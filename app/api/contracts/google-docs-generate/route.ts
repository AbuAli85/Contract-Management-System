import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { GoogleDocsService } from '@/lib/google-docs-service';
import type { ContractData } from '@/lib/google-docs-service';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Google Docs contract generation started');
    const body = await request.json();
    console.log('📤 Request body:', body);
    
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

    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          missing_fields: missingFields,
          received_fields: Object.keys(body)
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    console.log('🔄 Starting Google Docs contract generation...');

    // Generate unique contract number
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const contractNumber = `PAC-${day}${month}${year}-${random}`;

    // Map contract type
    const mapContractType = (type: string): string => {
      if (!type) return 'employment';
      const typeLower = String(type).toLowerCase();
      const typeMap: Record<string, string> = {
        'employment': 'employment',
        'full-time-permanent': 'employment',
        'full-time-fixed': 'employment',
        'part-time-permanent': 'employment',
        'part-time-fixed': 'employment',
        'probationary': 'employment',
        'training-contract': 'employment',
        'internship': 'employment',
        'graduate-trainee': 'employment',
        'service': 'service',
        'freelance': 'service',
        'contractor': 'service',
        'consultant': 'consultancy',
        'consulting': 'consultancy',
        'consulting-agreement': 'consultancy',
        'project-based': 'consultancy',
        'partnership': 'partnership',
        'temporary': 'service',
        'seasonal': 'service',
        'executive': 'employment',
        'management': 'employment',
        'director': 'employment',
        'remote-work': 'employment',
        'hybrid-work': 'employment',
        'secondment': 'service',
        'apprenticeship': 'employment',
        'service-agreement': 'service',
        'retainer': 'service',
      };
      return typeMap[typeLower] || 'employment';
    };

    const contractType = mapContractType(body.contract_type);

    // Create contract record in database with correct field mapping
    const contractData = {
      contract_number: contractNumber,
      promoter_id: body.promoter_id,
      employer_id: body.second_party_id, // Fixed: second_party = employer
      client_id: body.first_party_id,    // Fixed: first_party = client
      title: body.job_title || 'Employment Contract',
      description: body.special_terms || '',
      contract_type: contractType,
      start_date: body.contract_start_date,
      end_date: body.contract_end_date,
      value: body.basic_salary,
      currency: 'USD',
      status: 'draft', // Fixed: use 'draft' instead of 'generating'
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
        { 
          error: 'Failed to create contract record',
          domain: "protal.thesmartpro.io",
          details: contractError.message,
          code: contractError.code,
          hint: contractError.hint
        },
        { status: 500 }
      );
    }

    console.log('✅ Contract created:', (contract as any)?.id);

    // Fetch promoter and party data
    console.log('🔍 Fetching data for:', {
      promoter_id: body.promoter_id,
      first_party_id: body.first_party_id,
      second_party_id: body.second_party_id
    });

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

    console.log('📊 Fetch results:', {
      promoter: { data: promoterResult.data, error: promoterResult.error },
      firstParty: { data: firstPartyResult.data, error: firstPartyResult.error },
      secondParty: { data: secondPartyResult.data, error: secondPartyResult.error }
    });

    let promoter = promoterResult.data as any;
    let firstParty = firstPartyResult.data as any;
    let secondParty = secondPartyResult.data as any;

    // Check for missing data and provide detailed error
    const missingData = [];
    if (!promoter) missingData.push(`promoter (ID: ${body.promoter_id})`);
    if (!firstParty) missingData.push(`first_party (ID: ${body.first_party_id})`);
    if (!secondParty) missingData.push(`second_party (ID: ${body.second_party_id})`);

    if (missingData.length > 0) {
      console.warn('⚠️ Missing data, using fallback data:', missingData);
      
      // Use fallback data for missing records
      promoter = promoter || {
        id: body.promoter_id,
        name_en: 'Unknown Promoter',
        name_ar: 'مروج غير معروف',
        email: 'promoter@example.com',
        mobile_number: '+96800000000',
        id_card_number: 'N/A',
        passport_number: 'N/A'
      };
      
      firstParty = firstParty || {
        id: body.first_party_id,
        name_en: 'Unknown Client',
        name_ar: 'عميل غير معروف',
        crn: 'N/A',
        email: 'client@example.com',
        phone: '+96800000000'
      };
      
      secondParty = secondParty || {
        id: body.second_party_id,
        name_en: 'Unknown Employer',
        name_ar: 'صاحب عمل غير معروف',
        crn: 'N/A',
        email: 'employer@example.com',
        phone: '+96800000000'
      };
      
      console.log('✅ Using fallback data for missing records');
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

    // Check environment variables with detailed logging
    console.log('🔍 Checking environment variables...');
    const envStatus = {
      GOOGLE_SERVICE_ACCOUNT_KEY: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      GOOGLE_DOCS_TEMPLATE_ID: !!process.env.GOOGLE_DOCS_TEMPLATE_ID,
      GOOGLE_DRIVE_OUTPUT_FOLDER_ID: !!process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID
    };
    console.log('📋 Environment status:', envStatus);

    if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
      console.error('❌ GOOGLE_SERVICE_ACCOUNT_KEY not set');
      return NextResponse.json(
        { 
          error: 'Google Docs configuration missing',
          details: 'GOOGLE_SERVICE_ACCOUNT_KEY environment variable not set',
          environment_status: envStatus,
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
          environment_status: envStatus,
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
    
    // Make output folder optional - use root if not specified
    if (process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID) {
      googleDocsConfig.outputFolderId = process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID;
    } else {
      console.log('⚠️ GOOGLE_DRIVE_OUTPUT_FOLDER_ID not set, using root folder');
      // Don't set outputFolderId - let the service use default
    }

    let googleDocsService;
    try {
      console.log('🔧 Initializing Google Docs service...');
      console.log('📋 Service config:', {
        templateId: googleDocsConfig.templateId,
        hasServiceAccount: !!googleDocsConfig.serviceAccountKey,
        hasOutputFolder: !!googleDocsConfig.outputFolderId
      });
      
      googleDocsService = new GoogleDocsService(googleDocsConfig);
      console.log('✅ Google Docs service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Docs service:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      return NextResponse.json(
        { 
          error: 'Google Docs service initialization failed',
          domain: "protal.thesmartpro.io",
          details: error instanceof Error ? error.message : 'Unknown error',
          config: {
            hasTemplateId: !!process.env.GOOGLE_DOCS_TEMPLATE_ID,
            hasServiceAccount: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
            hasOutputFolder: !!process.env.GOOGLE_DRIVE_OUTPUT_FOLDER_ID,
            templateId: process.env.GOOGLE_DOCS_TEMPLATE_ID
          },
          debug: 'Check /api/debug/google-docs-config for configuration status',
          troubleshooting: [
            '1. Verify Google Service Account key is valid JSON',
            '2. Check that Google Docs API and Google Drive API are enabled',
            '3. Ensure template is shared with service account email',
            '4. Verify service account has proper permissions'
          ]
        },
        { status: 500 }
      );
    }

    // Generate contract using Google Docs
    let result;
    try {
      console.log('🔄 Starting contract generation with Google Docs...');
      console.log('📋 Contract data being sent:', {
        contract_id: googleDocsData.contract_id,
        contract_number: googleDocsData.contract_number,
        contract_type: googleDocsData.contract_type,
        promoter_name: googleDocsData.promoter_name_en,
        first_party_name: googleDocsData.first_party_name_en,
        second_party_name: googleDocsData.second_party_name_en
      });
      
      result = await googleDocsService.generateContract(googleDocsData);
      console.log('✅ Contract generation completed:', {
        documentId: result.documentId,
        documentUrl: result.documentUrl,
        pdfUrl: result.pdfUrl
      });
    } catch (error) {
      console.error('❌ Google Docs contract generation failed:', error);
      console.error('❌ Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      
      // Update contract status to failed
      try {
        await (supabase as any)
          .from('contracts')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            updated_at: new Date().toISOString(),
          })
          .eq('id', (contract as any)?.id);
        console.log('✅ Contract status updated to failed');
      } catch (updateError) {
        console.error('❌ Failed to update contract status:', updateError);
      }

      return NextResponse.json(
        { 
          error: 'Contract generation failed',
          details: error instanceof Error ? error.message : 'Unknown error',
          contract_id: (contract as any)?.id,
          contract_number: googleDocsData.contract_number,
          debug: 'Check /api/debug/google-docs-config for configuration status',
          troubleshooting: [
            '1. Check Google Docs template exists and is accessible',
            '2. Verify service account has permission to create documents',
            '3. Check Google Drive storage quota',
            '4. Verify template sharing permissions'
          ]
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
      domain: "protal.thesmartpro.io",
      data: {
        contract_id: (contract as any)?.id,
        contract_number: googleDocsData.contract_number,
        document_id: result.documentId,
        document_url: result.documentUrl,
        pdf_url: result.pdfUrl,
        generated_at: new Date().toISOString(),
      },
      warnings: missingData.length > 0 ? {
        fallback_data_used: true,
        missing_records: missingData,
        message: 'Some records were not found in database, fallback data was used'
      } : undefined
    });

  } catch (error) {
    console.error('❌ Contract generation failed (catch-all):', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'Contract generation failed',
        domain: "protal.thesmartpro.io",
        details: error instanceof Error ? error.message : 'Unknown error',
        error_type: error instanceof Error ? error.name : 'Unknown',
        debug: 'Check /api/debug/google-docs-config for configuration status',
        troubleshooting: [
          '1. Check server logs for detailed error information',
          '2. Verify all environment variables are set correctly',
          '3. Test Google Docs configuration with debug endpoint',
          '4. Check database connectivity and permissions'
        ]
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