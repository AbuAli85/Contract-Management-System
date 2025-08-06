const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function createMissingUserRecord() {
  const userId = '3f5dea42-c4bd-44bd-bcb9-0ac81e3c8170'
  
  console.log('🔧 Creating Missing User Record...\n')
  
  try {
    // 1. Get user data from profiles table
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError || !profileData) {
      console.error('❌ Could not fetch profile data:', profileError)
      return
    }

    console.log('✅ Found profile data:', {
      id: profileData.id,
      email: profileData.email,
      full_name: profileData.full_name,
      role: profileData.role,
      status: profileData.status
    })

    // 2. Check if user already exists in users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)

    if (checkError) {
      console.error('❌ Error checking existing user:', checkError)
      return
    }

    if (existingUser && existingUser.length > 0) {
      console.log('ℹ️ User already exists in users table')
      return
    }

    // 3. Create user record in users table
    console.log('\n🚀 Creating user record in users table...')
    
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([
        {
          id: profileData.id,
          email: profileData.email,
          full_name: profileData.full_name,
          role: profileData.role || 'admin',
          status: profileData.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()

    if (insertError) {
      console.error('❌ Error creating user record:', insertError)
      return
    }

    console.log('✅ Successfully created user record:', newUser)

    // 4. Verify the fix by testing the failing queries
    console.log('\n🧪 Testing fixes...')
    
    const { data: usersTest, error: usersTestError } = await supabase
      .from('users')
      .select('status,role')
      .eq('id', userId)
    
    if (usersTestError) {
      console.log('❌ Users query still failing:', usersTestError.message)
    } else {
      console.log('✅ Users query now works:', usersTest)
    }

    const { data: profilesTest, error: profilesTestError } = await supabase
      .from('profiles')
      .select('status,role')
      .eq('id', userId)
    
    if (profilesTestError) {
      console.log('❌ Profiles query still failing:', profilesTestError.message)
    } else {
      console.log('✅ Profiles query working:', profilesTest)
    }

    console.log('\n🎉 User record creation completed!')
    console.log('   The API endpoints should now work correctly.')

  } catch (error) {
    console.error('💥 Unexpected error:', error)
  }
}

createMissingUserRecord()
