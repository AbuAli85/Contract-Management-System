/**
 * Script to rename storage files from NO_PASSPORT to actual passport numbers
 * 
 * Usage (with tsx - recommended):
 *   npx tsx scripts/rename-storage-files.ts
 * 
 * Or use JavaScript version (no dependencies):
 *   node scripts/rename-storage-files.js
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Files to rename (from the match query results)
const filesToRename = [
  { old: 'abdul_wahab_makki_ali_NO_PASSPORT.png', new: 'abdul_wahab_makki_ali_ab0397283.png' },
  { old: 'abdullah_muhammad_ilyas_NO_PASSPORT.png', new: 'abdullah_muhammad_ilyas_hn9999573.png' },
  { old: 'adeel_aziz_NO_PASSPORT.png', new: 'adeel_aziz_ce1811183.png' },
  { old: 'ahmad_yar_NO_PASSPORT.png', new: 'ahmad_yar_bd6991962.png' },
  { old: 'ali_husnain_karamat_ali_NO_PASSPORT.png', new: 'ali_husnain_karamat_ali_jz6801782.png' },
  { old: 'ayub_ansari_NO_PASSPORT.png', new: 'ayub_ansari_p4949022.png' },
  { old: 'azhar_habib_NO_PASSPORT.png', new: 'azhar_habib_ca6033242.png' },
  { old: 'haseeb_arslan_NO_PASSPORT.png', new: 'haseeb_arslan_jb1916471.png' },
  { old: 'johirul_islam_NO_PASSPORT.png', new: 'johirul_islam_eh0211875.png' },
  { old: 'karam_din_NO_PASSPORT.png', new: 'karam_din_fw7792021.png' },
  { old: 'kashif_ali_NO_PASSPORT.png', new: 'kashif_ali_vf1822691.png' },
  { old: 'mahaboob_pasha_shaik_NO_PASSPORT.png', new: 'mahaboob_pasha_shaik_t6934406.png' },
  { old: 'marijoe_bulabon_pino_NO_PASSPORT.png', new: 'marijoe_bulabon_pino_p6702490b.png' },
  { old: 'mohamed_yahia_mohamed_abdelmonem_NO_PASSPORT.png', new: 'mohamed_yahia_mohamed_abdelmonem_a32204360.png' },
  { old: 'mohammad_mujahid_arafat_NO_PASSPORT.png', new: 'mohammad_mujahid_arafat_v4267475.png' },
  { old: 'mubeen_pasha_mohammed_NO_PASSPORT.png', new: 'mubeen_pasha_mohammed_ab012069.png' },
  { old: 'muhammad_farooq_NO_PASSPORT.png', new: 'muhammad_farooq_dv8966112.png' },
  { old: 'muhammad_jasim_NO_PASSPORT.png', new: 'muhammad_jasim_kw1519461.png' },
  { old: 'muhammad_sajjad_khan_NO_PASSPORT.png', new: 'muhammad_sajjad_khan_xk4133292.png' },
  { old: 'muhammad_waqar_NO_PASSPORT.png', new: 'muhammad_waqar_ba6321511.png' },
  { old: 'muhammad_zeeshan_NO_PASSPORT.png', new: 'muhammad_zeeshan_bc5843332.png' },
  { old: 'rameez_ramzan_NO_PASSPORT.png', new: 'rameez_ramzan_er9219231.png' },
  { old: 'rasheed_bilavinakath_NO_PASSPORT.png', new: 'rasheed_bilavinakath_u0341698.png' },
  { old: 'sajjad_hussain_NO_PASSPORT.png', new: 'sajjad_hussain_uh6892783.png' },
  { old: 'syed_ghazanfar_hussain_bukhari_NO_PASSPORT.png', new: 'syed_ghazanfar_hussain_bukhari_el3344032.png' },
  { old: 'usman_javed_NO_PASSPORT.png', new: 'usman_javed_er8673902.png' },
  { old: 'yasir_ali_NO_PASSPORT.png', new: 'yasir_ali_bb1838881.png' },
];

async function renameFile(oldName: string, newName: string): Promise<boolean> {
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
    const { error: uploadError } = await supabase.storage
      .from('promoter-documents')
      .upload(newName, fileData, {
        contentType: 'image/png',
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
  console.log('🚀 Starting storage file rename process...');
  console.log(`📋 Total files to rename: ${filesToRename.length}\n`);

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

  console.log('\n' + '='.repeat(50));
  console.log('📊 Rename Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Total: ${filesToRename.length}`);
  console.log('='.repeat(50));

  if (failCount === 0) {
    console.log('\n🎉 All files renamed successfully!');
  } else {
    console.log(`\n⚠️  ${failCount} files failed to rename. Please check the errors above.`);
  }
}

// Run the script
main().catch(console.error);

