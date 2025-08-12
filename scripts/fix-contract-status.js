const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixContractStatus() {
  console.log('🔧 Fixing Contract Status Issues...');

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('✅ Supabase client initialized with service role');

    // Find contracts that are stuck in processing or have PDF URLs but wrong status
    console.log('\n🔍 Finding contracts with status issues...');

    const { data: contractsWithIssues, error: fetchError } = await supabase
      .from('contracts')
      .select('*')
      .or('status.eq.processing,status.eq.pending')
      .order('created_at', { ascending: false })
      .limit(10);

    if (fetchError) {
      console.error('❌ Error fetching contracts:', fetchError);
      return;
    }

    console.log(
      `📋 Found ${contractsWithIssues?.length || 0} contracts with status issues:`
    );

    if (contractsWithIssues && contractsWithIssues.length > 0) {
      for (const contract of contractsWithIssues) {
        console.log(`\n📄 Contract: ${contract.contract_number}`);
        console.log(`   Status: ${contract.status}`);
        console.log(`   PDF URL: ${contract.pdf_url || 'None'}`);
        console.log(`   Created: ${contract.created_at}`);

        // Check if contract has PDF URL but wrong status
        if (contract.pdf_url && contract.status !== 'generated') {
          console.log('   🔧 Fixing: Has PDF but wrong status');

          const { error: updateError } = await supabase
            .from('contracts')
            .update({
              status: 'generated',
              updated_at: new Date().toISOString(),
            })
            .eq('id', contract.id);

          if (updateError) {
            console.error(`   ❌ Failed to update: ${updateError.message}`);
          } else {
            console.log('   ✅ Updated to "generated" status');
          }
        } else if (!contract.pdf_url && contract.status === 'processing') {
          // Check if contract has been processing for too long (more than 10 minutes)
          const createdTime = new Date(contract.created_at).getTime();
          const currentTime = new Date().getTime();
          const processingTime = currentTime - createdTime;
          const tenMinutes = 10 * 60 * 1000;

          if (processingTime > tenMinutes) {
            console.log('   🔧 Fixing: Stuck in processing for too long');

            const { error: updateError } = await supabase
              .from('contracts')
              .update({
                status: 'draft',
                updated_at: new Date().toISOString(),
              })
              .eq('id', contract.id);

            if (updateError) {
              console.error(`   ❌ Failed to update: ${updateError.message}`);
            } else {
              console.log('   ✅ Updated to "draft" status (can be retried)');
            }
          } else {
            console.log('   ⏳ Still processing (within normal time)');
          }
        } else {
          console.log('   ℹ️ No action needed');
        }
      }
    } else {
      console.log('✅ No contracts with status issues found');
    }

    // Also check for contracts with PDF URLs but wrong status
    console.log('\n🔍 Checking for contracts with PDFs but wrong status...');

    const { data: contractsWithPDFs, error: pdfFetchError } = await supabase
      .from('contracts')
      .select('*')
      .not('pdf_url', 'is', null)
      .neq('status', 'generated')
      .order('created_at', { ascending: false })
      .limit(10);

    if (pdfFetchError) {
      console.error('❌ Error fetching contracts with PDFs:', pdfFetchError);
    } else {
      console.log(
        `📋 Found ${contractsWithPDFs?.length || 0} contracts with PDFs but wrong status:`
      );

      if (contractsWithPDFs && contractsWithPDFs.length > 0) {
        for (const contract of contractsWithPDFs) {
          console.log(`\n📄 Contract: ${contract.contract_number}`);
          console.log(`   Status: ${contract.status}`);
          console.log(`   PDF URL: ${contract.pdf_url}`);

          const { error: updateError } = await supabase
            .from('contracts')
            .update({
              status: 'generated',
              updated_at: new Date().toISOString(),
            })
            .eq('id', contract.id);

          if (updateError) {
            console.error(`   ❌ Failed to update: ${updateError.message}`);
          } else {
            console.log('   ✅ Updated to "generated" status');
          }
        }
      }
    }

    // Get summary of contract statuses
    console.log('\n📊 Contract Status Summary:');

    const { data: statusSummary, error: summaryError } = await supabase
      .from('contracts')
      .select('status')
      .not('status', 'is', null);

    if (!summaryError && statusSummary) {
      const statusCounts = statusSummary.reduce((acc, contract) => {
        acc[contract.status] = (acc[contract.status] || 0) + 1;
        return acc;
      }, {});

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`);
      });
    }

    console.log('\n🎉 Contract status fix completed!');
    console.log('\nNext steps:');
    console.log('1. Check the contract generation page');
    console.log('2. Verify that contracts show correct status');
    console.log('3. Test PDF download functionality');
  } catch (error) {
    console.error('❌ Contract status fix failed:', error);
  }
}

// Run the fix
fixContractStatus();
