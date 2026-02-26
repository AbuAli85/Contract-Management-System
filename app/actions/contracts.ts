'use server';

import { createServerComponentClient } from '@/lib/supabaseServer';
import { nanoid } from 'nanoid';
import type { Database } from '@/types/supabase';
import { getContractGenerationService } from '@/lib/contract-generation-service';
import { ensureUserProfile } from '@/lib/ensure-user-profile';
import { createClient } from '@/lib/supabase/server';

export type ContractInsert =
  Database['public']['Tables']['contracts']['Insert'];

export async function createContract(newContract: ContractInsert) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User must be authenticated to create a contract.');
  }

  // Ensure the user has a profile before proceeding
  await ensureUserProfile(user);

  // Normalize optional fields and dates to avoid 500s from invalid payloads
  // Generate a robust contract number if missing (PAC-DDMMYYYY-XXXX)
  const now = new Date();
  const day = now.getDate().toString().padStart(2, '0');
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const year = now.getFullYear();
  const random = nanoid(4).toUpperCase();
  const generatedNumber = `PAC-${day}${month}${year}-${random}`;

  const asAny: any = newContract as any;

  // Map contract_start_date/contract_end_date to start_date/end_date if needed
  const startDate = asAny.contract_start_date || asAny.start_date;
  const endDate = asAny.contract_end_date || asAny.end_date;

  // Create base payload with proper date mapping
  // Note: email, job_title, work_location, department are not part of ContractInsert type
  // They may exist in the database but are not in the TypeScript types
  const basePayload: ContractInsert = {
    ...newContract,
    contract_number: (asAny.contract_number as string) || generatedNumber,
    start_date: startDate
      ? (new Date(startDate as unknown as string)
          .toISOString()
          .split('T')[0] as string)
      : newContract.start_date,
    end_date: endDate
      ? (new Date(endDate as unknown as string)
          .toISOString()
          .split('T')[0] as string)
      : newContract.end_date,
    currency: asAny.currency ?? 'OMR',
    contract_value: asAny.contract_value ?? asAny.basic_salary ?? null,
    first_party_id: asAny.first_party_id ?? newContract.first_party_id ?? null,
    second_party_id:
      asAny.second_party_id ?? newContract.second_party_id ?? null,
    promoter_id: asAny.promoter_id ?? newContract.promoter_id ?? null,
    status: (asAny.status as string) ?? 'draft',
    created_at: (asAny.created_at as string) ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Add legacy field names and extra fields for backward compatibility (cast to any to bypass type check)
  const safePayload = {
    ...basePayload,
    // Legacy date field names
    contract_start_date: startDate
      ? (new Date(startDate as unknown as string).toISOString() as any)
      : (null as any),
    contract_end_date: endDate
      ? (new Date(endDate as unknown as string).toISOString() as any)
      : (null as any),
    // Extra fields that may exist in database but not in TypeScript types
    email: asAny.email ?? null,
    job_title: asAny.job_title ?? null,
    work_location: asAny.work_location ?? null,
    department: asAny.department ?? null,
  } as any;

  const { data, error } = await supabase
    .from('contracts')
    .insert(safePayload)
    .select(
      `id,
       company_id,
       created_at,
       job_title,
       contract_start_date,
       contract_end_date,
       status,
       pdf_url,
       contract_number,
       contract_value,
       email,
       first_party_id,
       second_party_id,
       promoter_id,
       first_party:parties!contracts_employer_id_fkey (id, name_en, name_ar, crn, type),
       second_party:parties!contracts_client_id_fkey (id, name_en, name_ar, crn, type),
       promoter_id`
    )
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Contract creation failed, no data returned.');

  // Best-effort: ensure a workflow instance and initial "created" event exist
  try {
    // Create workflow instance for this contract
    const { data: workflowInstance, error: workflowError } = await supabase
      .from('workflow_instances')
      .insert({
        company_id: (data as any).company_id,
        entity_type: 'contract',
        entity_id: data.id,
        current_state: 'draft',
      })
      .select('id, company_id')
      .single();

    if (!workflowError && workflowInstance) {
      // Write initial workflow event
      await supabase.from('workflow_events').insert({
        company_id: workflowInstance.company_id,
        workflow_instance_id: workflowInstance.id,
        action: 'created',
        performed_by: user.id,
        previous_state: null,
        new_state: 'draft',
        metadata: {},
      });
    }
  } catch {
    // Swallow workflow errors to avoid breaking core contract creation.
  }

  return data;
}

