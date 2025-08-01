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

async function checkPartyStructure() {
  console.log('=== Checking Party Record Structure ===');
  
  try {
    // Get a sample party record to see the actual structure
    const { data: party, error } = await supabase
      .from('parties')
      .select('*')
      .limit(1)
      .single();
    
    if (error) {
      console.error('❌ Error fetching party:', error.message);
      return;
    }
    
    console.log('📋 Party record structure:');
    Object.keys(party).forEach(key => {
      console.log(`  - ${key}: ${JSON.stringify(party[key])}`);
    });
    
    // Specifically check registration_number structure
    if (party.registration_number) {
      console.log('\n📋 Registration Number Structure:');
      console.log(`  Type: ${typeof party.registration_number}`);
      console.log(`  Value: ${JSON.stringify(party.registration_number)}`);
      
      if (typeof party.registration_number === 'object') {
        Object.keys(party.registration_number).forEach(key => {
          console.log(`    - ${key}: ${party.registration_number[key]}`);
        });
      }
    } else {
      console.log('\n❌ No registration_number field found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkPartyStructure().catch(console.error); 