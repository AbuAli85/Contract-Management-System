#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')

async function testAuthConfig() {
  console.log('🔍 Testing Authentication Configuration...\n')
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('📋 Environment Variables:')
  console.log(`  Supabase URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`)
  console.log(`  Supabase Key: ${supabaseKey ? '✅ Set' : '❌ Missing'}`)
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('\n❌ Missing environment variables!')
    console.log('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
    return
  }
  
  try {
    // Test Supabase connection
    console.log('\n🔗 Testing Supabase Connection...')
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Test basic connection
    const { data, error } = await supabase.from('_dummy_table_').select('*').limit(1)
    
    if (error && error.code === 'PGRST116') {
      console.log('✅ Supabase connection successful (expected error for dummy table)')
    } else if (error) {
      console.log(`❌ Supabase connection failed: ${error.message}`)
      return
    }
    
    console.log('✅ Supabase connection successful!')
    
    // Test auth configuration
    console.log('\n🔐 Testing Auth Configuration...')
    const { data: authData, error: authError } = await supabase.auth.getSession()
    
    if (authError) {
      console.log(`❌ Auth configuration error: ${authError.message}`)
    } else {
      console.log('✅ Auth configuration successful!')
      console.log(`  Session: ${authData.session ? 'Active' : 'None'}`)
    }
    
    console.log('\n📋 Next Steps:')
    console.log('1. Update Supabase project settings with your production domain')
    console.log('2. Add redirect URLs in Supabase dashboard')
    console.log('3. Test authentication flow')
    
  } catch (error) {
    console.log(`❌ Error testing configuration: ${error.message}`)
  }
}

// Run the test
testAuthConfig() 