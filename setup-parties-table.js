const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please make sure your .env file contains:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPartiesTable() {
  console.log('=== Setting up Parties Table ===');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('create-parties-table.sql', 'utf8');
    
    console.log('📄 SQL content loaded');
    console.log('🔧 Executing SQL to create parties table...');
    
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Error executing SQL:', error.message);
      
      // If RPC doesn't work, try to create table manually
      console.log('🔄 Trying alternative approach...');
      
      // Create table manually using individual statements
      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS parties (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name_en TEXT NOT NULL,
          name_ar TEXT,
          crn TEXT,
          type TEXT CHECK (type IN ('Employer', 'Client', 'Generic', NULL)),
          role TEXT,
          status TEXT,
          cr_status TEXT,
          cr_expiry TEXT,
          license_status TEXT,
          license_expiry TEXT,
          contact_person TEXT,
          contact_email TEXT,
          contact_phone TEXT,
          address_en TEXT,
          tax_number TEXT,
          license_number TEXT,
          active_contracts INTEGER DEFAULT 0,
          overall_status TEXT DEFAULT 'Active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          notes TEXT
        );
      `;
      
      const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
      
      if (createError) {
        console.error('❌ Error creating table:', createError.message);
        console.log('💡 You may need to run the SQL manually in your database');
        console.log('📄 SQL file: create-parties-table.sql');
      } else {
        console.log('✅ Parties table created successfully!');
      }
    } else {
      console.log('✅ Parties table created successfully!');
    }
    
    // Verify table exists
    console.log('🔍 Verifying table structure...');
    const { data: tables, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'parties');
    
    if (tableError) {
      console.log('⚠️ Could not verify table (this is normal if using anon key)');
    } else if (tables && tables.length > 0) {
      console.log('✅ Table verification successful');
    }
    
  } catch (error) {
    console.error('❌ Error setting up table:', error.message);
    console.log('💡 Please run the SQL manually in your database');
    console.log('📄 SQL file: create-parties-table.sql');
  }
}

setupPartiesTable().catch(console.error); 