#!/usr/bin/env node

/**
 * Script to fix the missing contract_type column in the contracts table
 * This script can be run directly to resolve the PGRST204 error
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function fixContractTypeColumn() {
  console.log('🔧 Starting contract_type column fix...');
  
  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
    console.error('\nPlease check your .env.local file');
    return;
  }
  
  try {
    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log('📡 Connecting to Supabase...');
    
    // Check if contracts table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'contracts')
      .eq('table_schema', 'public')
      .single();
    
    if (tableError || !tableExists) {
      console.error('❌ Contracts table not found:', tableError?.message);
      return;
    }
    
    console.log('✅ Contracts table found');
    
    // Check if contract_type column exists
    const { data: columnExists, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'contracts')
      .eq('column_name', 'contract_type')
      .eq('table_schema', 'public')
      .single();
    
    if (columnExists) {
      console.log('✅ contract_type column already exists');
      return;
    }
    
    console.log('🔧 Adding contract_type column...');
    
    // Add contract_type column
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE contracts 
        ADD COLUMN contract_type TEXT DEFAULT 'employment' 
        CHECK (contract_type IN ('employment', 'service', 'consultancy', 'partnership'));
      `
    });
    
    if (alterError) {
      console.error('❌ Failed to add contract_type column:', alterError.message);
      
      // Try alternative approach with direct SQL
      console.log('🔄 Trying alternative approach...');
      const { error: directError } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE contracts ADD COLUMN contract_type TEXT DEFAULT 'employment';`
      });
      
      if (directError) {
        console.error('❌ Alternative approach also failed:', directError.message);
        return;
      }
    }
    
    console.log('✅ contract_type column added successfully');
    
    // Check if type column exists to copy data
    const { data: typeColumnExists } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'contracts')
      .eq('column_name', 'type')
      .eq('table_schema', 'public')
      .single();
    
    if (typeColumnExists) {
      console.log('🔄 Copying data from type column...');
      
      const { error: updateError } = await supabase.rpc('exec_sql', {
        sql: `
          UPDATE contracts 
          SET contract_type = COALESCE(type, 'employment') 
          WHERE contract_type IS NULL OR contract_type = '';
        `
      });
      
      if (updateError) {
        console.warn('⚠️ Could not copy data from type column:', updateError.message);
      } else {
        console.log('✅ Data copied from type column');
      }
    }
    
    // Make contract_type NOT NULL
    console.log('🔧 Making contract_type NOT NULL...');
    const { error: notNullError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE contracts ALTER COLUMN contract_type SET NOT NULL;`
    });
    
    if (notNullError) {
      console.warn('⚠️ Could not make contract_type NOT NULL:', notNullError.message);
    } else {
      console.log('✅ contract_type column is now NOT NULL');
    }
    
    // Create index
    console.log('🔧 Creating index...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `CREATE INDEX IF NOT EXISTS idx_contracts_contract_type ON contracts(contract_type);`
    });
    
    if (indexError) {
      console.warn('⚠️ Could not create index:', indexError.message);
    } else {
      console.log('✅ Index created successfully');
    }
    
    console.log('🎉 contract_type column fix completed successfully!');
    console.log('   The form should now work without the PGRST204 error.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the fix
fixContractTypeColumn().catch(console.error);
