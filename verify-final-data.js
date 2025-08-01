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

async function verifyFinalData() {
  console.log('=== Verifying Final Database State ===');
  
  try {
    // Check promoters count
    const { count: promotersCount } = await supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Promoters: ${promotersCount}`);
    
    // Check parties count
    const { count: partiesCount } = await supabase
      .from('parties')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Companies/Parties: ${partiesCount}`);
    
    // Check contracts count
    const { count: contractsCount } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Contracts: ${contractsCount}`);
    
    // Check users count
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Users: ${usersCount}`);
    
    // Check audit logs count
    const { count: auditLogsCount } = await supabase
      .from('audit_logs')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📊 Audit Logs: ${auditLogsCount}`);
    
    console.log('\n=== Sample Data ===');
    
    // Show sample promoters
    const { data: samplePromoters } = await supabase
      .from('promoters')
      .select('name_en, name_ar, id_card_number, status')
      .limit(3);
    
    if (samplePromoters && samplePromoters.length > 0) {
      console.log('\n📋 Sample Promoters:');
      samplePromoters.forEach((promoter, index) => {
        console.log(`  ${index + 1}. ${promoter.name_en} (${promoter.id_card_number}) - ${promoter.status}`);
      });
    }
    
    // Show sample companies
    const { data: sampleCompanies } = await supabase
      .from('parties')
      .select('name, type, status')
      .limit(3);
    
    if (sampleCompanies && sampleCompanies.length > 0) {
      console.log('\n📋 Sample Companies:');
      sampleCompanies.forEach((company, index) => {
        console.log(`  ${index + 1}. ${company.name} (${company.type}) - ${company.status}`);
      });
    }
    
    console.log('\n✅ Database verification complete!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyFinalData().catch(console.error); 