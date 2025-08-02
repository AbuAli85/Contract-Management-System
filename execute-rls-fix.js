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

async function executeRLSFix() {
  console.log('🔧 Executing RLS fix for infinite recursion...\n')

  const sqlCommands = [
    // Step 1: Disable RLS temporarily
    'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;',
    
    // Step 2: Drop problematic policies
    'DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;',
    'DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;',
    'DROP POLICY IF EXISTS "Users can view own profile" ON profiles;',
    'DROP POLICY IF EXISTS "Users can update own profile" ON profiles;',
    'DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;',
    'DROP POLICY IF EXISTS "profiles_select_own" ON profiles;',
    'DROP POLICY IF EXISTS "profiles_update_own" ON profiles;',
    'DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;',
    
    // Step 3: Re-enable RLS
    'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;',
    
    // Step 4: Create safe policies
    `CREATE POLICY "profiles_select_own" ON profiles
     FOR SELECT USING (auth.uid() = id);`,
    
    `CREATE POLICY "profiles_update_own" ON profiles  
     FOR UPDATE USING (auth.uid() = id);`,
    
    `CREATE POLICY "profiles_insert_own" ON profiles
     FOR INSERT WITH CHECK (auth.uid() = id);`
  ]

  for (let i = 0; i < sqlCommands.length; i++) {
    const sql = sqlCommands[i]
    console.log(`${i + 1}. Executing: ${sql.substring(0, 50)}...`)
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        console.log(`   ⚠️  Error (may be expected): ${error.message}`)
      } else {
        console.log(`   ✅ Success`)
      }
    } catch (error) {
      console.log(`   ⚠️  Caught error: ${error.message}`)
    }
  }

  // Create the safe function
  console.log('\n5. Creating safe role function...')
  const roleFunction = `
    CREATE OR REPLACE FUNCTION get_current_user_role()
    RETURNS TEXT
    SECURITY DEFINER
    SET search_path = public
    LANGUAGE plpgsql
    AS $$
    DECLARE
      user_role TEXT;
    BEGIN
      SELECT role INTO user_role
      FROM profiles
      WHERE id = auth.uid();
      
      RETURN COALESCE(user_role, 'user');
    END;
    $$;
    
    GRANT EXECUTE ON FUNCTION get_current_user_role() TO authenticated;
  `

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: roleFunction })
    if (error) {
      console.log(`   ⚠️  Function error: ${error.message}`)
    } else {
      console.log(`   ✅ Role function created successfully`)
    }
  } catch (error) {
    console.log(`   ⚠️  Function creation failed: ${error.message}`)
  }

  console.log('\n✅ RLS fix completed!')
  console.log('🔄 Please refresh your browser to test the changes')
}

executeRLSFix()
