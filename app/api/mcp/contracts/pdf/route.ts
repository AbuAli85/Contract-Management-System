// Ensure Node runtime (required for Supabase client and Buffer operations)
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import {
  getMcpContext,
  assertRole,
  toMcpErrorResponse,
  createUserScopedClient,
  extractBearerToken,
  McpError,
} from '@/lib/mcp/context';
import { generateContractPDF } from '@/lib/pdf-generator';

const generatePdfSchema = z.object({
  contract_id: z.string().uuid('contract_id must be a valid UUID'),
});

// Create Supabase service client for storage operations
function createServiceClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(req: NextRequest) {
  let correlationId: string;
  try {
    // Extract correlation ID for logging
    correlationId =
      req.headers.get('x-correlation-id') ||
      `mcp-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // 1. Auth + context (DB-first)
    const context = await getMcpContext(req);

    // Log with correlation ID

    // 2. RBAC: provider or admin only
    assertRole(context, ['provider', 'admin']);

    // 3. Validate request body (deterministic Zod error handling)
    const body = await req.json();
    const validated = generatePdfSchema.parse(body);

    // 4. Get user-scoped client
    const token = extractBearerToken(req);
    const supabase = createUserScopedClient(token);

    // 5. Verify contract belongs to tenant (tenant isolation BEFORE generation)
    // Note: This repo uses party_id (from companies) as tenant_id
    // Contracts are linked to parties via client_id/employer_id
    // We need to verify the contract's parties belong to the tenant
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select(
        'id, contract_number, client_id, employer_id, first_party_id, second_party_id, status, pdf_url'
      )
      .eq('id', validated.contract_id)
      .single();

    if (contractError) {
      throw contractError; // Throw Supabase error directly
    }

    if (!contract) {
      throw new McpError('NOT_FOUND', 'Contract not found');
    }

    // Verify contract belongs to tenant (tenant isolation BEFORE generation)
    // Tenant isolation: contracts are linked to parties via employer_id/client_id
    // tenant_id is the company's party_id, so we verify contract's parties match it
    const belongsToTenant =
      contract.employer_id === context.tenant_id ||
      contract.client_id === context.tenant_id ||
      contract.first_party_id === context.tenant_id ||
      contract.second_party_id === context.tenant_id;

    if (!belongsToTenant) {
      throw new McpError(
        'FORBIDDEN',
        'Contract does not belong to your company'
      );
    }

    // 6. Fetch full contract data for PDF generation
    const { data: fullContract, error: fullContractError } = await supabase
      .from('contracts')
      .select(
        `
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
        first_party:parties!contracts_employer_id_fkey (
          id,
          name_en,
          name_ar,
          crn,
          logo_url
        ),
        second_party:parties!contracts_client_id_fkey (
          id,
          name_en,
          name_ar,
          crn,
          logo_url
        )
      `
      )
      .eq('id', validated.contract_id)
      .single();

    if (fullContractError) {
      throw fullContractError; // Throw Supabase error directly
    }

    if (!fullContract) {
      throw new McpError('NOT_FOUND', 'Contract data not found');
    }

    // 7. Generate PDF using local generator
    let pdfBuffer: Buffer;
    try {
      pdfBuffer = await generateContractPDF(fullContract as any);
    } catch (pdfGenError) {
      throw new McpError(
        'INTERNAL_ERROR',
        `PDF generation failed: ${pdfGenError instanceof Error ? pdfGenError.message : 'Unknown error'}`
      );
    }

    // 8. Upload to Supabase Storage with tenant-scoped path
    // Path: tenants/{tenant_id}/contracts/{contract_id}/{filename}
    const serviceClient = createServiceClient();
    const bucketName = 'contracts';
    const fileName = `${fullContract.contract_number || validated.contract_id}.pdf`;
    const storagePath = `tenants/${context.tenant_id}/contracts/${validated.contract_id}/${fileName}`;

    const { data: uploadData, error: uploadError } = await serviceClient.storage
      .from(bucketName)
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true, // Overwrite if exists
      });

    if (uploadError) {
      throw uploadError; // Throw Supabase error directly
    }

    // 9. Generate signed URL (preferred) or get public URL
    let pdfUrl: string;
    try {
      // Try to get signed URL (expires in 1 year)
      const { data: signedUrlData, error: signedUrlError } =
        await serviceClient.storage
          .from(bucketName)
          .createSignedUrl(storagePath, 31536000); // 1 year expiry

      if (signedUrlError || !signedUrlData) {
        // Fallback to public URL
        const { data: publicUrlData } = serviceClient.storage
          .from(bucketName)
          .getPublicUrl(storagePath);
        pdfUrl = publicUrlData.publicUrl;
      } else {
        pdfUrl = signedUrlData.signedUrl;
      }
    } catch (urlError) {
      // Fallback to public URL
      const { data: publicUrlData } = serviceClient.storage
        .from(bucketName)
        .getPublicUrl(storagePath);
      pdfUrl = publicUrlData.publicUrl;
    }

    // 10. Update contract with PDF URL
    const { error: updateError } = await serviceClient
      .from('contracts')
      .update({ pdf_url: pdfUrl })
      .eq('id', validated.contract_id);

    if (updateError) {
      // Log but don't fail - PDF was generated successfully
    }

    // 11. Return response with filename and URL (or base64 as fallback)
    // Prefer URL, but include base64 if URL generation fails
    const response = Response.json({
      pdf: {
        filename: fileName,
        url: pdfUrl,
        // Optionally include base64 if needed (not included by default to reduce response size)
        // base64: pdfBuffer.toString('base64'),
      },
    });
    response.headers.set('X-Correlation-ID', correlationId);
    return response;
  } catch (err) {
    return toMcpErrorResponse(err, correlationId!);
  }
}
