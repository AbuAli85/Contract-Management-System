const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createBucketWithServiceRole() {
  console.log('=== Creating Storage Bucket with Service Role ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  // Use service role key to bypass RLS
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    // Check if bucket already exists
    console.log('\n1. Checking existing buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError.message)
      return
    }
    
    console.log('✅ Found buckets:', buckets.length)
    buckets.forEach(bucket => {
      console.log(`   - ${bucket.id} (public: ${bucket.public})`)
    })
    
    const existingBucket = buckets.find(bucket => bucket.id === 'promoter-documents')
    if (existingBucket) {
      console.log('✅ Storage bucket already exists:', existingBucket.id)
      console.log('   Public:', existingBucket.public)
      console.log('   File size limit:', existingBucket.file_size_limit)
      console.log('   Allowed types:', existingBucket.allowed_mime_types)
      return
    }
    
    // Create the storage bucket using service role
    console.log('\n2. Creating storage bucket with service role...')
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('promoter-documents', {
      public: false,
      fileSizeLimit: 5242880, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    })
    
    if (createError) {
      console.error('❌ Failed to create bucket:', createError.message)
      
      // Try alternative approach - create bucket through SQL
      console.log('\n3. Trying alternative approach...')
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
          VALUES (
            'promoter-documents',
            'promoter-documents',
            false,
            5242880,
            ARRAY['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
          ) ON CONFLICT (id) DO NOTHING;
        `
      })
      
      if (sqlError) {
        console.error('❌ SQL approach also failed:', sqlError.message)
        console.log('📝 Please create the bucket manually in Supabase Dashboard')
        return
      } else {
        console.log('✅ Bucket created via SQL approach')
      }
    } else {
      console.log('✅ Storage bucket created successfully:', newBucket.id)
      console.log('   Public:', newBucket.public)
      console.log('   File size limit:', newBucket.file_size_limit)
      console.log('   Allowed types:', newBucket.allowed_mime_types)
    }
    
    // Test bucket access
    console.log('\n4. Testing bucket access...')
    const { data: files, error: listError } = await supabase.storage
      .from('promoter-documents')
      .list()
    
    if (listError) {
      console.log('⚠️  Cannot list files yet (RLS policies needed):', listError.message)
    } else {
      console.log('✅ Can access bucket, files found:', files.length)
    }
    
    console.log('\n=== Storage Bucket Creation Complete ===')
    console.log('🎉 SUCCESS: Storage bucket should be created!')
    console.log('📝 Next: Test document upload in browser')
    
  } catch (error) {
    console.error('❌ Failed to create storage bucket:', error.message)
    console.log('📝 Please create the bucket manually in Supabase Dashboard')
  }
}

createBucketWithServiceRole().catch(console.error) 