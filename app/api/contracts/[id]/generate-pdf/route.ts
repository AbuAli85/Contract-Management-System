import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Make.com webhook URL from environment
const MAKE_WEBHOOK_URL = process.env.MAKE_CONTRACT_PDF_WEBHOOK_URL;

interface ContractData {
  id: string;
  contract_number: string;
  contract_type: string;
  promoter_id: string;
  first_party_id: string;
  second_party_id: string;
  job_title: string | null;
  department: string | null;
  work_location: string | null;
  basic_salary: number | null;
  start_date: string;
  end_date: string;
  special_terms: string | null;
  
  // Promoter data (from join)
  promoter_name_en: string;
  promoter_name_ar: string;
  promoter_mobile_number: string;
  promoter_email: string;
  promoter_id_card_number: string;
  promoter_id_card_url: string | null;
  promoter_passport_url: string | null;
  passport_number: string | null;
  
  // Party data (from join)
  first_party_name_en: string;
  first_party_name_ar: string;
  first_party_crn: string | null;
  first_party_logo: string | null;
  
  second_party_name_en: string;
  second_party_name_ar: string;
  second_party_crn: string | null;
  second_party_logo: string | null;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const contractId = params.id;

    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Fetch complete contract data with relations
    const { data: contract, error: fetchError } = await supabase
      .from('contracts')
      .select(`
        *,
        promoters:promoter_id (
          name_en,
          name_ar,
          mobile_number,
          email,
          id_card_number,
          id_card_url,
          passport_url,
          passport_number
        ),
        first_party:first_party_id (
          name_en,
          name_ar,
          crn,
          logo_url
        ),
        second_party:second_party_id (
          name_en,
          name_ar,
          crn,
          logo_url
        )
      `)
      .eq('id', contractId)
      .single();

