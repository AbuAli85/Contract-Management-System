import { NextRequest, NextResponse } from 'next/server';
import { GoogleDocsService } from '@/lib/google-docs-service';

export async function GET() {
  try {
    // Check if environment variables are set
    const requiredEnvVars = [
      'GOOGLE_SERVICE_ACCOUNT_KEY',
      'GOOGLE_DOCS_TEMPLATE_ID'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing environment variables',
        missing: missingVars,
        setup: 'Please check GOOGLE_DOCS_SETUP_INSTRUCTIONS.md'
      }, { status: 400 });
    }

    // Test configuration
    const config = {
      templateId: process.env.GOOGLE_DOCS_TEMPLATE_ID!,
      serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!,
      outputFolderId: process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID,
    };

    // Test contract data
    const testData = {
      contract_id: 'test-contract-123',
      contract_number: 'TEST-CON-001',
      contract_type: 'full-time-permanent',
      contract_date: '2024-01-01',
      
      promoter_name_en: 'John Doe',
      promoter_name_ar: 'جون دو',
      promoter_email: 'john.doe@example.com',
      promoter_mobile_number: '+96812345678',
      promoter_id_card_number: '1234567890',
      promoter_passport_number: 'P1234567',
      promoter_id_card_url: '',
      promoter_passport_url: '',
      
      first_party_name_en: 'ABC Company LLC',
      first_party_name_ar: 'شركة ABC',
      first_party_crn: '123456789',
      first_party_email: 'info@abc.com',
      first_party_phone: '+96898765432',
      
      second_party_name_en: 'XYZ Employer Ltd',
      second_party_name_ar: 'صاحب العمل XYZ',
      second_party_crn: '987654321',
      second_party_email: 'hr@xyz.com',
      second_party_phone: '+96887654321',
      
      job_title: 'Software Engineer',
      department: 'Information Technology',
      work_location: 'Muscat, Oman',
      basic_salary: 1500,
      contract_start_date: '2024-01-01',
      contract_end_date: '2025-01-01',
      special_terms: 'Remote work allowed 2 days per week',
      currency: 'OMR',
    };

    console.log('🧪 Testing Google Docs integration...');

    // Initialize service
    const googleDocsService = new GoogleDocsService(config);

    // Test contract generation
    const result = await googleDocsService.generateContract(testData);

    return NextResponse.json({
      status: 'success',
      message: 'Google Docs integration test successful!',
      data: {
        document_id: result.documentId,
        document_url: result.documentUrl,
        pdf_url: result.pdfUrl,
        test_data: testData
      },
      instructions: {
        next_steps: [
          '1. Check the generated document in Google Drive',
          '2. Verify all placeholders were replaced correctly',
          '3. Test the PDF generation',
          '4. Try the full contract generation API'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Google Docs test failed:', error);

    return NextResponse.json({
      status: 'error',
      message: 'Google Docs integration test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        common_issues: [
          'Check that Google Docs API is enabled in Google Cloud Console',
          'Verify Google Drive API is enabled',
          'Ensure template is shared with service account',
          'Check service account permissions',
          'Verify template ID is correct'
        ],
        setup_guide: 'See GOOGLE_DOCS_SETUP_INSTRUCTIONS.md for detailed setup'
      }
    }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({
    message: 'Google Docs Test API',
    usage: 'Send GET request to test the integration',
    endpoints: {
      GET: 'Test Google Docs integration with sample data'
    }
  });
}
