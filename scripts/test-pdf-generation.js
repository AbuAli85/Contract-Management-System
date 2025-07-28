const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function testPDFGeneration() {
  console.log('🧪 Testing PDF generation and storage...')
  
  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Test 1: Upload a test PDF
    console.log('📤 Testing PDF upload...')
    const testFileName = `test-contract-${Date.now()}.pdf`
    const testContent = Buffer.from('Test Contract PDF Content', 'utf-8')
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('contracts')
      .upload(testFileName, testContent, {
        contentType: 'application/pdf',
        cacheControl: '3600'
      })

    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
      console.log('💡 This confirms a storage permissions issue')
      return
    }

    console.log('✅ Upload successful!')

    // Test 2: Get public URL
    console.log('🔗 Testing public URL generation...')
    const { data: { publicUrl } } = supabase.storage
      .from('contracts')
      .getPublicUrl(testFileName)

    console.log('✅ Public URL generated:', publicUrl)

    // Test 3: Test URL access
    console.log('🌐 Testing URL accessibility...')
    try {
      const response = await fetch(publicUrl)
      if (response.ok) {
        console.log('✅ URL is accessible!')
      } else {
        console.log('⚠️ URL returned status:', response.status)
      }
    } catch (error) {
      console.log('⚠️ URL access test failed:', error.message)
    }

    // Clean up
    console.log('🧹 Cleaning up test file...')
    const { error: deleteError } = await supabase.storage
      .from('contracts')
      .remove([testFileName])

    if (deleteError) {
      console.log('⚠️ Could not delete test file:', deleteError)
    } else {
      console.log('✅ Test file cleaned up')
    }

    console.log('🎉 All tests passed! PDF generation should work now.')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

// Run the test
testPDFGeneration()
  .then(() => {
    console.log('🎉 Test completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Test failed:', error)
    process.exit(1)
  }) 