import { NextRequest, NextResponse } from 'next/server';
import { GoogleDocsService } from '@/lib/google-docs-service';

export async function GET() {
  try {
    console.log('🧪 Testing Google Docs service initialization...');

    // Check environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY || !process.env.GOOGLE_DOCS_TEMPLATE_ID) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          GOOGLE_SERVICE_ACCOUNT_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
          GOOGLE_DOCS_TEMPLATE_ID: !!process.env.GOOGLE_DOCS_TEMPLATE_ID
        }
      }, { status: 500 });
    }

    // Initialize service
    const config = {
      templateId: process.env.GOOGLE_DOCS_TEMPLATE_ID,
      serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      outputFolderId: process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID,
    };

    console.log('📋 Config:', {
      templateId: config.templateId,
      hasServiceAccountKey: !!config.serviceAccountKey,
      outputFolderId: config.outputFolderId || 'NOT_SET'
    });

    const service = new GoogleDocsService(config);
    console.log('✅ Google Docs service created');

    // Test with minimal data
    const testData = {
      // Contract info
      contract_id: 'test-123',
      contract_number: 'CON-TEST-001',
      contract_type: 'test',
      contract_date: '2024-01-01',
      
      // Promoter data
      promoter_name_en: 'Test Promoter',
      promoter_name_ar: 'مروج تجريبي',
      promoter_email: 'test@example.com',
      promoter_mobile_number: '+96812345678',
      promoter_id_card_number: '123456789',
      promoter_passport_number: 'P1234567',
      promoter_id_card_url: '',
      promoter_passport_url: '',
      
      // First party (Client) data
      first_party_name_en: 'Test Client',
      first_party_name_ar: 'عميل تجريبي',
      first_party_crn: 'CRN123456',
      first_party_email: 'client@example.com',
      first_party_phone: '+96887654321',
      
      // Second party (Employer) data
      second_party_name_en: 'Test Employer',
      second_party_name_ar: 'صاحب عمل تجريبي',
      second_party_crn: 'CRN789012',
      second_party_email: 'employer@example.com',
      second_party_phone: '+96811223344',
      
      // Contract details
      job_title: 'Test Position',
      department: 'IT',
      work_location: 'Muscat, Oman',
      basic_salary: 1000,
      contract_start_date: '2024-01-01',
      contract_end_date: '2024-12-31',
      special_terms: 'Test terms',
      currency: 'OMR',
    };

    console.log('🔄 Testing contract generation...');
    const result = await service.generateContract(testData);
    console.log('✅ Contract generation successful:', result);

    return NextResponse.json({
      success: true,
      message: 'Google Docs integration test successful',
      result: {
        documentId: result.documentId,
        documentUrl: result.documentUrl,
        pdfUrl: result.pdfUrl
      }
    });

  } catch (error) {
    console.error('❌ Google Docs test failed:', error);
    
    return NextResponse.json({
      error: 'Google Docs test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
