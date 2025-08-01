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

async function verifyPartiesWithCRN() {
  console.log('=== Verifying Parties with CRN Information ===');
  
  try {
    // Get all parties with their registration numbers
    const { data: parties, error } = await supabase
      .from('parties')
      .select('name, type, status, email, registration_number, created_at')
      .order('name');
    
    if (error) {
      console.error('❌ Error fetching parties:', error.message);
      return;
    }
    
    console.log(`📊 Total parties in database: ${parties.length}`);
    console.log('\n=== All Parties with CRN Information ===');
    
    let partiesWithCRN = 0;
    
    parties.forEach((party, index) => {
      console.log(`\n${index + 1}. ${party.name}`);
      console.log(`   Type: ${party.type}`);
      console.log(`   Status: ${party.status}`);
      console.log(`   Email: ${party.email || 'N/A'}`);
      
      // Parse registration_number JSON if it exists
      let crnNumber = 'Not available';
      if (party.registration_number) {
        try {
          const regData = typeof party.registration_number === 'string' 
            ? JSON.parse(party.registration_number) 
            : party.registration_number;
          
          if (regData && regData.number && regData.number !== '') {
            crnNumber = regData.number;
            partiesWithCRN++;
          }
        } catch (parseError) {
          console.log(`   CRN: Error parsing registration_number`);
        }
      }
      
      console.log(`   CRN: ${crnNumber}`);
      console.log(`   Created: ${party.created_at ? new Date(party.created_at).toLocaleDateString() : 'N/A'}`);
    });
    
    console.log(`\n📊 Parties with CRN: ${partiesWithCRN}/${parties.length}`);
    
    // Show CRN summary
    if (partiesWithCRN > 0) {
      console.log('\n=== CRN Summary ===');
      parties.forEach((party, index) => {
        if (party.registration_number) {
          try {
            const regData = typeof party.registration_number === 'string' 
              ? JSON.parse(party.registration_number) 
              : party.registration_number;
            
            if (regData && regData.number && regData.number !== '') {
              console.log(`${index + 1}. ${party.name}: ${regData.number}`);
            }
          } catch (parseError) {
            // Skip parsing errors
          }
        }
      });
    }
    
    console.log('\n✅ Verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyPartiesWithCRN().catch(console.error); 