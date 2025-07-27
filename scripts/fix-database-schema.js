const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function fixDatabaseSchema() {
  console.log('🔧 Fixing Database Schema Issues...')

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables')
      return
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('✅ Supabase client initialized with service role')

    // SQL commands to fix database schema
    const sqlCommands = [
      // Add error_message column
      `DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='contracts' AND column_name='error_message') THEN
          ALTER TABLE contracts ADD COLUMN error_message TEXT;
          CREATE INDEX IF NOT EXISTS idx_contracts_error_message ON contracts(error_message);
          COMMENT ON COLUMN contracts.error_message IS 'Error message from contract generation process';
        END IF;
      END $$;`,

      // Add other missing columns
      `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS google_drive_url TEXT;`,
      `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS makecom_webhook_response TEXT;`,
      `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS generation_attempts INTEGER DEFAULT 0;`,
      `ALTER TABLE contracts ADD COLUMN IF NOT EXISTS last_generation_attempt TIMESTAMPTZ;`,

      // Add comments
      `COMMENT ON COLUMN contracts.google_drive_url IS 'URL to the contract PDF stored in Google Drive';`,
      `COMMENT ON COLUMN contracts.makecom_webhook_response IS 'Response from Make.com webhook during contract generation';`,
      `COMMENT ON COLUMN contracts.generation_attempts IS 'Number of times contract generation has been attempted';`,
      `COMMENT ON COLUMN contracts.last_generation_attempt IS 'Timestamp of the last generation attempt';`,

      // Update status constraint
      `DO $$
      BEGIN
        ALTER TABLE contracts DROP CONSTRAINT IF EXISTS contracts_status_check;
        ALTER TABLE contracts ADD CONSTRAINT contracts_status_check 
          CHECK (status IN ('draft', 'pending', 'processing', 'active', 'expired', 'generated', 'soon-to-expire', 'approved', 'rejected', 'failed'));
      END $$;`
    ]

    // Execute each SQL command
    for (let i = 0; i < sqlCommands.length; i++) {
      const sql = sqlCommands[i]
      console.log(`\n🔧 Executing SQL command ${i + 1}/${sqlCommands.length}...`)

      const { error } = await supabase.rpc('exec_sql', { sql })

      if (error) {
        console.error(`❌ Error executing SQL command ${i + 1}:`, error.message)

        // If exec_sql function doesn't exist, try direct query
        if (error.message.includes('function "exec_sql" does not exist')) {
          console.log('⚠️ exec_sql function not found, trying direct query...')

          // For direct queries, we need to use the SQL editor or dashboard
          console.log('📝 Please run the following SQL in your Supabase SQL Editor:')
          console.log('\n' + sql + '\n')
        }
      } else {
        console.log(`✅ SQL command ${i + 1} executed successfully`)
      }
    }

    // Verify the schema changes
    console.log('\n🔍 Verifying schema changes...')

    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'contracts')
      .in('column_name', ['error_message', 'google_drive_url', 'makecom_webhook_response', 'generation_attempts', 'last_generation_attempt'])
      .order('column_name')

    if (columnsError) {
      console.error('❌ Error checking columns:', columnsError.message)
    } else {
      console.log('✅ Found columns in contracts table:')
      columns?.forEach(column => {
        console.log(`   - ${column.column_name}: ${column.data_type}`)
      })
    }

    // Test inserting a contract with error_message
    console.log('\n🧪 Testing error_message column...')

    const testContract = {
      contract_number: 'TEST-SCHEMA-FIX-' + Date.now(),
      status: 'draft',
      error_message: 'Test error message for schema verification',
      generation_attempts: 1,
      last_generation_attempt: new Date().toISOString()
    }

    const { data: insertedContract, error: insertError } = await supabase
      .from('contracts')
      .insert(testContract)
      .select()

    if (insertError) {
      console.error('❌ Test insert failed:', insertError.message)
    } else {
      console.log('✅ Test insert successful!')
      console.log(`Inserted test contract: ${insertedContract[0].contract_number}`)

      // Clean up the test data
      const { error: deleteError } = await supabase
        .from('contracts')
        .delete()
        .eq('contract_number', testContract.contract_number)

      if (deleteError) {
        console.log('⚠️ Warning: Could not clean up test data:', deleteError.message)
      } else {
        console.log('✅ Test data cleaned up successfully')
      }
    }

    console.log('\n🎉 Database schema fix completed!')
    console.log('\nNext steps:')
    console.log('1. Restart your application')
    console.log('2. Test contract generation again')
    console.log('3. Check that error messages are properly stored')

  } catch (error) {
    console.error('❌ Database schema fix failed:', error)
  }
}

// Run the fix
fixDatabaseSchema() 