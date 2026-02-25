// app/api/contracts/makecom/generate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withAnyRBAC } from '@/lib/rbac/guard';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import {
  generateContractWithMakecom,
  getEnhancedContractTypeConfig,
  getMakecomEnabledContractTypes,
} from '@/lib/contract-type-config';
import {
  getMakecomTemplateConfig,
  generateMakecomBlueprint,
} from '@/lib/makecom-template-config';

// Create Supabase client with service role for elevated privileges
function createSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createSupabaseClient(supabaseUrl, supabaseKey);
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


      if (!contractType || !contractData) {
        return NextResponse.json(
          {
            success: false,
            error: 'Contract type and data are required',
          },
          { status: 400 }
        );
      }

      // Validate required contract data fields
      const requiredFields = [
        'promoter_id',
        'first_party_id',
        'second_party_id',
        'job_title',
        'basic_salary',
      ];
      const missingFields = requiredFields.filter(
        field => !contractData[field]
      );

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: `Missing required fields: ${missingFields.join(', ')}`,
            details: {
              missingFields,
              receivedFields: Object.keys(contractData),
            },
          },
          { status: 400 }
        );
      }

      // Set location fields - use bilingual fields if available, otherwise fallback to work_location
      const location_en =
        contractData.location_en || contractData.work_location || '';
      const location_ar =
        contractData.location_ar || contractData.work_location || '';

      // Fetch promoter data including image URLs if promoter_id is provided
      let enrichedContractData = { ...contractData };
      const supabaseService = createSupabaseServiceClient();

      if (contractData.promoter_id) {
        const { data: promoter, error: promoterError } = await supabaseService
          .from('promoters')
          .select(
            'id, name_en, name_ar, id_card_number, passport_number, id_card_url, passport_url, email, mobile_number, employer_id'
          )
          .eq('id', contractData.promoter_id)
          .single();

        if (!promoterError && promoter) {

          // Log passport URL details for debugging
          if (promoter.passport_url) {
          } else {
          }

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
        }
      }

      // Fetch first party (employer) data if first_party_id is provided
      if (contractData.first_party_id) {
        const { data: firstParty, error: firstPartyError } =
          await supabaseService
            .from('parties')
            .select('id, name_en, name_ar, crn, logo_url')
            .eq('id', contractData.first_party_id)
            .single();

        if (!firstPartyError && firstParty) {
          enrichedContractData = {
            ...enrichedContractData,
            first_party_name_en: firstParty.name_en,
            first_party_name_ar: firstParty.name_ar,
            first_party_crn: firstParty.crn,
            first_party_logo: firstParty.logo_url,
            first_party_logo_url: firstParty.logo_url,
          };
        } else {
        }
      }

      // Fetch second party data if second_party_id is provided
      if (contractData.second_party_id) {
        const { data: secondParty, error: secondPartyError } =
          await supabaseService
            .from('parties')
            .select('id, name_en, name_ar, crn, logo_url')
            .eq('id', contractData.second_party_id)
            .single();

        if (!secondPartyError && secondParty) {
          enrichedContractData = {
            ...enrichedContractData,
            second_party_name_en: secondParty.name_en,
            second_party_name_ar: secondParty.name_ar,
            second_party_crn: secondParty.crn,
            second_party_logo: secondParty.logo_url,
            second_party_logo_url: secondParty.logo_url,
          };
        } else {
        }
      }

      // Add default placeholder URLs for ALL possible template images to prevent empty URL errors
      // Using publicly accessible imgur placeholders instead of via.placeholder.com for better reliability
      const placeholderImage = 'https://i.imgur.com/7DrMrhN.png'; // 200x200 light gray placeholder
      const placeholderLogo = 'https://i.imgur.com/YlUKsz7.png'; // 300x100 blue placeholder
      const _placeholderSignature = 'https://i.imgur.com/zQeWKYc.png'; // 200x100 dark gray placeholder
      // Function to normalize Supabase storage URLs (convert partial URLs to full public URLs)
      const normalizeSupabaseUrl = (
        url: string | null | undefined,
        bucket: string = 'promoter-documents'
      ): string | null => {
        if (!url || url.toString().trim() === '') {
          return null;
        }

        const urlString = url.toString().trim();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        // If it's already a full URL, return as-is
        if (
          urlString.startsWith('http://') ||
          urlString.startsWith('https://')
        ) {
          return urlString;
        }

        // If it's a partial URL (just filename), convert to full public URL
        if (supabaseUrl) {
          // Extract project ID from Supabase URL (e.g., https://xxxxx.supabase.co)
          const urlMatch = supabaseUrl.match(
            /https?:\/\/([^.]+)\.supabase\.co/
          );
          if (urlMatch) {
            const projectId = urlMatch[1];
            // Remove any leading slashes from filename
            const cleanFilename = urlString.replace(/^\/+/, '');
            return `https://${projectId}.supabase.co/storage/v1/object/public/${bucket}/${cleanFilename}`;
          }
        }

        // If we can't normalize it, return null
        return null;
      };

      // Function to ensure valid URL with strict validation
      const ensureValidUrl = (
        url: string | null | undefined,
        type: 'image' | 'logo' | 'signature' = 'image'
      ): string | undefined => {
        // If URL is null/undefined/empty, return undefined to skip this image in the template
        if (!url || url.toString().trim() === '') {
          return undefined;
        }

        // Normalize Supabase storage URLs (convert partial URLs to full public URLs)
        let urlString = url.toString().trim();
        const normalizedUrl = normalizeSupabaseUrl(urlString);
        if (normalizedUrl) {
          urlString = normalizedUrl;
        }

        try {
          const parsedUrl = new URL(urlString);
          // Ensure it's http or https
          if (
            parsedUrl.protocol !== 'http:' &&
            parsedUrl.protocol !== 'https:'
          ) {
            return undefined;
          }

          // Check if it's a Supabase storage URL with "NO_PASSPORT" or similar placeholders
          // Also check for case-insensitive matches and common variations
          const urlLower = urlString.toLowerCase();
          if (
            urlLower.includes('no_passport') ||
            urlLower.includes('no_id_card') ||
            urlLower.includes('no-passport') ||
            urlLower.includes('no-id-card') ||
            urlString.includes('NO_PASSPORT') ||
            urlString.includes('NO_ID_CARD')
          ) {
            return undefined;
          }

          // Check for "REAL_PASSPORT" marker - this might indicate a placeholder file
          // If the filename contains REAL_PASSPORT but no actual passport number, it's likely a placeholder
          if (urlLower.includes('real_passport') && type === 'image') {
            // Extract filename from URL
            const filenameMatch = urlString.match(
              /\/([^\/]+\.(png|jpeg|jpg|gif))$/i
            );
            if (filenameMatch) {
              const filename = filenameMatch[1];
              const filenameLower = filename.toLowerCase();
              // If filename has REAL_PASSPORT but no passport number pattern, it's likely a placeholder
              // Passport numbers are typically alphanumeric codes (e.g., fu5097601, fd4227081, eg4128603)
              // Check for passport number patterns (case-insensitive)
              const hasPassportNumber =
                /\d{7,}/.test(filenameLower) ||
                /[a-z]{2}\d{7}/i.test(filenameLower);
              if (!hasPassportNumber) {
                return undefined;
              } else {
                // REAL_PASSPORT file exists but has passport number - this is valid, allow it
              }
            }
          }

          // Additional validation: Check for common broken image patterns
          // Some URLs might point to error pages or screenshots instead of actual images
          const brokenImagePatterns = [
            /image.*not.*available/i,
            /404.*not.*found/i,
            /broken.*image/i,
            /screenshot/i,
            /placeholder/i,
          ];

          for (const pattern of brokenImagePatterns) {
            if (pattern.test(urlString)) {
              return undefined;
            }
          }

          return urlString;
        } catch {
          // If URL parsing fails, try to normalize it as a Supabase storage URL
          const normalized = normalizeSupabaseUrl(urlString);
          if (normalized) {
            try {
              new URL(normalized); // Validate the normalized URL
              return normalized;
            } catch {
              return undefined;
            }
          }
          return undefined;
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
        company_logo_url: ensureValidUrl(
          enrichedContractData.company_logo_url,
          'logo'
        ),
        first_party_logo: ensureValidUrl(
          enrichedContractData.first_party_logo,
          'logo'
        ),
        first_party_logo_url: ensureValidUrl(
          enrichedContractData.first_party_logo_url,
          'logo'
        ),
        second_party_logo: ensureValidUrl(
          enrichedContractData.second_party_logo,
          'logo'
        ),
        second_party_logo_url: ensureValidUrl(
          enrichedContractData.second_party_logo_url,
          'logo'
        ),
        party_1_logo: ensureValidUrl(enrichedContractData.party_1_logo, 'logo'),
        party_2_logo: ensureValidUrl(enrichedContractData.party_2_logo, 'logo'),

        // Signature images - use ensureValidUrl with 'signature' type
        first_party_signature: ensureValidUrl(
          enrichedContractData.first_party_signature,
          'signature'
        ),
        second_party_signature: ensureValidUrl(
          enrichedContractData.second_party_signature,
          'signature'
        ),
        party_1_signature: ensureValidUrl(
          enrichedContractData.party_1_signature,
          'signature'
        ),
        party_2_signature: ensureValidUrl(
          enrichedContractData.party_2_signature,
          'signature'
        ),
        witness_signature: ensureValidUrl(
          enrichedContractData.witness_signature,
          'signature'
        ),
        signature_1: ensureValidUrl(
          enrichedContractData.signature_1,
          'signature'
        ),
        signature_2: ensureValidUrl(
          enrichedContractData.signature_2,
          'signature'
        ),

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
        promoter_id_card_url: ensureValidUrl(
          enrichedContractData.promoter_id_card_url
        ),
        promoter_passport_url: ensureValidUrl(
          enrichedContractData.promoter_passport_url
        ),
        id_card_url: ensureValidUrl(
          enrichedContractData.promoter_id_card_url ||
            enrichedContractData.id_card_url
        ),
        passport_url: ensureValidUrl(
          enrichedContractData.promoter_passport_url ||
            enrichedContractData.passport_url
        ),

        // ✨ Make.com compatible field names (stored_*) - CRITICAL FIX
        stored_promoter_id_card_image_url: ensureValidUrl(
          enrichedContractData.promoter_id_card_url ||
            enrichedContractData.id_card_url
        ),
        stored_promoter_passport_image_url: ensureValidUrl(
          enrichedContractData.promoter_passport_url ||
            enrichedContractData.passport_url
        ),
        stored_first_party_logo_url: ensureValidUrl(
          enrichedContractData.first_party_logo_url ||
            enrichedContractData.first_party_logo,
          'logo'
        ),
        stored_second_party_logo_url: ensureValidUrl(
          enrichedContractData.second_party_logo_url ||
            enrichedContractData.second_party_logo,
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

      // Special logging for passport URL processing
      if (enrichedContractData.promoter_passport_url) {
      } else {
      }

      // Log enriched data before webhook generation

      // Remove undefined image URLs before sending to Make.com
      // This prevents the "problem retrieving image" error for invalid/missing images
      const undefinedKeys = Object.entries(enrichedContractData)
        .filter(([_, value]) => value === undefined)
        .map(([key]) => key);

      if (undefinedKeys.length > 0) {
      }

      const cleanedContractData = Object.fromEntries(
        Object.entries(enrichedContractData).filter(
          ([_, value]) => value !== undefined
        )
      ) as typeof enrichedContractData;

      const sanitizedContractData = { ...cleanedContractData };

      const imageFallbacks: Record<string, string> = {
        promoter_id_card_url: placeholderImage,
        id_card_url: placeholderImage,
        promoter_passport_url: placeholderImage,
        passport_url: placeholderImage,
        first_party_logo: placeholderLogo,
        first_party_logo_url: placeholderLogo,
        second_party_logo: placeholderLogo,
        second_party_logo_url: placeholderLogo,
        stored_promoter_id_card_image_url: placeholderImage,
        stored_promoter_passport_image_url: placeholderImage,
        stored_first_party_logo_url: placeholderLogo,
        stored_second_party_logo_url: placeholderLogo,
        image_1: placeholderImage,
        image_2: placeholderImage,
        image_3: placeholderImage,
        image_4: placeholderImage,
        image_5: placeholderImage,
        image_6: placeholderImage,
        image_7: placeholderImage,
        image_8: placeholderImage,
        image_9: placeholderImage,
        image_10: placeholderImage,
        image_11: placeholderImage,
        image_12: placeholderImage,
      };

      for (const [key, fallback] of Object.entries(imageFallbacks)) {
        if (!sanitizedContractData[key as keyof typeof sanitizedContractData]) {
          sanitizedContractData[key as keyof typeof sanitizedContractData] =
            fallback as any;
        }
      }

      // Generate contract with Make.com integration
      const { webhookPayload, templateConfig, validation } =
        generateContractWithMakecom(contractType, sanitizedContractData);


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

      // First, get the authenticated user using the server client (has access to cookies)
      const supabaseServer = await createServerClient();
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabaseServer.auth.getUser();

      if (authError || !currentUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'You must be logged in to create contracts',
            details: authError?.message || 'User not authenticated',
          },
          { status: 401 }
        );
      }

      // supabaseService already defined above - reuse it for database operations
      const { data: contract, error: contractError } = await supabaseService
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
          user_id: currentUser.id, // Track who created the contract
        })
        .select(
          'id, contract_number, contract_type, status, promoter_id, start_date, end_date, title, value, currency, created_at, updated_at'
        )
        .single();

      if (contractError) {
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
            update_url: `${appUrl}/api/webhook/contract-pdf-ready`,
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
          // Support both MAKECOM_WEBHOOK_URL and MAKECOM_WEBHOOK_URL_EXTRA
          const makecomWebhookUrl =
            process.env.MAKECOM_WEBHOOK_URL_EXTRA ||
            process.env.MAKECOM_WEBHOOK_URL;

          if (makecomWebhookUrl) {

            // Log comprehensive payload data for debugging

            // Log full payload in development for debugging
            if (process.env.NODE_ENV === 'development') {
            }

            // Retry up to 3 times with exponential backoff
            let lastError: any = null;
            let retrySucceeded = false;

            for (let attempt = 1; attempt <= 3; attempt++) {
              const controller = new AbortController();
              let timeoutId: NodeJS.Timeout | null = null;

              try {

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


                // Parse response body for better handling
                let parsedResponse = null;
                try {
                  parsedResponse = JSON.parse(responseText);
                } catch (e) {
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

                  // Update contract status to processing
                  const { error: updateError } = await supabaseService
                    .from('contracts')
                    .update({
                      status: 'processing',
                      updated_at: new Date().toISOString(),
                    })
                    .eq('id', contract.id);

                  if (updateError) {
                  } else {
                  }

                  retrySucceeded = true;
                  break; // Success, exit retry loop
                } else {

                  lastError = {
                    status: response.status,
                    statusText: response.statusText,
                    body: responseText,
                    attempt,
                  };

                  // Wait before retry (exponential backoff)
                  if (attempt < 3) {
                    const waitTime = Math.min(
                      1000 * Math.pow(2, attempt),
                      10000
                    );
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                  }
                }
              } catch (fetchError) {
                if (timeoutId) {
                  clearTimeout(timeoutId);
                }


                lastError = {
                  error:
                    fetchError instanceof Error
                      ? fetchError.message
                      : 'Unknown error',
                  attempt,
                };

                // Wait before retry
                if (attempt < 3) {
                  const waitTime = Math.min(1000 * Math.pow(2, attempt), 10000);
                  await new Promise(resolve => setTimeout(resolve, waitTime));
                }
              }
            }

            if (!retrySucceeded) {
              makecomResponse = {
                status: 500,
                success: false,
                error: 'All webhook attempts failed',
                lastError,
                timestamp: new Date().toISOString(),
              };
            }
          } else {
            makecomResponse = {
              status: 0,
              success: false,
              error: 'Webhook URL not configured',
              timestamp: new Date().toISOString(),
            };
          }
        } catch (makecomError) {
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
      const makecomStatus = makecomResponse
        ? {
            triggered: triggerMakecom,
            success: makecomResponse.success,
            status: makecomResponse.status,
            response: makecomResponse.parsedResponse || makecomResponse.body,
            error: makecomResponse.error || null,
            attempt: makecomResponse.attempt,
            timestamp: makecomResponse.timestamp,
            webhook_url: process.env.MAKECOM_WEBHOOK_URL,
          }
        : {
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
