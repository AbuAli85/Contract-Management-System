const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

async function checkUpdatedParty() {
  console.log('=== Checking Updated Party Record ===');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Get a specific party that should have CRN
    const { data: party, error } = await supabase
      .from('parties')
      .select('*')
      .eq('name', 'AL AMRI INVESTMENT AND SERVICES LLC')
      .single();
    
    if (error) {
      console.error('❌ Error fetching party:', error.message);
      return;
    }
    
    console.log('📋 Party record for "AL AMRI INVESTMENT AND SERVICES LLC":');
    Object.keys(party).forEach(key => {
      console.log(`  - ${key}: ${JSON.stringify(party[key])}`);
    });
    
    // Check if we can update the registration_number directly
    console.log('\n🧪 Testing direct update of registration_number...');
    
    const updateData = {
      registration_number: {
        number: '1315483',
        type: 'CRN'
      }
    };
    
    const { error: updateError } = await supabase
      .from('parties')
      .update(updateData)
      .eq('name', 'AL AMRI INVESTMENT AND SERVICES LLC');
    
    if (updateError) {
      console.error('❌ Error updating registration_number:', updateError.message);
    } else {
      console.log('✅ Successfully updated registration_number');
      
      // Check the updated record
      const { data: updatedParty } = await supabase
        .from('parties')
        .select('*')
        .eq('name', 'AL AMRI INVESTMENT AND SERVICES LLC')
        .single();
      
      console.log('\n📋 Updated party record:');
      console.log(`  - registration_number: ${JSON.stringify(updatedParty.registration_number)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUpdatedParty().catch(console.error); 