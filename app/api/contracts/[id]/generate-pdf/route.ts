import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// Create Supabase service client
function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Make.com webhook URL from environment - support multiple env var names
const MAKE_WEBHOOK_URL = 
  process.env.MAKE_CONTRACT_PDF_WEBHOOK_URL || 
  process.env.MAKECOM_WEBHOOK_URL_EXTRA ||
  process.env.MAKECOM_WEBHOOK_URL;

// Interface is just for reference - actual contract data structure varies
interface ContractData {
  id: string;
  contract_number: string;
  contract_type: string;
  promoter_id: string | null;
  first_party_id: string | null;
  second_party_id: string | null;
  title: string; // Main title field in database
  description: string | null; // Description field
  terms: string | null; // Terms field
  basic_salary: number | null;
  value: number | null;
  total_value: number | null;
  start_date: string;
  end_date: string;
  notice_period: number | null;
  metadata: any; // JSONB field containing additional data
  
  // Joined promoter data
  promoters?: {
    name_en: string;
    name_ar: string;
    mobile_number: string | null;
    email: string | null;
    id_card_number: string | null;
    id_card_url: string | null;
    passport_url: string | null;
    passport_number: string | null;
  };
  
  // Joined party data
  first_party?: {
    name_en: string;
    name_ar: string;
    crn: string | null;
    logo_url: string | null;
  };
  
  second_party?: {
    name_en: string;
    name_ar: string;
    crn: string | null;
    logo_url: string | null;
  };
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contractId = params.id;

    // 1. Check authentication using server client (has cookies)
    const supabaseServer = await createServerClient();
    const { data: { user }, error: authError } = await supabaseServer.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Fetch complete contract data with relations using service client
    const supabase = createServiceClient();
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

    // 3. Validate required fields (relaxed validation)
    const missingFields: string[] = [];
    
    if (!contract.contract_number) missingFields.push('contract_number');
    if (!contract.start_date) missingFields.push('start_date');
    if (!contract.end_date) missingFields.push('end_date');

    // Only validate promoter data if promoter exists
    if (contract.promoters) {
      if (!contract.promoters.name_en && !contract.promoters.name_ar) {
        missingFields.push('promoter name (at least one language)');
      }
    } else {
      console.warn('⚠️ No promoter data found for contract');
    }

    // Only validate party data if parties exist
    if (contract.first_party) {
      if (!contract.first_party.name_en && !contract.first_party.name_ar) {
        missingFields.push('first party name (at least one language)');
      }
    } else {
      console.warn('⚠️ No first party data found for contract');
    }

