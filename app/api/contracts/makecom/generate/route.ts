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
      });

      if (!contractType || !contractData) {
        return NextResponse.json(
          {
            success: false,
            error: 'Contract type and data are required',
          },
          { status: 400 }
        );
      }

      // Fetch promoter data including image URLs if promoter_id is provided
      let enrichedContractData = { ...contractData };
      if (contractData.promoter_id) {
        const supabase = createSupabaseClient();
        const { data: promoter, error: promoterError } = await supabase
          .from('promoters')
          .select('id, name_en, name_ar, id_card_number, passport_number, id_card_url, passport_url, email, mobile_number')
          .eq('id', contractData.promoter_id)
          .single();

        if (!promoterError && promoter) {
          console.log('✅ Fetched promoter data for contract generation:', promoter.name_en);
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
          console.warn('⚠️ Could not fetch second party data:', secondPartyError);
        }
      }
      
      // Add default placeholder URLs for ALL possible template images to prevent empty URL errors
      // This ensures all image slots (body, header, footer, with various naming conventions) have valid URLs
      const placeholderImage = 'https://via.placeholder.com/200x200/cccccc/666666.png?text=No+Image';
      
      // Function to ensure valid URL
      const ensureValidUrl = (url: string | null | undefined): string => {
        if (!url || url.trim() === '') {
          return placeholderImage;
        }
        // Basic URL validation
        try {
          new URL(url);
          return url;
        } catch {
          return placeholderImage;
        }
      };
      
      enrichedContractData = {
        ...enrichedContractData,
        // Header/Footer images (various naming conventions)
        header_logo: enrichedContractData.header_logo || placeholderImage,
        footer_logo: enrichedContractData.footer_logo || placeholderImage,
        header_image: enrichedContractData.header_image || placeholderImage,
        footer_image: enrichedContractData.footer_image || placeholderImage,
        
        // Company/Party logos
        company_logo: enrichedContractData.company_logo || placeholderImage,
        company_logo_url: enrichedContractData.company_logo_url || placeholderImage,
        first_party_logo: enrichedContractData.first_party_logo || placeholderImage,
        second_party_logo: enrichedContractData.second_party_logo || placeholderImage,
        party_1_logo: enrichedContractData.party_1_logo || placeholderImage,
        party_2_logo: enrichedContractData.party_2_logo || placeholderImage,
        
        // Signature images
        first_party_signature: enrichedContractData.first_party_signature || placeholderImage,
        second_party_signature: enrichedContractData.second_party_signature || placeholderImage,
        party_1_signature: enrichedContractData.party_1_signature || placeholderImage,
        party_2_signature: enrichedContractData.party_2_signature || placeholderImage,
        witness_signature: enrichedContractData.witness_signature || placeholderImage,
        signature_1: enrichedContractData.signature_1 || placeholderImage,
        signature_2: enrichedContractData.signature_2 || placeholderImage,
        
        // Official stamps/seals
        stamp_image: enrichedContractData.stamp_image || placeholderImage,
        stamp: enrichedContractData.stamp || placeholderImage,
        official_stamp: enrichedContractData.official_stamp || placeholderImage,
        seal: enrichedContractData.seal || placeholderImage,
        
        // QR codes/Barcodes
        qr_code: enrichedContractData.qr_code || placeholderImage,
        barcode: enrichedContractData.barcode || placeholderImage,
        
        // Watermarks/Background
        watermark: enrichedContractData.watermark || placeholderImage,
        background_image: enrichedContractData.background_image || placeholderImage,
        
        // Promoter images (ensure these have valid URLs)
        promoter_id_card_url: ensureValidUrl(enrichedContractData.promoter_id_card_url),
        promoter_passport_url: ensureValidUrl(enrichedContractData.promoter_passport_url),
        id_card_url: ensureValidUrl(enrichedContractData.id_card_url),
        passport_url: ensureValidUrl(enrichedContractData.passport_url),
        
        // Generic numbered placeholders (in case template uses img_1, img_2, etc.)
        image_1: enrichedContractData.image_1 || placeholderImage,
        image_2: enrichedContractData.image_2 || placeholderImage,
        image_3: enrichedContractData.image_3 || placeholderImage,
        image_4: enrichedContractData.image_4 || placeholderImage,
        image_5: enrichedContractData.image_5 || placeholderImage,
        image_6: enrichedContractData.image_6 || placeholderImage,
        image_7: enrichedContractData.image_7 || placeholderImage,
        image_8: enrichedContractData.image_8 || placeholderImage,
        image_9: enrichedContractData.image_9 || placeholderImage,
        image_10: enrichedContractData.image_10 || placeholderImage,
        image_11: enrichedContractData.image_11 || placeholderImage,
        image_12: enrichedContractData.image_12 || placeholderImage,
      };

      // Log the enriched data for debugging
      console.log('🔍 Enriched contract data with image URLs:', {
        promoter_id_card_url: enrichedContractData.promoter_id_card_url,
        promoter_passport_url: enrichedContractData.promoter_passport_url,
        id_card_url: enrichedContractData.id_card_url,
        passport_url: enrichedContractData.passport_url,
        promoter_passport_number: enrichedContractData.promoter_passport_number,
      });

      // Generate contract with Make.com integration
      const { webhookPayload, templateConfig, validation } =
        generateContractWithMakecom(contractType, enrichedContractData);

      if (!validation.isValid) {
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
        .select('id, contract_number, contract_type, status, promoter_id, start_date, end_date, title, value, currency, created_at, updated_at')
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
                    makeTemplate.makecomModuleConfig.googleDriveSettings
                      .naming,
                }
              : {}),
          };

          // Trigger Make.com webhook (replace with your actual Make.com webhook URL)
          const makecomWebhookUrl = process.env.MAKECOM_WEBHOOK_URL;

          if (makecomWebhookUrl) {
            const response = await fetch(makecomWebhookUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(enhancedPayload),
            });

            makecomResponse = {
              status: response.status,
              success: response.ok,
              timestamp: new Date().toISOString(),
            };

            if (response.ok) {
              console.log('✅ Make.com webhook triggered successfully');

              // Update contract status
              await supabase
                .from('contracts')
                .update({ status: 'processing' })
                .eq('id', contract.id);
            } else {
              console.error('❌ Make.com webhook failed:', response.statusText);
            }
          } else {
            console.warn('⚠️ MAKECOM_WEBHOOK_URL not configured');
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

      return NextResponse.json({
        success: true,
        data: {
          contract,
          validation,
          templateConfig: templateConfig
            ? {
                id: templateConfig.id,
                name: templateConfig.name,
                googleDocsTemplateId: templateConfig.googleDocsTemplateId,
              }
            : null,
          makecom: {
            triggered: triggerMakecom,
            webhookPayload: triggerMakecom ? webhookPayload : null,
            response: makecomResponse,
          },
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
