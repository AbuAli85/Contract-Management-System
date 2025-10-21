/**
 * Fix Promoter-Contract Orphans
 * 
 * This script identifies and optionally fixes promoters who are assigned to employers
 * (have employer_id) but have no contracts in the contracts table.
 * 
 * Usage:
 *   npm run fix-promoter-orphans -- [--dry-run] [--create-contracts]
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface OrphanedPromoter {
  id: string;
  name_en: string;
  name_ar: string;
  status: string;
  employer_id: string;
  employer_name: string;
  job_title?: string;
  mobile_number?: string;
  created_at: string;
}

async function findOrphanedPromoters(): Promise<OrphanedPromoter[]> {
  console.log('🔍 Searching for orphaned promoters...\n');

  const { data, error } = await supabase.rpc('find_orphaned_promoters', {});

  if (error) {
    // Fallback to manual query if RPC doesn't exist
    const { data: promotersData, error: promotersError } = await supabase
      .from('promoters')
      .select(`
        id,
        name_en,
        name_ar,
        status,
        employer_id,
        job_title,
        mobile_number,
        created_at,
        parties:employer_id (
          name_en,
          name_ar
        )
      `)
      .eq('status', 'active')
      .not('employer_id', 'is', null);

    if (promotersError) {
      console.error('❌ Error fetching promoters:', promotersError);
      return [];
    }

    // Filter out those with contracts
    const orphaned: OrphanedPromoter[] = [];
    
    for (const promoter of promotersData || []) {
      // Use raw SQL to handle type casting
      const { data: contracts, error: contractsError } = await supabase.rpc(
        'check_promoter_contracts',
        { promoter_uuid: promoter.id }
      );

      // Fallback to direct query if RPC doesn't exist
      if (contractsError) {
        const { data: directContracts } = await supabase
          .from('contracts')
          .select('id')
          .eq('promoter_id', promoter.id)
          .limit(1);
        
        if (directContracts && directContracts.length === 0) {
          orphaned.push({
            id: promoter.id,
            name_en: promoter.name_en,
            name_ar: promoter.name_ar,
            status: promoter.status,
            employer_id: promoter.employer_id!,
            employer_name: (promoter.parties as any)?.name_en || 'Unknown',
            job_title: promoter.job_title,
            mobile_number: promoter.mobile_number,
            created_at: promoter.created_at,
          });
        }
      } else if (!contracts || contracts === 0) {
        orphaned.push({
          id: promoter.id,
          name_en: promoter.name_en,
          name_ar: promoter.name_ar,
          status: promoter.status,
          employer_id: promoter.employer_id!,
          employer_name: (promoter.parties as any)?.name_en || 'Unknown',
          job_title: promoter.job_title,
          mobile_number: promoter.mobile_number,
          created_at: promoter.created_at,
        });
      }
    }

    return orphaned;
  }

  return data || [];
}

async function createPlaceholderContract(promoter: OrphanedPromoter): Promise<boolean> {
  console.log(`  Creating placeholder contract for ${promoter.name_en}...`);

  const contractNumber = `PLACEHOLDER-${Date.now()}-${promoter.id.substring(0, 4).toUpperCase()}`;
  
  const { error } = await supabase.from('contracts').insert({
    contract_number: contractNumber,
    promoter_id: promoter.id,
    employer_id: promoter.employer_id,
    title: promoter.job_title || 'Employment Contract',
    description: 'Auto-generated placeholder contract to maintain data integrity',
    contract_type: 'employment',
    status: 'active',
    start_date: promoter.created_at.split('T')[0], // Use promoter creation date
    end_date: null, // No end date for placeholder
    value: 0,
    currency: 'OMR',
    terms: 'This is a placeholder contract created automatically to represent the promoter-employer relationship.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error(`    ❌ Failed: ${error.message}`);
    return false;
  }

  console.log(`    ✅ Created contract: ${contractNumber}`);
  return true;
}

async function displayStatistics() {
  console.log('\n📊 DATABASE STATISTICS\n');

  // Total active promoters
  const { count: totalActive } = await supabase
    .from('promoters')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Active with employer
  const { count: withEmployer } = await supabase
    .from('promoters')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .not('employer_id', 'is', null);

  console.log(`Total Active Promoters:                 ${totalActive}`);
  console.log(`Active Promoters with Employer:          ${withEmployer}`);
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const createContracts = args.includes('--create-contracts');

  console.log('🔧 Promoter-Contract Orphan Diagnostic Tool\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no changes)' : createContracts ? 'FIX MODE' : 'DIAGNOSTIC ONLY'}\n`);

  // Display statistics
  await displayStatistics();

  // Find orphaned promoters
  const orphaned = await findOrphanedPromoters();

  if (orphaned.length === 0) {
    console.log('\n✅ No orphaned promoters found! Data integrity is good.\n');
    return;
  }

  console.log(`\n⚠️  Found ${orphaned.length} orphaned promoter(s):\n`);

  // Display orphaned promoters
  orphaned.forEach((promoter, index) => {
    console.log(`${index + 1}. ${promoter.name_en} (${promoter.name_ar})`);
    console.log(`   Employer: ${promoter.employer_name}`);
    console.log(`   Job Title: ${promoter.job_title || 'N/A'}`);
    console.log(`   Mobile: ${promoter.mobile_number || 'N/A'}`);
    console.log(`   Created: ${new Date(promoter.created_at).toLocaleDateString()}`);
    console.log('');
  });

  // Create placeholder contracts if requested
  if (createContracts && !dryRun) {
    console.log('\n🔨 Creating placeholder contracts...\n');
    
    let successCount = 0;
    let failCount = 0;

    for (const promoter of orphaned) {
      const success = await createPlaceholderContract(promoter);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    console.log(`\n✅ Successfully created ${successCount} contract(s)`);
    if (failCount > 0) {
      console.log(`❌ Failed to create ${failCount} contract(s)`);
    }
  } else if (dryRun) {
    console.log('💡 Tip: Run with --create-contracts (without --dry-run) to fix these issues\n');
  }

  console.log('\n📋 Recommendations:\n');
  console.log('1. Review these promoters with the HR team');
  console.log('2. Create actual contracts for legitimate assignments');
  console.log('3. Remove employer_id if assignment is no longer valid');
  console.log('4. Add validation rules to prevent future orphans\n');
}

main().catch(console.error);

