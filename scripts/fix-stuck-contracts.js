const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixStuckContracts() {
  console.log('🔧 Starting to fix stuck processing contracts...');

  try {
    // Create Supabase client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables:');
      console.error('   - NEXT_PUBLIC_SUPABASE_URL');
      console.error('   - SUPABASE_SERVICE_ROLE_KEY');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find all contracts stuck in processing status
    const { data: stuckContracts, error } = await supabase
      .from('contracts')
      .select('id, contract_number, status, created_at')
      .eq('status', 'processing')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Error fetching stuck contracts:', error);
      return;
    }

    if (!stuckContracts || stuckContracts.length === 0) {
      console.log('✅ No stuck processing contracts found!');
      return;
    }

    console.log(
      `📋 Found ${stuckContracts.length} stuck processing contracts:`
    );
    stuckContracts.forEach(contract => {
      console.log(
        `  - ${contract.contract_number} (${contract.id}) - Created: ${contract.created_at}`
      );
    });

    // Fix each stuck contract by setting status to draft
    let successCount = 0;
    let failCount = 0;

    for (const contract of stuckContracts) {
      console.log(`\n🔧 Fixing contract: ${contract.contract_number}`);

      try {
        // Set status to draft since we can't generate PDF without storage bucket
        const { error: updateError } = await supabase
          .from('contracts')
          .update({
            status: 'draft',
            updated_at: new Date().toISOString(),
          })
          .eq('id', contract.id);

        if (updateError) {
          console.error(
            `❌ Failed to fix ${contract.contract_number}:`,
            updateError
          );
          failCount++;
        } else {
          console.log(`✅ Successfully fixed: ${contract.contract_number}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error fixing ${contract.contract_number}:`, error);
        failCount++;
      }
    }

    console.log(`\n📊 Fix Summary:`);
    console.log(`  ✅ Successfully fixed: ${successCount}`);
    console.log(`  ❌ Failed to fix: ${failCount}`);
    console.log(`  📋 Total processed: ${stuckContracts.length}`);
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
fixStuckContracts()
  .then(() => {
    console.log('🎉 Script completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
