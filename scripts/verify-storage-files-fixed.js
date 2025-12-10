/**
 * Verification Script: Check if all storage files are fixed
 * 
 * Usage:
 *   node scripts/verify-storage-files-fixed.js
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

if (!supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY');
  console.error('Please set the environment variable or create .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Expected files (from the match query)
const expectedFiles = [
  { name: 'abdul_wahab_makki_ali_ab0397283.png', passport: 'ab0397283' },
  { name: 'abdullah_muhammad_ilyas_hn9999573.png', passport: 'hn9999573' },
  { name: 'adeel_aziz_ce1811183.png', passport: 'ce1811183' },
  { name: 'ahmad_yar_bd6991962.png', passport: 'bd6991962' },
  { name: 'ali_husnain_karamat_ali_jz6801782.png', passport: 'jz6801782' },
  { name: 'ayub_ansari_p4949022.png', passport: 'p4949022' },
  { name: 'azhar_habib_ca6033242.png', passport: 'ca6033242' },
  { name: 'haseeb_arslan_jb1916471.png', passport: 'jb1916471' },
  { name: 'johirul_islam_eh0211875.png', passport: 'eh0211875' },
  { name: 'karam_din_fw7792021.png', passport: 'fw7792021' },
  { name: 'kashif_ali_vf1822691.png', passport: 'vf1822691' },
  { name: 'mahaboob_pasha_shaik_t6934406.png', passport: 't6934406' },
  { name: 'marijoe_bulabon_pino_p6702490b.png', passport: 'p6702490b' },
  { name: 'mohamed_yahia_mohamed_abdelmonem_a32204360.png', passport: 'a32204360' },
  { name: 'mohammad_mujahid_arafat_v4267475.png', passport: 'v4267475' },
  { name: 'mubeen_pasha_mohammed_ab012069.png', passport: 'ab012069' },
  { name: 'muhammad_farooq_dv8966112.png', passport: 'dv8966112' },
  { name: 'muhammad_jasim_kw1519461.png', passport: 'kw1519461' },
  { name: 'muhammad_sajjad_khan_xk4133292.png', passport: 'xk4133292' },
  { name: 'muhammad_waqar_ba6321511.png', passport: 'ba6321511' },
  { name: 'muhammad_zeeshan_bc5843332.png', passport: 'bc5843332' },
  { name: 'rameez_ramzan_er9219231.png', passport: 'er9219231' },
  { name: 'rasheed_bilavinakath_u0341698.png', passport: 'u0341698' },
  { name: 'sajjad_hussain_uh6892783.png', passport: 'uh6892783' },
  { name: 'syed_ghazanfar_hussain_bukhari_el3344032.png', passport: 'el3344032' },
  { name: 'usman_javed_er8673902.png', passport: 'er8673902' },
  { name: 'yasir_ali_bb1838881.png', passport: 'bb1838881' },
];

const oldFiles = [
  'abdul_wahab_makki_ali_NO_PASSPORT.png',
  'abdullah_muhammad_ilyas_NO_PASSPORT.png',
  'adeel_aziz_NO_PASSPORT.png',
  'ahmad_yar_NO_PASSPORT.png',
  'ali_husnain_karamat_ali_NO_PASSPORT.png',
  'ayub_ansari_NO_PASSPORT.png',
  'azhar_habib_NO_PASSPORT.png',
  'haseeb_arslan_NO_PASSPORT.png',
  'johirul_islam_NO_PASSPORT.png',
  'karam_din_NO_PASSPORT.png',
  'kashif_ali_NO_PASSPORT.png',
  'mahaboob_pasha_shaik_NO_PASSPORT.png',
  'marijoe_bulabon_pino_NO_PASSPORT.png',
  'mohamed_yahia_mohamed_abdelmonem_NO_PASSPORT.png',
  'mohammad_mujahid_arafat_NO_PASSPORT.png',
  'mubeen_pasha_mohammed_NO_PASSPORT.png',
  'muhammad_farooq_NO_PASSPORT.png',
  'muhammad_jasim_NO_PASSPORT.png',
  'muhammad_sajjad_khan_NO_PASSPORT.png',
  'muhammad_waqar_NO_PASSPORT.png',
  'muhammad_zeeshan_NO_PASSPORT.png',
  'rameez_ramzan_NO_PASSPORT.png',
  'rasheed_bilavinakath_NO_PASSPORT.png',
  'sajjad_hussain_NO_PASSPORT.png',
  'syed_ghazanfar_hussain_bukhari_NO_PASSPORT.png',
  'usman_javed_NO_PASSPORT.png',
  'yasir_ali_NO_PASSPORT.png',
];

async function checkFileExists(filename) {
  try {
    const { data, error } = await supabase.storage
      .from('promoter-documents')
      .list('', {
        search: filename,
      });

    if (error) {
      return { exists: false, error: error.message };
    }

    const fileExists = data && data.some(file => file.name === filename);
    return { exists: fileExists, error: null };
  } catch (error) {
    return { exists: false, error: error.message };
  }
}

async function verifyAllFiles() {
  console.log('🔍 Verifying Storage Files Fix...\n');
  console.log('='.repeat(60));

  let newFilesExist = 0;
  let newFilesMissing = 0;
  let oldFilesStillExist = 0;
  let oldFilesRemoved = 0;

  // Check new files (with passport numbers)
  console.log('\n📋 Checking NEW files (with passport numbers):');
  console.log('-'.repeat(60));

  for (const file of expectedFiles) {
    const { exists, error } = await checkFileExists(file.name);
    if (exists) {
      console.log(`✅ ${file.name}`);
      newFilesExist++;
    } else {
      console.log(`❌ ${file.name} - ${error || 'Not found'}`);
      newFilesMissing++;
    }
  }

  // Check old files (NO_PASSPORT)
  console.log('\n📋 Checking OLD files (NO_PASSPORT - should be removed):');
  console.log('-'.repeat(60));

  for (const oldFile of oldFiles) {
    const { exists, error } = await checkFileExists(oldFile);
    if (exists) {
      console.log(`⚠️  ${oldFile} - Still exists (should be removed)`);
      oldFilesStillExist++;
    } else {
      console.log(`✅ ${oldFile} - Removed`);
      oldFilesRemoved++;
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  console.log(`\n✅ New Files (with passport numbers):`);
  console.log(`   Found: ${newFilesExist}/${expectedFiles.length}`);
  console.log(`   Missing: ${newFilesMissing}/${expectedFiles.length}`);

  console.log(`\n🗑️  Old Files (NO_PASSPORT):`);
  console.log(`   Removed: ${oldFilesRemoved}/${oldFiles.length}`);
  console.log(`   Still Exist: ${oldFilesStillExist}/${oldFiles.length}`);

  console.log('\n' + '='.repeat(60));
  
  if (newFilesMissing === 0 && oldFilesStillExist === 0) {
    console.log('🎉 ALL FILES ARE FIXED!');
    console.log('✅ All new files exist');
    console.log('✅ All old files removed');
    console.log('✅ System is ready!');
  } else {
    console.log('⚠️  SOME FILES NEED ATTENTION:');
    if (newFilesMissing > 0) {
      console.log(`   ❌ ${newFilesMissing} new files are missing`);
    }
    if (oldFilesStillExist > 0) {
      console.log(`   ⚠️  ${oldFilesStillExist} old files still exist`);
    }
  }

  console.log('='.repeat(60));
}

// Run verification
verifyAllFiles().catch(console.error);

