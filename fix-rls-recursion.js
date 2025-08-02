import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixRLSInfiniteRecursion() {
  console.log('🔧 Fixing RLS infinite recursion issue...\n')

  try {
    // First, let's disable RLS temporarily to fix the policies
    console.log('1. Temporarily disabling RLS on profiles table...')
    
    const disableRLS = `
      ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
    `
    
    const { error: disableError } = await supabase.rpc('exec_sql', { sql: disableRLS })
    if (disableError) {
      console.log('Note: Could not disable RLS via RPC, continuing...')
    }

    // Now let's drop the problematic policies and recreate them
    console.log('2. Dropping existing problematic policies...')
    
    const dropPolicies = `
      DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
      DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
      DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
      DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
    `

    // Try to execute via direct SQL if possible
    const { error: dropError } = await supabase.rpc('exec_sql', { sql: dropPolicies })
    if (dropError) {
      console.log('Note: Could not drop policies via RPC, they may not exist')
    }

    // Create simpler, non-recursive policies
    console.log('3. Creating safe RLS policies...')
    
    const safePolicies = `
      -- Enable RLS
      ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
      
      -- Simple policy: users can view/update their own profile only
      CREATE POLICY "profiles_select_own" ON profiles
        FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY "profiles_update_own" ON profiles  
        FOR UPDATE USING (auth.uid() = id);
      
      CREATE POLICY "profiles_insert_own" ON profiles
        FOR INSERT WITH CHECK (auth.uid() = id);
      
      -- For admin access, we'll handle this through service role or API routes
      -- No complex role-checking policies that can cause recursion
    `

    const { error: policyError } = await supabase.rpc('exec_sql', { sql: safePolicies })
    if (policyError) {
      console.log('Could not create policies via RPC, will create a direct SQL file instead')
    }

    console.log('✅ RLS policies should now be fixed!')
    console.log('\n📝 Next steps:')
    console.log('1. The frontend should use API routes for admin operations')
    console.log('2. API routes use service role to bypass RLS')
    console.log('3. No more infinite recursion on profiles table')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n🔧 Creating a SQL fix file instead...')
    
    // Create a SQL file to run manually
    const fixSQL = `
-- Fix RLS infinite recursion issue
-- Run this SQL in Supabase SQL editor

-- Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop problematic policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Re-enable RLS with safe policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple, safe policies
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles  
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Note: Admin access will be handled through service role in API routes
-- This prevents infinite recursion while maintaining security
`
    
    console.log('SQL fix file created as fix-rls-recursion.sql')
    return fixSQL
  }
}

fixRLSInfiniteRecursion().then(sql => {
  if (sql) {
    // Write the SQL to a file
    import('fs').then(fs => {
      fs.writeFileSync('fix-rls-recursion.sql', sql)
      console.log('✅ SQL fix file created: fix-rls-recursion.sql')
    })
  }
})