    if (fetchError || !contract) {
      console.error('Contract fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    // 3. Validate required fields
    const missingFields: string[] = [];
    
    if (!contract.contract_number) missingFields.push('contract_number');
    if (!contract.promoters) missingFields.push('promoter');
    if (!contract.first_party) missingFields.push('first_party (employer)');
    if (!contract.second_party) missingFields.push('second_party (client)');
    if (!contract.start_date) missingFields.push('start_date');
    if (!contract.end_date) missingFields.push('end_date');

    // Validate promoter data
    if (contract.promoters) {
      if (!contract.promoters.name_en) missingFields.push('promoter name (English)');
      if (!contract.promoters.name_ar) missingFields.push('promoter name (Arabic)');
      if (!contract.promoters.id_card_number) missingFields.push('promoter ID card number');
      if (!contract.promoters.id_card_url) missingFields.push('promoter ID card image');
      if (!contract.promoters.passport_url) missingFields.push('promoter passport image');
    }

    // Validate party data
    if (contract.first_party) {
      if (!contract.first_party.name_en) missingFields.push('first party name (English)');
      if (!contract.first_party.name_ar) missingFields.push('first party name (Arabic)');
    }

    if (contract.second_party) {
      if (!contract.second_party.name_en) missingFields.push('second party name (English)');
      if (!contract.second_party.name_ar) missingFields.push('second party name (Arabic)');
    }

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: `The following fields are required for PDF generation: ${missingFields.join(', ')}`,
          missingFields,
        },
        { status: 400 }
      );
    }

    // 4. Verify image URLs are accessible
    const imageUrls = [
      contract.promoters.id_card_url,
      contract.promoters.passport_url,
    ].filter(Boolean);

    for (const url of imageUrls) {
      try {
        const response = await fetch(url as string, { method: 'HEAD' });
        if (!response.ok) {
          return NextResponse.json(
            { error: `Image not accessible: ${url}` },
            { status: 400 }
          );
        }
      } catch (error) {
        console.error(`Image URL check failed for ${url}:`, error);
        return NextResponse.json(
          { error: `Cannot access image: ${url}` },
          { status: 400 }
        );
      }
    }

    // 5. Update contract status to 'generating'
    await supabase
      .from('contracts')
      .update({
        pdf_status: 'generating',
        pdf_error_message: null,
      })
      .eq('id', contractId);

    // Extract supplier/brand info from metadata
    const supplierBrandId = contract.metadata?.supplier_brand_id;
    let supplierBrandData = null;

    if (supplierBrandId) {
      const { data: supplier } = await supabase
        .from('parties')
        .select('name_en, name_ar')
        .eq('id', supplierBrandId)
        .single();
      supplierBrandData = supplier;
    }

    // 6. Prepare payload for Make.com webhook
    const webhookPayload = {
      contract_id: contract.id,
      contract_number: contract.contract_number,
      contract_type: contract.contract_type,
      
      // Promoter information
      promoter_id: contract.promoter_id,
      promoter_name_en: contract.promoters.name_en,
      promoter_name_ar: contract.promoters.name_ar,
      promoter_mobile_number: contract.promoters.mobile_number,
      promoter_email: contract.promoters.email,
      promoter_id_card_number: contract.promoters.id_card_number,
      promoter_id_card_url: contract.promoters.id_card_url,
      promoter_passport_url: contract.promoters.passport_url,
      passport_number: contract.promoters.passport_number,
      
      // Party information
      first_party_id: contract.first_party_id,
      first_party_name_en: contract.first_party.name_en,
      first_party_name_ar: contract.first_party.name_ar,
      first_party_crn: contract.first_party.crn,
      first_party_logo: contract.first_party.logo_url,
      
      second_party_id: contract.second_party_id,
      second_party_name_en: contract.second_party.name_en,
      second_party_name_ar: contract.second_party.name_ar,
      second_party_crn: contract.second_party.crn,
      second_party_logo: contract.second_party.logo_url,
      
      // Supplier/Brand information (from parties, shows only names)
      supplier_brand_name_en: supplierBrandData?.name_en || contract.metadata?.supplier_brand_name_en,
      supplier_brand_name_ar: supplierBrandData?.name_ar || contract.metadata?.supplier_brand_name_ar,
      
      // Contract details
      job_title: contract.job_title,
      department: contract.department,
      work_location: contract.work_location,
      basic_salary: contract.basic_salary,
      contract_start_date: contract.start_date,
      contract_end_date: contract.end_date,
      special_terms: contract.special_terms,
      
      // Employment terms (from metadata)
      probation_period: contract.metadata?.probation_period,
      notice_period: contract.metadata?.notice_period,
      working_hours: contract.metadata?.working_hours,
      housing_allowance: contract.metadata?.housing_allowance,
      transport_allowance: contract.metadata?.transport_allowance,
    };

    // 7. Call Make.com webhook
    if (!MAKE_WEBHOOK_URL) {
      throw new Error('MAKE_CONTRACT_PDF_WEBHOOK_URL environment variable is not set');
    }

    const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      console.error('Make.com webhook error:', errorText);
      
      // Update contract with error status
      await supabase
        .from('contracts')
        .update({
          pdf_status: 'error',
          pdf_error_message: 'Failed to trigger PDF generation workflow',
        })
        .eq('id', contractId);

      throw new Error(`Webhook failed: ${webhookResponse.statusText}`);
    }

    // 8. Return success response
    return NextResponse.json({
      success: true,
      status: 'generating',
      message: 'PDF generation started successfully',
      contractId: contract.id,
      contractNumber: contract.contract_number,
    });

  } catch (error) {
    console.error('PDF generation error:', error);

    // Try to update contract status
    try {
      const supabase = await createClient();
      await supabase
        .from('contracts')
        .update({
          pdf_status: 'error',
          pdf_error_message: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', params.id);
    } catch (updateError) {
      console.error('Failed to update error status:', updateError);
    }

    return NextResponse.json(
      {
        error: 'PDF generation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
