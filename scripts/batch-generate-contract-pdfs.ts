/**
 * Batch Contract PDF Generation Script
 * 
 * This script triggers PDF generation for all contracts that are missing PDFs.
 * It calls the Make.com generation endpoint for each contract.
 * 
 * Usage:
 *   npx tsx scripts/batch-generate-contract-pdfs.ts
 * 
 * Options:
 *   --dry-run : Preview what would be done without making changes
 *   --limit N : Process only N contracts
 *   --status draft|pending|active : Filter by status
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables from .env files (try multiple files in order)
const envFiles = ['.env.local', '.env', '.env.vercel'];
for (const envFile of envFiles) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    console.log(`📄 Loading environment from: ${envFile}`);
    config({ path: envPath, override: false }); // Don't override already set vars
  }
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const MAKECOM_WEBHOOK_URL = process.env.MAKECOM_WEBHOOK_URL || process.env.MAKE_WEBHOOK_URL || process.env.WEBHOOK_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = args.find(arg => arg.startsWith('--limit'))?.split('=')[1] 
  ? parseInt(args.find(arg => arg.startsWith('--limit'))!.split('=')[1]) 
  : undefined;
const STATUS_FILTER = args.find(arg => arg.startsWith('--status'))?.split('=')[1] || 'draft,pending,active';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface Contract {
  id: string;
  contract_number: string;
  status: string;
  first_party_id: string | null;
  second_party_id: string | null;
  promoter_id: string | null;
  start_date: string;
  end_date: string;
  title: string;
  value: number | null;
  currency: string | null;
  contract_type: string;
  pdf_url: string | null;
}

async function main() {
  console.log('🚀 Batch Contract PDF Generation Script');
  console.log('========================================\n');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials.');
    console.error('   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('\n📝 Example .env.local:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
    console.error('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here\n');
    process.exit(1);
  }

  if (!MAKECOM_WEBHOOK_URL) {
    console.error('❌ Missing Make.com webhook URL.');
    console.error('   Set one of these in .env.local:');
    console.error('   - MAKECOM_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_WEBHOOK_ID');
    console.error('   - MAKE_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_WEBHOOK_ID');
    console.error('   - WEBHOOK_URL=https://hook.eu2.make.com/YOUR_WEBHOOK_ID\n');
    console.error('💡 Get this URL from your Make.com scenario webhook trigger.\n');
    process.exit(1);
  }

  console.log(`📊 Configuration:`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(`   Make.com Webhook: ${MAKECOM_WEBHOOK_URL.substring(0, 50)}...`);
  console.log(`   App URL: ${APP_URL}`);
  console.log(`   Status Filter: ${STATUS_FILTER}`);
  if (LIMIT) console.log(`   Limit: ${LIMIT} contracts`);
  console.log();

  // Step 1: Fetch contracts without PDFs
  console.log('📋 Step 1: Fetching contracts without PDFs...\n');
  
  const statusArray = STATUS_FILTER.split(',').map(s => s.trim());
  
  let query = supabase
    .from('contracts')
    .select(`
      id,
      contract_number,
      status,
      first_party_id,
      second_party_id,
      promoter_id,
      start_date,
      end_date,
      title,
      value,
      currency,
      contract_type,
      pdf_url
    `)
    .is('pdf_url', null)
    .in('status', statusArray)
    .not('promoter_id', 'is', null); // Only contracts with promoters

  if (LIMIT) {
    query = query.limit(LIMIT);
  }

  const { data: contracts, error } = await query;

  if (error) {
    console.error('❌ Error fetching contracts:', error);
    process.exit(1);
  }

  if (!contracts || contracts.length === 0) {
    console.log('✅ No contracts found that need PDF generation!');
    process.exit(0);
  }

  console.log(`Found ${contracts.length} contracts without PDFs:\n`);
  
  // Show summary
  const byStatus = contracts.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('Status breakdown:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  console.log();

  if (DRY_RUN) {
    console.log('🔍 DRY RUN - Would process these contracts:');
    contracts.slice(0, 10).forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.contract_number} - ${c.status} - ${c.title || 'No title'}`);
    });
    if (contracts.length > 10) {
      console.log(`   ... and ${contracts.length - 10} more`);
    }
    console.log('\n✅ Dry run complete. Remove --dry-run to actually generate PDFs.');
    process.exit(0);
  }

  // Step 2: Process contracts
  console.log(`📄 Step 2: Generating PDFs for ${contracts.length} contracts...\n`);

  let successCount = 0;
  let failureCount = 0;
  const failures: Array<{ contract: string; error: string }> = [];

  for (let i = 0; i < contracts.length; i++) {
    const contract = contracts[i];
    const progress = `[${i + 1}/${contracts.length}]`;

    console.log(`${progress} Processing ${contract.contract_number}...`);

    try {
      // Fetch related data
      const [firstPartyData, secondPartyData, promoterData] = await Promise.all([
        contract.first_party_id
          ? supabase
              .from('parties')
              .select('id, name_en, name_ar, crn, logo_url')
              .eq('id', contract.first_party_id)
              .single()
          : null,
        contract.second_party_id
          ? supabase
              .from('parties')
              .select('id, name_en, name_ar, crn, logo_url')
              .eq('id', contract.second_party_id)
              .single()
          : null,
        contract.promoter_id
          ? supabase
              .from('promoters')
              .select('id, name_en, name_ar, id_card_number, passport_number, id_card_url, passport_url, email, mobile_number')
              .eq('id', contract.promoter_id)
              .single()
          : null,
      ]);

      if (!promoterData?.data) {
        console.log(`   ⚠️  Skipping - No promoter data found`);
        failureCount++;
        failures.push({ contract: contract.contract_number, error: 'Missing promoter data' });
        continue;
      }

      // Prepare contract data for Make.com with ALL required fields
      const contractData = {
        // Core IDs
        first_party_id: contract.first_party_id,
        second_party_id: contract.second_party_id,
        promoter_id: contract.promoter_id,
        contract_number: contract.contract_number,
        
        // Dates
        contract_start_date: contract.start_date,
        contract_end_date: contract.end_date,
        
        // Contract details (with all required fields)
        job_title: contract.title || 'Employment Contract',
        work_location: 'To be specified',
        department: 'General Department', // Required - min 2 chars
        email: promoterData.data.email || 'not-specified@example.com',
        basic_salary: contract.value || 250,
        currency: contract.currency || 'OMR',
        contract_type: contract.contract_type,
        special_terms: '',
        
        // Work terms - REQUIRED fields
        probation_period: '3 months', // Required
        notice_period: '30 days', // Required
        working_hours: '8 hours/day, 5 days/week', // Required
        
        // Optional allowances
        housing_allowance: 0,
        transport_allowance: 0,
        allowances: 0,
        
        // Location bilingual fields
        location_en: 'To be specified',
        location_ar: 'لم يتم تحديده',
        
        // Products bilingual fields  
        products_en: 'Employment services',
        products_ar: 'خدمات التوظيف',
        
        // Enriched promoter data
        promoter_name_en: promoterData.data.name_en,
        promoter_name_ar: promoterData.data.name_ar,
        promoter_id_card_number: promoterData.data.id_card_number || '',
        promoter_passport_number: promoterData.data.passport_number || '',
        promoter_id_card_url: promoterData.data.id_card_url,
        promoter_passport_url: promoterData.data.passport_url,
        promoter_email: promoterData.data.email || '',
        promoter_mobile_number: promoterData.data.mobile_number || '',
        
        // Enriched first party (client) data
        first_party_name_en: firstPartyData?.data?.name_en || 'First Party',
        first_party_name_ar: firstPartyData?.data?.name_ar || 'الطرف الأول',
        first_party_crn: firstPartyData?.data?.crn || '',
        first_party_logo_url: firstPartyData?.data?.logo_url,
        
        // Enriched second party (employer) data
        second_party_name_en: secondPartyData?.data?.name_en || 'Second Party',
        second_party_name_ar: secondPartyData?.data?.name_ar || 'الطرف الثاني',
        second_party_crn: secondPartyData?.data?.crn || '',
        second_party_logo_url: secondPartyData?.data?.logo_url,
      };

      // Call Make.com generation endpoint
      const response = await fetch(`${APP_URL}/api/contracts/makecom/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractType: contract.contract_type,
          contractData,
          triggerMakecom: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`   ✅ Success - Status: ${result.data?.makecom?.status || 'triggered'}`);
        successCount++;
      } else {
        const errorText = await response.text();
        console.log(`   ❌ Failed - ${response.status}: ${errorText.substring(0, 100)}`);
        failureCount++;
        failures.push({ contract: contract.contract_number, error: `HTTP ${response.status}` });
      }

      // Rate limiting - wait 1 second between requests
      if (i < contracts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      failureCount++;
      failures.push({ 
        contract: contract.contract_number, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Step 3: Summary
  console.log('\n========================================');
  console.log('📊 Generation Complete!\n');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📋 Total: ${contracts.length}`);

  if (failures.length > 0) {
    console.log('\n❌ Failed contracts:');
    failures.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f.contract} - ${f.error}`);
    });
  }

  console.log('\n💡 Note: PDF generation happens asynchronously via Make.com.');
  console.log('   Check the contracts table in a few minutes to see updated pdf_url values.');
}

main().catch(console.error);

