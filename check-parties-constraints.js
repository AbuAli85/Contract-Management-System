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

async function checkPartiesConstraints() {
  console.log('=== Checking Parties Table Constraints ===');
  
  try {
    // Try different type values to see what's allowed
    const testTypes = ['Employer', 'employer', 'Client', 'client', 'Vendor', 'vendor', 'Partner', 'partner'];
    
    for (const testType of testTypes) {
      console.log(`\n🧪 Testing type: "${testType}"`);
      
      const testData = {
        name: `Test Company ${testType}`,
        type: testType,
        email: 'test@example.com',
        phone: '+1234567890',
        address: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postal_code: '12345'
        },
        tax_id: {
          number: 'TEST123',
          type: 'tax'
        },
        status: 'Active'
      };
      
      try {
        const { error } = await supabase
          .from('parties')
          .insert([testData]);
        
        if (error) {
          console.log(`❌ Failed: ${error.message}`);
        } else {
          console.log(`✅ Success: "${testType}" is valid`);
          // Clean up test data
          await supabase.from('parties').delete().eq('name', `Test Company ${testType}`);
        }
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
      }
    }
    
    // Also check what types currently exist in the database
    const { data: existingParties } = await supabase
      .from('parties')
      .select('type')
      .limit(10);
    
    if (existingParties && existingParties.length > 0) {
      console.log('\n📋 Existing types in database:');
      const types = [...new Set(existingParties.map(p => p.type))];
      types.forEach(type => console.log(`  - "${type}"`));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPartiesConstraints().catch(console.error); 