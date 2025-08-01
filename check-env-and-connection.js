const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function checkEnvAndConnection() {
  console.log('=== Checking Environment and Connection ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('🔗 Supabase URL:', supabaseUrl)
  console.log('🔑 Service key length:', supabaseServiceKey?.length || 0)
  console.log('🔑 Anon key length:', supabaseAnonKey?.length || 0)
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Test connection with a simple query
    console.log('\n1. Testing database connection...')
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message)
    } else {
      console.log('✅ Database connection successful')
    }
    
    // Check if we can access the database
    console.log('\n2. Testing table access...')
    const { data: tableTest, error: tableError } = await supabase
      .from('users')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError.message)
    } else {
      console.log('✅ Table access successful')
      console.log('📋 Sample data:', tableTest)
    }
    
    // Try to get the actual count
    console.log('\n3. Getting actual table counts...')
    const { count: userCount, error: userCountError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
    
    if (userCountError) {
      console.error('❌ User count failed:', userCountError.message)
    } else {
      console.log('✅ Users table count:', userCount)
    }
    
    const { count: profileCount, error: profileCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (profileCountError) {
      console.error('❌ Profile count failed:', profileCountError.message)
    } else {
      console.log('✅ Profiles table count:', profileCount)
    }
    
    console.log('\n=== Environment and Connection Check Complete ===')
    
  } catch (error) {
    console.error('❌ Check failed:', error.message)
  }
}

checkEnvAndConnection().catch(console.error) 