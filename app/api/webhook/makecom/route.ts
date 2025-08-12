import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getEnhancedContractTypeConfig } from '@/lib/contract-type-config';

import { verifyWebhook } from '@/lib/webhooks/verify';

export async function POST(request: NextRequest) {
  try {
    console.log('🔗 Make.com webhook received');

    const rawBody = await request.text();

    const verification = await verifyWebhook({
      rawBody,
      signature: request.headers.get('x-signature') || '',
      timestamp: request.headers.get('x-timestamp') || '',
      idempotencyKey: request.headers.get('x-idempotency-key') || '',
      secret: process.env.MAKE_WEBHOOK_SECRET || '',
    });

    if (!verification.verified) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    if (verification.idempotent) {
      return NextResponse.json({ success: true, message: 'Already processed' });
    }

    const body = verification.payload;

    console.log('📤 Webhook payload:', body);

    // Validate required fields
    const { contract_id, contract_number, contract_type } = body;

    if (!contract_id && !contract_number) {
      return NextResponse.json(
        {
          success: false,
          error: 'contract_id or contract_number is required',
        },
        { status: 400 }
      );
    }

    if (!contract_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'contract_type is required',
        },
        { status: 400 }
      );
    }

    // Get contract type configuration
    const contractTypeConfig = getEnhancedContractTypeConfig(contract_type);
    if (!contractTypeConfig) {
      return NextResponse.json(
        {
          success: false,
          error: `Contract type '${contract_type}' not found`,
        },
        { status: 400 }
      );
    }

    // Fetch contract with all related data
    const supabase = await createClient();
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        `
        *,
        first_party:parties!first_party_id(
          id, name_en, name_ar, crn, address_en, address_ar, 
          contact_person, contact_email, contact_phone, type
        ),
        second_party:parties!second_party_id(
          id, name_en, name_ar, crn, address_en, address_ar,
          contact_person, contact_email, contact_phone, type
        ),
        promoter:promoters(
          id, name_en, name_ar, id_card_number, mobile_number, 
          id_card_url, passport_url, status
        )
      `
      )
      .eq('id', contract_id)
      .single();

    if (contractError || !contract) {
      console.error('❌ Contract fetch error:', contractError);
      return NextResponse.json(
        {
          success: false,
          error: 'Contract not found',
        },
        { status: 404 }
      );
    }

    console.log('📋 Contract data fetched:', {
      id: contract.id,
      number: contract.contract_number,
      type: contract.contract_type,
      hasFirstParty: !!contract.first_party,
      hasSecondParty: !!contract.second_party,
      hasPromoter: !!contract.promoter,
    });

    // Prepare clean, template-ready data
    const templateData = {
      // Contract information
      contract_number: contract.contract_number || '',
      contract_type: contract.contract_type || '',
      contract_date: new Date().toLocaleDateString('en-GB'), // DD/MM/YYYY format

      // First party (Client) information
      first_party_name_en: contract.first_party?.name_en || '',
      first_party_name_ar: contract.first_party?.name_ar || '',
      first_party_crn: contract.first_party?.crn || '',
      first_party_address_en: contract.first_party?.address_en || '',
      first_party_address_ar: contract.first_party?.address_ar || '',
      first_party_contact_person: contract.first_party?.contact_person || '',
      first_party_contact_email: contract.first_party?.contact_email || '',
      first_party_contact_phone: contract.first_party?.contact_phone || '',

      // Second party (Employer) information
      second_party_name_en: contract.second_party?.name_en || '',
      second_party_name_ar: contract.second_party?.name_ar || '',
      second_party_crn: contract.second_party?.crn || '',
      second_party_address_en: contract.second_party?.address_en || '',
      second_party_address_ar: contract.second_party?.address_ar || '',
      second_party_contact_person: contract.second_party?.contact_person || '',
      second_party_contact_email: contract.second_party?.contact_email || '',
      second_party_contact_phone: contract.second_party?.contact_phone || '',

      // Promoter information
      promoter_name_en: contract.promoter?.name_en || '',
      promoter_name_ar: contract.promoter?.name_ar || '',
      promoter_id_card_number: contract.promoter?.id_card_number || '',
      promoter_mobile_number: contract.promoter?.mobile_number || '',
      promoter_email: '', // Email field not available in promoters table
      promoter_id_card_url: contract.promoter?.id_card_url || '',
      promoter_passport_url: contract.promoter?.passport_url || '',

      // Contract details
      job_title: contract.job_title || '',
      work_location: contract.work_location || '',
      department: contract.department || '',
      email: contract.email || '',
      contract_start_date: contract.contract_start_date
        ? new Date(contract.contract_start_date).toLocaleDateString('en-GB')
        : '',
      contract_end_date: contract.contract_end_date
        ? new Date(contract.contract_end_date).toLocaleDateString('en-GB')
        : '',
      basic_salary: contract.basic_salary || 0,
      allowances: contract.allowances || 0,
      currency: contract.currency || 'OMR',
      special_terms: contract.special_terms || '',

      // Calculated fields
      total_salary: (contract.basic_salary || 0) + (contract.allowances || 0),
      contract_duration_days:
        contract.contract_start_date && contract.contract_end_date
          ? Math.ceil(
              (new Date(contract.contract_end_date).getTime() -
                new Date(contract.contract_start_date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,

      // Template configuration
      template_id: contractTypeConfig.googleDocsTemplateId,
      makecom_template_id: contractTypeConfig.makecomTemplateId,

      // Status and metadata
      status: contract.status || 'draft',
      created_at: contract.created_at || new Date().toISOString(),
      updated_at: contract.updated_at || new Date().toISOString(),
    };

    // Clean up text fields for template compatibility
    const cleanedData = {
      ...templateData,
      // Remove special characters and clean text fields
      contract_number: templateData.contract_number.replace(/[^A-Z0-9-]/g, ''),
      first_party_name_en: templateData.first_party_name_en.trim(),
      first_party_name_ar: templateData.first_party_name_ar.trim(),
      second_party_name_en: templateData.second_party_name_en.trim(),
      second_party_name_ar: templateData.second_party_name_ar.trim(),
      promoter_name_en: templateData.promoter_name_en.trim(),
      promoter_name_ar: templateData.promoter_name_ar.trim(),
      job_title: templateData.job_title.trim(),
      work_location: templateData.work_location.trim(),
      department: templateData.department.trim(),
      special_terms: templateData.special_terms.trim(),
    };

    console.log('✅ Template data prepared:', {
      contract_number: cleanedData.contract_number,
      promoter_name: cleanedData.promoter_name_en,
      first_party: cleanedData.first_party_name_en,
      second_party: cleanedData.second_party_name_en,
      job_title: cleanedData.job_title,
      template_id: cleanedData.template_id,
    });

    // Record successful processing
    await supabase.from('tracking_events').insert({
      actor_user_id: null,
      subject_type: 'webhook',
      subject_id: contract_id,
      event_type: 'webhook_processed',
      metadata: { webhook_type: 'makecom' },
      idempotency_key: request.headers.get('x-idempotency-key') || '',
    });

    // Return the cleaned data for Make.com to use with Google Docs templates
    return NextResponse.json({
      success: true,
      message: 'Contract data prepared for Google Docs template',
      data: cleanedData,
      template_config: {
        id: contractTypeConfig.id,
        name: contractTypeConfig.name,
        google_docs_template_id: contractTypeConfig.googleDocsTemplateId,
        makecom_template_id: contractTypeConfig.makecomTemplateId,
        category: contractTypeConfig.category,
        description: contractTypeConfig.description,
      },
    });
  } catch (error) {
    console.error('❌ Make.com webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    success: true,
    message: 'Make.com webhook endpoint is active',
    timestamp: new Date().toISOString(),
    supported_contract_types: [
      'oman-unlimited-contract',
      'oman-limited-contract',
      'oman-part-time-contract',
      'oman-fixed-term-contract',
      'oman-project-based-contract',
      'oman-consulting-contract',
      'oman-freelance-contract',
      'oman-partnership-contract',
      'oman-nda-contract',
    ],
  });
}
