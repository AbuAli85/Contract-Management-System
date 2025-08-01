const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function clearSchemaCache() {
  console.log('=== Clearing Supabase Schema Cache ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Method 1: Force schema refresh by querying the new columns
    console.log('\n1. Forcing schema refresh...')
    
    const { data: schemaTest, error: schemaError } = await supabase
      .from('promoters')
      .select('passport_number, profile_picture_url')
      .limit(1)
    
    if (schemaError) {
      console.error('❌ Schema refresh failed:', schemaError.message)
    } else {
      console.log('✅ Schema refresh successful:', schemaTest)
    }
    
    // Method 2: Test a direct update to force cache refresh
    console.log('\n2. Testing direct update to refresh cache...')
    
    const { data: promoters, error: listError } = await supabase
      .from('promoters')
      .select('id, name_en')
      .limit(1)
    
    if (listError) {
      console.error('❌ Failed to list promoters:', listError.message)
      return
    }
    
    if (promoters && promoters.length > 0) {
      const testPromoter = promoters[0]
      
      const { data: updateResult, error: updateError } = await supabase
        .from('promoters')
        .update({
          passport_number: 'CACHE_TEST_' + Date.now(),
          profile_picture_url: 'https://cache-test.com/image.jpg',
          updated_at: new Date().toISOString()
        })
        .eq('id', testPromoter.id)
        .select('id, passport_number, profile_picture_url')
        .single()
      
      if (updateError) {
        console.error('❌ Cache refresh update failed:', updateError.message)
      } else {
        console.log('✅ Cache refresh update successful:', updateResult)
        
        // Revert the test update
        const { error: revertError } = await supabase
          .from('promoters')
          .update({
            passport_number: 'A123456789',
            profile_picture_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
            updated_at: new Date().toISOString()
          })
          .eq('id', testPromoter.id)
        
        if (revertError) {
          console.log('⚠️  Could not revert test update:', revertError.message)
        } else {
          console.log('✅ Test update reverted')
        }
      }
    }
    
    // Method 3: Check if the issue is with the browser client
    console.log('\n3. Testing browser client simulation...')
    
    const browserSupabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    
    const { data: browserTest, error: browserError } = await browserSupabase
      .from('promoters')
      .select('passport_number, profile_picture_url')
      .limit(1)
    
    if (browserError) {
      console.error('❌ Browser client test failed:', browserError.message)
      console.log('🔍 This suggests the browser client needs to refresh its schema cache')
    } else {
      console.log('✅ Browser client test successful:', browserTest)
    }
    
    console.log('\n=== Schema Cache Clear Complete ===')
    console.log('📝 If the browser is still showing errors, try:')
    console.log('   1. Hard refresh the browser (Ctrl+F5 or Cmd+Shift+R)')
    console.log('   2. Clear browser cache and cookies')
    console.log('   3. Restart the development server (npm run dev)')
    console.log('   4. Wait a few minutes for Supabase cache to refresh')
    
  } catch (error) {
    console.error('❌ Schema cache clear failed:', error.message)
  }
}

clearSchemaCache().catch(console.error) 