const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateContracts() {
  try {
    console.log('🚀 Updating contracts with sample data...');
    
    // Get some parties
    const { data: parties } = await supabase
      .from('parties')
      .select('id, name_en')
      .limit(3);
    
    if (!parties || parties.length === 0) {
      console.log('❌ No parties found');
      return;
    }
    
    console.log('📋 Available parties:', parties.map(p => p.name_en));
    
    // Get some contracts
    const { data: contracts } = await supabase
      .from('contracts')
      .select('id, contract_number')
      .limit(10);
    
    if (!contracts || contracts.length === 0) {
      console.log('❌ No contracts found');
      return;
    }
    
    console.log(`📝 Found ${contracts.length} contracts to update`);
    
    // Update each contract with sample data
    for (let i = 0; i < contracts.length; i++) {
      const contract = contracts[i];
      const employer = parties[i % parties.length];
      const client = parties[(i + 1) % parties.length];
      
      const updateData = {
        employer_id: employer.id,
        client_id: client.id,
        first_party_id: client.id,
        second_party_id: employer.id,
        title: `Sales Promoter - Contract ${i + 1}`,
        start_date: '2025-01-01',
        end_date: '2025-12-31',
        contract_value: 1200 + (i * 200),
        basic_salary: 1200 + (i * 200),
        value: 1200 + (i * 200),
        status: 'active',
        contract_type: 'employment'
      };
      
      const { error } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contract.id);
      
      if (error) {
        console.log(`❌ Error updating ${contract.contract_number}:`, error.message);
      } else {
        console.log(`✅ Updated ${contract.contract_number} with ${employer.name_en} and ${client.name_en}`);
      }
    }
    
    console.log('🎉 Contract updates completed!');
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

updateContracts();
