const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createStorageBucket() {
  console.log('🪣 Creating storage bucket for contracts...')
  
  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables:')
      console.error('   - NEXT_PUBLIC_SUPABASE_URL')
      console.error('   - SUPABASE_SERVICE_ROLE_KEY')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError)
      return
    }

    const contractsBucket = buckets?.find(bucket => bucket.name === 'contracts')
    
    if (contractsBucket) {
      console.log('✅ Storage bucket "contracts" already exists!')
      return
    }

    console.log('📋 Creating new storage bucket "contracts"...')
    
    // Create the contracts bucket
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('contracts', {
      public: true, // Allow public read access
      allowedMimeTypes: ['application/pdf'], // Only allow PDF files
      fileSizeLimit: 52428800, // 50MB limit
    })

    if (createError) {
      console.error('❌ Error creating bucket:', createError)
      return
    }

    console.log('✅ Successfully created storage bucket "contracts":', newBucket)

    console.log('📋 Note: Storage policies need to be configured manually in the Supabase Dashboard:')
    console.log('   1. Go to Storage > Policies')
    console.log('   2. Select the "contracts" bucket')
    console.log('   3. Add policies for INSERT (authenticated users) and SELECT (public)')

    console.log('🎉 Storage bucket setup completed successfully!')
    console.log('📋 Bucket details:')
    console.log(`  - Name: contracts`)
    console.log(`  - Public: true`)
    console.log(`  - Allowed MIME types: application/pdf`)
    console.log(`  - File size limit: 50MB`)

  } catch (error) {
    console.error('❌ Script error:', error)
  }
}

// Run the script
createStorageBucket()
  .then(() => {
    console.log('🎉 Script completed!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }) 