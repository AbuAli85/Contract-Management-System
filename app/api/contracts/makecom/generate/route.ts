// app/api/contracts/makecom/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRBAC, withAnyRBAC } from '@/lib/rbac/guard';
import { createClient } from '@supabase/supabase-js';
import {
  generateContractWithMakecom,
  getEnhancedContractTypeConfig,
  getMakecomEnabledContractTypes,
} from '@/lib/contract-type-config';
import {
  getMakecomTemplateConfig,
  generateMakecomBlueprint,
} from '@/lib/makecom-template-config';

// Create Supabase client function to avoid build-time issues
function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// GET: List all Make.com enabled contract types
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const contractType = searchParams.get('type');

    if (action === 'types') {
      // Return all Make.com enabled contract types
      const makecomTypes = getMakecomEnabledContractTypes();
      return NextResponse.json({
        success: true,
        data: makecomTypes.map(type => ({
          id: type.id,
          name: type.name,
          description: type.description,
          category: type.category,
          makecomTemplateId: type.makecomTemplateId,
          requiredFields: type.validation.requiredFields,
          optionalFields: type.validation.optionalFields,
          fieldsCount: type.fields.length,
          isActive: type.isActive,
          requiresApproval: type.requiresApproval,
        })),
      });
    }

    if (action === 'template' && contractType) {
      // Return template configuration for a specific contract type
      const contractConfig = getEnhancedContractTypeConfig(contractType);
      const templateConfig = contractConfig?.makecomTemplateId
        ? getMakecomTemplateConfig(contractConfig.makecomTemplateId)
        : null;

      if (!templateConfig) {
        return NextResponse.json(
          {
            success: false,
            error: 'Template configuration not found',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          contractConfig,
          templateConfig,
          googleDocsTemplateId: templateConfig.googleDocsTemplateId,
          makecomModuleConfig: templateConfig.makecomModuleConfig,
        },
      });
    }

    if (action === 'blueprint' && contractType) {
      // Generate Make.com blueprint for a contract type
      const blueprint = generateMakecomBlueprint(contractType);

      if (!blueprint) {
        return NextResponse.json(
          {
            success: false,
            error: 'Blueprint generation failed',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: blueprint,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Invalid action parameter',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Make.com API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

// POST: Generate contract using Make.com templates
export const POST = withAnyRBAC(
  ['contract:message:own', 'contract:generate:own', 'contract:create:own'],
  async (request: NextRequest) => {
    try {
      const body = await request.json();
      const { contractType, contractData, triggerMakecom = true } = body;

      console.log('🔄 Make.com contract generation request:', {
        contractType,
        triggerMakecom,
        contractDataKeys: Object.keys(contractData),
        contractDataSample: {
          promoter_id: contractData.promoter_id,
          first_party_id: contractData.first_party_id,
          second_party_id: contractData.second_party_id,
          contract_type: contractData.contract_type,
          job_title: contractData.job_title,
          basic_salary: contractData.basic_salary,
        }
      });

      if (!contractType || !contractData) {
        console.error('❌ Missing required data:', { contractType, hasContractData: !!contractData });
        return NextResponse.json(
          {
            success: false,
            error: 'Contract type and data are required',
          },
          { status: 400 }
        );
      }

      // Validate required contract data fields
      const requiredFields = ['promoter_id', 'first_party_id', 'second_party_id', 'job_title', 'basic_salary'];
      const missingFields = requiredFields.filter(field => !contractData[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required contract data fields:', missingFields);
        return NextResponse.json(
          {
            success: false,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            details: {
              missingFields,
              receivedFields: Object.keys(contractData),
            }
          },
          { status: 400 }
        );
      }

      // Set location fields - use bilingual fields if available, otherwise fallback to work_location
      const location_en = contractData.location_en || contractData.work_location || '';
      const location_ar = contractData.location_ar || contractData.work_location || '';

      // Fetch promoter data including image URLs if promoter_id is provided
      let enrichedContractData = { ...contractData };
      if (contractData.promoter_id) {
        const supabase = createSupabaseClient();
        const { data: promoter, error: promoterError } = await supabase
          .from('promoters')
          .select(
            'id, name_en, name_ar, id_card_number, passport_number, id_card_url, passport_url, email, mobile_number, employer_id'
          )
          .eq('id', contractData.promoter_id)
          .single();

        if (!promoterError && promoter) {
          console.log(
            '✅ Fetched promoter data for contract generation:',
            promoter.name_en
          );
          // Add promoter image URLs to contract data for webhook
          enrichedContractData = {
            ...enrichedContractData,
            promoter_id_card_url: promoter.id_card_url,
            promoter_passport_url: promoter.passport_url,
            promoter_name_en: promoter.name_en,
            promoter_name_ar: promoter.name_ar,
            promoter_id_card_number: promoter.id_card_number,
            promoter_passport_number: promoter.passport_number,
            promoter_email: promoter.email,
            promoter_mobile_number: promoter.mobile_number,
            promoter_employer_id: promoter.employer_id,
            // Add aliases for template compatibility
            id_card_number: promoter.id_card_number, // Alias for promoter_id_card_number
            passport_number: promoter.passport_number, // Alias for promoter_passport_number
          };
        } else {
          console.warn('⚠️ Could not fetch promoter data:', promoterError);
        }
      }

      // Fetch first party (employer) data if first_party_id is provided
      if (contractData.first_party_id) {
        const supabase = createSupabaseClient();
        const { data: firstParty, error: firstPartyError } = await supabase
          .from('parties')
          .select('id, name_en, name_ar, crn, logo_url')
          .eq('id', contractData.first_party_id)
          .single();

        if (!firstPartyError && firstParty) {
          console.log('✅ Fetched first party data:', firstParty.name_en);
          enrichedContractData = {
            ...enrichedContractData,
            first_party_name_en: firstParty.name_en,
            first_party_name_ar: firstParty.name_ar,
            first_party_crn: firstParty.crn,
            first_party_logo: firstParty.logo_url,
            first_party_logo_url: firstParty.logo_url,
          };
        } else {
          console.warn('⚠️ Could not fetch first party data:', firstPartyError);
        }
      }

      // Fetch second party data if second_party_id is provided
      if (contractData.second_party_id) {
        const supabase = createSupabaseClient();
        const { data: secondParty, error: secondPartyError } = await supabase
          .from('parties')
          .select('id, name_en, name_ar, crn, logo_url')
          .eq('id', contractData.second_party_id)
          .single();

        if (!secondPartyError && secondParty) {
          console.log('✅ Fetched second party data:', secondParty.name_en);
          enrichedContractData = {
            ...enrichedContractData,
            second_party_name_en: secondParty.name_en,
            second_party_name_ar: secondParty.name_ar,
            second_party_crn: secondParty.crn,
            second_party_logo: secondParty.logo_url,
            second_party_logo_url: secondParty.logo_url,
          };
        } else {
          console.warn(
            '⚠️ Could not fetch second party data:',
            secondPartyError
          );
        }
      }

      // Add default placeholder URLs for ALL possible template images to prevent empty URL errors
      // This ensures all image slots (body, header, footer, with various naming conventions) have valid URLs
      const placeholderImage =
        'https://via.placeholder.com/200x200/cccccc/666666.png?text=No+Image';
      const placeholderLogo =
        'https://via.placeholder.com/300x100/0066cc/ffffff.png?text=Logo';
      const placeholderSignature =
        'https://via.placeholder.com/200x100/333333/ffffff.png?text=Signature';

      // Function to ensure valid URL with strict validation
      const ensureValidUrl = (
        url: string | null | undefined,
        type: 'image' | 'logo' | 'signature' = 'image'
      ): string => {
        // Return appropriate placeholder if URL is null/undefined/empty
        if (!url || url.toString().trim() === '') {
          console.warn(`⚠️ Empty URL detected, using placeholder for ${type}`);
          if (type === 'logo') return placeholderLogo;
          if (type === 'signature') return placeholderSignature;
          return placeholderImage;
        }
        
        // Basic URL validation
        const urlString = url.toString().trim();
        try {
          const parsedUrl = new URL(urlString);
          // Ensure it's http or https
          if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
            console.warn(`⚠️ Invalid protocol: ${parsedUrl.protocol}, using placeholder`);
            return type === 'logo' ? placeholderLogo : type === 'signature' ? placeholderSignature : placeholderImage;
          }
          return urlString;
        } catch {
          console.warn(`⚠️ Invalid URL format: ${urlString}, using placeholder`);
          return type === 'logo' ? placeholderLogo : type === 'signature' ? placeholderSignature : placeholderImage;
        }
      };

      // Add location fields to enriched data
      enrichedContractData = {
        ...enrichedContractData,
        location_en,
        location_ar,
      };

      // ✨ CRITICAL FIX: Ensure ALL image URLs are valid and non-empty
      // This prevents the "[400] Invalid requests[12].replaceImage: The URL should not be empty" error
      enrichedContractData = {
        ...enrichedContractData,
        // Header/Footer images (various naming conventions) - use ensureValidUrl
        header_logo: ensureValidUrl(enrichedContractData.header_logo, 'logo'),
        footer_logo: ensureValidUrl(enrichedContractData.footer_logo, 'logo'),
        header_image: ensureValidUrl(enrichedContractData.header_image, 'logo'),
        footer_image: ensureValidUrl(enrichedContractData.footer_image, 'logo'),

        // Company/Party logos - use ensureValidUrl with 'logo' type
        company_logo: ensureValidUrl(enrichedContractData.company_logo, 'logo'),
        company_logo_url: ensureValidUrl(enrichedContractData.company_logo_url, 'logo'),
        first_party_logo: ensureValidUrl(enrichedContractData.first_party_logo, 'logo'),
        first_party_logo_url: ensureValidUrl(enrichedContractData.first_party_logo_url, 'logo'),
        second_party_logo: ensureValidUrl(enrichedContractData.second_party_logo, 'logo'),
        second_party_logo_url: ensureValidUrl(enrichedContractData.second_party_logo_url, 'logo'),
        party_1_logo: ensureValidUrl(enrichedContractData.party_1_logo, 'logo'),
        party_2_logo: ensureValidUrl(enrichedContractData.party_2_logo, 'logo'),

        // Signature images - use ensureValidUrl with 'signature' type
        first_party_signature: ensureValidUrl(enrichedContractData.first_party_signature, 'signature'),
        second_party_signature: ensureValidUrl(enrichedContractData.second_party_signature, 'signature'),
        party_1_signature: ensureValidUrl(enrichedContractData.party_1_signature, 'signature'),
        party_2_signature: ensureValidUrl(enrichedContractData.party_2_signature, 'signature'),
        witness_signature: ensureValidUrl(enrichedContractData.witness_signature, 'signature'),
        signature_1: ensureValidUrl(enrichedContractData.signature_1, 'signature'),
        signature_2: ensureValidUrl(enrichedContractData.signature_2, 'signature'),

        // Official stamps/seals
        stamp_image: ensureValidUrl(enrichedContractData.stamp_image),
        stamp: ensureValidUrl(enrichedContractData.stamp),
        official_stamp: ensureValidUrl(enrichedContractData.official_stamp),
        seal: ensureValidUrl(enrichedContractData.seal),

        // QR codes/Barcodes
        qr_code: ensureValidUrl(enrichedContractData.qr_code),
        barcode: ensureValidUrl(enrichedContractData.barcode),

        // Watermarks/Background
        watermark: ensureValidUrl(enrichedContractData.watermark),
        background_image: ensureValidUrl(enrichedContractData.background_image),

        // Promoter images (CRITICAL - these are the main ones)
        promoter_id_card_url: ensureValidUrl(enrichedContractData.promoter_id_card_url),
        promoter_passport_url: ensureValidUrl(enrichedContractData.promoter_passport_url),
        id_card_url: ensureValidUrl(enrichedContractData.promoter_id_card_url || enrichedContractData.id_card_url),
        passport_url: ensureValidUrl(enrichedContractData.promoter_passport_url || enrichedContractData.passport_url),
        
        // ✨ Make.com compatible field names (stored_*) - CRITICAL FIX
        stored_promoter_id_card_image_url: ensureValidUrl(
          enrichedContractData.promoter_id_card_url || enrichedContractData.id_card_url
        ),
        stored_promoter_passport_image_url: ensureValidUrl(
          enrichedContractData.promoter_passport_url || enrichedContractData.passport_url
        ),
        stored_first_party_logo_url: ensureValidUrl(
          enrichedContractData.first_party_logo_url || enrichedContractData.first_party_logo,
          'logo'
        ),
        stored_second_party_logo_url: ensureValidUrl(
          enrichedContractData.second_party_logo_url || enrichedContractData.second_party_logo,
          'logo'
        ),

        // Generic numbered placeholders (ensure all 12 have valid URLs)
        image_1: ensureValidUrl(enrichedContractData.image_1),
        image_2: ensureValidUrl(enrichedContractData.image_2),
        image_3: ensureValidUrl(enrichedContractData.image_3),
        image_4: ensureValidUrl(enrichedContractData.image_4),
        image_5: ensureValidUrl(enrichedContractData.image_5),
        image_6: ensureValidUrl(enrichedContractData.image_6),
        image_7: ensureValidUrl(enrichedContractData.image_7),
        image_8: ensureValidUrl(enrichedContractData.image_8),
        image_9: ensureValidUrl(enrichedContractData.image_9),
        image_10: ensureValidUrl(enrichedContractData.image_10),
        image_11: ensureValidUrl(enrichedContractData.image_11),
        image_12: ensureValidUrl(enrichedContractData.image_12),
      };

      // Log the enriched data for debugging
      console.log('🔍 Enriched contract data with ALL image URLs:', {
        promoter_id_card_url: enrichedContractData.promoter_id_card_url,
        promoter_passport_url: enrichedContractData.promoter_passport_url,
        stored_promoter_id_card_image_url: enrichedContractData.stored_promoter_id_card_image_url,
        stored_promoter_passport_image_url: enrichedContractData.stored_promoter_passport_image_url,
        stored_first_party_logo_url: enrichedContractData.stored_first_party_logo_url,
        stored_second_party_logo_url: enrichedContractData.stored_second_party_logo_url,
        first_party_logo: enrichedContractData.first_party_logo,
        image_12: enrichedContractData.image_12,
      });

      // Log enriched data before webhook generation
      console.log('📊 Enriched contract data before webhook generation:', {
        promoterData: {
          name_en: enrichedContractData.promoter_name_en,
          name_ar: enrichedContractData.promoter_name_ar,
          id_card_url: enrichedContractData.promoter_id_card_url,
          passport_url: enrichedContractData.promoter_passport_url,
        },
        firstPartyData: {
          name_en: enrichedContractData.first_party_name_en,
          name_ar: enrichedContractData.first_party_name_ar,
          logo_url: enrichedContractData.first_party_logo_url,
        },
        secondPartyData: {
          name_en: enrichedContractData.second_party_name_en,
          name_ar: enrichedContractData.second_party_name_ar,
          logo_url: enrichedContractData.second_party_logo_url,
        },
        contractData: {
          job_title: enrichedContractData.job_title,
          basic_salary: enrichedContractData.basic_salary,
          contract_start_date: enrichedContractData.contract_start_date,
          contract_end_date: enrichedContractData.contract_end_date,
        }
      });

      // Generate contract with Make.com integration
      const { webhookPayload, templateConfig, validation } =
        generateContractWithMakecom(contractType, enrichedContractData);

      console.log('🔧 Generated webhook payload:', {
        hasWebhookPayload: !!webhookPayload,
        webhookPayloadKeys: webhookPayload ? Object.keys(webhookPayload) : [],
        templateConfig: templateConfig ? {
          id: templateConfig.id,
          name: templateConfig.name,
          googleDocsTemplateId: templateConfig.googleDocsTemplateId,
        } : null,
        validation: {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
        }
      });

      if (!validation.isValid) {
        console.error('❌ Contract validation failed:', validation.errors);
        return NextResponse.json(
          {
            success: false,
            error: 'Contract validation failed',
            details: {
              errors: validation.errors,
              warnings: validation.warnings,
            },
          },
          { status: 400 }
        );
      }

      // First, create the contract in the database
      const supabase = createSupabaseClient();
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .insert({
          contract_number:
            contractData.contract_number || generateContractNumber(),
          // Persist both legacy and new party columns for compatibility
          client_id: contractData.first_party_id,
          employer_id: contractData.second_party_id,
          first_party_id: contractData.first_party_id,
          second_party_id: contractData.second_party_id,
          promoter_id: contractData.promoter_id,
          start_date: contractData.contract_start_date,
          end_date: contractData.contract_end_date,
          title: contractData.job_title || 'Employment Contract',
          description: contractData.special_terms || '',
          contract_type: contractType,
          status: 'pending',
          value: contractData.basic_salary,
          currency: contractData.currency || 'OMR',
          is_current: true,
        })
        .select(
          'id, contract_number, contract_type, status, promoter_id, start_date, end_date, title, value, currency, created_at, updated_at'
        )
        .single();

      if (contractError) {
        console.error('❌ Contract creation error:', contractError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to create contract',
            details: contractError,
          },
          { status: 500 }
        );
      }

      // Add the party IDs back to the contract object (they weren't selected to avoid foreign key expansion)
      (contract as any).first_party_id = contractData.first_party_id;
      (contract as any).second_party_id = contractData.second_party_id;

      console.log('✅ Contract created:', contract.id);

      // If triggerMakecom is true, send webhook to Make.com
      let makecomResponse = null;
      if (triggerMakecom && webhookPayload) {
        try {
          // Add the created contract ID to the webhook payload
          const appUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.APP_URL ||
            process.env.VERCEL_URL?.startsWith('http')
              ? process.env.VERCEL_URL
              : process.env.VERCEL_URL
                ? `https://${process.env.VERCEL_URL}`
                : 'http://localhost:3000';

          // Pull Google Drive settings from Make.com template config (if available)
          const makeTemplate = templateConfig?.makecomTemplateId
            ? getMakecomTemplateConfig(templateConfig.makecomTemplateId)
            : null;

          const enhancedPayload = {
            ...webhookPayload,
            contract_id: contract.id,
            contract_number: contract.contract_number,
            ref_number: contract.contract_number, // Alias for template compatibility
            // Callback URL for Make.com to update status/pdf_url
            update_url: `${appUrl}/api/generate-contract`,
            // Provide Drive folder context to Make.com scenario if configured
            ...(makeTemplate?.makecomModuleConfig.googleDriveSettings
              ? {
                  google_drive_folder_id:
                    makeTemplate.makecomModuleConfig.googleDriveSettings
                      .folderId,
                  file_naming_pattern:
                    makeTemplate.makecomModuleConfig.googleDriveSettings.naming,
                }
              : {}),
          };

          // Trigger Make.com webhook with retry logic
          const makecomWebhookUrl = process.env.MAKECOM_WEBHOOK_URL;

          if (makecomWebhookUrl) {
            console.log('📤 Triggering Make.com webhook:', makecomWebhookUrl);
            console.log('📋 Enhanced payload - checking critical fields:', {
              contract_id: enhancedPayload.contract_id,
              contract_number: enhancedPayload.contract_number,
              has_stored_id_card: !!enhancedPayload.stored_promoter_id_card_image_url,
              has_stored_passport: !!enhancedPayload.stored_promoter_passport_image_url,
              has_stored_logo: !!enhancedPayload.stored_first_party_logo_url,
              stored_promoter_id_card_image_url: enhancedPayload.stored_promoter_id_card_image_url,
              stored_promoter_passport_image_url: enhancedPayload.stored_promoter_passport_image_url,
              stored_first_party_logo_url: enhancedPayload.stored_first_party_logo_url,
            });
            
            // Log comprehensive payload data for debugging
            console.log('🔍 Make.com webhook payload details:', {
              contractInfo: {
                id: enhancedPayload.contract_id,
                number: enhancedPayload.contract_number,
                type: enhancedPayload.contract_type,
              },
              promoterInfo: {
                name_en: enhancedPayload.promoter_name_en,
                name_ar: enhancedPayload.promoter_name_ar,
                id_card_url: enhancedPayload.promoter_id_card_url,
                passport_url: enhancedPayload.promoter_passport_url,
                stored_id_card: enhancedPayload.stored_promoter_id_card_image_url,
                stored_passport: enhancedPayload.stored_promoter_passport_image_url,
              },
              firstPartyInfo: {
                name_en: enhancedPayload.first_party_name_en,
                name_ar: enhancedPayload.first_party_name_ar,
                logo_url: enhancedPayload.first_party_logo_url,
                stored_logo: enhancedPayload.stored_first_party_logo_url,
              },
              secondPartyInfo: {
                name_en: enhancedPayload.second_party_name_en,
                name_ar: enhancedPayload.second_party_name_ar,
                logo_url: enhancedPayload.second_party_logo_url,
                stored_logo: enhancedPayload.stored_second_party_logo_url,
              },
              contractDetails: {
                job_title: enhancedPayload.job_title,
                basic_salary: enhancedPayload.basic_salary,
                start_date: enhancedPayload.contract_start_date,
                end_date: enhancedPayload.contract_end_date,
                work_location: enhancedPayload.work_location,
                location_en: enhancedPayload.location_en,
                location_ar: enhancedPayload.location_ar,
              },
              imageFields: {
                image_1: enhancedPayload.image_1,
                image_2: enhancedPayload.image_2,
                image_12: enhancedPayload.image_12,
                totalImageFields: Object.keys(enhancedPayload).filter(key => key.startsWith('image_')).length,
              }
            });
            
            // Log full payload in development for debugging
            if (process.env.NODE_ENV === 'development') {
              console.log('🔍 Full enhanced payload:', JSON.stringify(enhancedPayload, null, 2));
            }

            // Retry up to 3 times with exponential backoff
            let lastError: any = null;
            let retrySucceeded = false;
            
            for (let attempt = 1; attempt <= 3; attempt++) {
              const controller = new AbortController();
              let timeoutId: NodeJS.Timeout | null = null;
              
              try {
                console.log(`🔄 Webhook attempt ${attempt}/3...`);
                
                timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

                const response = await fetch(makecomWebhookUrl, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Secret': process.env.MAKE_WEBHOOK_SECRET || '',
                    'User-Agent': 'Contract-Management-System/1.0',
                  },
                  body: JSON.stringify(enhancedPayload),
                  signal: controller.signal,
                });

                clearTimeout(timeoutId);

                const responseText = await response.text();
                
                console.log('📥 Webhook response:', {
                  status: response.status,
                  statusText: response.statusText,
                  ok: response.ok,
                  body: responseText.substring(0, 200),
                });

                // Parse response body for better handling
                let parsedResponse = null;
                try {
                  parsedResponse = JSON.parse(responseText);
                } catch (e) {
                  console.log('ℹ️ Response is not JSON, using as plain text');
                  parsedResponse = responseText;
                }

                makecomResponse = {
                  status: response.status,
                  success: response.ok,
                  body: responseText,
                  parsedResponse,
                  attempt,
                  timestamp: new Date().toISOString(),
                };

                if (response.ok) {
                  console.log(`✅ Make.com webhook triggered successfully on attempt ${attempt}`);
                  console.log('📊 Make.com response data:', parsedResponse);

                  // Update contract status to processing
                  const { error: updateError } = await supabase
                    .from('contracts')
                    .update({ 
                      status: 'processing',
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', contract.id);

                  if (updateError) {
                    console.error('❌ Failed to update contract status:', updateError);
                  } else {
                    console.log('✅ Contract status updated to processing');
                  }

                  retrySucceeded = true;
                  break; // Success, exit retry loop
                } else {
                  console.error(`❌ Make.com webhook failed (attempt ${attempt}):`, {
                    status: response.status,
                    statusText: response.statusText,
                    body: responseText,
                  });
                  
                  lastError = {
                    status: response.status,
                    statusText: response.statusText,
                    body: responseText,
                    attempt,
                  };

                  // Wait before retry (exponential backoff)
                  if (attempt < 3) {
                    const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
                    console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                  }
                }
              } catch (fetchError) {
                if (timeoutId) {
                  clearTimeout(timeoutId);
                }
                
                console.error(`❌ Webhook request error (attempt ${attempt}):`, fetchError);
                
                lastError = {
                  error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
                  attempt,
                };

                // Wait before retry
                if (attempt < 3) {
                  const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
                  console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                }
              }
            }

            if (!retrySucceeded) {
              console.error('❌ All 3 webhook attempts failed');
              makecomResponse = {
                status: 500,
                success: false,
                error: 'All webhook attempts failed',
                lastError,
                timestamp: new Date().toISOString(),
              };
            }
          } else {
            console.warn('⚠️ MAKECOM_WEBHOOK_URL not configured');
            makecomResponse = {
              status: 0,
              success: false,
              error: 'Webhook URL not configured',
              timestamp: new Date().toISOString(),
            };
          }
        } catch (makecomError) {
          console.error('❌ Make.com webhook error:', makecomError);
          makecomResponse = {
            status: 500,
            success: false,
            error:
              makecomError instanceof Error
                ? makecomError.message
                : 'Unknown error',
            timestamp: new Date().toISOString(),
          };
        }
      }

      // Enhanced response with better Make.com status
      const makecomStatus = makecomResponse ? {
        triggered: triggerMakecom,
        success: makecomResponse.success,
        status: makecomResponse.status,
        response: makecomResponse.parsedResponse || makecomResponse.body,
        error: makecomResponse.error || null,
        attempt: makecomResponse.attempt,
        timestamp: makecomResponse.timestamp,
        webhook_url: process.env.MAKECOM_WEBHOOK_URL,
      } : {
        triggered: false,
        success: false,
        error: 'Make.com webhook not configured',
        timestamp: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        message: 'Contract generated successfully',
        data: {
          contract: {
            id: contract.id,
            contract_number: contract.contract_number,
            title: contract.title,
            status: contract.status,
            contract_type: contract.contract_type,
            created_at: contract.created_at,
          },
          validation,
          templateConfig: templateConfig
            ? {
                id: templateConfig.id,
                name: templateConfig.name,
                googleDocsTemplateId: templateConfig.googleDocsTemplateId,
              }
            : null,
          makecom: makecomStatus,
          // Helpful link to the target Drive folder if configured
          google_drive_url: ((): string | null => {
            try {
              const makeTemplate = templateConfig?.makecomTemplateId
                ? getMakecomTemplateConfig(templateConfig.makecomTemplateId)
                : null;
              const folderId =
                makeTemplate?.makecomModuleConfig.googleDriveSettings?.folderId;
              return folderId
                ? `https://drive.google.com/drive/folders/${folderId}`
                : null;
            } catch {
              return null;
            }
          })(),
        },
      });
    } catch (error) {
      console.error('❌ Contract generation error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Contract generation failed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  }
);

// Utility function to generate contract numbers
function generateContractNumber(): string {
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  return `PAC-${day}${month}${year}-${random}`;
}
