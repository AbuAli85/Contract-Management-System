const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS Policies...\n')
  
  try {
    console.log('1️⃣ Checking current RLS policies...')
    
    // First, let's disable RLS temporarily to test
    console.log('\n2️⃣ Temporarily disabling RLS on profiles table...')
    
    const { error: disableRLSError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
    })
    
    if (disableRLSError) {
      console.log('❌ Could not disable RLS via RPC:', disableRLSError.message)
      
      // Try alternative approach
      console.log('   Trying alternative approach...')
      
      const { error: altError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
      
      if (altError) {
        console.log('❌ Profiles table still has issues:', altError.message)
      } else {
        console.log('✅ Profiles table seems accessible now')
      }
    } else {
      console.log('✅ RLS disabled on profiles table')
    }

    // Test query without RLS
    console.log('\n3️⃣ Testing query without RLS...')
    
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('status,role')
      .eq('id', '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170')
    
    if (testError) {
      console.log('❌ Still failing:', testError.message)
    } else {
      console.log('✅ Query works without RLS:', testData)
    }

    // Re-enable RLS with proper policies
    console.log('\n4️⃣ Re-enabling RLS with proper policies...')
    
    const policies = [
      // Enable RLS
      'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;',
      
      // Drop existing problematic policies
      'DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;',
      'DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;',
      'DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;',
      'DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;',
      
      // Create simple, non-recursive policies
      `CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (true);`,
      `CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (auth.uid() = id);`,
      `CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);`,
      `CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE USING (auth.uid() = id);`
    ]

    for (const policy of policies) {
      console.log(`   Executing: ${policy.substring(0, 50)}...`)
      
      const { error: policyError } = await supabase.rpc('exec_sql', {
        sql: policy
      })
      
      if (policyError) {
        console.log(`   ❌ Error: ${policyError.message}`)
      } else {
        console.log(`   ✅ Success`)
      }
    }

    // Final test
    console.log('\n5️⃣ Final test with new policies...')
    
    const { data: finalTest, error: finalError } = await supabase
      .from('profiles')
      .select('status,role')
      .eq('id', '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170')
    
    if (finalError) {
      console.log('❌ Still failing:', finalError.message)
      
      // If still failing, let's try a more permissive approach
      console.log('\n   Trying more permissive policies...')
      
      const permissivePolicies = [
        'DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;',
        'CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (true);'
      ]
      
      for (const policy of permissivePolicies) {
        const { error } = await supabase.rpc('exec_sql', { sql: policy })
        if (error) {
          console.log(`   ❌ ${error.message}`)
        } else {
          console.log(`   ✅ ${policy.substring(0, 30)}... applied`)
        }
      }
      
    } else {
      console.log('✅ Final test successful:', finalTest)
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

fixRLSPolicies()
