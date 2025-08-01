const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createAdminBypassRLS() {
  console.log('=== Creating Admin User (Bypass RLS) ===')
  
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
    // Step 1: Disable RLS temporarily
    console.log('\n1. Disabling RLS temporarily...')
    const { error: disableUsersError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE users DISABLE ROW LEVEL SECURITY;'
      })
    
    if (disableUsersError) {
      console.error('❌ Failed to disable RLS on users:', disableUsersError.message)
    } else {
      console.log('✅ RLS disabled on users table')
    }
    
    const { error: disableProfilesError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;'
      })
    
    if (disableProfilesError) {
      console.error('❌ Failed to disable RLS on profiles:', disableProfilesError.message)
    } else {
      console.log('✅ RLS disabled on profiles table')
    }
    
    // Step 2: Create admin user in users table
    console.log('\n2. Creating admin user in users table...')
    const { data: newUser, error: createUserError } = await supabase
      .from('users')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'luxsess2001@gmail.com',
        full_name: 'Admin User',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createUserError) {
      console.error('❌ Failed to create admin user:', createUserError.message)
    } else {
      console.log('✅ Admin user created in users table:', newUser)
    }
    
    // Step 3: Create admin user in profiles table
    console.log('\n3. Creating admin user in profiles table...')
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'luxsess2001@gmail.com',
        full_name: 'Admin User',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (createProfileError) {
      console.error('❌ Failed to create admin profile:', createProfileError.message)
    } else {
      console.log('✅ Admin profile created in profiles table:', newProfile)
    }
    
    // Step 4: Re-enable RLS
    console.log('\n4. Re-enabling RLS...')
    const { error: enableUsersError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE users ENABLE ROW LEVEL SECURITY;'
      })
    
    if (enableUsersError) {
      console.error('❌ Failed to enable RLS on users:', enableUsersError.message)
    } else {
      console.log('✅ RLS enabled on users table')
    }
    
    const { error: enableProfilesError } = await supabase
      .rpc('exec_sql', { 
        sql: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;'
      })
    
    if (enableProfilesError) {
      console.error('❌ Failed to enable RLS on profiles:', enableProfilesError.message)
    } else {
      console.log('✅ RLS enabled on profiles table')
    }
    
    // Step 5: Verify creation
    console.log('\n5. Verifying admin user creation...')
    const { data: verifyUser, error: verifyUserError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'luxsess2001@gmail.com')
      .single()
    
    if (verifyUserError) {
      console.error('❌ Verification failed:', verifyUserError.message)
    } else {
      console.log('✅ Admin user verified:', verifyUser)
    }
    
    const { data: verifyProfile, error: verifyProfileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'luxsess2001@gmail.com')
      .single()
    
    if (verifyProfileError) {
      console.error('❌ Profile verification failed:', verifyProfileError.message)
    } else {
      console.log('✅ Admin profile verified:', verifyProfile)
    }
    
    // Step 6: Test RBAC query
    console.log('\n6. Testing RBAC query...')
    const { data: rbacTest, error: rbacError } = await supabase
      .from('users')
      .select('role')
      .eq('email', 'luxsess2001@gmail.com')
      .single()
    
    if (rbacError) {
      console.error('❌ RBAC test failed:', rbacError.message)
    } else {
      console.log('✅ RBAC test successful, role:', rbacTest.role)
    }
    
    console.log('\n=== Admin User Creation Complete ===')
    
  } catch (error) {
    console.error('❌ Creation failed:', error.message)
  }
}

createAdminBypassRLS().catch(console.error) 