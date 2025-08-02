const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Company IDs with better distribution weights
const COMPANY_DISTRIBUTION = [
  { id: '33ef31db-36c3-4fdd-b239-87b084ea1246', name: 'AL AMRI INVESTMENT AND SERVICES LLC', weight: 25 }, // Highest contracts (84)
  { id: '8776a032-5dad-4cd0-b0f8-c3cdd64e2831', name: 'Falcon Eye Modern Investments SPC', weight: 20 },
  { id: '2a581b4b-0775-4728-b957-bd04ca4aba8a', name: 'Falcon Eye Management and Investment', weight: 15 },
  { id: 'da0075d3-afd0-4fba-9b75-0e8d5922a4f5', name: 'Falcon Eye Management and Business', weight: 12 },
  { id: 'd49fc7fe-1f05-499e-9ab0-d92da543a038', name: 'Falcon Eye Investment SPC', weight: 10 },
  { id: '8d113567-9e7e-4413-931f-2944ae4dbde1', name: 'Falcon Eye Projects Management', weight: 8 },
  { id: 'f16a94e0-92f8-4864-a2df-a8c0ffac3303', name: 'Falcon Eye Promotion and Investment', weight: 5 },
  { id: '2995dea1-04dc-48f5-8fc8-c61d3d71fc58', name: 'Quality project management', weight: 3 },
  { id: 'c0af4c64-e29f-4532-87ed-9ca3124e57bd', name: 'Blue Oasis Quality Services', weight: 2 }
];

