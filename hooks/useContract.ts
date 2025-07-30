import { useQuery } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { useCallback } from "react"
import type { Database } from "@/types/supabase"

export type ContractWithRelations = Database["public"]["Tables"]["contracts"]["Row"] & {
  first_party?: any
  second_party?: any
  promoter?: any
}

const fetchContract = async (contractId: string): Promise<ContractWithRelations | null> => {
  try {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("contracts")
      .select(
        `*,
        first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
        promoter:promoters!contracts_promoter_id_fkey(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status)`,
      )
      .eq("id", contractId)
      .single()

    if (error) {
      console.error("Error fetching contract:", error)
      if (error.code === "PGRST116") {
        // No rows returned - contract not found
        return null
      }
      throw new Error(error.message)
    }

    return data as ContractWithRelations
  } catch (error) {
    console.error("Error in fetchContract:", error)
    throw error
  }
}

export function useContract(contractId: string) {
  const { user } = useAuth()
  const queryKey = ["contract", contractId]

  const {
    data: contract,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<ContractWithRelations | null, Error>({
    queryKey,
    queryFn: () => fetchContract(contractId),
    enabled: !!contractId && user !== null,
    retry: (failureCount, error) => {
      // Don't retry if contract is not found
      if (error.message.includes("No rows returned") || error.message.includes("PGRST116")) {
        return false
      }
      return failureCount < 3
    },
  })

  return {
    contract,
    loading,
    error: error ? error.message : null,
    refetch,
  }
}
