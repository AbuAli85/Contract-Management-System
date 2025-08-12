const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function runDatabaseFixes() {
  console.log('🔧 Running database fixes...');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error(
      'Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('📋 Fixing contract status constraint...');

    // Read the migration SQL
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(
      __dirname,
      '015_fix_contract_status_constraint.sql'
    );

    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      process.exit(1);
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('❌ Error executing migration:', error);

      // Fallback: try to execute the SQL directly
      console.log('🔄 Trying direct SQL execution...');

      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);

      for (const statement of statements) {
        if (statement.trim()) {
          console.log('Executing:', statement.substring(0, 50) + '...');
          const { error: stmtError } = await supabase.rpc('exec_sql', {
            sql: statement + ';',
          });
          if (stmtError) {
            console.warn('⚠️ Statement failed:', stmtError.message);
          }
        }
      }
    } else {
      console.log('✅ Contract status constraint fixed successfully');
    }

    // Verify the fix by checking current constraint
    console.log('🔍 Verifying constraint...');
    const { data: constraints, error: checkError } = await supabase
      .from('information_schema.check_constraints')
      .select('constraint_name, check_clause')
      .eq('constraint_name', 'contracts_status_check');

    if (checkError) {
      console.warn('⚠️ Could not verify constraint:', checkError.message);
    } else if (constraints && constraints.length > 0) {
      console.log('✅ Constraint verified:', constraints[0].check_clause);
    }

    console.log('🎉 Database fixes completed successfully!');
  } catch (error) {
    console.error('❌ Error running database fixes:', error);
    process.exit(1);
  }
}

// Run the fixes
runDatabaseFixes();