export async function generateContractWithMakecom(contractData: {
  first_party_id: string;
  second_party_id: string;
  promoter_id: string;
  contract_start_date: Date;
  contract_end_date?: Date;
  email: string;
  job_title: string;
  work_location: string;
  department: string;
  contract_type: string;
  currency: string;
  basic_salary?: number;
  allowances?: number;
  special_terms?: string;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('User must be authenticated to generate a contract.');
    }

    // Ensure the user has a profile before proceeding
    await ensureUserProfile(user);

    // Basic validation to prevent common errors
    if (
      !contractData.first_party_id ||
      !contractData.second_party_id ||
      !contractData.promoter_id
    ) {
      throw new Error('Missing required party or promoter information.');
    }
    if (!contractData.contract_start_date) {
      throw new Error('Contract start date is required.');
    }

    const contractService = getContractGenerationService();

    // Convert to the expected format, handling optional contract_end_date
    const generationData = {
      ...contractData,
      // Dates should be Date objects as expected by the service
      contract_start_date: new Date(contractData.contract_start_date),
      contract_end_date: contractData.contract_end_date
        ? new Date(contractData.contract_end_date)
        : new Date(
            new Date(contractData.contract_start_date).setFullYear(
              new Date(contractData.contract_start_date).getFullYear() + 1
            )
          ), // Default to 1 year if not provided
    };

    const result = await contractService.generateContract(generationData);

    if (!result.success) {
      // Provide a more specific error message if available
      throw new Error(
        result.message || 'Contract generation failed in the service layer.'
      );
    }

    // Return the contract data in the expected format
    return {
      id: result.contract_id,
      contract_number: result.contract_number,
      status: result.status,
      pdf_url: result.pdf_url,
      google_drive_url: result.google_drive_url,
      message: result.message || 'Contract generated successfully.',
      success: true,
    };
  } catch (error) {

    // Re-throw a structured error to be caught by the client
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : 'An unknown error occurred during contract generation.',
    };
  }
}

export async function deleteContract(contractId: string) {
  const supabase = await createServerComponentClient();
  const { error } = await supabase
    .from('contracts')
    .delete()
    .eq('id', contractId);
  if (error) throw new Error(error.message);
}

export async function updateContract(
  contractId: string,
  updatedContract: Partial<ContractInsert>
) {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('contracts')
    .update(updatedContract)
    .eq('id', contractId)
    .select(
      `id,
       created_at,
       job_title,
       contract_start_date,
       contract_end_date,
       status,
       pdf_url,
       contract_number,
       contract_value,
       email,
       first_party_id,
       second_party_id,
       promoter_id,
       first_party:parties!contracts_employer_id_fkey (id, name_en, name_ar, crn, type),
       second_party:parties!contracts_client_id_fkey (id, name_en, name_ar, crn, type),
       promoter_id`
    )
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Contract update failed, no data returned.');
  return data;
}

export async function getContractById(contractId: string) {
  const supabase = await createServerComponentClient();
  const { data, error } = await supabase
    .from('contracts')
    .select(
      `id,
       created_at,
       job_title,
       contract_start_date,
       contract_end_date,
       status,
       pdf_url,
       contract_number,
       contract_value,
       email,
       first_party_id,
       second_party_id,
       promoter_id,
       first_party:parties!contracts_employer_id_fkey (id, name_en, name_ar, crn, type),
       second_party:parties!contracts_client_id_fkey (id, name_en, name_ar, crn, type),
       promoter_id`
    )
    .eq('id', contractId)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Contract with id ${contractId} not found.`);
  return data;
}
