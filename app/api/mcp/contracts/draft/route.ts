// Ensure Node runtime (required for Supabase client and Buffer operations)
export const runtime = 'nodejs';

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  getMcpContext,
  assertRole,
  toMcpErrorResponse,
  createUserScopedClient,
  extractBearerToken,
  McpError,
} from '@/lib/mcp/context';

const createDraftSchema = z.object({
  template_id: z.string().uuid('template_id must be a valid UUID'),
  parties: z.record(z.unknown()).or(z.object({}).passthrough()), // Accept any object structure
  variables: z.record(z.unknown()).or(z.object({}).passthrough()), // Accept any object structure
  promoter_id: z.string().uuid('promoter_id must be a valid UUID').optional(), // Optional but recommended (required by DB schema)
});

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
    const validated = createDraftSchema.parse(body);

    // 4. Get user-scoped client
    const token = extractBearerToken(req);
    const supabase = createUserScopedClient(token);

    // 5. Verify template belongs to tenant (tenant isolation BEFORE insert)
    // Note: Templates are external (Make.com), so we store template_id in metadata
    // For now, we'll accept any template_id and store it in metadata
    // If you have a templates table, add verification here:
    // const { data: template, error: templateError } = await supabase
    //   .from('templates')
    //   .select('id, tenant_id')
    //   .eq('id', validated.template_id)
    //   .eq('tenant_id', context.tenant_id)
    //   .single();
    // if (templateError || !template) {
    //   throw new McpError('NOT_FOUND', 'Template not found or does not belong to your company');
    // }

    // 6. Extract party IDs from parties object if provided
    // Parties object may contain first_party_id, second_party_id, or other structure
    let firstPartyId: string | null = null;
    let secondPartyId: string | null = null;
    let clientId: string | null = null;
    let employerId: string | null = null;

    if (validated.parties && typeof validated.parties === 'object') {
      // Try to extract party IDs from various possible structures
      const parties = validated.parties as any;

      // Check for direct party ID fields
      if (parties.first_party_id) firstPartyId = parties.first_party_id;
      if (parties.second_party_id) secondPartyId = parties.second_party_id;
      if (parties.client_id) clientId = parties.client_id;
      if (parties.employer_id) employerId = parties.employer_id;

      // If party IDs are provided, verify they belong to tenant
      // Tenant isolation: tenant_id is the company's party_id
      // We verify that provided party IDs match the tenant_id (company's party_id)
      const partyIds = [
        firstPartyId,
        secondPartyId,
        clientId,
        employerId,
      ].filter(Boolean) as string[];

      if (partyIds.length > 0) {
        // Verify all provided party IDs match tenant_id (company's party_id)
        // In this schema, parties are the tenant identifier, so we check direct match
        const invalidParties = partyIds.filter(id => id !== context.tenant_id);

        if (invalidParties.length > 0) {
          // Additional check: verify parties exist
          const { data: partiesData, error: partiesError } = await supabase
            .from('parties')
            .select('id')
            .in('id', partyIds);

          if (partiesError) {
            throw partiesError; // Throw Supabase error directly
          }

          const foundPartyIds = (partiesData || []).map(p => p.id);
          const missingParties = partyIds.filter(
            id => !foundPartyIds.includes(id)
          );
          if (missingParties.length > 0) {
            throw new McpError(
              'NOT_FOUND',
              `Parties not found: ${missingParties.join(', ')}`
            );
          }

          // If parties don't match tenant_id, they don't belong to tenant
          // Note: Adjust this logic if your parties table has a company_id column
          throw new McpError(
            'FORBIDDEN',
            `Parties do not belong to your company: ${invalidParties.join(', ')}`
          );
        }
      }
    }

    // 7. Generate unique contract number
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    const contractNumber = `MCP-${day}${month}${year}-${random}`;

    // 8. Create contract with status='draft'
    // Store template_id, parties, and variables in metadata JSONB
    const contractData: any = {
      contract_number: contractNumber,
      title: 'Contract Draft', // Default title, can be overridden by variables
      description: '',
      contract_type: 'employment', // Default, can be overridden by variables
      status: 'draft',
      start_date: null,
      end_date: null,
      value: 0,
      currency: 'USD',
      terms: null,
      metadata: {
        template_id: validated.template_id,
        parties: validated.parties,
        variables: validated.variables,
        created_via: 'mcp',
        created_at: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    };

    // Set party IDs if provided
    if (clientId) contractData.client_id = clientId;
    if (employerId) contractData.employer_id = employerId;
    if (firstPartyId) {
      // Map first_party_id to client_id if client_id not set
      if (!contractData.client_id) contractData.client_id = firstPartyId;
    }
    if (secondPartyId) {
      // Map second_party_id to employer_id if employer_id not set
      if (!contractData.employer_id) contractData.employer_id = secondPartyId;
    }

    // Set promoter_id if provided (required by DB schema)
    if (validated.promoter_id) {
      contractData.promoter_id = validated.promoter_id;
    } else {
      // If not provided, we'll let the DB constraint error handle it
      // Alternatively, you could require it in the input schema
      throw new McpError('VALIDATION_ERROR', 'promoter_id is required');
    }

    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert(contractData)
      .select('id, status, metadata')
      .single();

    if (contractError) {
      throw contractError; // Throw Supabase error directly
    }

    if (!contract) {
      throw new McpError('INTERNAL_ERROR', 'Failed to create contract');
    }

    // 9. Return minimal safe fields matching contract exactly
    // Extract template_id from metadata for response
    const templateId =
      (contract.metadata as any)?.template_id || validated.template_id;

    const response = Response.json({
      contract: {
        id: contract.id,
        status: contract.status,
        template_id: templateId, // Return from metadata
      },
    });
    response.headers.set('X-Correlation-ID', correlationId);
    return response;
  } catch (err) {
    return toMcpErrorResponse(err, correlationId!);
  }
}
