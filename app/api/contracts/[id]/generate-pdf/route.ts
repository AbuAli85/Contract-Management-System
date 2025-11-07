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

// Make.com webhook URLs from environment - support multiple contract types
const MAKE_WEBHOOK_URL_SHARAF_DG = process.env.MAKECOM_WEBHOOK_URL_SHARAF_DG;
const MAKE_WEBHOOK_URL_EXTRA = process.env.MAKECOM_WEBHOOK_URL_EXTRA;
const MAKE_WEBHOOK_URL_GENERAL = process.env.MAKECOM_WEBHOOK_URL_GENERAL;
const MAKE_WEBHOOK_URL_LEGACY = 
  process.env.MAKE_CONTRACT_PDF_WEBHOOK_URL || 
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
    
    // Try to fetch with first_party_id/second_party_id, fallback to employer_id/client_id
    let { data: contract, error: fetchError } = await supabase
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
        ),
        employer:employer_id (
          name_en,
          name_ar,
          crn,
          logo_url
        ),
        client:client_id (
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
      console.error('Contract ID:', contractId);
      return NextResponse.json(
        { 
          error: 'Contract not found',
          details: fetchError?.message || 'No contract found with the provided ID',
          contractId 
        },
        { status: 404 }
      );
    }

    // Handle promoters - can be array or object depending on query
    let promoterData = null;
    if (Array.isArray(contract.promoters)) {
      promoterData = contract.promoters[0] || null;
    } else {
      promoterData = contract.promoters || null;
    }
    
    // If promoter data is missing but promoter_id exists, try to fetch it separately
    if (!promoterData && contract.promoter_id) {
      console.warn('⚠️ Promoter data not returned in query, fetching separately...');
      const { data: promoter, error: promoterError } = await supabase
        .from('promoters')
        .select('name_en, name_ar, mobile_number, email, id_card_number, id_card_url, passport_url, passport_number')
        .eq('id', contract.promoter_id)
        .single();
      
      if (promoterError) {
        console.error('Failed to fetch promoter separately:', promoterError);
      } else if (promoter) {
        promoterData = promoter;
        console.log('✅ Successfully fetched promoter data separately');
      }
    }
    
    contract.promoters = promoterData;

    // Log contract data for debugging (without sensitive info)
    console.log('📋 Contract data fetched:', {
      id: contract.id,
      contract_number: contract.contract_number,
      promoter_id: contract.promoter_id,
      first_party_id: contract.first_party_id,
      second_party_id: contract.second_party_id,
      employer_id: contract.employer_id,
      client_id: contract.client_id,
      has_promoter: !!contract.promoters,
      promoter_passport_number: contract.promoters?.passport_number,
      has_first_party: !!contract.first_party,
      has_second_party: !!contract.second_party,
      has_employer: !!contract.employer,
      has_client: !!contract.client,
    });

    // Use employer/client as fallback if first_party/second_party don't exist
    if (!contract.first_party && contract.employer) {
      contract.first_party = contract.employer;
      contract.first_party_id = contract.employer_id;
    }
    if (!contract.second_party && contract.client) {
      contract.second_party = contract.client;
      contract.second_party_id = contract.client_id;
    }

    // 3. Validate required fields (relaxed validation)
    const missingFields: string[] = [];
    
    if (!contract.contract_number) missingFields.push('contract_number');
    if (!contract.start_date) missingFields.push('start_date');
    if (!contract.end_date) missingFields.push('end_date');

    // Validate promoter data
    if (contract.promoter_id && !contract.promoters) {
      // Promoter ID exists but promoter data couldn't be fetched
      console.error('❌ Promoter ID exists but promoter data is missing:', contract.promoter_id);
      missingFields.push('promoter data (promoter not found in database)');
    } else if (contract.promoters) {
      // Promoter data exists, validate it
      if (!contract.promoters.name_en && !contract.promoters.name_ar) {
        missingFields.push('promoter name (at least one language)');
      }
      
      // Validate that promoter images are NOT placeholders
      // ID card is required for PDF generation
      if (contract.promoters.id_card_url) {
        if (contract.promoters.id_card_url.includes('NO_ID_CARD') || 
            contract.promoters.id_card_url.toLowerCase().includes('placeholder')) {
          missingFields.push('valid ID card image (current image is a placeholder)');
        }
      } else {
        missingFields.push('ID card image');
      }
      
      // Passport image is optional - warn but don't block if placeholder
      // The webhook will handle missing/placeholder passport images gracefully
      if (!contract.promoters.passport_url) {
        console.warn('⚠️ No passport image provided - PDF will be generated without passport image');
      } else if (contract.promoters.passport_url.includes('NO_PASSPORT') || 
                 contract.promoters.passport_url.toLowerCase().includes('placeholder')) {
        console.warn('⚠️ Passport image is a placeholder - PDF will be generated without passport image');
        // Don't block PDF generation for placeholder passport images
      }
      
      // Passport number is optional - warn but don't block
      // Only require it if passport image is provided and valid
      if (!contract.promoters.passport_number) {
        const hasValidPassportImage = contract.promoters.passport_url && 
          !contract.promoters.passport_url.includes('NO_PASSPORT') &&
          !contract.promoters.passport_url.toLowerCase().includes('placeholder');
        
        if (hasValidPassportImage) {
          console.warn('⚠️ Passport number missing but passport image is provided');
          // Only warn, don't block - the PDF can still be generated
        } else {
          console.warn('⚠️ No passport number provided - PDF will be generated without passport number');
        }
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
      console.error('❌ Missing required fields:', missingFields);
      console.error('📋 Contract state:', {
        contract_number: contract.contract_number,
        start_date: contract.start_date,
        end_date: contract.end_date,
        has_promoter: !!contract.promoters,
        promoter_name_en: contract.promoters?.name_en,
        promoter_name_ar: contract.promoters?.name_ar,
        promoter_id_card_url: contract.promoters?.id_card_url,
        promoter_passport_url: contract.promoters?.passport_url,
        promoter_passport_number: contract.promoters?.passport_number,
        has_first_party: !!contract.first_party,
        has_second_party: !!contract.second_party,
      });
      
      return NextResponse.json(
        {
          error: 'Missing required fields for PDF generation',
          message: `The following fields are required: ${missingFields.join(', ')}`,
          details: `Please ensure all required contract information is complete before generating the PDF. Missing: ${missingFields.join('; ')}`,
          missingFields,
          contractId: contract.id,
          contractNumber: contract.contract_number,
        },
        { status: 400 }
      );
    }

    // 4. Verify image URLs are accessible (skip if not provided or placeholders)
    const imageUrls = [
      contract.promoters?.id_card_url,
      contract.promoters?.passport_url,
    ].filter(url => 
      url && 
      !url.includes('NO_PASSPORT') && 
      !url.includes('NO_ID_CARD') &&
      !url.toLowerCase().includes('placeholder')
    );

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

    // 5. Update contract status to 'generating' (using notes since pdf_status doesn't exist)
    await supabase
      .from('contracts')
      .update({
        notes: `PDF generation started at ${new Date().toISOString()}`,
        updated_at: new Date().toISOString(),
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
      webhookPayload.promoter_passport_number = contract.promoters.passport_number;
      // Aliases for Make.com template compatibility
      webhookPayload.id_card_number = contract.promoters.id_card_number;
      webhookPayload.passport_number = contract.promoters.passport_number;
      webhookPayload.employee_name_en = contract.promoters.name_en;
      webhookPayload.employee_name_ar = contract.promoters.name_ar;
      
      // Only add image URLs if they're valid (not placeholders)
      // Check for both specific placeholders (NO_ID_CARD, NO_PASSPORT) and generic "placeholder"
      const isValidIdCardUrl = contract.promoters.id_card_url && 
        !contract.promoters.id_card_url.includes('NO_ID_CARD') &&
        !contract.promoters.id_card_url.toLowerCase().includes('placeholder');
      
      const isValidPassportUrl = contract.promoters.passport_url && 
        !contract.promoters.passport_url.includes('NO_PASSPORT') &&
        !contract.promoters.passport_url.toLowerCase().includes('placeholder');
      
      if (isValidIdCardUrl) {
        webhookPayload.promoter_id_card_url = contract.promoters.id_card_url;
        webhookPayload.id_card_url = contract.promoters.id_card_url;
      } else {
        console.warn('⚠️ Skipping ID card URL - placeholder or invalid:', contract.promoters.id_card_url);
      }
      
      if (isValidPassportUrl) {
        webhookPayload.promoter_passport_url = contract.promoters.passport_url;
        webhookPayload.passport_url = contract.promoters.passport_url;
      } else {
        console.warn('⚠️ Skipping passport URL - placeholder or invalid:', contract.promoters.passport_url);
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
    console.log('📤 Image URLs being sent to Make.com:', {
      id_card: webhookPayload.promoter_id_card_url || '(not included - placeholder or missing)',
      passport: webhookPayload.promoter_passport_url || '(not included - placeholder or missing)',
    });

    // 7. Determine which webhook URL to use based on contract type
    // Check if this is a Sharaf DG contract
    let termsData: any = null;
    if (contract.terms && typeof contract.terms === 'string') {
      try {
        termsData = JSON.parse(contract.terms);
      } catch {
        // If parsing fails, treat as plain string
        termsData = contract.terms;
      }
    }

    const isSharafDG = 
      contract.contract_type?.toLowerCase().includes('sharaf') ||
      contract.contract_type?.toLowerCase().includes('deployment') ||
      contract.title?.toLowerCase().includes('sharaf') ||
      contract.title?.toLowerCase().includes('deployment') ||
      contract.description?.toLowerCase().includes('sharaf') ||
      (contract.terms && typeof contract.terms === 'string' && contract.terms.toLowerCase().includes('sharaf-dg')) ||
      (termsData && typeof termsData === 'object' && termsData.contract_subtype === 'sharaf-dg-deployment') ||
      (contract.metadata && typeof contract.metadata === 'object' && 
       (contract.metadata.contract_subtype === 'sharaf-dg-deployment' || 
        JSON.stringify(contract.metadata).toLowerCase().includes('sharaf')));

    console.log('🔍 Contract type detection:', {
      contract_type: contract.contract_type,
      title: contract.title,
      description: contract.description,
      terms_subtype: termsData?.contract_subtype,
      isSharafDG,
    });

    let webhookUrl: string | undefined = undefined;
    let usedEnvVar: string = '';

    if (isSharafDG && MAKE_WEBHOOK_URL_SHARAF_DG) {
      webhookUrl = MAKE_WEBHOOK_URL_SHARAF_DG;
      usedEnvVar = 'MAKECOM_WEBHOOK_URL_SHARAF_DG';
      console.log('🎯 Detected Sharaf DG contract - using Sharaf DG webhook');
    } else if (MAKE_WEBHOOK_URL_EXTRA) {
      webhookUrl = MAKE_WEBHOOK_URL_EXTRA;
      usedEnvVar = 'MAKECOM_WEBHOOK_URL_EXTRA';
      console.log('📋 Using eXtra contracts webhook');
    } else if (MAKE_WEBHOOK_URL_GENERAL) {
      webhookUrl = MAKE_WEBHOOK_URL_GENERAL;
      usedEnvVar = 'MAKECOM_WEBHOOK_URL_GENERAL';
      console.log('📄 Using general contracts webhook');
    } else if (MAKE_WEBHOOK_URL_LEGACY) {
      webhookUrl = MAKE_WEBHOOK_URL_LEGACY;
      usedEnvVar = process.env.MAKE_CONTRACT_PDF_WEBHOOK_URL ? 'MAKE_CONTRACT_PDF_WEBHOOK_URL' : 'MAKECOM_WEBHOOK_URL';
      console.log('🔄 Using legacy webhook URL');
    }

    if (!webhookUrl) {
      console.error('❌ Make.com webhook URL not configured');
      const requiredVars = isSharafDG 
        ? ['MAKECOM_WEBHOOK_URL_SHARAF_DG']
        : ['MAKECOM_WEBHOOK_URL_EXTRA', 'MAKECOM_WEBHOOK_URL_GENERAL', 'MAKE_CONTRACT_PDF_WEBHOOK_URL', 'MAKECOM_WEBHOOK_URL'];
      
      throw new Error(
        `Make.com webhook URL not configured. ` +
        `For ${isSharafDG ? 'Sharaf DG' : 'this contract type'}, please set: ${requiredVars.join(' or ')}`
      );
    }

    console.log('📤 Using webhook URL from environment variable:', usedEnvVar);
    console.log('📤 Webhook URL (full):', webhookUrl);
    console.log('📤 Webhook URL (masked):', webhookUrl.substring(0, 30) + '...' + webhookUrl.substring(webhookUrl.length - 10));
    console.log('📤 Webhook URL length:', webhookUrl.length);
    console.log('📤 Available webhook URLs:', {
      SHARAF_DG: MAKE_WEBHOOK_URL_SHARAF_DG ? '✅ Set' : '❌ Not set',
      EXTRA: MAKE_WEBHOOK_URL_EXTRA ? '✅ Set' : '❌ Not set',
      GENERAL: MAKE_WEBHOOK_URL_GENERAL ? '✅ Set' : '❌ Not set',
      LEGACY: MAKE_WEBHOOK_URL_LEGACY ? '✅ Set' : '❌ Not set',
    });

    // Validate webhook URL format before calling
    if (!webhookUrl.startsWith('https://hook.eu2.make.com/') && 
        !webhookUrl.startsWith('https://hook.make.com/') &&
        !webhookUrl.startsWith('https://hook.us1.make.com/')) {
      console.warn('⚠️ Webhook URL format may be incorrect:', webhookUrl.substring(0, 50));
    }

    console.log('📤 Sending payload to Make.com webhook...');
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': process.env.MAKE_WEBHOOK_SECRET || '',
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      const errorText = await webhookResponse.text();
      let errorMessage = `Webhook failed with status ${webhookResponse.status}`;
      
      // Parse error response if it's JSON
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.message || errorJson.error || errorMessage;
        console.error('Make.com webhook error (parsed):', errorJson);
      } catch {
        console.error('Make.com webhook error (raw):', errorText);
        errorMessage = errorText || errorMessage;
      }
      
      // Provide specific guidance for 404 errors
      if (webhookResponse.status === 404) {
        const maskedUrl = webhookUrl 
          ? `${webhookUrl.substring(0, 30)}...${webhookUrl.substring(webhookUrl.length - 10)}`
          : 'not configured';
        errorMessage = `Make.com webhook not found (404). The webhook endpoint does not exist or the URL is incorrect.`;
        console.error('❌ Webhook URL returned 404:', maskedUrl);
        console.error('❌ Please verify:');
        console.error('   1. The webhook URL is correct in Make.com');
        console.error('   2. The Make.com scenario is active and running');
        console.error('   3. The webhook trigger module is enabled');
        console.error('   4. The environment variable', usedEnvVar, 'contains the correct URL');
      }
      
      console.error('Webhook response status:', webhookResponse.status);
      console.error('Webhook response headers:', Object.fromEntries(webhookResponse.headers.entries()));
      
      // Update contract with error status (using notes since pdf_status doesn't exist)
      await supabase
        .from('contracts')
        .update({
          notes: `PDF generation failed at ${new Date().toISOString()}: ${errorMessage}`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contractId);

      return NextResponse.json(
        {
          error: 'PDF generation failed',
          message: errorMessage,
          statusCode: webhookResponse.status,
          details: webhookResponse.status === 404 
            ? 'The Make.com webhook URL appears to be incorrect or the webhook endpoint does not exist. Please check your environment variables (MAKE_CONTRACT_PDF_WEBHOOK_URL, MAKECOM_WEBHOOK_URL_EXTRA, or MAKECOM_WEBHOOK_URL).'
            : 'Failed to trigger PDF generation workflow in Make.com',
        },
        { status: 500 }
      );
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

    // Try to update contract status (using notes since pdf_status doesn't exist)
    if (errorContractId) {
      try {
        const supabase = createServiceClient();
        await supabase
          .from('contracts')
          .update({
            notes: `PDF generation error at ${new Date().toISOString()}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            updated_at: new Date().toISOString(),
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
