"use server"

import { createServerComponentClient } from "@/lib/supabaseServer"
import type { Database } from "@/types/supabase"
import { getContractGenerationService } from "@/lib/contract-generation-service"

export type ContractInsert = Database["public"]["Tables"]["contracts"]["Insert"]

export async function createContract(newContract: ContractInsert) {
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase
    .from("contracts")
    .insert(newContract)
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
       first_party:parties!contracts_first_party_id_fkey (id, name_en, name_ar, crn, type),
       second_party:parties!contracts_second_party_id_fkey (id, name_en, name_ar, crn, type),
       promoters (id, name_en, name_ar, id_card_number, id_card_url, passport_url, status)`,
    )
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Contract creation failed, no data returned.")
  return data
}

export async function generateContractWithMakecom(contractData: {
  first_party_id: string
  second_party_id: string
  promoter_id: string
  contract_start_date: Date
  contract_end_date?: Date
  email: string
  job_title: string
  work_location: string
  department: string
  contract_type: string
  currency: string
  basic_salary?: number
  allowances?: number
  special_terms?: string
}) {
  try {
    // Basic validation to prevent common errors
    if (!contractData.first_party_id || !contractData.second_party_id || !contractData.promoter_id) {
      throw new Error("Missing required party or promoter information.");
    }
    if (!contractData.contract_start_date) {
      throw new Error("Contract start date is required.");
    }

    const contractService = getContractGenerationService()

    // Convert to the expected format, handling optional contract_end_date
    const generationData = {
      ...contractData,
      // Dates should be Date objects as expected by the service
      contract_start_date: new Date(contractData.contract_start_date),
      contract_end_date: contractData.contract_end_date 
        ? new Date(contractData.contract_end_date)
        : new Date(new Date(contractData.contract_start_date).setFullYear(new Date(contractData.contract_start_date).getFullYear() + 1)), // Default to 1 year if not provided
    }

    const result = await contractService.generateContract(generationData)

    if (!result.success) {
      // Provide a more specific error message if available
      throw new Error(result.message || "Contract generation failed in the service layer.");
    }

    // Return the contract data in the expected format
    return {
      id: result.contract_id,
      contract_number: result.contract_number,
      status: result.status,
      pdf_url: result.pdf_url,
      google_drive_url: result.google_drive_url,
      message: result.message || "Contract generated successfully.",
      success: true,
    }
  } catch (error) {
    console.error("[generateContractWithMakecom] Error:", error);
    // Re-throw a structured error to be caught by the client
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred during contract generation.",
    };
  }
}

export async function deleteContract(contractId: string) {
  const supabase = await createServerComponentClient()
  const { error } = await supabase.from("contracts").delete().eq("id", contractId)
  if (error) throw new Error(error.message)
}

export async function updateContract(contractId: string, updatedContract: Partial<ContractInsert>) {
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase
    .from("contracts")
    .update(updatedContract)
    .eq("id", contractId)
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
       first_party:parties!contracts_first_party_id_fkey (id, name_en, name_ar, crn, type),
       second_party:parties!contracts_second_party_id_fkey (id, name_en, name_ar, crn, type),
       promoters (id, name_en, name_ar, id_card_number, id_card_url, passport_url, status)`,
    )
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error("Contract update failed, no data returned.")
  return data
}

export async function getContractById(contractId: string) {
  const supabase = await createServerComponentClient()
  const { data, error } = await supabase
    .from("contracts")
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
       first_party:parties!contracts_first_party_id_fkey (id, name_en, name_ar, crn, type),
       second_party:parties!contracts_second_party_id_fkey (id, name_en, name_ar, crn, type),
       promoters (id, name_en, name_ar, id_card_number, id_card_url, passport_url, status)`,
    )
    .eq("id", contractId)
    .single()

  if (error) throw new Error(error.message)
  if (!data) throw new Error(`Contract with id ${contractId} not found.`)
  return data
}
