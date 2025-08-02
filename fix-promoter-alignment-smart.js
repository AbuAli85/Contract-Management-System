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

async function fixPromoterAlignmentSmart() {
  console.log('🧠 SMART FIX: Match Promoters to Companies by Logic');
  console.log('=' .repeat(60));
  
  try {
    // 1. Get all companies
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('id, name_en, name_ar, crn, type')
      .order('created_at', { ascending: true });
    
    if (partiesError || !parties) {
      console.error('❌ Error fetching companies:', partiesError?.message);
      return;
    }
    
    console.log(`📊 Available companies: ${parties.length}`);
    
    // 2. Get all promoters with issues
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('id, name_en, employer_id');
    
    if (promotersError) {
      console.error('❌ Error fetching promoters:', promotersError.message);
      return;
    }
    
    const validCompanyIds = new Set(parties.map(p => p.id));
    const problematicPromoters = promoters?.filter(p => 
      !p.employer_id || !validCompanyIds.has(p.employer_id)
    ) || [];
    
    console.log(`📊 Problematic promoters: ${problematicPromoters.length}`);
    
    // 3. Smart matching logic
    console.log(`\n🧠 Applying smart matching logic...`);
    
    const smartMatches = [];
    const fallbackToFirst = [];
    const defaultCompany = parties[0]; // Fallback company
    
    for (const promoter of problematicPromoters) {
      let bestMatch = null;
      let matchReason = '';
      
      // Logic 1: If promoter name contains "falcon", match to Falcon Eye companies
      const promoterName = promoter.name_en?.toLowerCase() || '';
      
      if (promoterName.includes('falcon')) {
        bestMatch = parties.find(p => p.name_en?.toLowerCase().includes('falcon'));
        matchReason = 'Name contains "falcon"';
      }
      
      // Logic 2: If promoter name contains Arabic/Middle Eastern patterns, prefer certain companies
      else if (promoterName.includes('abdul') || promoterName.includes('mohammed') || 
               promoterName.includes('muhammad') || promoterName.includes('ahmed') ||
               promoterName.includes('ali') || promoterName.includes('hassan')) {
        // Prefer companies with "Investment" or "Services" in name
        bestMatch = parties.find(p => 
          p.name_en?.toLowerCase().includes('investment') || 
          p.name_en?.toLowerCase().includes('services')
        );
        matchReason = 'Arabic/Middle Eastern name pattern';
      }
      
      // Logic 3: If promoter name suggests technical/project work
      else if (promoterName.includes('engineer') || promoterName.includes('manager') ||
               promoterName.includes('project') || promoterName.includes('technical')) {
        bestMatch = parties.find(p => 
          p.name_en?.toLowerCase().includes('management') ||
          p.name_en?.toLowerCase().includes('project')
        );
        matchReason = 'Technical/management role indicator';
      }
      
      // Logic 4: If promoter name suggests quality/business work
      else if (promoterName.includes('quality') || promoterName.includes('business')) {
        bestMatch = parties.find(p => 
          p.name_en?.toLowerCase().includes('quality') ||
          p.name_en?.toLowerCase().includes('business')
        );
        matchReason = 'Quality/business role indicator';
      }
      
      // If smart match found, use it
      if (bestMatch) {
        smartMatches.push({
          promoterId: promoter.id,
          promoterName: promoter.name_en,
          companyId: bestMatch.id,
          companyName: bestMatch.name_en,
          reason: matchReason
        });
      } else {
        // Fallback to first company
        fallbackToFirst.push({
          promoterId: promoter.id,
          promoterName: promoter.name_en,
          companyId: defaultCompany.id,
          companyName: defaultCompany.name_en,
          reason: 'No smart match found - default assignment'
        });
      }
    }
    
    // 4. Show the matching results
    console.log(`\n📊 Matching Results:`);
    console.log(`   • Smart matches: ${smartMatches.length}`);
    console.log(`   • Fallback to default: ${fallbackToFirst.length}`);
    
    console.log(`\n🎯 Smart Matches (first 10):`);
    smartMatches.slice(0, 10).forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.promoterName} → ${match.companyName}`);
      console.log(`      Reason: ${match.reason}`);
    });
    
    if (fallbackToFirst.length > 0) {
      console.log(`\n🔄 Fallback Assignments (first 5):`);
      fallbackToFirst.slice(0, 5).forEach((match, index) => {
        console.log(`   ${index + 1}. ${match.promoterName} → ${match.companyName}`);
      });
    }
    
    // 5. Confirm before proceeding
    const allMatches = [...smartMatches, ...fallbackToFirst];
    console.log(`\n⚠️  Will update ${allMatches.length} promoter records`);
    console.log(`🚀 Proceeding with smart update in 3 seconds...`);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 6. Apply the updates
    console.log(`\n🔄 Applying smart matches...`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const match of allMatches) {
      try {
        const { error: updateError } = await supabase
          .from('promoters')
          .update({ employer_id: match.companyId })
          .eq('id', match.promoterId);
        
        if (updateError) {
          console.error(`   ❌ Failed: ${match.promoterName}`, updateError.message);
          errorCount++;
        } else {
          successCount++;
          if (successCount % 20 === 0) {
            console.log(`   ✅ Updated ${successCount} promoters...`);
          }
        }
      } catch (error) {
        console.error(`   ❌ Exception: ${match.promoterName}`, error.message);
        errorCount++;
      }
    }
    
    // 7. Final report
    console.log(`\n✅ SMART UPDATE COMPLETE!`);
    console.log(`   • Successfully updated: ${successCount} promoters`);
    console.log(`   • Failed updates: ${errorCount} promoters`);
    console.log(`   • Success rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
    
    // 8. Show distribution of assignments
    console.log(`\n📊 Final Company Distribution:`);
    const companyAssignments = {};
    
    [...smartMatches, ...fallbackToFirst].forEach(match => {
      if (!companyAssignments[match.companyName]) {
        companyAssignments[match.companyName] = 0;
      }
      companyAssignments[match.companyName]++;
    });
    
    Object.entries(companyAssignments).forEach(([company, count]) => {
      console.log(`   • ${company}: ${count} promoters`);
    });
    
    console.log(`\n🎉 Smart promoter-company alignment completed!`);
    
  } catch (error) {
    console.error('❌ Smart fix failed:', error.message);
  }
}

fixPromoterAlignmentSmart();
