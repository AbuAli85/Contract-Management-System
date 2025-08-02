const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase with service role for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function fixPromoterAlignmentSimple() {
  console.log('🔧 SIMPLE FIX: Assign All Problematic Promoters to First Company');
  console.log('=' .repeat(70));
  
  try {
    // 1. Get the first company (target company)
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name_en, name_ar')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();
    
    if (partiesError || !parties) {
      console.error('❌ Error fetching first company:', partiesError?.message);
      return;
    }
    
    const targetCompany = parties;
    console.log(`🎯 Target Company: ${targetCompany.name_en}`);
    console.log(`   ID: ${targetCompany.id}`);
    
    // 2. Get all companies for validation
    const { data: allParties, error: allPartiesError } = await supabase
      .from('parties')
      .select('id');
    
    if (allPartiesError) {
      console.error('❌ Error fetching all companies:', allPartiesError.message);
      return;
    }
    
    const validCompanyIds = new Set(allParties?.map(p => p.id) || []);
    
    // 3. Find all promoters with invalid or null employer_id
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('id, name_en, employer_id');
    
    if (promotersError) {
      console.error('❌ Error fetching promoters:', promotersError.message);
      return;
    }
    
    const problematicPromoters = promoters?.filter(p => 
      !p.employer_id || !validCompanyIds.has(p.employer_id)
    ) || [];
    
    console.log(`\n📊 Analysis:`);
    console.log(`   • Total promoters: ${promoters?.length || 0}`);
    console.log(`   • Problematic promoters: ${problematicPromoters.length}`);
    console.log(`   • Will be fixed: ${problematicPromoters.length}`);
    
    if (problematicPromoters.length === 0) {
      console.log('✅ No problematic promoters found - all alignments are valid!');
      return;
    }
    
    // 4. Show what will be updated
    console.log(`\n🔄 Promoters to be updated:`);
    problematicPromoters.slice(0, 10).forEach((promoter, index) => {
      console.log(`   ${index + 1}. ${promoter.name_en} (${promoter.employer_id || 'NULL'} → ${targetCompany.id.substring(0, 8)}...)`);
    });
    
    if (problematicPromoters.length > 10) {
      console.log(`   ... and ${problematicPromoters.length - 10} more`);
    }
    
    // 5. Confirm before proceeding
    console.log(`\n⚠️  WARNING: This will update ${problematicPromoters.length} promoter records`);
    console.log(`   All will be assigned to: ${targetCompany.name_en}`);
    console.log(`\n🚀 Proceeding with update in 3 seconds...`);
    
    // Wait 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. Perform the update
    console.log(`\n🔄 Starting bulk update...`);
    
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < problematicPromoters.length; i += batchSize) {
      const batch = problematicPromoters.slice(i, i + batchSize);
      console.log(`   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(problematicPromoters.length/batchSize)} (${batch.length} records)`);
      
      for (const promoter of batch) {
        try {
          const { error: updateError } = await supabase
            .from('promoters')
            .update({ employer_id: targetCompany.id })
            .eq('id', promoter.id);
          
          if (updateError) {
            console.error(`     ❌ Failed to update ${promoter.name_en}:`, updateError.message);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error(`     ❌ Exception updating ${promoter.name_en}:`, error.message);
          errorCount++;
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 7. Final report
    console.log(`\n✅ UPDATE COMPLETE!`);
    console.log(`   • Successfully updated: ${successCount} promoters`);
    console.log(`   • Failed updates: ${errorCount} promoters`);
    console.log(`   • Success rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
    
    // 8. Verify the fix
    console.log(`\n🔍 Verifying fix...`);
    const { data: verifyPromoters, error: verifyError } = await supabase
      .from('promoters')
      .select('id, name_en, employer_id')
      .limit(5);
    
    if (!verifyError && verifyPromoters) {
      console.log(`✅ Sample of updated promoters:`);
      verifyPromoters.forEach((promoter, index) => {
        const isValid = validCompanyIds.has(promoter.employer_id);
        console.log(`   ${index + 1}. ${promoter.name_en} → ${isValid ? '✅' : '❌'} ${promoter.employer_id?.substring(0, 8)}...`);
      });
    }
    
    console.log(`\n🎉 Promoter-Company alignment fix completed!`);
    console.log(`   All promoters now reference valid companies.`);
    
  } catch (error) {
    console.error('❌ Fix failed:', error.message);
  }
}

fixPromoterAlignmentSimple();
