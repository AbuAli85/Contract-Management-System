/**
 * Regenerate PDFs for Existing Contracts
 *
 * This script triggers PDF generation for contracts that already exist
 * in the database but don't have PDFs yet.
 *
 * Usage:
 *   npx tsx scripts/regenerate-existing-contract-pdfs.ts
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
    config({ path: envPath, override: false });
  }
}

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Two different webhooks for different contract types
const EMPLOYMENT_WEBHOOK =
  process.env.MAKECOM_WEBHOOK_URL_SIMPLE ||
  process.env.MAKE_WEBHOOK_URL ||
  'https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4';

const GENERAL_WEBHOOK =
  process.env.MAKECOM_WEBHOOK_URL_GENERAL ||
  'https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz';

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.VERCEL_URL ||
  'http://localhost:3000';

// Function to determine which webhook to use based on contract type
function getWebhookForContractType(contractType: string): string {
  const type = contractType.toLowerCase();

  // Employment contracts (use employment webhook)
  const employmentTypes = [
    'employment',
    'full-time-permanent',
    'full-time-fixed',
    'part-time-permanent',
    'part-time-fixed',
    'oman-unlimited-makecom',
    'oman-fixed-term-makecom',
    'oman-part-time-makecom',
    'probationary',
    'training-contract',
    'internship',
  ];

  if (employmentTypes.some(t => type.includes(t))) {
    return EMPLOYMENT_WEBHOOK;
  }

  // General business contracts (use general webhook)
  return GENERAL_WEBHOOK;
}

// Parse command line arguments
const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = args.find(arg => arg.startsWith('--limit'))?.split('=')[1]
  ? parseInt(args.find(arg => arg.startsWith('--limit'))!.split('=')[1])
  : undefined;
const STATUS_FILTER =
  args.find(arg => arg.startsWith('--status'))?.split('=')[1] ||
  'draft,pending,active';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('🚀 Regenerate Contract PDFs Script');
  console.log('========================================\n');

  if (DRY_RUN) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing Supabase credentials.');
    console.error(
      '   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local'
    );
    process.exit(1);
  }

  if (!EMPLOYMENT_WEBHOOK && !GENERAL_WEBHOOK) {
    console.error('❌ Missing Make.com webhook URLs.');
    console.error('   At least one webhook must be configured');
    process.exit(1);
  }

  console.log(`📊 Configuration:`);
  console.log(`   Supabase URL: ${SUPABASE_URL}`);
  console.log(
    `   Employment Webhook: ${EMPLOYMENT_WEBHOOK.substring(0, 50)}...`
  );
  console.log(`   General Webhook: ${GENERAL_WEBHOOK.substring(0, 50)}...`);
  console.log(`   App URL: ${APP_URL}`);
  console.log(`   Status Filter: ${STATUS_FILTER}`);
  if (LIMIT) console.log(`   Limit: ${LIMIT} contracts`);
  console.log();

  // Step 1: Fetch contracts without PDFs
  console.log('📋 Step 1: Fetching existing contracts without PDFs...\n');

  const statusArray = STATUS_FILTER.split(',').map(s => s.trim());

  let query = supabase
    .from('contracts')
    .select(
      `
      id,
      contract_number,
      status,
      first_party_id,
      second_party_id,
      client_id,
      employer_id,
      promoter_id,
      start_date,
      end_date,
      title,
      value,
      currency,
      contract_type,
      pdf_url
    `
    )
    .is('pdf_url', null)
    .in('status', statusArray)
    .not('promoter_id', 'is', null);

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
  const byStatus = contracts.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  console.log('Status breakdown:');
  Object.entries(byStatus).forEach(([status, count]) => {
    console.log(`   ${status}: ${count}`);
  });
  console.log();

  if (DRY_RUN) {
    console.log('🔍 DRY RUN - Would process these contracts:');
    contracts.slice(0, 10).forEach((c, i) => {
      console.log(
        `   ${i + 1}. ${c.contract_number} - ${c.status} - ${c.title || 'No title'}`
      );
    });
    if (contracts.length > 10) {
      console.log(`   ... and ${contracts.length - 10} more`);
    }
    console.log(
      '\n✅ Dry run complete. Remove --dry-run to actually generate PDFs.'
    );
    process.exit(0);
  }

  // Step 2: Process contracts
  console.log(
    `📄 Step 2: Triggering PDF generation for ${contracts.length} existing contracts...\n`
  );

  let successCount = 0;
  let failureCount = 0;
  const failures: Array<{ contract: string; error: string }> = [];

  for (let i = 0; i < contracts.length; i++) {
    const contract = contracts[i];
    const progress = `[${i + 1}/${contracts.length}]`;

    console.log(`${progress} Processing ${contract.contract_number}...`);

    try {
      // Fetch related data
      const [firstPartyData, secondPartyData, promoterData] = await Promise.all(
        [
          contract.first_party_id || contract.client_id
            ? supabase
                .from('parties')
                .select('id, name_en, name_ar, crn, logo_url')
                .eq('id', contract.first_party_id || contract.client_id)
                .single()
            : null,
          contract.second_party_id || contract.employer_id
            ? supabase
                .from('parties')
                .select('id, name_en, name_ar, crn, logo_url')
                .eq('id', contract.second_party_id || contract.employer_id)
                .single()
            : null,
          contract.promoter_id
            ? supabase
                .from('promoters')
                .select(
                  'id, name_en, name_ar, id_card_number, passport_number, id_card_url, passport_url, email, mobile_number'
                )
                .eq('id', contract.promoter_id)
                .single()
            : null,
        ]
      );

      if (!promoterData?.data) {
        console.log(`   ⚠️  Skipping - No promoter data found`);
        failureCount++;
        failures.push({
          contract: contract.contract_number,
          error: 'Missing promoter data',
        });
        continue;
      }

      // Send DIRECTLY to Make.com webhook (not via API which creates new contract)
      const webhookPayload = {
        // Contract identification
        contract_id: contract.id,
        contract_number: contract.contract_number,
        ref_number: contract.contract_number,

        // Party IDs
        first_party_id: contract.first_party_id || contract.client_id,
        second_party_id: contract.second_party_id || contract.employer_id,
        promoter_id: contract.promoter_id,

        // Dates
        contract_start_date: contract.start_date,
        contract_end_date: contract.end_date,
        start_date: contract.start_date,
        end_date: contract.end_date,

        // Contract details with ALL required fields
        job_title: contract.title || 'Employment Contract',
        work_location: 'To be specified',
        department: 'General Department',
        email: promoterData.data.email || 'not-specified@example.com',
        basic_salary: Number(contract.value) || 250,
        currency: contract.currency || 'OMR',
        contract_type: contract.contract_type,

        // Work terms - REQUIRED
        probation_period: '3 months',
        notice_period: '30 days',
        working_hours: '8 hours/day, 5 days/week',

        // Allowances
        housing_allowance: 0,
        transport_allowance: 0,

        // Bilingual fields
        location_en: 'To be specified',
        location_ar: 'لم يتم تحديده',
        products_en: 'Employment services',
        products_ar: 'خدمات التوظيف',

        // Promoter data
        promoter_name_en: promoterData.data.name_en,
        promoter_name_ar: promoterData.data.name_ar,
        promoter_id_card_number: promoterData.data.id_card_number || '',
        promoter_passport_number: promoterData.data.passport_number || '',
        promoter_id_card_url:
          promoterData.data.id_card_url ||
          'https://via.placeholder.com/200x200',
        promoter_passport_url:
          promoterData.data.passport_url ||
          'https://via.placeholder.com/200x200',
        promoter_email: promoterData.data.email || '',
        promoter_mobile_number: promoterData.data.mobile_number || '',

        // First party data
        first_party_name_en: firstPartyData?.data?.name_en || 'First Party',
        first_party_name_ar: firstPartyData?.data?.name_ar || 'الطرف الأول',
        first_party_crn: firstPartyData?.data?.crn || '',
        first_party_logo_url:
          firstPartyData?.data?.logo_url ||
          'https://via.placeholder.com/300x100',

        // Second party data
        second_party_name_en: secondPartyData?.data?.name_en || 'Second Party',
        second_party_name_ar: secondPartyData?.data?.name_ar || 'الطرف الثاني',
        second_party_crn: secondPartyData?.data?.crn || '',
        second_party_logo_url:
          secondPartyData?.data?.logo_url ||
          'https://via.placeholder.com/300x100',

        // Callback URL for Make.com to update the existing contract
        update_url: `${APP_URL}/api/webhook/contract-pdf-ready`,
        callback_url: `${APP_URL}/api/webhook/contract-pdf-ready`,
      };

      // Determine which webhook to use based on contract type
      const webhookUrl = getWebhookForContractType(contract.contract_type);
      const webhookType =
        webhookUrl === EMPLOYMENT_WEBHOOK ? 'Employment' : 'General';

      console.log(`   🔗 Using ${webhookType} webhook`);

      // Call Make.com webhook DIRECTLY
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Contract-Management-System-Batch/1.0',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (response.ok) {
        const result = await response.text();
        console.log(`   ✅ Success - Make.com webhook triggered`);

        // Update contract status to processing
        await supabase
          .from('contracts')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', contract.id);

        successCount++;
      } else {
        const errorText = await response.text();
        console.log(
          `   ❌ Failed - ${response.status}: ${errorText.substring(0, 100)}`
        );
        failureCount++;
        failures.push({
          contract: contract.contract_number,
          error: `HTTP ${response.status}`,
        });
      }

      // Rate limiting - wait 1 second between requests
      if (i < contracts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.log(
        `   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      failureCount++;
      failures.push({
        contract: contract.contract_number,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  // Step 3: Summary
  console.log('\n========================================');
  console.log('📊 PDF Regeneration Complete!\n');
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Failed: ${failureCount}`);
  console.log(`📋 Total: ${contracts.length}`);

  if (failures.length > 0 && failures.length <= 20) {
    console.log('\n❌ Failed contracts:');
    failures.forEach((f, i) => {
      console.log(`   ${i + 1}. ${f.contract} - ${f.error}`);
    });
  } else if (failures.length > 20) {
    console.log(`\n❌ ${failures.length} contracts failed (too many to list)`);
  }

  console.log('\n💡 PDFs generate asynchronously via Make.com.');
  console.log('   Check contracts in 5-10 minutes for updated pdf_url values.');
  console.log('\n📊 Verify progress with:');
  console.log(
    '   SELECT status, COUNT(*), COUNT(CASE WHEN pdf_url IS NOT NULL THEN 1 END) as with_pdf'
  );
  console.log('   FROM contracts GROUP BY status;');
}

main().catch(console.error);
