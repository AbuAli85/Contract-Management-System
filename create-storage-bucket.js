const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createStorageBucket() {
  console.log('=== Creating Storage Bucket ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  try {
    // Check if bucket already exists
    console.log('\n1. Checking existing buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError.message)
      return
    }
    
    const existingBucket = buckets.find(bucket => bucket.id === 'promoter-documents')
    if (existingBucket) {
      console.log('✅ Storage bucket already exists:', existingBucket.id)
      console.log('   Public:', existingBucket.public)
      console.log('   File size limit:', existingBucket.file_size_limit)
      console.log('   Allowed types:', existingBucket.allowed_mime_types)
      return
    }
    
    // Create the storage bucket
    console.log('\n2. Creating storage bucket...')
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('promoter-documents', {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    })
    
    if (createError) {
      console.error('❌ Failed to create bucket:', createError.message)
      return
    }
    
    console.log('✅ Storage bucket created successfully:', newBucket.id)
    console.log('   Public:', newBucket.public)
    console.log('   File size limit:', newBucket.file_size_limit)
    console.log('   Allowed types:', newBucket.allowed_mime_types)
    
    // Test bucket access
    console.log('\n3. Testing bucket access...')
    const { data: files, error: listError } = await supabase.storage
      .from('promoter-documents')
      .list()
    
    if (listError) {
      console.log('⚠️  Cannot list files yet (RLS policies needed):', listError.message)
    } else {
      console.log('✅ Can access bucket, files found:', files.length)
    }
    
    console.log('\n=== Storage Bucket Creation Complete ===')
    console.log('🎉 SUCCESS: Storage bucket created!')
    console.log('📝 Next: Run the RLS policies script to enable uploads')
    
  } catch (error) {
    console.error('❌ Failed to create storage bucket:', error.message)
  }
}

createStorageBucket().catch(console.error) 