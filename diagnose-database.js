const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function diagnoseDatabaseIssue() {
  console.log('=== Database Diagnosis ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  console.log('🔗 Supabase URL:', supabaseUrl)
  console.log('🔑 Service key provided:', !!supabaseServiceKey)
  console.log('🔑 Service key starts with:', supabaseServiceKey?.substring(0, 50) + '...')
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Available env vars:', Object.keys(process.env).filter(k => k.includes('SUPABASE')))
    return
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    console.log('\n1. Testing tables access...')
    
    // Check profiles table
    console.log('Checking profiles table...')
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5)
    
    if (profilesError) {
      console.error('❌ Profiles table error:', profilesError)
    } else {
      console.log('✅ Profiles table accessible:', profiles?.length || 0, 'records')
      if (profiles && profiles.length > 0) {
        console.log('📋 Sample profile:', profiles[0])
      }
    }
    
    // Check users table
    console.log('\nChecking users table...')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (usersError) {
      console.error('❌ Users table error:', usersError)
    } else {
      console.log('✅ Users table accessible:', users?.length || 0, 'records')
      if (users && users.length > 0) {
        console.log('📋 Sample user:', users[0])
      }
    }
    
    // Check auth.users 
    console.log('\nChecking auth.users...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Auth users error:', authError)
    } else {
      console.log('✅ Auth users accessible:', authUsers?.users?.length || 0, 'users')
      if (authUsers?.users && authUsers.users.length > 0) {
        console.log('📋 Sample auth user:', {
          id: authUsers.users[0].id,
          email: authUsers.users[0].email,
          created_at: authUsers.users[0].created_at
        })
      }
    }
    
    // Try to find admin user by email
    console.log('\n2. Looking for admin user...')
    
    // Check in profiles
    const { data: adminProfile, error: adminProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'luxsess2001@gmail.com')
      .single()
    
    if (adminProfileError) {
      console.log('⚠️ Admin not found in profiles:', adminProfileError.message)
    } else {
      console.log('✅ Admin found in profiles:', adminProfile)
    }
    
    // Check in users
    const { data: adminUser, error: adminUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'luxsess2001@gmail.com')
      .single()
    
    if (adminUserError) {
      console.log('⚠️ Admin not found in users:', adminUserError.message)
    } else {
      console.log('✅ Admin found in users:', adminUser)
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

diagnoseDatabaseIssue().catch(console.error)
