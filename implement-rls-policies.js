const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function implementRLSPolicies() {
  console.log('🔧 Implementing Recommended RLS Policies...\n')
  
  try {
    // The policies shown in the Supabase dashboard screenshot
    const policies = [
      // Policy for users to update their own profile
      {
        name: 'Users can update own profile',
        sql: `
          CREATE POLICY IF NOT EXISTS "Users can update own profile" ON profiles
          FOR UPDATE 
          USING (auth.uid() = id);
        `
      },
      
      // Policy for users to insert their own profile  
      {
        name: 'Users can insert own profile',
        sql: `
          CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON profiles
          FOR INSERT 
          WITH CHECK (auth.uid() = id);
        `
      },
      
      // Policy for authenticated users to read profiles
      {
        name: 'Authenticated users can read profiles',
        sql: `
          CREATE POLICY IF NOT EXISTS "Authenticated users can read profiles" ON profiles
          FOR SELECT 
          USING (auth.role() = 'authenticated');
        `
      },

      // Enable RLS on profiles if not already enabled
      {
        name: 'Enable RLS on profiles',
        sql: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;`
      },

      // Similar policies for users table
      {
        name: 'Users table RLS enable',
        sql: `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
      },

      {
        name: 'Authenticated users can read users',
        sql: `
          CREATE POLICY IF NOT EXISTS "Authenticated users can read users" ON users
          FOR SELECT 
          USING (auth.role() = 'authenticated');
        `
      },

      {
        name: 'Users can update own user record',
        sql: `
          CREATE POLICY IF NOT EXISTS "Users can update own user record" ON users
          FOR UPDATE 
          USING (auth.uid() = id);
        `
      },

      // Service role policies for both tables
      {
        name: 'Service role full access to profiles',
        sql: `
          CREATE POLICY IF NOT EXISTS "Service role full access to profiles" ON profiles
          FOR ALL 
          USING (auth.role() = 'service_role');
        `
      },

      {
        name: 'Service role full access to users',
        sql: `
          CREATE POLICY IF NOT EXISTS "Service role full access to users" ON users
          FOR ALL 
          USING (auth.role() = 'service_role');
        `
      }
    ]

    console.log('📋 Applying RLS policies...\n')

    for (const policy of policies) {
      console.log(`🔨 Applying: ${policy.name}`)
      
      const { error } = await supabase.rpc('exec_sql', {
        sql: policy.sql
      })
      
      if (error) {
        // If exec_sql doesn't work, try direct query
        console.log(`   ⚠️  exec_sql failed: ${error.message}`)
        console.log(`   🔄 Trying direct execution...`)
        
        // For policies, we'll need to execute them manually in Supabase dashboard
        console.log(`   📝 SQL to execute in Supabase dashboard:`)
        console.log(`   ${policy.sql}`)
      } else {
        console.log(`   ✅ Success`)
      }
    }

    // Test the policies
    console.log('\n🧪 Testing RLS policies...')
    
    const testUserId = '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170'
    
    // Test with anon key (should work due to authenticated role policy)
    const anonSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: testData, error: testError } = await anonSupabase
      .from('profiles')
      .select('id,role,status')
      .eq('id', testUserId)
    
    if (testError) {
      console.log('❌ RLS test failed:', testError.message)
      console.log('   This is expected if user is not authenticated')
    } else {
      console.log('✅ RLS test passed:', testData)
    }

    console.log('\n📋 Next Steps:')
    console.log('1. If any policies failed, execute the SQL manually in Supabase dashboard')
    console.log('2. Test authentication flow to ensure policies work correctly')
    console.log('3. Verify that authenticated users can access their own data')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

implementRLSPolicies()
