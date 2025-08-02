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

async function fixPromoterCompanyAlignment() {
  console.log('🔧 FIXING PROMOTER-COMPANY ALIGNMENT');
  console.log('=' .repeat(50));
  
  try {
    // 1. Get all parties (companies)
    console.log('\n1️⃣ LOADING PARTIES DATA:');
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name_en, name_ar, crn, type, created_at')
      .order('created_at', { ascending: true });
    
    if (partiesError) {
      console.error('❌ Error fetching parties:', partiesError.message);
      return;
    }
    
    console.log(`📊 Found ${parties?.length || 0} companies`);
    parties?.forEach((party, index) => {
      console.log(`   ${index + 1}. ${party.name_en} (ID: ${party.id.substring(0, 8)}...)`);
    });
    
    // 2. Get all promoters
    console.log('\n2️⃣ LOADING PROMOTERS DATA:');
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, employer_id, created_at')
      .order('created_at', { ascending: true });
    
    if (promotersError) {
      console.error('❌ Error fetching promoters:', promotersError.message);
      return;
    }
    
    console.log(`📊 Found ${promoters?.length || 0} promoters`);
    
    // 3. Analyze current alignment
    console.log('\n3️⃣ ANALYZING CURRENT ALIGNMENT:');
    const partyIds = new Set(parties?.map(p => p.id) || []);
    const validPromotions = [];
    const invalidPromotions = [];
    const nullPromotions = [];
    
    promoters?.forEach((promoter, index) => {
      if (!promoter.employer_id) {
        nullPromotions.push(promoter);
      } else if (partyIds.has(promoter.employer_id)) {
        const company = parties?.find(p => p.id === promoter.employer_id);
        validPromotions.push({
          promoter: promoter.name_en,
          company: company?.name_en,
          promoterId: promoter.id,
          companyId: promoter.employer_id
        });
      } else {
        invalidPromotions.push({
          promoter: promoter.name_en,
          promoterId: promoter.id,
          invalidEmployerId: promoter.employer_id
        });
      }
    });
    
    console.log(`✅ Valid alignments: ${validPromotions.length}`);
    console.log(`❌ Invalid employer_id: ${invalidPromotions.length}`);
    console.log(`⚠️ Null employer_id: ${nullPromotions.length}`);
    
    if (validPromotions.length > 0) {
      console.log('\n✅ VALID ALIGNMENTS:');
      validPromotions.forEach((valid, index) => {
        console.log(`   ${index + 1}. ${valid.promoter} → ${valid.company}`);
      });
    }
    
    if (invalidPromotions.length > 0) {
      console.log('\n❌ INVALID ALIGNMENTS:');
      invalidPromotions.forEach((invalid, index) => {
        console.log(`   ${index + 1}. ${invalid.promoter} → Invalid ID: ${invalid.invalidEmployerId?.substring(0, 8)}...`);
      });
    }
    
    if (nullPromotions.length > 0) {
      console.log('\n⚠️ PROMOTERS WITHOUT COMPANY:');
      nullPromotions.forEach((null_p, index) => {
        console.log(`   ${index + 1}. ${null_p.name_en}`);
      });
    }
    
    // 4. Propose fix strategies
    console.log('\n4️⃣ FIX STRATEGIES:');
    
    if (parties && parties.length > 0) {
      const firstCompany = parties[0];
      console.log(`\n🔧 STRATEGY 1: Assign all problematic promoters to first company`);
      console.log(`   Company: ${firstCompany.name_en} (${firstCompany.id.substring(0, 8)}...)`);
      console.log(`   Would fix: ${invalidPromotions.length + nullPromotions.length} promoters`);
      
      console.log(`\n🔧 STRATEGY 2: Smart matching by name similarity`);
      const smartMatches = [];
      
      [...invalidPromotions, ...nullPromotions].forEach(problematic => {
        const promoterName = problematic.promoter?.toLowerCase() || '';
        
        // Try to find company with similar name
        const bestMatch = parties.find(party => {
          const companyName = party.name_en?.toLowerCase() || '';
          const companyNameAr = party.name_ar?.toLowerCase() || '';
          
          return companyName.includes(promoterName.split(' ')[0]) ||
                 promoterName.includes(companyName.split(' ')[0]) ||
                 companyNameAr.includes(promoterName.split(' ')[0]);
        });
        
        if (bestMatch) {
          smartMatches.push({
            promoterId: problematic.promoterId,
            promoterName: problematic.promoter,
            companyId: bestMatch.id,
            companyName: bestMatch.name_en
          });
        }
      });
      
      if (smartMatches.length > 0) {
        console.log(`   Found ${smartMatches.length} potential smart matches:`);
        smartMatches.forEach((match, index) => {
          console.log(`     ${index + 1}. ${match.promoterName} → ${match.companyName}`);
        });
      }
      
      // 5. Ask user for confirmation to proceed
      console.log('\n5️⃣ READY TO APPLY FIX:');
      console.log('   Choose your preferred strategy:');
      console.log('   1. Assign all to first company (safest)');
      console.log('   2. Use smart matching (requires review)');
      console.log('   3. Manual specification');
      
      console.log('\n📝 To proceed, run one of these scripts:');
      console.log('   • node fix-promoter-alignment-simple.js  (Strategy 1)');
      console.log('   • node fix-promoter-alignment-smart.js   (Strategy 2)');
      
    } else {
      console.log('❌ No companies found - cannot fix alignment');
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

fixPromoterCompanyAlignment();
