const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create supabase client with service role
const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorageForPromoters() {
  console.log('🗂️ COMPREHENSIVE STORAGE SETUP FOR PROMOTERS');
  console.log('=' .repeat(60));
  
  try {
    // First, let's check if we can access storage at all
    console.log('\n1️⃣ TESTING STORAGE ACCESS:');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Cannot access storage:', listError.message);
      console.log('🔧 This might be a permissions issue. Let me try a different approach...');
    } else {
      console.log(`✅ Storage accessible. Found ${buckets?.length || 0} buckets.`);
      buckets?.forEach((bucket, index) => {
        console.log(`   ${index + 1}. ${bucket.name} (${bucket.public ? 'Public' : 'Private'})`);
      });
    }

    // Check if promoter-documents bucket exists
    const promoterBucket = buckets?.find(b => b.name === 'promoter-documents');
    
    if (!promoterBucket) {
      console.log('\n2️⃣ CREATING PROMOTER-DOCUMENTS BUCKET:');
      
      // Try multiple methods to create the bucket
      let bucketCreated = false;
      
      // Method 1: Direct bucket creation
      try {
        const { data: bucket1, error: createError1 } = await supabase.storage.createBucket('promoter-documents', {
          public: true,
          allowedMimeTypes: [
            'image/jpeg', 
            'image/jpg', 
            'image/png', 
            'image/gif', 
            'image/webp',
            'application/pdf'
          ],
          fileSizeLimit: 10485760 // 10MB
        });

        if (!createError1) {
          console.log('✅ Method 1: Direct creation successful!');
          bucketCreated = true;
        } else {
          console.log('❌ Method 1 failed:', createError1.message);
        }
      } catch (error1) {
        console.log('❌ Method 1 exception:', error1.message);
      }

      // Method 2: SQL insertion if direct creation failed
      if (!bucketCreated) {
        console.log('🔧 Trying Method 2: SQL insertion...');
        
        try {
          // First, check if we need to disable RLS temporarily
          const disableRLS = `
            ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;
          `;
          
          const { error: disableError } = await supabase.rpc('exec_sql', {
            sql: disableRLS
          });
          
          if (disableError) {
            console.log('⚠️ Could not disable RLS:', disableError.message);
          } else {
            console.log('✅ RLS disabled temporarily');
          }

          // Insert bucket directly
          const insertBucket = `
            INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, created_at, updated_at)
            VALUES (
              'promoter-documents',
              'promoter-documents', 
              true,
              10485760,
              ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'],
              NOW(),
              NOW()
            )
            ON CONFLICT (id) DO NOTHING;
          `;

          const { error: insertError } = await supabase.rpc('exec_sql', {
            sql: insertBucket
          });

          if (!insertError) {
            console.log('✅ Method 2: SQL insertion successful!');
            bucketCreated = true;
          } else {
            console.log('❌ Method 2 failed:', insertError.message);
          }

          // Re-enable RLS
          const enableRLS = `
            ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
          `;
          
          await supabase.rpc('exec_sql', {
            sql: enableRLS
          });
          
        } catch (error2) {
          console.log('❌ Method 2 exception:', error2.message);
        }
      }

      if (!bucketCreated) {
        console.log('❌ All bucket creation methods failed. You may need to create the bucket manually in Supabase Dashboard.');
        console.log('📝 Manual steps:');
        console.log('   1. Go to Supabase Dashboard > Storage');
        console.log('   2. Click "New bucket"');
        console.log('   3. Name: promoter-documents');
        console.log('   4. Make it public');
        console.log('   5. Set file size limit to 10MB');
        console.log('   6. Add allowed MIME types: image/jpeg, image/png, application/pdf');
      }
    } else {
      console.log('\n2️⃣ PROMOTER-DOCUMENTS BUCKET ALREADY EXISTS ✅');
      console.log(`   • ID: ${promoterBucket.id}`);
      console.log(`   • Public: ${promoterBucket.public}`);
    }

    // Create/update storage policies
    console.log('\n3️⃣ SETTING UP STORAGE POLICIES:');
    
    const policies = [
      {
        name: 'Allow authenticated upload to promoter-documents',
        sql: `
          DROP POLICY IF EXISTS "promoter_documents_upload" ON storage.objects;
          CREATE POLICY "promoter_documents_upload" 
          ON storage.objects 
          FOR INSERT 
          TO authenticated 
          WITH CHECK (bucket_id = 'promoter-documents');
        `
      },
      {
        name: 'Allow authenticated view of promoter-documents',
        sql: `
          DROP POLICY IF EXISTS "promoter_documents_select" ON storage.objects;
          CREATE POLICY "promoter_documents_select" 
          ON storage.objects 
          FOR SELECT 
          TO authenticated 
          USING (bucket_id = 'promoter-documents');
        `
      },
      {
        name: 'Allow public view of promoter-documents',
        sql: `
          DROP POLICY IF EXISTS "promoter_documents_public" ON storage.objects;
          CREATE POLICY "promoter_documents_public" 
          ON storage.objects 
          FOR SELECT 
          TO public 
          USING (bucket_id = 'promoter-documents');
        `
      },
      {
        name: 'Allow authenticated delete of promoter-documents',
        sql: `
          DROP POLICY IF EXISTS "promoter_documents_delete" ON storage.objects;
          CREATE POLICY "promoter_documents_delete" 
          ON storage.objects 
          FOR DELETE 
          TO authenticated 
          USING (bucket_id = 'promoter-documents');
        `
      }
    ];

    for (const policy of policies) {
      try {
        const { error: policyError } = await supabase.rpc('exec_sql', {
          sql: policy.sql
        });

        if (policyError) {
          console.error(`❌ ${policy.name}: ${policyError.message}`);
        } else {
          console.log(`✅ ${policy.name}`);
        }
      } catch (error) {
        console.error(`❌ ${policy.name}: ${error.message}`);
      }
    }

    // Test file upload
    console.log('\n4️⃣ TESTING FILE UPLOAD:');
    try {
      const testContent = Buffer.from('Test promoter document upload - this is a test file');
      const testFileName = `test/upload-test-${Date.now()}.txt`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('promoter-documents')
        .upload(testFileName, testContent, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ Upload test failed:', uploadError.message);
        
        if (uploadError.message.includes('bucket') && uploadError.message.includes('not found')) {
          console.log('💡 The bucket might not exist. Please create it manually in Supabase Dashboard.');
        } else if (uploadError.message.includes('policy') || uploadError.message.includes('RLS')) {
          console.log('💡 This appears to be a policy/permission issue.');
          console.log('   Check your RLS policies in Supabase Dashboard > Authentication > Policies');
        }
      } else {
        console.log('✅ Upload test successful!');
        console.log(`   • File path: ${uploadData.path}`);
        
        // Get public URL
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
    } catch (uploadError) {
      console.error('❌ Upload test error:', uploadError.message);
    }

    // Final verification
    console.log('\n5️⃣ FINAL VERIFICATION:');
    const { data: finalBuckets, error: finalError } = await supabase.storage.listBuckets();
    
    if (finalError) {
      console.error('❌ Cannot verify buckets:', finalError.message);
    } else {
      const finalPromoterBucket = finalBuckets?.find(b => b.name === 'promoter-documents');
      if (finalPromoterBucket) {
        console.log('✅ promoter-documents bucket confirmed!');
        console.log('✅ Storage setup complete for promoter documents');
        
        console.log('\n🎯 NEXT STEPS FOR TESTING:');
        console.log('   1. Start your Next.js application');
        console.log('   2. Go to a promoter edit page');
        console.log('   3. Try uploading an ID card or passport');
        console.log('   4. Check if the file URL is saved to the database');
        console.log('   5. Verify the uploaded file is accessible');
        
      } else {
        console.log('❌ promoter-documents bucket not found in final verification');
        console.log('🔧 You will need to create the bucket manually in Supabase Dashboard');
      }
    }

  } catch (error) {
    console.error('❌ Storage setup failed:', error.message);
    console.error('Full error:', error);
  }
}

setupStorageForPromoters();
