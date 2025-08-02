const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkStorageBucket() {
  console.log('🗂️ CHECKING STORAGE BUCKET CONFIGURATION');
  console.log('=' .repeat(60));
  
  try {
    // 1. List all buckets
    console.log('\n1️⃣ LISTING ALL STORAGE BUCKETS:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Error listing buckets:', bucketsError.message);
      return;
    }
    
    console.log(`✅ Found ${buckets?.length || 0} buckets:`);
    buckets?.forEach((bucket, index) => {
      console.log(`   ${index + 1}. ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
    });
    
    // 2. Check if promoter-documents bucket exists
    console.log('\n2️⃣ CHECKING PROMOTER-DOCUMENTS BUCKET:');
    const promoterBucket = buckets?.find(b => b.name === 'promoter-documents');
    
    if (!promoterBucket) {
      console.log('❌ promoter-documents bucket does not exist');
      console.log('🔨 Creating promoter-documents bucket...');
      
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('promoter-documents', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        return;
      }
      
      console.log('✅ promoter-documents bucket created successfully');
    } else {
      console.log('✅ promoter-documents bucket exists');
      console.log(`   • Public: ${promoterBucket.public}`);
      console.log(`   • Created: ${promoterBucket.created_at}`);
      console.log(`   • Updated: ${promoterBucket.updated_at}`);
    }
    
    // 3. Test file upload permissions
    console.log('\n3️⃣ TESTING FILE UPLOAD PERMISSIONS:');
    const testFile = Buffer.from('Test file content for promoter documents');
    const testFileName = `test/upload-test-${Date.now()}.txt`;
    
    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('promoter-documents')
        .upload(testFileName, testFile, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (uploadError) {
        console.error('❌ Upload test failed:', uploadError.message);
        
        if (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS')) {
          console.log('🔨 Attempting to fix RLS policies for storage...');
          await fixStorageRLS();
        }
      } else {
        console.log('✅ Upload test successful');
        console.log(`   • File path: ${uploadData.path}`);
        
        // Test getting public URL
        const { data: urlData } = supabase.storage
          .from('promoter-documents')
          .getPublicUrl(testFileName);
        
        console.log(`   • Public URL: ${urlData.publicUrl}`);
        
        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from('promoter-documents')
          .remove([testFileName]);
        
        if (!deleteError) {
          console.log('✅ Test file cleaned up');
        }
      }
    } catch (error) {
      console.error('❌ Upload test error:', error.message);
    }
    
    // 4. Check existing files
    console.log('\n4️⃣ CHECKING EXISTING FILES:');
    const { data: files, error: listError } = await supabase.storage
      .from('promoter-documents')
      .list('', {
        limit: 10,
        offset: 0
      });
    
    if (listError) {
      console.error('❌ Error listing files:', listError.message);
    } else {
      console.log(`✅ Found ${files?.length || 0} items in bucket`);
      files?.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.name} (${file.metadata?.size || 'unknown size'})`);
      });
    }
    
    console.log('\n🎉 STORAGE BUCKET CHECK COMPLETE!');
    
  } catch (error) {
    console.error('❌ Storage check failed:', error.message);
  }
}

async function fixStorageRLS() {
  console.log('\n🔧 FIXING STORAGE RLS POLICIES:');
  
  try {
    // Create policy for authenticated users to upload files
    const createPolicy1 = `
      CREATE POLICY "Allow authenticated users to upload to promoter-documents" 
      ON storage.objects 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (bucket_id = 'promoter-documents');
    `;
    
    const createPolicy2 = `
      CREATE POLICY "Allow authenticated users to view promoter-documents" 
      ON storage.objects 
      FOR SELECT 
      TO authenticated 
      USING (bucket_id = 'promoter-documents');
    `;
    
    const createPolicy3 = `
      CREATE POLICY "Allow authenticated users to delete their promoter-documents" 
      ON storage.objects 
      FOR DELETE 
      TO authenticated 
      USING (bucket_id = 'promoter-documents');
    `;
    
    // Execute policies using service role
    console.log('Creating storage policies...');
    
    const { error: policy1Error } = await supabase.rpc('exec_sql', { 
      sql: createPolicy1 
    });
    
    if (policy1Error && !policy1Error.message.includes('already exists')) {
      console.error('❌ Policy 1 error:', policy1Error.message);
    } else {
      console.log('✅ Upload policy created/exists');
    }
    
    const { error: policy2Error } = await supabase.rpc('exec_sql', { 
      sql: createPolicy2 
    });
    
    if (policy2Error && !policy2Error.message.includes('already exists')) {
      console.error('❌ Policy 2 error:', policy2Error.message);
    } else {
      console.log('✅ View policy created/exists');
    }
    
    const { error: policy3Error } = await supabase.rpc('exec_sql', { 
      sql: createPolicy3 
    });
    
    if (policy3Error && !policy3Error.message.includes('already exists')) {
      console.error('❌ Policy 3 error:', policy3Error.message);
    } else {
      console.log('✅ Delete policy created/exists');
    }
    
  } catch (error) {
    console.error('❌ RLS fix failed:', error.message);
  }
}

checkStorageBucket();
