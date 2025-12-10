/**
 * Quick Fix Script for 5 Remaining NO_PASSPORT Files
 * 
 * Usage:
 *   node scripts/fix-5-remaining-files.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env.local if it exists
const envPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://reootcngcptfogfozlmz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('Set it with: $env:SUPABASE_SERVICE_ROLE_KEY="your-key"');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Exact mappings from SQL query results
const filesToRename = [
  {
    old: 'abdelrhman_ahmed_hassan_abdelmoniem_hassan_NO_PASSPORT.jpeg',
    new: 'abdelrhman_ahmed_hassan_abdelmoniem_hassan_a41851594.jpeg',
    passport: 'a41851594'
  },
  {
    old: 'haider_ali_gulam_abbas_merchant_NO_PASSPORT.jpeg',
    new: 'haider_ali_gulam_abbas_merchant_y5935625.jpeg',
    passport: 'y5935625'
  },
  {
    old: 'husnain_sohail_butt_NO_PASSPORT.jpeg',
    new: 'husnain_sohail_butt_ew3490852.jpeg',
    passport: 'ew3490852'
  },
  {
    old: 'MAHMOUD_ELMASRY_ABDELKARIM_ZAHRAN_NO_PASSPORT.jpeg',
    new: 'mahmoud_elmasry_abdelkarim_zahran_a40744362.jpeg',
    passport: 'a40744362'
  },
  // Note: syed_roshaan_e_haider_abbas_jafri_NO_PASSPORT.png
  // Will be handled by checking database first
];

async function checkSyedRoshaan() {
  console.log('🔍 Checking syed_roshaan_e_haider_abbas_jafri...');
  
  const { data, error } = await supabase
    .from('promoters')
    .select('id, name_en, passport_number, passport_url')
    .or('name_en.ilike.%syed roshaan%,name_en.ilike.%roshaan%');

  if (error) {
    console.error('❌ Error:', error.message);
    return null;
  }

  if (data && data.length > 0) {
    const promoter = data[0];
    if (promoter.passport_number) {
      const cleanName = promoter.name_en
        .trim()
        .replace(/[^a-zA-Z0-9\s]/g, '_')
        .replace(/\s+/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .toLowerCase();
      
      return {
        old: 'syed_roshaan_e_haider_abbas_jafri_NO_PASSPORT.png',
        new: `${cleanName}_${promoter.passport_number.toLowerCase()}.png`,
        passport: promoter.passport_number
      };
    }
  }
  
  return null;
}

async function renameFile(oldName, newName) {
  try {
    console.log(`\n🔄 Renaming: ${oldName}`);
    console.log(`   → ${newName}`);

    // Use move operation (more efficient than download/upload/delete)
    const { data, error } = await supabase.storage
      .from('promoter-documents')
      .move(oldName, newName);

    if (error) {
      // If move fails, try download/upload/delete method
      console.log(`   ⚠️  Move failed, trying alternative method...`);
      
      // Download
      const { data: fileData, error: downloadError } = await supabase.storage
        .from('promoter-documents')
        .download(oldName);

      if (downloadError) {
        console.error(`   ❌ Failed to download: ${downloadError.message}`);
        return false;
      }

      // Upload
      const contentType = newName.toLowerCase().endsWith('.jpeg') || newName.toLowerCase().endsWith('.jpg')
        ? 'image/jpeg'
        : 'image/png';

      const { error: uploadError } = await supabase.storage
        .from('promoter-documents')
        .upload(newName, fileData, {
          contentType: contentType,
          upsert: true,
        });

      if (uploadError) {
        console.error(`   ❌ Failed to upload: ${uploadError.message}`);
        return false;
      }

      // Delete old
      const { error: deleteError } = await supabase.storage
        .from('promoter-documents')
        .remove([oldName]);

      if (deleteError) {
        console.log(`   ⚠️  Warning: Old file may still exist: ${deleteError.message}`);
      }
    }

    console.log(`   ✅ Successfully renamed!`);
    return true;
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Fixing 5 Remaining NO_PASSPORT Files\n');
  console.log('='.repeat(60));

  // Check for syed_roshaan
  const syedRoshaan = await checkSyedRoshaan();
  if (syedRoshaan) {
    filesToRename.push(syedRoshaan);
    console.log(`✅ Found passport for syed_roshaan: ${syedRoshaan.passport}`);
  } else {
    console.log(`⚠️  syed_roshaan not found or missing passport number`);
  }

  console.log(`\n📋 Total files to rename: ${filesToRename.length}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const file of filesToRename) {
    const success = await renameFile(file.old, file.new);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 RENAME SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files: ${filesToRename.length}`);
  console.log(`✅ Successfully renamed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);

  if (failCount === 0) {
    console.log('\n🎉 All files renamed successfully!');
  } else {
    console.log(`\n⚠️  ${failCount} files failed. Please check the errors above.`);
    process.exit(1);
  }
}

main().catch(console.error);

