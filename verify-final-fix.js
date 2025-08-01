const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function verifyFinalFix() {
  console.log('=== Verifying Final RBAC Fix ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test 1: Check admin user in users table
    console.log('\n1. Testing admin user in users table...')
    const { data: adminUser, error: userError } = await supabase
      .from('users')
      .select('id, email, role, status')
      .eq('email', 'luxsess2001@gmail.com')
      .single()
    
    if (userError) {
      console.error('❌ Admin user lookup failed:', userError.message)
    } else {
      console.log('✅ Admin user found:', adminUser)
    }
    
    // Test 2: Check admin user in profiles table
    console.log('\n2. Testing admin user in profiles table...')
    const { data: adminProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, status')
      .eq('email', 'luxsess2001@gmail.com')
      .single()
    
    if (profileError) {
      console.error('❌ Admin profile lookup failed:', profileError.message)
    } else {
      console.log('✅ Admin profile found:', adminProfile)
    }
    
    // Test 3: Simulate RBAC provider query
    console.log('\n3. Testing RBAC provider query...')
    const { data: rbacQuery, error: rbacError } = await supabase
      .from('users')
      .select('role')
      .eq('email', 'luxsess2001@gmail.com')
      .single()
    
    if (rbacError) {
      console.error('❌ RBAC query failed:', rbacError.message)
    } else {
      console.log('✅ RBAC query successful, role:', rbacQuery.role)
    }
    
    // Test 4: Check table counts
    console.log('\n4. Checking table counts...')
    const { data: userCount, error: countError } = await supabase
      .from('users')
      .select('*', { count: 'exact' })
    
    if (countError) {
      console.error('❌ User count failed:', countError.message)
    } else {
      console.log('✅ Users table count:', userCount?.length || 0)
    }
    
    const { data: profileCount, error: profileCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
    
    if (profileCountError) {
      console.error('❌ Profile count failed:', profileCountError.message)
    } else {
      console.log('✅ Profiles table count:', profileCount?.length || 0)
    }
    
    // Test 5: Test with regular client (not service role)
    console.log('\n5. Testing with regular client...')
    const regularSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: regularQuery, error: regularError } = await regularSupabase
      .from('users')
      .select('role')
      .eq('email', 'luxsess2001@gmail.com')
      .single()
    
    if (regularError) {
      console.error('❌ Regular client query failed:', regularError.message)
    } else {
      console.log('✅ Regular client query successful, role:', regularQuery.role)
    }
    
    console.log('\n=== Final Fix Verification Complete ===')
    
    if (adminUser && adminProfile && rbacQuery) {
      console.log('🎉 SUCCESS: All tests passed! RBAC should now work properly.')
    } else {
      console.log('⚠️  WARNING: Some tests failed. Please check the SQL script execution.')
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyFinalFix().catch(console.error) 