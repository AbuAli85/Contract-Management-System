const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function checkDatabaseStatus() {
  console.log('=== Checking Database Status ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  console.log('🔗 Connecting to:', supabaseUrl)
  console.log('🔑 Service key length:', supabaseServiceKey?.length || 0)
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Check all users
    console.log('\n1. All users in database:')
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.error('❌ Users query failed:', usersError.message)
    } else {
      console.log('✅ Users found:', allUsers?.length || 0)
      if (allUsers && allUsers.length > 0) {
        allUsers.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.status} - ID: ${user.id}`)
        })
      }
    }
    
    // Check all profiles
    console.log('\n2. All profiles in database:')
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Profiles query failed:', profilesError.message)
    } else {
      console.log('✅ Profiles found:', allProfiles?.length || 0)
      if (allProfiles && allProfiles.length > 0) {
        allProfiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} (${profile.role}) - ${profile.status} - ID: ${profile.id}`)
        })
      }
    }
    
    // Check for admin user specifically
    console.log('\n3. Checking for admin user specifically:')
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'luxsess2001@gmail.com')
    
    if (adminError) {
      console.error('❌ Admin user query failed:', adminError.message)
    } else {
      console.log('✅ Admin users found:', adminUser?.length || 0)
      if (adminUser && adminUser.length > 0) {
        adminUser.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.status} - ID: ${user.id}`)
        })
      }
    }
    
    // Check for admin profile specifically
    console.log('\n4. Checking for admin profile specifically:')
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'luxsess2001@gmail.com')
    
    if (profileError) {
      console.error('❌ Admin profile query failed:', profileError.message)
    } else {
      console.log('✅ Admin profiles found:', adminProfile?.length || 0)
      if (adminProfile && adminProfile.length > 0) {
        adminProfile.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} (${profile.role}) - ${profile.status} - ID: ${profile.id}`)
        })
      }
    }
    
    console.log('\n=== Database Status Check Complete ===')
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message)
  }
}

checkDatabaseStatus().catch(console.error) 