    if (contract.second_party) {
      if (!contract.second_party.name_en && !contract.second_party.name_ar) {
        missingFields.push('second party name (at least one language)');
      }
    } else {
      console.warn('⚠️ No second party data found for contract');
    }

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields);
      return NextResponse.json(
        {
          error: 'Missing required fields',
          details: `The following fields are required for PDF generation: ${missingFields.join(', ')}`,
          missingFields,
        },
        { status: 400 }
      );
    }

    // 4. Verify image URLs are accessible (skip if not provided)
    const imageUrls = [
      contract.promoters?.id_card_url,
      contract.promoters?.passport_url,
    ].filter(url => url && !url.includes('NO_PASSPORT') && !url.includes('NO_ID_CARD'));

    console.log(`🔍 Checking ${imageUrls.length} image URLs for accessibility...`);

    for (const url of imageUrls) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(url as string, { 
          method: 'HEAD', 
          signal: controller.signal 
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          console.warn(`⚠️ Image not accessible (${response.status}): ${url}`);
          // Don't fail - just log warning
        } else {
          console.log(`✅ Image accessible: ${url}`);
        }
      } catch (error) {
        console.warn(`⚠️ Image URL check failed for ${url}:`, error);
        // Don't fail - just log warning
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

    // 6. Prepare payload for Make.com webhook (with safe access to nested data)
    const webhookPayload: any = {
      contract_id: contract.id,
      contract_number: contract.contract_number,
      contract_type: contract.contract_type || 'employment_contract',
      
      // Contract details - use correct column names from database
      job_title: contract.title || 'Employment Contract', // 'title' column, not 'job_title'
      department: contract.metadata?.department,
      work_location: contract.metadata?.work_location,
      basic_salary: contract.basic_salary || contract.value || contract.total_value,
      contract_start_date: contract.start_date,
      contract_end_date: contract.end_date,
      special_terms: contract.description || contract.terms,
      
      // Employment terms (from metadata)
      probation_period: contract.metadata?.probation_period,
      notice_period: contract.notice_period || contract.metadata?.notice_period,
      working_hours: contract.metadata?.working_hours,
      housing_allowance: contract.metadata?.housing_allowance,
      transport_allowance: contract.metadata?.transport_allowance,
    };

    // Add promoter information if available
    if (contract.promoters) {
      webhookPayload.promoter_id = contract.promoter_id;
      webhookPayload.promoter_name_en = contract.promoters.name_en;
      webhookPayload.promoter_name_ar = contract.promoters.name_ar;
      webhookPayload.promoter_mobile_number = contract.promoters.mobile_number;
      webhookPayload.promoter_email = contract.promoters.email;
      webhookPayload.promoter_id_card_number = contract.promoters.id_card_number;
      webhookPayload.id_card_number = contract.promoters.id_card_number;
      webhookPayload.passport_number = contract.promoters.passport_number;
      
      // Only add image URLs if they're valid (not placeholders)
      if (contract.promoters.id_card_url && !contract.promoters.id_card_url.includes('NO_ID_CARD')) {
        webhookPayload.promoter_id_card_url = contract.promoters.id_card_url;
        webhookPayload.id_card_url = contract.promoters.id_card_url;
      }
      if (contract.promoters.passport_url && !contract.promoters.passport_url.includes('NO_PASSPORT')) {
        webhookPayload.promoter_passport_url = contract.promoters.passport_url;
        webhookPayload.passport_url = contract.promoters.passport_url;
      }
    }
    
    // Add first party information if available
    if (contract.first_party) {
      webhookPayload.first_party_id = contract.first_party_id;
      webhookPayload.first_party_name_en = contract.first_party.name_en;
      webhookPayload.first_party_name_ar = contract.first_party.name_ar;
      webhookPayload.first_party_crn = contract.first_party.crn;
      if (contract.first_party.logo_url) {
        webhookPayload.first_party_logo = contract.first_party.logo_url;
        webhookPayload.first_party_logo_url = contract.first_party.logo_url;
      }
    }
    
    // Add second party information if available
    if (contract.second_party) {
      webhookPayload.second_party_id = contract.second_party_id;
      webhookPayload.second_party_name_en = contract.second_party.name_en;
      webhookPayload.second_party_name_ar = contract.second_party.name_ar;
      webhookPayload.second_party_crn = contract.second_party.crn;
      if (contract.second_party.logo_url) {
        webhookPayload.second_party_logo = contract.second_party.logo_url;
        webhookPayload.second_party_logo_url = contract.second_party.logo_url;
      }
    }

    // Add supplier/brand information if available
    if (supplierBrandData) {
      webhookPayload.supplier_brand_name_en = supplierBrandData.name_en;
      webhookPayload.supplier_brand_name_ar = supplierBrandData.name_ar;
    } else if (contract.metadata?.supplier_brand_name_en) {
      webhookPayload.supplier_brand_name_en = contract.metadata.supplier_brand_name_en;
      webhookPayload.supplier_brand_name_ar = contract.metadata.supplier_brand_name_ar;
    }

    console.log('📤 Prepared webhook payload with keys:', Object.keys(webhookPayload));

    // 7. Call Make.com webhook
    if (!MAKE_WEBHOOK_URL) {
      console.error('❌ Make.com webhook URL not configured');
      throw new Error('Make.com webhook URL not configured. Please set MAKECOM_WEBHOOK_URL_EXTRA environment variable.');
    }

    console.log('📤 Calling Make.com webhook:', MAKE_WEBHOOK_URL);

    const webhookResponse = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.MAKE_WEBHOOK_SECRET || '',
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
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    // Get contract ID from params or from earlier
    const errorContractId = params?.id;

    // Try to update contract status
    if (errorContractId) {
      try {
        const supabase = createServiceClient();
        await supabase
          .from('contracts')
          .update({
            pdf_status: 'error',
            pdf_error_message: error instanceof Error ? error.message : 'Unknown error',
          })
          .eq('id', errorContractId);
      } catch (updateError) {
        console.error('Failed to update error status:', updateError);
      }
    }

    return NextResponse.json(
      {
        error: 'PDF generation failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
