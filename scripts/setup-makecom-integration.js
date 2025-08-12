const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function setupMakecomIntegration() {
  console.log('🔧 Setting up Make.com Integration...');

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('❌ Missing Supabase environment variables');
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('✅ Supabase client initialized with service role');

    // Check current environment variables
    console.log('\n📋 Current Environment Variables:');
    console.log('MAKE_WEBHOOK_URL:', process.env.MAKE_WEBHOOK_URL || 'NOT SET');
    console.log(
      'NEXT_PUBLIC_MAKE_WEBHOOK_URL:',
      process.env.NEXT_PUBLIC_MAKE_WEBHOOK_URL || 'NOT SET'
    );
    console.log(
      'PDF_READY_WEBHOOK_URL:',
      process.env.PDF_READY_WEBHOOK_URL || 'NOT SET'
    );

    // Check contract types with Make.com integration
    console.log('\n📋 Contract Types with Make.com Integration:');

    const { data: contractTypes, error: contractTypesError } = await supabase
      .from('contract_types')
      .select('*')
      .not('makecom_template_id', 'is', null);

    if (contractTypesError) {
      console.log(
        '⚠️ Could not fetch contract types from database, checking configuration files...'
      );
    } else {
      console.log(
        `Found ${contractTypes?.length || 0} contract types with Make.com integration:`
      );
      contractTypes?.forEach(type => {
        console.log(`   - ${type.name}: ${type.makecom_template_id}`);
      });
    }

    // Test the current webhook
    console.log('\n🧪 Testing current webhook...');

    if (process.env.MAKE_WEBHOOK_URL) {
      try {
        const testPayload = {
          contract_id: 'test-contract-id',
          contract_number: 'TEST-SETUP-001',
          contract_type: 'full-time-permanent',
          test: true,
        };

        console.log(
          '📤 Sending test payload to:',
          process.env.MAKE_WEBHOOK_URL
        );
        console.log('📤 Test payload:', testPayload);

        const response = await fetch(process.env.MAKE_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload),
        });

        console.log(
          '🔗 Webhook response status:',
          response.status,
          response.statusText
        );

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const result = await response.json();
          console.log('✅ Webhook response (JSON):', result);
        } else {
          const textResponse = await response.text();
          console.log('✅ Webhook response (text):', textResponse);
        }

        if (response.ok) {
          console.log('✅ Webhook is working correctly!');
        } else {
          console.log('❌ Webhook returned an error status');
        }
      } catch (error) {
        console.error('❌ Webhook test failed:', error.message);
      }
    } else {
      console.log('⚠️ No MAKE_WEBHOOK_URL configured');
    }

    // Check if we have the correct webhook URLs
    console.log('\n🔍 Webhook URL Analysis:');

    const currentWebhookUrl = process.env.MAKE_WEBHOOK_URL;
    const pdfReadyWebhookUrl = process.env.PDF_READY_WEBHOOK_URL;

    if (currentWebhookUrl === pdfReadyWebhookUrl) {
      console.log(
        '⚠️ WARNING: Main webhook URL is the same as PDF ready webhook URL'
      );
      console.log(
        '   This means the system is using the PDF notification webhook for contract generation'
      );
      console.log(
        '   You need to set up a separate webhook for the main contract generation process'
      );
    } else {
      console.log(
        '✅ Main webhook and PDF ready webhook are different (correct setup)'
      );
    }

    // Provide setup instructions
    console.log('\n📝 Setup Instructions:');
    console.log('\n1. Create a new Make.com scenario for contract generation:');
    console.log('   - Go to https://www.make.com/');
    console.log('   - Create a new scenario');
    console.log('   - Add a Webhook trigger module');
    console.log('   - Copy the webhook URL');
    console.log('   - Add Google Docs modules for template processing');
    console.log('   - Add Supabase module for PDF upload');
    console.log('   - Add HTTP request module to update contract status');

    console.log('\n2. Update your .env.local file:');
    console.log('   # Main contract generation webhook');
    console.log(
      '   MAKE_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_NEW_CONTRACT_GENERATION_WEBHOOK_ID'
    );
    console.log(
      '   NEXT_PUBLIC_MAKE_WEBHOOK_URL=https://hook.eu2.make.com/YOUR_NEW_CONTRACT_GENERATION_WEBHOOK_ID'
    );
    console.log('   ');
    console.log('   # PDF ready notification webhook (keep existing)');
    console.log(
      '   PDF_READY_WEBHOOK_URL=https://hook.eu2.make.com/71go2x4zwsnha4r1f4en1g9gjxpk3ts4'
    );

    console.log('\n3. Create Google Docs templates:');
    console.log(
      '   - Create templates in Google Docs with proper placeholders'
    );
    console.log('   - Copy the template IDs from the URLs');
    console.log(
      '   - Update lib/contract-type-config.ts with the template IDs'
    );

    console.log('\n4. Test the integration:');
    console.log('   - Generate a new contract');
    console.log('   - Check Make.com scenario execution');
    console.log('   - Verify PDF generation and upload');

    // Check if we have Google Docs template IDs configured
    console.log('\n🔍 Google Docs Template Configuration:');

    const contractTypeConfig = require('../lib/contract-type-config.ts');
    const enhancedTypes =
      contractTypeConfig.enhancedContractTypes ||
      contractTypeConfig.contractTypes ||
      [];

    const typesWithTemplates = enhancedTypes.filter(
      type => type.googleDocsTemplateId
    );
    console.log(
      `Found ${typesWithTemplates.length} contract types with Google Docs templates:`
    );

    typesWithTemplates.forEach(type => {
      const templateId = type.googleDocsTemplateId;
      const isPlaceholder = templateId.includes(
        'AbCdEfGhIjKlMnOpQrStUvWxYz123456789'
      );

      console.log(
        `   - ${type.name}: ${templateId} ${isPlaceholder ? '(PLACEHOLDER - NEEDS REAL ID)' : '(CONFIGURED)'}`
      );
    });

    if (
      typesWithTemplates.some(type =>
        type.googleDocsTemplateId.includes(
          'AbCdEfGhIjKlMnOpQrStUvWxYz123456789'
        )
      )
    ) {
      console.log(
        '\n⚠️ WARNING: Some contract types still have placeholder template IDs'
      );
      console.log(
        '   You need to replace the placeholder IDs with real Google Docs template IDs'
      );
    }

    console.log('\n🎉 Make.com integration setup analysis completed!');
    console.log('\nNext steps:');
    console.log('1. Set up the Make.com scenario as described above');
    console.log('2. Update the webhook URLs in .env.local');
    console.log('3. Create and configure Google Docs templates');
    console.log('4. Test the complete workflow');
  } catch (error) {
    console.error('❌ Make.com integration setup failed:', error);
  }
}

// Run the setup
setupMakecomIntegration();