async function redistributePromotersRealistic() {
  console.log('🔄 REDISTRIBUTING PROMOTERS REALISTICALLY');
  console.log('=' .repeat(55));
  
  try {
    // 1. Get all promoters
    console.log('\n1️⃣ LOADING ALL PROMOTERS:');
    const { data: allPromoters, error: promotersError } = await supabase
      .from('promoters')
      .select('id, name_en, employer_id');
    
    if (promotersError) {
      console.error('❌ Error fetching promoters:', promotersError.message);
      return;
    }
    
    console.log(`📊 Total promoters: ${allPromoters?.length || 0}`);
    
    // 2. Check current distribution (showing the problem)
    console.log('\n2️⃣ CURRENT DISTRIBUTION (PROBLEMATIC):');
    const currentDistribution = {};
    allPromoters?.forEach(promoter => {
      const companyId = promoter.employer_id;
      const company = COMPANY_DISTRIBUTION.find(c => c.id === companyId);
      const companyName = company ? company.name : 'Unknown Company';
      
      currentDistribution[companyName] = (currentDistribution[companyName] || 0) + 1;
    });
    
    Object.entries(currentDistribution).forEach(([company, count]) => {
      console.log(`   • ${company}: ${count} promoters`);
    });
    
    // 3. Create realistic distribution plan
    console.log('\n3️⃣ CREATING REALISTIC DISTRIBUTION PLAN:');
    const totalPromoters = allPromoters?.length || 0;
    const distributionPlan = [];
    
    let remainingPromoters = totalPromoters;
    
    COMPANY_DISTRIBUTION.forEach((company, index) => {
      const isLast = index === COMPANY_DISTRIBUTION.length - 1;
      let assignCount;
      
      if (isLast) {
        // Assign remaining promoters to last company
        assignCount = remainingPromoters;
      } else {
        // Calculate based on weight
        assignCount = Math.floor((company.weight / 100) * totalPromoters);
        remainingPromoters -= assignCount;
      }
      
      if (assignCount > 0) {
        distributionPlan.push({
          ...company,
          assignCount: assignCount
        });
      }
    });
    
    console.log('📋 New distribution plan:');
    distributionPlan.forEach((plan, index) => {
      console.log(`   ${index + 1}. ${plan.name}: ${plan.assignCount} promoters`);
    });
    
    // 4. Shuffle promoters for random assignment
    console.log('\n4️⃣ SHUFFLING PROMOTERS FOR FAIR DISTRIBUTION:');
    const shuffledPromoters = [...(allPromoters || [])];
    for (let i = shuffledPromoters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPromoters[i], shuffledPromoters[j]] = [shuffledPromoters[j], shuffledPromoters[i]];
    }
    
    // 5. Create assignments based on plan
    const assignments = [];
    let promoterIndex = 0;
    
    distributionPlan.forEach(plan => {
      for (let i = 0; i < plan.assignCount && promoterIndex < shuffledPromoters.length; i++) {
        const promoter = shuffledPromoters[promoterIndex];
        assignments.push({
          promoterId: promoter.id,
          promoterName: promoter.name_en,
          oldEmployerId: promoter.employer_id,
          newEmployerId: plan.id,
          companyName: plan.name,
          reason: `Realistic distribution (${plan.weight}% weight)`
        });
        promoterIndex++;
      }
    });
    
    console.log(`✅ Created ${assignments.length} assignments`);
    
    // 6. Show assignment summary
    console.log('\n📊 NEW ASSIGNMENT SUMMARY:');
    const newDistribution = {};
    assignments.forEach(assignment => {
      newDistribution[assignment.companyName] = (newDistribution[assignment.companyName] || 0) + 1;
    });
    
    Object.entries(newDistribution).forEach(([company, count]) => {
      console.log(`   • ${company}: ${count} promoters`);
    });
    
    // 7. Execute the redistribution
    console.log(`\n🚀 EXECUTING REDISTRIBUTION FOR ${assignments.length} PROMOTERS...`);
    console.log('⚠️  This will change ALL promoter assignments to create realistic distribution');
    console.log('Starting in 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    let successCount = 0;
    let errorCount = 0;
    const batchSize = 10;
    
    for (let i = 0; i < assignments.length; i += batchSize) {
      const batch = assignments.slice(i, i + batchSize);
      console.log(`\n   Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(assignments.length/batchSize)} (${batch.length} promoters)`);
      
      for (const assignment of batch) {
        try {
          const { error: updateError } = await supabase
            .from('promoters')
            .update({ employer_id: assignment.newEmployerId })
            .eq('id', assignment.promoterId);
          
          if (updateError) {
            console.error(`     ❌ ${assignment.promoterName}: ${updateError.message}`);
            errorCount++;
          } else {
            successCount++;
            if (successCount % 25 === 0) {
              console.log(`     ✅ Updated ${successCount} promoters...`);
            }
          }
        } catch (error) {
          console.error(`     ❌ ${assignment.promoterName}: ${error.message}`);
          errorCount++;
        }
      }
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // 8. Final verification
    console.log(`\n✅ REDISTRIBUTION COMPLETED!`);
    console.log(`   • Successfully updated: ${successCount} promoters`);
    console.log(`   • Failed updates: ${errorCount} promoters`);
    console.log(`   • Success rate: ${Math.round((successCount / (successCount + errorCount)) * 100)}%`);
    
    // 9. Verify new distribution
    console.log(`\n🔍 VERIFYING NEW DISTRIBUTION:`);
    const { data: verifyPromoters, error: verifyError } = await supabase
      .from('promoters')
      .select('id, name_en, employer_id');
    
    if (!verifyError && verifyPromoters) {
      const finalDistribution = {};
      verifyPromoters.forEach(promoter => {
        const company = COMPANY_DISTRIBUTION.find(c => c.id === promoter.employer_id);
        const companyName = company ? company.name : 'Unknown Company';
        finalDistribution[companyName] = (finalDistribution[companyName] || 0) + 1;
      });
      
      console.log('📊 Final distribution:');
      Object.entries(finalDistribution).forEach(([company, count]) => {
        const percentage = Math.round((count / verifyPromoters.length) * 100);
        console.log(`   • ${company}: ${count} promoters (${percentage}%)`);
      });
    }
    
    console.log(`\n🎉 REALISTIC PROMOTER DISTRIBUTION COMPLETE!`);
    console.log(`   Promoters are now distributed across multiple companies based on business logic.`);
    console.log(`   No more concentration in a single company.`);
    
  } catch (error) {
    console.error('❌ Redistribution failed:', error.message);
  }
}

redistributePromotersRealistic();
