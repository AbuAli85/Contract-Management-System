import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleDocsService, type ContractData } from '@/lib/google-docs-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'promoter_id',
      'first_party_id', 
      'second_party_id',
      'contract_type',
      'job_title',
      'department',
      'work_location',
      'basic_salary',
      'contract_start_date',
      'contract_end_date'
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    console.log('🔄 Starting Google Docs contract generation...');

    // Create contract record in database
    const contractData = {
      promoter_id: body.promoter_id,
      first_party_id: body.first_party_id,
      second_party_id: body.second_party_id,
      contract_type: body.contract_type,
      job_title: body.job_title,
      department: body.department,
      work_location: body.work_location,
      basic_salary: body.basic_salary,
      contract_start_date: body.contract_start_date,
      contract_end_date: body.contract_end_date,
      special_terms: body.special_terms || '',
      status: 'generating',
      created_at: new Date().toISOString(),
    };

    const { data: contract, error: contractError } = await (supabase as any)
      .from('contracts')
      .insert(contractData)
      .select()
      .single();

    if (contractError) {
      console.error('❌ Failed to create contract:', contractError);
      return NextResponse.json(
        { error: 'Failed to create contract record' },
        { status: 500 }
      );
    }

    console.log('✅ Contract created:', (contract as any)?.id);

    // Fetch promoter and party data
    const [promoterResult, firstPartyResult, secondPartyResult] = await Promise.all([
      (await supabase)
        .from('promoters')
        .select('id, name_en, name_ar, email, mobile_number, id_card_number, passport_number, id_card_url, passport_url')
        .eq('id', body.promoter_id)
        .single(),
      (await supabase)
        .from('parties')
        .select('id, name_en, name_ar, crn, email, phone')
        .eq('id', body.first_party_id)
        .single(),
      (await supabase)
        .from('parties')
        .select('id, name_en, name_ar, crn, email, phone')
        .eq('id', body.second_party_id)
        .single(),
    ]);

    const promoter = promoterResult.data as any;
    const firstParty = firstPartyResult.data as any;
    const secondParty = secondPartyResult.data as any;

    if (!promoter || !firstParty || !secondParty) {
      return NextResponse.json(
        { error: 'Failed to fetch required data' },
        { status: 500 }
      );
    }

    // Prepare contract data for Google Docs
    const googleDocsData: ContractData = {
      // Contract info
      contract_id: (contract as any)?.id || '',
      contract_number: (contract as any)?.contract_number || `CON-${Date.now()}`,
      contract_type: body.contract_type || '',
      contract_date: new Date().toISOString().split('T')[0] || '',
      
      // Promoter data
      promoter_name_en: promoter?.name_en || '',
      promoter_name_ar: promoter?.name_ar || '',
      promoter_email: promoter?.email || '',
      promoter_mobile_number: promoter?.mobile_number || '',
      promoter_id_card_number: promoter?.id_card_number || '',
      promoter_passport_number: promoter?.passport_number || '',
      promoter_id_card_url: promoter?.id_card_url || '',
      promoter_passport_url: promoter?.passport_url || '',
      
      // First party (Client) data
      first_party_name_en: firstParty?.name_en || '',
      first_party_name_ar: firstParty?.name_ar || '',
      first_party_crn: firstParty?.crn || '',
      first_party_email: firstParty?.email || '',
      first_party_phone: firstParty?.phone || '',
      
      // Second party (Employer) data
      second_party_name_en: secondParty?.name_en || '',
      second_party_name_ar: secondParty?.name_ar || '',
      second_party_crn: secondParty?.crn || '',
      second_party_email: secondParty?.email || '',
      second_party_phone: secondParty?.phone || '',
      
      // Contract details
      job_title: body.job_title,
      department: body.department,
      work_location: body.work_location,
      basic_salary: body.basic_salary,
      contract_start_date: body.contract_start_date,
      contract_end_date: body.contract_end_date,
      special_terms: body.special_terms || '',
      currency: 'OMR',
    };

    // Check environment variables
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not set');
      return NextResponse.json(
        { 
          error: 'Google Docs configuration missing',
          details: 'GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set',
          debug: 'Check /api/debug/google-docs-config for configuration status'
        },
        { status: 500 }
      );
    }

    if (!process.env.GOOGLE_DOCS_TEMPLATE_ID) {
      console.error('❌ GOOGLE_DOCS_TEMPLATE_ID not set');
      return NextResponse.json(
        { 
          error: 'Google Docs configuration missing',
          details: 'GOOGLE_DOCS_TEMPLATE_ID environment variable not set',
          debug: 'Check /api/debug/google-docs-config for configuration status'
        },
        { status: 500 }
      );
    }

    // Initialize Google Docs service
    const googleDocsConfig: any = {
      templateId: process.env.GOOGLE_DOCS_TEMPLATE_ID!,
      serviceAccountKey: process.env.GOOGLE_SERVICE_ACCOUNT_KEY!,
    };
    
    if (process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID) {
      googleDocsConfig.outputFolderId = process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID;
    }

    let googleDocsService;
    try {
      console.log('🔧 Initializing Google Docs service...');
      googleDocsService = new GoogleDocsService(googleDocsConfig);
      console.log('✅ Google Docs service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Docs service:', error);
      return NextResponse.json(
        { 
          error: 'Google Docs service initialization failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          debug: 'Check /api/debug/google-docs-config for configuration status'
        },
        { status: 500 }
      );
    }

    // Generate contract using Google Docs
    let result;
    try {
      result = await googleDocsService.generateContract(googleDocsData);
    } catch (error) {
      console.error('❌ Google Docs contract generation failed:', error);
      
      // Update contract status to failed
      await (supabase as any)
        .from('contracts')
        .update({
          status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          updated_at: new Date().toISOString(),
        })
        .eq('id', (contract as any)?.id);

      return NextResponse.json(
        { 
          error: 'Contract generation failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          contract_id: (contract as any)?.id,
          debug: 'Check /api/debug/google-docs-config for configuration status'
        },
        { status: 500 }
      );
    }

    // Update contract with generated document info
    await (supabase as any)
      .from('contracts')
      .update({
        status: 'completed',
        document_id: result.documentId,
        document_url: result.documentUrl,
        pdf_url: result.pdfUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', (contract as any)?.id);

    console.log('✅ Contract generation completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Contract generated successfully',
      data: {
        contract_id: (contract as any)?.id,
        contract_number: googleDocsData.contract_number,
        document_id: result.documentId,
        document_url: result.documentUrl,
        pdf_url: result.pdfUrl,
        generated_at: new Date().toISOString(),
      }
    });

  } catch (error) {
    console.error('❌ Contract generation failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Contract generation failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        debug: 'Check /api/debug/google-docs-config for configuration status'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Google Docs Contract Generation API',
    endpoints: {
      POST: 'Generate contract using Google Docs template'
    },
    debug: '/api/debug/google-docs-config'
  });
}