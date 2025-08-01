const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function verifyAdmin() {
  console.log('=== Verifying Admin User ===')
  
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
    // Simple query to check users table
    console.log('\n1. Checking users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.error('❌ Users table error:', usersError.message)
    } else {
      console.log('✅ Users table accessible')
      console.log('📋 Users found:', users?.length || 0)
      if (users && users.length > 0) {
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.status}`)
        })
      }
    }
    
    // Simple query to check profiles table
    console.log('\n2. Checking profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError.message)
    } else {
      console.log('✅ Profiles table accessible')
      console.log('📋 Profiles found:', profiles?.length || 0)
      if (profiles && profiles.length > 0) {
        profiles.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} (${profile.role}) - ${profile.status}`)
        })
      }
    }
    
    // Check for admin user specifically
    console.log('\n3. Checking for admin user...')
    const { data: adminUser, error: adminError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'luxsess2001@gmail.com')
    
    if (adminError) {
      console.error('❌ Admin user query error:', adminError.message)
    } else {
      console.log('✅ Admin user query successful')
      console.log('📋 Admin users found:', adminUser?.length || 0)
      if (adminUser && adminUser.length > 0) {
        adminUser.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role}) - ${user.status} - ID: ${user.id}`)
        })
      }
    }
    
    // Check for admin profile specifically
    console.log('\n4. Checking for admin profile...')
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'luxsess2001@gmail.com')
    
    if (profileError) {
      console.error('❌ Admin profile query error:', profileError.message)
    } else {
      console.log('✅ Admin profile query successful')
      console.log('📋 Admin profiles found:', adminProfile?.length || 0)
      if (adminProfile && adminProfile.length > 0) {
        adminProfile.forEach((profile, index) => {
          console.log(`   ${index + 1}. ${profile.email} (${profile.role}) - ${profile.status} - ID: ${profile.id}`)
        })
      }
    }
    
    console.log('\n=== Verification Complete ===')
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyAdmin().catch(console.error) 