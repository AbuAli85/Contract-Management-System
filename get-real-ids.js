// Get real party and promoter IDs for testing
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getRealIds() {
  try {
    console.log('🔍 Getting real IDs from database...');
    
    // Get parties
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name_en, type')
      .limit(5);
    
    if (partiesError) {
      console.error('❌ Error fetching parties:', partiesError);
      return;
    }
    
    console.log('\n📋 Available Parties:');
    parties.forEach((party, index) => {
      console.log(`${index + 1}. ${party.name_en} (${party.type}) - ID: ${party.id}`);
    });
    
    // Get promoters
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('id, name_en, status')
      .limit(5);
    
    if (promotersError) {
      console.error('❌ Error fetching promoters:', promotersError);
      return;
    }
    
    console.log('\n👥 Available Promoters:');
    promoters.forEach((promoter, index) => {
      console.log(`${index + 1}. ${promoter.name_en} (${promoter.status}) - ID: ${promoter.id}`);
    });
    
    // Find client and employer
    const client = parties.find(p => p.type === 'client') || parties[0];
    const employer = parties.find(p => p.type === 'employer') || parties[1];
    const promoter = promoters.find(p => p.status === 'active') || promoters[0];
    
    console.log('\n🎯 Recommended IDs for testing:');
    console.log(`First Party (Client): ${client.name_en} - ID: ${client.id}`);
    console.log(`Second Party (Employer): ${employer.name_en} - ID: ${employer.id}`);
    console.log(`Promoter: ${promoter.name_en} - ID: ${promoter.id}`);
    
    // Generate test contract data
    const testContractData = {
      first_party_id: client.id,
      second_party_id: employer.id,
      promoter_id: promoter.id,
      contract_start_date: '2024-01-01T00:00:00.000Z',
      contract_end_date: '2024-12-31T00:00:00.000Z',
      email: 'test@example.com',
      job_title: 'Software Developer',
      work_location: 'Remote',
      department: 'Engineering',
      contract_type: 'full-time-permanent',
      currency: 'USD',
      basic_salary: 50000
    };
    
    console.log('\n📝 Test contract data:');
    console.log(JSON.stringify(testContractData, null, 2));
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

getRealIds();
