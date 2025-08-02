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

async function analyzeMismatchedData() {
  console.log('🔍 ANALYZING PROMOTER-COMPANY RELATIONSHIP MISMATCH');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check parties table structure and data
    console.log('\n1️⃣ CHECKING PARTIES TABLE:');
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name, name_ar, crn, type, role, created_at')
      .order('created_at', { ascending: true });
    
    if (partiesError) {
      console.error('❌ Error fetching parties:', partiesError.message);
      return;
    }
    
    console.log(`📊 Total parties found: ${parties?.length || 0}`);
    console.log('\n📋 Parties data:');
    parties?.forEach((party, index) => {
      console.log(`   ${index + 1}. ID: ${party.id} | Name: ${party.name} | Type: ${party.type} | CRN: ${party.crn}`);
    });
    
    // 2. Check promoters table and their company references
    console.log('\n2️⃣ CHECKING PROMOTERS TABLE:');
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('id, name, name_ar, company_id, created_at')
      .order('created_at', { ascending: true });
    
    if (promotersError) {
      console.error('❌ Error fetching promoters:', promotersError.message);
      return;
    }
    
    console.log(`📊 Total promoters found: ${promoters?.length || 0}`);
    console.log('\n👤 Promoters data:');
    promoters?.forEach((promoter, index) => {
      console.log(`   ${index + 1}. ID: ${promoter.id} | Name: ${promoter.name} | Company ID: ${promoter.company_id}`);
    });
    
    // 3. Analyze the mismatch
    console.log('\n3️⃣ ANALYZING RELATIONSHIP MISMATCHES:');
    const mismatches = [];
    const validMatches = [];
    
    for (const promoter of promoters || []) {
      if (promoter.company_id) {
        const matchingParty = parties?.find(party => party.id === promoter.company_id);
        
        if (matchingParty) {
          validMatches.push({
            promoter: promoter.name,
            promoterId: promoter.id,
            company: matchingParty.name,
            companyId: matchingParty.id
          });
        } else {
          mismatches.push({
            promoter: promoter.name,
            promoterId: promoter.id,
            invalidCompanyId: promoter.company_id
          });
        }
      } else {
        mismatches.push({
          promoter: promoter.name,
          promoterId: promoter.id,
          invalidCompanyId: 'NULL/EMPTY'
        });
      }
    }
    
    console.log(`\n✅ Valid matches: ${validMatches.length}`);
    validMatches.forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.promoter} → ${match.company} (${match.companyId})`);
    });
    
    console.log(`\n❌ Mismatched/Invalid: ${mismatches.length}`);
    mismatches.forEach((mismatch, index) => {
      console.log(`   ${index + 1}. ${mismatch.promoter} → Invalid ID: ${mismatch.invalidCompanyId}`);
    });
    
    // 4. Suggest fix strategies
    console.log('\n4️⃣ SUGGESTED FIX STRATEGIES:');
    
    if (mismatches.length > 0) {
      console.log('\n🔧 STRATEGY 1: Match by company name');
      console.log('   Try to match promoters to companies by name similarity');
      
      console.log('\n🔧 STRATEGY 2: Reset all company_id to first company');
      console.log('   Set all promoters to reference the first available company');
      
      console.log('\n🔧 STRATEGY 3: Manual mapping');
      console.log('   Provide a manual mapping of promoter names to company names');
      
      // Try automatic name matching
      console.log('\n🤖 ATTEMPTING AUTOMATIC NAME MATCHING:');
      const autoMatches = [];
      
      for (const mismatch of mismatches) {
        if (mismatch.invalidCompanyId === 'NULL/EMPTY') continue;
        
        // Try to find a company with similar name
        const promoterName = mismatch.promoter?.toLowerCase() || '';
        const potentialMatch = parties?.find(party => {
          const partyName = party.name?.toLowerCase() || '';
          return partyName.includes(promoterName.split(' ')[0]) || 
                 promoterName.includes(partyName.split(' ')[0]);
        });
        
        if (potentialMatch) {
          autoMatches.push({
            promoterId: mismatch.promoterId,
            promoterName: mismatch.promoter,
            companyId: potentialMatch.id,
            companyName: potentialMatch.name,
            confidence: 'LOW' // Mark as low confidence for manual review
          });
        }
      }
      
      if (autoMatches.length > 0) {
        console.log('\n🎯 Potential automatic matches found:');
        autoMatches.forEach((match, index) => {
          console.log(`   ${index + 1}. ${match.promoterName} → ${match.companyName} (${match.confidence} confidence)`);
        });
      } else {
        console.log('\n⚠️ No automatic matches found');
      }
    }
    
    // 5. Data summary for decision making
    console.log('\n5️⃣ DATA SUMMARY:');
    console.log(`   • Total Companies (Parties): ${parties?.length || 0}`);
    console.log(`   • Total Promoters: ${promoters?.length || 0}`);
    console.log(`   • Valid Relationships: ${validMatches.length}`);
    console.log(`   • Broken Relationships: ${mismatches.length}`);
    console.log(`   • Success Rate: ${promoters?.length ? Math.round((validMatches.length / promoters.length) * 100) : 0}%`);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

// Run the analysis
analyzeMismatchedData();
