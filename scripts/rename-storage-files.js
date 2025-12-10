/**
 * Script to rename storage files from NO_PASSPORT to actual passport numbers
 * 
 * Usage:
 *   node scripts/rename-storage-files.js
 * 
 * Prerequisites:
 *   - Set NEXT_PUBLIC_SUPABASE_URL environment variable
 *   - Set SUPABASE_SERVICE_ROLE_KEY environment variable
 *   - OR create .env.local file with these variables
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Try to load .env.local if it exists
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

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://reootcngcptfogfozlmz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('\n📋 Please set the following environment variables:');
  console.error('   1. NEXT_PUBLIC_SUPABASE_URL');
  console.error('   2. SUPABASE_SERVICE_ROLE_KEY');
  console.error('\n🔧 Option 1: Set in PowerShell (temporary):');
  console.error('   $env:NEXT_PUBLIC_SUPABASE_URL="https://reootcngcptfogfozlmz.supabase.co"');
  console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE"');
  console.error('   node scripts/rename-storage-files.js');
  console.error('\n🔧 Option 2: Create .env.local file:');
  console.error('   Create .env.local in project root with:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL=https://reootcngcptfogfozlmz.supabase.co');
  console.error('   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlb290Y25nY3B0Zm9nZm96bG16Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ0NDM4MiwiZXhwIjoyMDY5MDIwMzgyfQ.BTLA-2wwXJgjW6MKoaw2ERbCr_fXF9w4zgLb70_5DAE');
  console.error('\n📝 How to get Service Role Key:');
  console.error('   1. Go to Supabase Dashboard → Settings → API');
  console.error('   2. Copy "service_role" key (NOT the anon key)');
  console.error('   3. ⚠️  Keep this secret! Never commit to Git!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dynamic function to fetch files that need renaming from database
async function fetchFilesToRename() {
  console.log('🔍 Fetching files that need renaming from database...');
  
  // Get all promoters with passport numbers
  const { data: promoters, error: promoterError } = await supabase
    .from('promoters')
    .select('id, name_en, passport_number, passport_url')
    .not('passport_number', 'is', null)
    .neq('passport_number', '');

  if (promoterError) {
    console.error('❌ Error fetching promoters:', promoterError.message);
    return [];
  }

  // Get all files in storage
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from('promoter-documents')
    .list('', { limit: 10000 });

  if (storageError) {
    console.error('❌ Error fetching storage files:', storageError.message);
    return [];
  }

  const filesToRename = [];

  // Find NO_PASSPORT files and match with promoters
  for (const file of storageFiles || []) {
    if (file.name && (file.name.includes('NO_PASSPORT') || file.name.includes('no_passport'))) {
      // Try to match with promoter
      for (const promoter of promoters || []) {
        if (!promoter.name_en || !promoter.passport_number) continue;

        const cleanName = promoter.name_en
          .trim()
          .replace(/[^a-zA-Z0-9\s]/g, '_')
          .replace(/\s+/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '')
          .toLowerCase();

        const cleanPassport = promoter.passport_number
          .trim()
          .replace(/[^a-zA-Z0-9]/g, '_')
          .toLowerCase();

        // Get file extension from current file
        const extension = file.name.match(/\.(png|jpeg|jpg)$/i)?.[0] || '.png';

        // Check if this file matches this promoter
        // Handle case-insensitive matching and different naming patterns
        const oldNameLower = file.name.toLowerCase();
        const cleanNameLower = cleanName.toLowerCase();
        
        // Build various expected patterns
        const expectedOldName1 = `${cleanNameLower}_no_passport${extension}`;
        const expectedOldName2 = `${cleanNameLower}_no_passport.png`; // Default to .png
        const expectedOldName3 = `${cleanNameLower}_no_passport.jpeg`; // .jpeg variant
        const expectedOldName4 = `${cleanNameLower}_no_passport.jpg`; // .jpg variant
        
        // Also check uppercase variants
        const cleanNameUpper = cleanName.toUpperCase();
        const expectedOldName5 = `${cleanNameUpper}_NO_PASSPORT${extension.toUpperCase()}`;
        const expectedOldName6 = `${cleanNameUpper}_NO_PASSPORT.PNG`;
        const expectedOldName7 = `${cleanNameUpper}_NO_PASSPORT.JPEG`;
        const expectedOldName8 = `${cleanNameUpper}_NO_PASSPORT.JPG`;

        // Fuzzy matching: check if filename contains promoter name and NO_PASSPORT
        const nameWords = cleanNameLower.split('_').filter(w => w.length > 3); // Get significant words
        const hasNameMatch = nameWords.length > 0 && nameWords.some(word => oldNameLower.includes(word));
        const hasNoPassport = oldNameLower.includes('no_passport') || oldNameLower.includes('NO_PASSPORT');

        if (
          oldNameLower === expectedOldName1 ||
          oldNameLower === expectedOldName2 ||
          oldNameLower === expectedOldName3 ||
          oldNameLower === expectedOldName4 ||
          oldNameLower === expectedOldName5.toLowerCase() ||
          oldNameLower === expectedOldName6.toLowerCase() ||
          oldNameLower === expectedOldName7.toLowerCase() ||
          oldNameLower === expectedOldName8.toLowerCase() ||
          // Fuzzy match: filename contains promoter name and NO_PASSPORT
          (hasNameMatch && hasNoPassport && 
           // Additional check: at least 3 matching words or 70% name similarity
           (nameWords.filter(w => oldNameLower.includes(w)).length >= Math.min(3, nameWords.length) ||
            oldNameLower.replace(/[^a-z0-9]/g, '').includes(cleanNameLower.replace(/[^a-z0-9]/g, '').substring(0, Math.floor(cleanNameLower.length * 0.7)))))
        ) {
          const newName = `${cleanName}_${cleanPassport}${extension}`;
          
          // Only add if not already in list
          if (!filesToRename.find(f => f.old === file.name)) {
            filesToRename.push({
              old: file.name,
              new: newName,
              promoter_id: promoter.id,
              promoter_name: promoter.name_en,
              passport_number: promoter.passport_number
            });
          }
          break; // Found match, move to next file
        }
      }
    }
  }

  console.log(`✅ Found ${filesToRename.length} files to rename`);
  return filesToRename;
}

async function renameFile(oldName, newName) {
  try {
    console.log(`\n🔄 Renaming: ${oldName} → ${newName}`);

    // Step 1: Download the old file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('promoter-documents')
      .download(oldName);

    if (downloadError) {
      console.error(`❌ Failed to download ${oldName}:`, downloadError.message);
      return false;
    }

    if (!fileData) {
      console.error(`❌ File ${oldName} not found`);
      return false;
    }

    // Step 2: Upload with new name
    // Determine content type from extension
    const contentType = newName.toLowerCase().endsWith('.jpeg') || newName.toLowerCase().endsWith('.jpg')
      ? 'image/jpeg'
      : 'image/png';

    const { error: uploadError } = await supabase.storage
      .from('promoter-documents')
      .upload(newName, fileData, {
        contentType: contentType,
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      console.error(`❌ Failed to upload ${newName}:`, uploadError.message);
      return false;
    }

    // Step 3: Delete the old file
    const { error: deleteError } = await supabase.storage
      .from('promoter-documents')
      .remove([oldName]);

    if (deleteError) {
      console.error(`⚠️  Warning: Failed to delete ${oldName}:`, deleteError.message);
      console.log(`   File ${newName} was created, but old file may still exist`);
      return true; // Still consider success if new file exists
    }

    console.log(`✅ Successfully renamed: ${oldName} → ${newName}`);
    return true;
  } catch (error) {
    console.error(`❌ Error renaming ${oldName}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Storage Files Rename Process...\n');
  console.log('='.repeat(60));

  // Fetch files dynamically from database
  const filesToRename = await fetchFilesToRename();

  if (filesToRename.length === 0) {
    console.log('✅ No files found that need renaming. All files are already correct!');
    return;
  }

  console.log(`\n📋 Found ${filesToRename.length} files to rename:\n`);
  filesToRename.forEach((file, index) => {
    console.log(`${index + 1}. ${file.old}`);
    console.log(`   → ${file.new} (${file.promoter_name} - ${file.passport_number})`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('🔄 Starting rename process...\n');

  let successCount = 0;
  let failCount = 0;

  for (const file of filesToRename) {
    if (!file.new) {
      console.log(`⚠️  Skipping ${file.old} - no new name specified`);
      failCount++;
      continue;
    }

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
  console.log(`❌ Failed to rename: ${failCount}`);

  if (failCount > 0) {
    console.error('\n⚠️  Some files failed to rename. Please review the logs above.');
    process.exit(1);
  } else {
    console.log('\n🎉 All files renamed successfully!');
  }
}

// Run the script
main().catch(console.error);

