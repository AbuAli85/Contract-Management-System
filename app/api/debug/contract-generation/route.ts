import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface DatabaseRecord {
  id: string;
  name_en: string;
}

export async function GET() {
  try {
    console.log('🔍 Contract Generation Debug - Starting diagnostics...');
    
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'undefined',
        GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Missing',
        GOOGLE_DOCS_TEMPLATE_ID: process.env.GOOGLE_DOCS_TEMPLATE_ID ? '✅ Set' : '❌ Missing',
        GOOGLE_DRIVE_OUTPUT_FOLDER_ID: process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID ? '✅ Set' : '❌ Missing',
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || '❌ Missing',
      },
      database: {
        connection: 'Testing...',
        tables: {
          contracts: 'Testing...',
          promoters: 'Testing...',
          parties: 'Testing...'
        }
      },
      services: {
        html_contract_service: 'Testing...',
        simple_pdf_service: 'Testing...',
        google_docs_service: 'Testing...'
      }
    };

    // Test database connection
    try {
      const supabase = await createClient();
      if (supabase) {
        diagnostics.database.connection = '✅ Connected';
        
        // Test table access
        const [contractsTest, promotersTest, partiesTest] = await Promise.all([
          supabase.from('contracts').select('id').limit(1),
          supabase.from('promoters').select('id').limit(1),
          supabase.from('parties').select('id').limit(1)
        ]);
        
        diagnostics.database.tables.contracts = contractsTest.error ? `❌ Error: ${contractsTest.error.message}` : '✅ Accessible';
        diagnostics.database.tables.promoters = promotersTest.error ? `❌ Error: ${promotersTest.error.message}` : '✅ Accessible';
        diagnostics.database.tables.parties = partiesTest.error ? `❌ Error: ${partiesTest.error.message}` : '✅ Accessible';
      } else {
        diagnostics.database.connection = '❌ Failed to connect';
      }
    } catch (error) {
      diagnostics.database.connection = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Test service imports
    try {
      const { HtmlContractService } = await import('@/lib/html-contract-service');
      diagnostics.services.html_contract_service = '✅ Available';
    } catch (error) {
      diagnostics.services.html_contract_service = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    try {
      const { SimplePdfService } = await import('@/lib/simple-pdf-service');
      diagnostics.services.simple_pdf_service = '✅ Available';
    } catch (error) {
      diagnostics.services.simple_pdf_service = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    try {
      const { GoogleDocsService } = await import('@/lib/google-docs-service');
      diagnostics.services.google_docs_service = '✅ Available';
    } catch (error) {
      diagnostics.services.google_docs_service = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }

    // Test Google Docs configuration
    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY && process.env.GOOGLE_DOCS_TEMPLATE_ID) {
      try {
        const { GoogleDocsService } = await import('@/lib/google-docs-service');
        const googleDocsService = new GoogleDocsService({
          templateId: process.env.GOOGLE_DOCS_TEMPLATE_ID,
          serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
        });
        diagnostics.google_docs_config = '✅ Service can be initialized';
      } catch (error) {
        diagnostics.google_docs_config = `❌ Service initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      }
    } else {
      diagnostics.google_docs_config = '❌ Missing required environment variables';
    }

    console.log('📊 Contract Generation Diagnostics:', JSON.stringify(diagnostics, null, 2));
    
    return NextResponse.json({
      success: true,
      message: 'Contract generation diagnostics completed',
      diagnostics
    });
    
  } catch (error) {
    console.error('❌ Contract generation diagnostics failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Diagnostics failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🧪 Contract Generation Test - Request body:', body);
    
    // Test basic validation
    const requiredFields = ['promoter_id', 'first_party_id', 'second_party_id'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        missing_fields: missingFields,
        received_fields: Object.keys(body)
      }, { status: 400 });
    }

    // Test database access
    const supabase = await createClient();
    
    // Test promoter
    const promoterResult = await supabase.from('promoters').select('id, name_en').eq('id', body.promoter_id).single();
    const promoterName = (promoterResult as any).data ? (promoterResult as any).data.name_en || 'Unknown' : 'Unknown';
    const promoterStatus = promoterResult.error ? `❌ Error: ${promoterResult.error.message}` : `✅ Found: ${promoterName}`;
    
    // Test first party
    const firstPartyResult = await supabase.from('parties').select('id, name_en').eq('id', body.first_party_id).single();
    const firstPartyName = (firstPartyResult as any).data ? (firstPartyResult as any).data.name_en || 'Unknown' : 'Unknown';
    const firstPartyStatus = firstPartyResult.error ? `❌ Error: ${firstPartyResult.error.message}` : `✅ Found: ${firstPartyName}`;
    
    // Test second party
    const secondPartyResult = await supabase.from('parties').select('id, name_en').eq('id', body.second_party_id).single();
    const secondPartyName = (secondPartyResult as any).data ? (secondPartyResult as any).data.name_en || 'Unknown' : 'Unknown';
    const secondPartyStatus = secondPartyResult.error ? `❌ Error: ${secondPartyResult.error.message}` : `✅ Found: ${secondPartyName}`;

    const testResults = {
      promoter: promoterStatus,
      first_party: firstPartyStatus,
      second_party: secondPartyStatus
    };

    return NextResponse.json({
      success: true,
      message: 'Contract generation test completed',
      test_results: testResults,
      validation: {
        required_fields_present: missingFields.length === 0,
        database_access: Object.values(testResults).every(result => result.startsWith('✅'))
      }
    });
    
  } catch (error) {
    console.error('❌ Contract generation test failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
