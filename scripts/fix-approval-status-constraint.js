const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixApprovalStatusConstraint() {
  console.log('🔧 Fixing approval_status constraint in database...');

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

    console.log('📋 Current constraint check...');

    // First, let's check what the current constraint allows
    const { data: constraintInfo, error: constraintError } = await supabase.rpc(
      'get_table_constraints',
      { table_name: 'contracts' }
    );

    if (constraintError) {
      console.log(
        '⚠️ Could not check current constraints, proceeding with fix...'
      );
    } else {
      console.log('📋 Current constraints:', constraintInfo);
    }

    console.log('🔧 Dropping existing approval_status constraint...');

    // Drop the existing constraint
    const { error: dropError } = await supabase.rpc(
      'drop_constraint_if_exists',
      {
        table_name: 'contracts',
        constraint_name: 'contracts_approval_status_check',
      }
    );

    if (dropError) {
      console.log(
        '⚠️ Could not drop constraint (might not exist):',
        dropError.message
      );
    } else {
      console.log('✅ Dropped existing constraint');
    }

    console.log('🔧 Adding new approval_status constraint...');

    // Add new constraint with all the approval workflow statuses
    const { error: addError } = await supabase.rpc('add_check_constraint', {
      table_name: 'contracts',
      constraint_name: 'contracts_approval_status_check',
      check_expression:
        "approval_status IN ('draft', 'legal_review', 'hr_review', 'final_approval', 'signature', 'active', 'rejected', 'requested_changes')",
    });

    if (addError) {
      console.error('❌ Error adding new constraint:', addError);

      // Fallback: try direct SQL
      console.log('🔄 Trying direct SQL approach...');
      const { error: sqlError } = await supabase.rpc('execute_sql', {
        sql: `
            ALTER TABLE contracts 
            DROP CONSTRAINT IF EXISTS contracts_approval_status_check;
            
            ALTER TABLE contracts 
            ADD CONSTRAINT contracts_approval_status_check 
            CHECK (approval_status IN ('draft', 'legal_review', 'hr_review', 'final_approval', 'signature', 'active', 'rejected', 'requested_changes'));
          `,
      });

      if (sqlError) {
        console.error('❌ SQL approach also failed:', sqlError);
        console.log('💡 Manual fix required in Supabase Dashboard:');
        console.log('   1. Go to Supabase Dashboard > SQL Editor');
        console.log('   2. Run this SQL:');
        console.log(`
          ALTER TABLE contracts 
          DROP CONSTRAINT IF EXISTS contracts_approval_status_check;
          
          ALTER TABLE contracts 
          ADD CONSTRAINT contracts_approval_status_check 
          CHECK (approval_status IN ('draft', 'legal_review', 'hr_review', 'final_approval', 'signature', 'active', 'rejected', 'requested_changes'));
        `);
        return;
      } else {
        console.log('✅ Constraint updated via SQL');
      }
    } else {
      console.log('✅ New constraint added successfully');
    }

    console.log('🧪 Testing the constraint...');

    // Test with a sample update
    const { data: testContract } = await supabase
      .from('contracts')
      .select('id')
      .limit(1);

    if (testContract && testContract.length > 0) {
      const { error: testError } = await supabase
        .from('contracts')
        .update({ approval_status: 'legal_review' })
        .eq('id', testContract[0].id);

      if (testError) {
        console.error('❌ Constraint test failed:', testError);
      } else {
        console.log(
          '✅ Constraint test passed - can now set approval_status to legal_review'
        );

        // Revert the test
        await supabase
          .from('contracts')
          .update({ approval_status: 'draft' })
          .eq('id', testContract[0].id);
      }
    }

    console.log('\n🎉 Constraint fix completed!');
    console.log('📋 Allowed approval_status values:');
    console.log('   - draft');
    console.log('   - legal_review');
    console.log('   - hr_review');
    console.log('   - final_approval');
    console.log('   - signature');
    console.log('   - active');
    console.log('   - rejected');
    console.log('   - requested_changes');
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

// Run the script
fixApprovalStatusConstraint()
  .then(() => {
    console.log('\n🎉 Constraint fix completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
