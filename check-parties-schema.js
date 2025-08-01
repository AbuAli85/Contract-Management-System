const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPartiesSchema() {
  console.log('=== Checking Parties Table Schema ===');
  
  try {
    // Get a sample record to see the structure
    const { data: sampleParty, error } = await supabase
      .from('parties')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching parties:', error.message);
      return;
    }
    
    if (sampleParty && sampleParty.length > 0) {
      console.log('📋 Parties table columns:');
      Object.keys(sampleParty[0]).forEach(column => {
        console.log(`  - ${column}: ${typeof sampleParty[0][column]}`);
      });
    } else {
      console.log('📋 No parties found, checking table structure...');
      
      // Try to get table info from information_schema
      const { data: columns, error: schemaError } = await supabase
        .rpc('get_table_columns', { table_name: 'parties' });
      
      if (schemaError) {
        console.log('📋 Trying alternative method...');
        // Try a simple insert to see what columns are available
        const testData = {
          name: 'Test Company',
          name_ar: 'شركة تجريبية',
          crn: 'TEST123',
          type: 'Employer',
          role: 'ceo',
          status: 'Active'
        };
        
        const { error: insertError } = await supabase
          .from('parties')
          .insert([testData]);
        
        if (insertError) {
          console.error('❌ Insert error (this shows available columns):', insertError.message);
        } else {
          console.log('✅ Test insert successful');
          // Clean up test data
          await supabase.from('parties').delete().eq('crn', 'TEST123');
        }
      } else {
        console.log('📋 Table columns:', columns);
      }
    }
    
    // Also check total count
    const { count } = await supabase
      .from('parties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Total parties in database: ${count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPartiesSchema().catch(console.error); 