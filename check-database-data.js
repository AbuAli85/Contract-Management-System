// Check existing data in database
const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseData() {
  try {
    console.log('🔍 Checking database data...');
    
    // We'll need to get the Supabase config
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase environment variables not found');
      console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('SUPABASE')));
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check parties
    console.log('\n📋 Checking parties...');
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name_en, type')
      .limit(5);
    
    if (partiesError) {
      console.error('❌ Error fetching parties:', partiesError);
    } else {
      console.log('✅ Parties found:', parties?.length || 0);
      parties?.forEach(party => {
        console.log(`  - ${party.name_en} (${party.type}) - ID: ${party.id}`);
      });
    }
    
    // Check promoters
    console.log('\n👥 Checking promoters...');
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('id, name_en, status')
      .limit(5);
    
    if (promotersError) {
      console.error('❌ Error fetching promoters:', promotersError);
    } else {
      console.log('✅ Promoters found:', promoters?.length || 0);
      promoters?.forEach(promoter => {
        console.log(`  - ${promoter.name_en} (${promoter.status}) - ID: ${promoter.id}`);
      });
    }
    
    // Check contract types
    console.log('\n📄 Checking existing contracts...');
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, contract_number, status, contract_type')
      .limit(5);
    
    if (contractsError) {
      console.error('❌ Error fetching contracts:', contractsError);
    } else {
      console.log('✅ Contracts found:', contracts?.length || 0);
      contracts?.forEach(contract => {
        console.log(`  - ${contract.contract_number} (${contract.status}) - Type: ${contract.contract_type}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking database:', error);
  }
}

checkDatabaseData();
