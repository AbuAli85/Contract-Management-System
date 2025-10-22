#!/usr/bin/env tsx

/**
 * Test Make.com Direct - Sends data in the exact format your current scenario expects
 * This bypasses the database query issues by sending all data directly
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables
const envFiles = ['.env.local', '.env', '.env.vercel'];
for (const envFile of envFiles) {
  const envPath = resolve(process.cwd(), envFile);
  if (existsSync(envPath)) {
    console.log(`📄 Loading environment from: ${envFile}`);
    config({ path: envPath, override: false });
  }
}

// Two different webhooks for different contract types
const EMPLOYMENT_WEBHOOK = process.env.MAKECOM_WEBHOOK_URL_SIMPLE || 
                           process.env.MAKE_WEBHOOK_URL || 
                           'https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4';
                           
const GENERAL_WEBHOOK = process.env.MAKECOM_WEBHOOK_URL_GENERAL || 
                        'https://hook.eu2.make.com/j07svcht90xh6w0eblon81hrmu9opykz';

console.log(`✅ Employment Webhook: ${EMPLOYMENT_WEBHOOK.substring(0, 50)}...`);
console.log(`✅ General Webhook: ${GENERAL_WEBHOOK.substring(0, 50)}...`);

async function testMakecomDirect() {
  console.log('🧪 Testing Make.com with direct data...\n');

  // Test data that matches your current Make.com scenario expectations
  const testPayload = {
    // Contract identification
    contract_id: "test-contract-123",
    contract_number: "TEST-20250122-001",
    ref_number: "TEST-20250122-001",
    
    // Contract type
    contract_type: "full-time-permanent",
    
    // Party IDs (what your scenario tries to fetch from DB)
    promoter_id: "test-promoter-123",
    first_party_id: "test-client-123", 
    second_party_id: "test-employer-123",
    
    // Dates
    contract_start_date: "2025-01-22",
    contract_end_date: "2026-01-22",
    start_date: "2025-01-22",
    end_date: "2026-01-22",
    
    // Contract details
    job_title: "Software Developer",
    work_location: "Muscat, Oman",
    department: "IT Department",
    basic_salary: 1500,
    special_terms: "Standard employment terms",
    
    // Promoter data (what your scenario tries to fetch)
    promoter_name_en: "Ahmed Al-Rashid",
    promoter_name_ar: "أحمد الراشد",
    promoter_email: "ahmed@example.com",
    promoter_mobile_number: "+96812345678",
    promoter_id_card_number: "1234567890",
    promoter_id_card_url: "https://via.placeholder.com/300x200/0066CC/FFFFFF?text=ID+Card",
    promoter_passport_url: "https://via.placeholder.com/300x200/CC6600/FFFFFF?text=Passport",
    
    // First party data (Client)
    first_party_name_en: "United Electronics Company",
    first_party_name_ar: "الشركة المتحدة للالكترونيات",
    first_party_crn: "1141656",
    first_party_logo: "https://reootcngcptfogfozlmz.supabase.co/storage/v1/object/public/party-logos/extra%20logo1.png",
    
    // Second party data (Employer) 
    second_party_name_en: "Blue Oasis Quality Services",
    second_party_name_ar: "الواحة الزرقاء لجودة الخدمات",
    second_party_crn: "1367636",
    second_party_logo: "https://via.placeholder.com/200x100/009900/FFFFFF?text=Logo",
    
    // Required fields for validation
    probation_period: "3 months",
    notice_period: "30 days", 
    working_hours: "8 hours/day, 5 days/week",
    currency: "OMR",
    
    // Callback URLs
    update_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/contract-pdf-ready`,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhook/contract-pdf-ready`,
  };

  try {
    console.log('📤 Sending test payload to Employment webhook...');
    console.log(`🔗 URL: ${EMPLOYMENT_WEBHOOK}`);
    
    const response = await fetch(EMPLOYMENT_WEBHOOK, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
    });

    const responseText = await response.text();
    
    if (response.ok) {
      console.log('✅ Webhook accepted successfully!');
      console.log(`📋 Response: ${responseText}`);
      
      console.log('\n⏳ Waiting 3 minutes for Make.com to process...');
      await new Promise(resolve => setTimeout(resolve, 180000)); // 3 minutes
      
      console.log('✅ Test complete! Check your Make.com scenario execution history.');
      console.log('📊 If successful, you should see a PDF generated in your Google Drive.');
      
    } else {
      console.log(`❌ Webhook failed: ${response.status}`);
      console.log(`📋 Response: ${responseText}`);
    }
    
  } catch (error) {
    console.error('❌ Error sending webhook:', error);
  }
}

// Run the test
testMakecomDirect().catch(console.error);
