/**
 * Test endpoint for Google Service Account contract generation
 */

import { NextResponse } from 'next/server';
// import { googleDocsServiceSA } from '@/lib/google-docs-service-sa';

export async function GET() {
  try {
    // Temporarily disabled for build
    return NextResponse.json({
      success: false,
      message: 'Test route temporarily disabled for build',
      error: 'Missing Google Service Account credentials'
    }, { status: 503 });

    console.log('🧪 Testing Google Service Account contract generation...');

    // Test with sample data
    const result = await googleDocsServiceSA.generateContract({
      ref_number: 'TEST-001',
      contract_number: 'TEST-001',
      first_party_name_ar: 'شركة الإلكترونيات المتحدة - اكسترا',
      first_party_name_en: 'United Electronics Company - eXtra',
      first_party_crn: '1234567',
      second_party_name_ar: 'شركة المورد التجارية',
      second_party_name_en: 'Vendor Trading Company',
      second_party_crn: '7654321',
      promoter_name_ar: 'محمد أحمد علي',
      promoter_name_en: 'Mohammed Ahmed Ali',
      id_card_number: '123456789',
      contract_start_date: '2025-01-01',
      contract_end_date: '2025-12-31',
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: '✅ Contract generated successfully!',
        result,
        instructions: {
          next_steps: [
            'Open the document URL to see the generated contract',
            'Check that all placeholders are replaced',
            'Download the PDF using the PDF URL',
            'If everything works, integrate into your contract generation flow',
          ],
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorDetails: result.errorDetails,
          troubleshooting: {
            common_issues: [
              'Check that GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 is set in production environment',
              'Verify template is shared with service account: contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com',
              'Make sure template ID is correct: 1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0',
              'Check that Google Docs and Drive APIs are enabled in your Google Cloud Project',
            ],
            service_account_email: 'contract-generator@nth-segment-475411-g1.iam.gserviceaccount.com',
            template_id: '1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0',
            template_url: 'https://docs.google.com/document/d/1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0/edit',
          },
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error,
      },
      { status: 500 }
    );
  }
}

