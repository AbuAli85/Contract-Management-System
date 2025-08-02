const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase with service role for admin access
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkTableStructures() {
  console.log('🔍 CHECKING TABLE STRUCTURES');
  console.log('=' .repeat(40));
  
  try {
    // 1. Check parties table structure
    console.log('\n1️⃣ PARTIES TABLE STRUCTURE:');
    const { data: partiesData, error: partiesError } = await supabase
      .from('parties')
      .select('*')
      .limit(1);
    
    if (partiesError) {
      console.error('❌ Parties table error:', partiesError.message);
      
      // Try alternative column names
      console.log('🔄 Trying alternative column names...');
      const { data: altPartiesData, error: altPartiesError } = await supabase
        .from('parties')
        .select('id, company_name, company_name_ar, company_crn')
        .limit(1);
        
      if (!altPartiesError && altPartiesData) {
        console.log('✅ Alternative parties structure found:');
        Object.keys(altPartiesData[0] || {}).forEach(key => {
          console.log(`   - ${key}: ${typeof (altPartiesData[0][key]) }`);
        });
      }
    } else if (partiesData && partiesData.length > 0) {
      console.log('✅ Parties table columns:');
      Object.keys(partiesData[0]).forEach(key => {
        console.log(`   - ${key}: ${typeof partiesData[0][key]}`);
      });
    }
    
    // 2. Check promoters table structure
    console.log('\n2️⃣ PROMOTERS TABLE STRUCTURE:');
    const { data: promotersData, error: promotersError } = await supabase
      .from('promoters')
      .select('*')
      .limit(1);
    
    if (promotersError) {
      console.error('❌ Promoters table error:', promotersError.message);
    } else if (promotersData && promotersData.length > 0) {
      console.log('✅ Promoters table columns:');
      Object.keys(promotersData[0]).forEach(key => {
        console.log(`   - ${key}: ${typeof promotersData[0][key]}`);
      });
    }
    
    // 3. Try to get all data with basic columns
    console.log('\n3️⃣ GETTING ACTUAL DATA:');
    
    // Get parties with basic ID
    const { data: allParties, error: allPartiesError } = await supabase
      .from('parties')
      .select('id, company_name, company_name_ar, company_crn, created_at')
      .order('created_at', { ascending: true });
    
    if (!allPartiesError) {
      console.log(`📊 Parties count: ${allParties?.length || 0}`);
      allParties?.slice(0, 3).forEach((party, index) => {
        console.log(`   ${index + 1}. ID: ${party.id?.substring(0, 8)}... | Name: ${party.company_name}`);
      });
    }
    
    // Get promoters with basic ID and company_id
    const { data: allPromoters, error: allPromotersError } = await supabase
      .from('promoters')
      .select('id, name, name_ar, company_id, created_at')
      .order('created_at', { ascending: true });
    
    if (!allPromotersError) {
      console.log(`📊 Promoters count: ${allPromoters?.length || 0}`);
      allPromoters?.slice(0, 3).forEach((promoter, index) => {
        console.log(`   ${index + 1}. ID: ${promoter.id?.substring(0, 8)}... | Name: ${promoter.name} | Company ID: ${promoter.company_id?.substring(0, 8) || 'NULL'}...`);
      });
    }
    
    // 4. Check for orphaned relationships
    if (allParties && allPromoters) {
      console.log('\n4️⃣ RELATIONSHIP ANALYSIS:');
      const partyIds = new Set(allParties.map(p => p.id));
      const orphanedPromoters = allPromoters.filter(p => p.company_id && !partyIds.has(p.company_id));
      
      console.log(`✅ Valid company references: ${allPromoters.filter(p => p.company_id && partyIds.has(p.company_id)).length}`);
      console.log(`❌ Orphaned promoters (invalid company_id): ${orphanedPromoters.length}`);
      console.log(`⚠️ Promoters without company_id: ${allPromoters.filter(p => !p.company_id).length}`);
      
      if (orphanedPromoters.length > 0) {
        console.log('\n🔧 ORPHANED PROMOTERS:');
        orphanedPromoters.slice(0, 5).forEach((promoter, index) => {
          console.log(`   ${index + 1}. ${promoter.name} → Invalid ID: ${promoter.company_id?.substring(0, 8)}...`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Structure check failed:', error.message);
  }
}

checkTableStructures();
