const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixContractStatusConstraint() {
  console.log('🔧 Fixing Contract Status Constraint...');

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

    // SQL commands to fix contract status constraint
    const sqlCommands = [
      // Drop existing constraint
      `ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;`,

      // Add new constraint with 'processing' status included
      `ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
       CHECK (status IN ('draft', 'pending', 'processing', 'active', 'expired', 'generated', 'soon-to-expire', 'approved', 'rejected'));`,

      // Update any existing contracts with invalid status to 'draft'
      `UPDATE contracts 
       SET status = 'draft' 
       WHERE status NOT IN ('draft', 'pending', 'processing', 'active', 'expired', 'generated', 'soon-to-expire', 'approved', 'rejected');`,

      // Add comment
      `COMMENT ON CONSTRAINT contracts_status_check ON contracts IS 'Contract status constraint - allows draft, pending, processing, active, expired, generated, soon-to-expire, approved, rejected';`,
    ];

    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i];
      console.log(
        `\n🔧 Executing SQL command ${i + 1}/${sqlCommands.length}...`
      );

      const { error } = await supabase.rpc('exec_sql', { sql });

      if (error) {
        console.error(
          `❌ Error executing SQL command ${i + 1}:`,
          error.message
        );

        // If exec_sql function doesn't exist, try direct query
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.log('⚠️ exec_sql function not found, trying direct query...');

          // For direct queries, we need to use the SQL editor or dashboard
          console.log(
            '📝 Please run the following SQL in your Supabase SQL Editor:'
          );
          console.log('\n' + sql + '\n');
        }
      } else {
        console.log(`✅ SQL command ${i + 1} executed successfully`);
      }
    }

    // Test the fix by trying to insert a test contract with 'processing' status
    console.log('\n🧪 Testing the fix with a test contract insert...');

    const testContract = {
      contract_number: 'TEST-' + Date.now(),
      first_party_id: '00000000-0000-0000-0000-000000000000',
      second_party_id: '00000000-0000-0000-0000-000000000000',
      promoter_id: '00000000-0000-0000-0000-000000000000',
      contract_start_date: new Date().toISOString().split('T')[0],
      contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      status: 'processing',
      approval_status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: insertedContract, error: insertError } = await supabase
      .from('contracts')
      .insert(testContract)
      .select();

    if (insertError) {
      console.error('❌ Test insert failed:', insertError.message);
      console.log('\n🔧 The constraint still needs to be fixed manually.');
      console.log(
        '📝 Please run the SQL commands from scripts/016_add_processing_status.sql in your Supabase SQL Editor.'
      );
    } else {
      console.log('✅ Test insert successful!');
      console.log(
        `Inserted test contract: ${insertedContract[0].contract_number}`
      );

      // Clean up the test data
      const { error: deleteError } = await supabase
        .from('contracts')
        .delete()
        .eq('contract_number', testContract.contract_number);

      if (deleteError) {
        console.log(
          '⚠️ Warning: Could not clean up test data:',
          deleteError.message
        );
      } else {
        console.log('✅ Test data cleaned up successfully');
      }
    }

    // Verify the constraint was updated
    console.log('\n📋 Verifying constraint...');
    const { data: constraints, error: constraintsError } = await supabase
      .from('information_schema.check_constraints')
      .select('*')
      .eq('constraint_name', 'contracts_status_check');

    if (constraintsError) {
      console.error('❌ Error checking constraints:', constraintsError.message);
    } else {
      console.log(
        `✅ Found ${constraints?.length || 0} contract status constraints:`
      );
      constraints?.forEach(constraint => {
        console.log(
          `   - ${constraint.constraint_name}: ${constraint.check_clause}`
        );
      });
    }

    console.log('\n🎉 Contract status constraint fix completed!');
    console.log('\nNext steps:');
    console.log('1. Try generating a contract again in your application');
    console.log('2. The status "processing" should now be accepted');
    console.log(
      '3. Check the Supabase Dashboard > Database > Tables > contracts for verification'
    );
  } catch (error) {
    console.error('❌ Contract status constraint fix failed:', error);
  }
}

// Run the fix
fixContractStatusConstraint();
