const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function populateSampleData() {
  try {
    console.log('🚀 Starting to populate sample data...');

    // First, get existing parties
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name_en, type')
      .limit(10);

    if (partiesError) {
      console.error('Error fetching parties:', partiesError.message);
      return;
    }

    console.log(`📋 Found ${parties.length} existing parties`);

    if (parties.length === 0) {
      console.log('❌ No parties found. Please create some parties first.');
      return;
    }

    // Create sample promoters
    const samplePromoters = [
      {
        name_en: 'Ahmed Al-Rashid',
        name_ar: 'أحمد الراشد',
        id_card_number: '1234567890',
        mobile_number: '+96891234567',
        status: 'active',
        employer_id: parties[0].id, // Link to first employer
      },
      {
        name_en: 'Fatima Al-Zahra',
        name_ar: 'فاطمة الزهراء',
        id_card_number: '0987654321',
        mobile_number: '+96898765432',
        status: 'active',
        employer_id: parties[1]?.id || parties[0].id, // Link to second employer or first if only one
      },
      {
        name_en: 'Omar Al-Mansouri',
        name_ar: 'عمر المنصوري',
        id_card_number: '1122334455',
        mobile_number: '+96895544332',
        status: 'active',
        employer_id: parties[2]?.id || parties[0].id, // Link to third employer or first if only one
      },
    ];

    console.log('👥 Creating sample promoters...');
    const { data: createdPromoters, error: promotersError } = await supabase
      .from('promoters')
      .insert(samplePromoters)
      .select();

    if (promotersError) {
      console.error('Error creating promoters:', promotersError.message);
      return;
    }

    console.log(`✅ Created ${createdPromoters.length} promoters`);

    // Update some existing contracts with proper relationships
    console.log('📝 Updating existing contracts with proper relationships...');

    const { data: existingContracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, contract_number')
      .limit(10);

    if (contractsError) {
      console.error('Error fetching contracts:', contractsError.message);
      return;
    }

    console.log(`📋 Found ${existingContracts.length} existing contracts`);

    // Update contracts with proper relationships
    for (
      let i = 0;
      i < Math.min(existingContracts.length, createdPromoters.length);
      i++
    ) {
      const contract = existingContracts[i];
      const promoter = createdPromoters[i];
      const employer = parties[i % parties.length]; // Cycle through available parties
      const client = parties[(i + 1) % parties.length]; // Use different party as client

      const updateData = {
        promoter_id: promoter.id,
        employer_id: employer.id,
        client_id: client.id,
        first_party_id: client.id,
        second_party_id: employer.id,
        title: `Sales Promoter - ${promoter.name_en}`,
        job_title: `Sales Promoter - ${promoter.name_en}`,
        contract_start_date: new Date().toISOString().split('T')[0],
        contract_end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0], // 1 year from now
        contract_value: 1200 + i * 200, // Varying salary amounts
        basic_salary: 1200 + i * 200,
        value: 1200 + i * 200,
        status: 'active',
        contract_type: 'employment',
      };

      const { error: updateError } = await supabase
        .from('contracts')
        .update(updateData)
        .eq('id', contract.id);

      if (updateError) {
        console.error(
          `Error updating contract ${contract.contract_number}:`,
          updateError.message
        );
      } else {
        console.log(
          `✅ Updated contract ${contract.contract_number} with promoter ${promoter.name_en}`
        );
      }
    }

    console.log('🎉 Sample data population completed!');
    console.log('📊 Summary:');
    console.log(`   - Parties: ${parties.length}`);
    console.log(`   - Promoters created: ${createdPromoters.length}`);
    console.log(
      `   - Contracts updated: ${Math.min(existingContracts.length, createdPromoters.length)}`
    );
  } catch (error) {
    console.error('❌ Error populating sample data:', error.message);
  }
}

populateSampleData();
