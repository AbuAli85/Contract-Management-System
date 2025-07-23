const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://ekdjxzhujettocosgzql.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVrZGp4emh1amV0dG9jb3NzenFsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTMxOTEwNiwiZXhwIjoyMDY0ODk1MTA2fQ.dAf5W8m9Q8FGlLY19Lo2x8JYSfq3RuFMAsHaPcH3F7A";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testHooks() {
  try {
    console.log('🧪 Testing hooks data fetching...\n');
    
    // Test parties fetching (simulating useParties hook)
    console.log('📋 Testing parties fetching...');
    const { data: allParties, error: partiesError } = await supabase
      .from("parties")
      .select(`
        id, name_en, name_ar, crn, type, role, cr_expiry_date,
        contact_person, contact_email, contact_phone, address_en, address_ar,
        tax_number, license_number, license_expiry_date, status, notes
      `)
      .order("name_en", { ascending: true });
    
    if (partiesError) {
      console.error('❌ Error fetching parties:', partiesError.message);
      return;
    }
    
    console.log(`✅ Successfully fetched ${allParties?.length || 0} parties`);
    
    // Filter parties by type (like the form does)
    const clientParties = allParties?.filter(party => party.type === 'Client') || [];
    const employerParties = allParties?.filter(party => party.type === 'Employer') || [];
    
    console.log(`   - Client parties: ${clientParties.length}`);
    console.log(`   - Employer parties: ${employerParties.length}`);
    console.log(`   - Generic parties: ${allParties?.filter(p => !p.type || p.type === 'Generic').length || 0}`);
    
    if (clientParties.length > 0) {
      console.log('   Sample client parties:');
      clientParties.slice(0, 3).forEach((party, index) => {
        console.log(`     ${index + 1}. ${party.name_en} (CRN: ${party.crn})`);
      });
    }
    
    if (employerParties.length > 0) {
      console.log('   Sample employer parties:');
      employerParties.slice(0, 3).forEach((party, index) => {
        console.log(`     ${index + 1}. ${party.name_en} (CRN: ${party.crn})`);
      });
    }
    
    // Test promoters fetching (simulating usePromoters hook)
    console.log('\n📋 Testing promoters fetching...');
    const { data: promoters, error: promotersError } = await supabase
      .from("promoters")
      .select("*")
      .order("name_en", { ascending: true });
    
    if (promotersError) {
      console.error('❌ Error fetching promoters:', promotersError.message);
      return;
    }
    
    console.log(`✅ Successfully fetched ${promoters?.length || 0} promoters`);
    
    if (promoters && promoters.length > 0) {
      console.log('   Sample promoters:');
      promoters.slice(0, 3).forEach((promoter, index) => {
        console.log(`     ${index + 1}. ${promoter.name_en} (ID: ${promoter.id_card_number})`);
      });
    }
    
    console.log('\n🎯 Testing form data availability...');
    console.log('The form should now be able to populate:');
    console.log('   - Client dropdown with', clientParties?.length || 0, 'options');
    console.log('   - Employer dropdown with', employerParties?.length || 0, 'options');
    console.log('   - Promoter dropdown with', promoters?.length || 0, 'options');
    
    if ((clientParties?.length || 0) === 0) {
      console.log('\n⚠️  WARNING: No client parties found!');
      console.log('   The form will show "No clients found" in the dropdown.');
    }
    
    if ((employerParties?.length || 0) === 0) {
      console.log('\n⚠️  WARNING: No employer parties found!');
      console.log('   The form will show "No employers found" in the dropdown.');
    }
    
    if ((promoters?.length || 0) === 0) {
      console.log('\n⚠️  WARNING: No promoters found!');
      console.log('   The form will show "No promoters found" in the dropdown.');
    }
    
    console.log('\n✅ Hook testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing hooks:', error.message);
  }
}

// Run the test
testHooks(); 