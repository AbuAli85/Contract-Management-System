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
    const contractService = getContractGenerationService()

    // Convert to the expected format, handling optional contract_end_date
    const generationData = {
      ...contractData,
      contract_end_date:
        contractData.contract_end_date || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Default to 1 year from now if not provided
    }

    const result = await contractService.generateContract(generationData)

    if (!result.success) {
      throw new Error(result.message || "Contract generation failed")
    }

    // Return the contract data in the expected format
    return {
      id: result.contract_id,
      contract_number: result.contract_number,
      status: result.status,
      pdf_url: result.pdf_url,
      google_drive_url: result.google_drive_url,
      message: result.message,
      success: true,
    }
  } catch (error) {
    console.error("Contract generation error:", error)
    throw new Error(error instanceof Error ? error.message : "Contract generation failed")
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
