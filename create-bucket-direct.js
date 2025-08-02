const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function createBucketDirectSQL() {
  console.log('=== Creating Storage Bucket via Direct SQL ===')
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    process.exit(1)
  }
  
  // Use service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  
  try {
    console.log('\n1. Creating bucket via SQL...')
    
    // First try to create the bucket using raw SQL
    const { data: createResult, error: createError } = await supabase
      .from('storage.buckets')
      .insert({
        id: 'promoter-documents',
        name: 'promoter-documents',
        public: false,
        file_size_limit: 5242880,
        allowed_mime_types: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
      })
    
    if (createError) {
      console.error('❌ Failed to insert bucket:', createError.message)
      
      // Try alternative - direct SQL query
      console.log('\n2. Trying direct SQL execution...')
      const { data: sqlResult, error: sqlError } = await supabase
        .rpc('exec', { 
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
        console.error('❌ SQL execution failed:', sqlError.message)
        console.log('\n📋 MANUAL SETUP REQUIRED:')
        console.log('Please go to your Supabase Dashboard > Storage > Create new bucket:')
        console.log('• Bucket name: promoter-documents')
        console.log('• Public: false')
        console.log('• File size limit: 5MB')
        console.log('• Allowed MIME types: image/jpeg, image/png, image/jpg, application/pdf')
        return
      }
      
      console.log('✅ Bucket created via SQL')
    } else {
      console.log('✅ Bucket created via direct insert')
    }
    
    // Verify bucket was created
    console.log('\n3. Verifying bucket creation...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Failed to verify:', listError.message)
      return
    }
    
    const bucket = buckets.find(b => b.id === 'promoter-documents')
    if (bucket) {
      console.log('✅ Bucket verified:', bucket.id)
      console.log('   Public:', bucket.public)
      console.log('   Size limit:', bucket.file_size_limit)
    } else {
      console.log('❌ Bucket not found after creation')
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message)
    console.log('\n📋 MANUAL SETUP REQUIRED:')
    console.log('Please create the bucket manually in Supabase Dashboard')
  }
}

createBucketDirectSQL()
