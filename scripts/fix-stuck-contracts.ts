import { createClient } from '@/lib/supabase/server';
import { contractGenerationService } from '@/lib/contract-generation-service';

async function fixStuckContracts() {
  console.log('🔧 Starting to fix stuck processing contracts...');

  try {
    const supabase = await createClient();

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

    // Fix each stuck contract
    let successCount = 0;
    let failCount = 0;

    for (const contract of stuckContracts) {
      console.log(`\n🔧 Fixing contract: ${contract.contract_number}`);

      try {
        const success =
          await contractGenerationService.fixStuckProcessingContract(
            contract.id
          );

        if (success) {
          console.log(`✅ Successfully fixed: ${contract.contract_number}`);
          successCount++;
        } else {
          console.log(`❌ Failed to fix: ${contract.contract_number}`);
          failCount++;
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

// Run the script if called directly
if (require.main === module) {
  fixStuckContracts()
    .then(() => {
      console.log('🎉 Script completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

export { fixStuckContracts };
