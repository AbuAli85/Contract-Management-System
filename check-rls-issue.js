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

async function checkSchemaAndPolicies() {
  console.log('🔍 Checking database schema and RLS policies...\n')

  try {
    // Check if users table exists
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    console.log('👥 Users table:', usersError ? 'Does not exist' : 'Exists')

    // Check if profiles table exists
    const { data: profilesTable, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)

    console.log('👤 Profiles table:', profilesError ? 'Does not exist' : 'Exists')

    // Check RLS policies on profiles table
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies', { table_name: 'profiles' })
      .catch(() => null)

    if (policies) {
      console.log('\n📋 Current RLS policies on profiles:')
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd}`)
      })
    } else {
      console.log('\n📋 Could not fetch RLS policies (this is normal)')
    }

    // Try to query profiles directly with service role
    const { data: profilesData, error: profilesQueryError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(5)

    if (profilesQueryError) {
      console.log('\n❌ Error querying profiles:', profilesQueryError.message)
    } else {
      console.log('\n✅ Profiles query successful, found', profilesData?.length || 0, 'records')
      if (profilesData && profilesData.length > 0) {
        console.log('Sample profile structure:', Object.keys(profilesData[0]))
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkSchemaAndPolicies()
