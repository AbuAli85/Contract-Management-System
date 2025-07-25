import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useCallback } from "react";
import type { Database } from "@/types/supabase";

export type ContractWithRelations = Database["public"]["Tables"]["contracts"]["Row"] & {
  first_party?: any;
  second_party?: any;
  promoter?: any;
};

const fetchContract = async (contractId: string): Promise<ContractWithRelations | null> => {
  const { data, error } = await supabase
    .from("contracts")
    .select(
      `*,
      first_party:parties!contracts_first_party_id_fkey(id,name_en,name_ar,crn,type),
      second_party:parties!contracts_second_party_id_fkey(id,name_en,name_ar,crn,type),
      promoter:promoters!contracts_promoter_id_fkey(id,name_en,name_ar,id_card_number,id_card_url,passport_url,status,email,phone)`
    )
    .eq("id", contractId)
    .single();
  if (error) throw new Error(error.message);
  return data as ContractWithRelations;
};

export function useContract(contractId: string) {
  const { isAuthenticated } = useAuth();
  const queryKey = ["contract", contractId];

  const {
    data: contract,
    isLoading: loading,
    error,
    refetch,
  } = useQuery<ContractWithRelations | null, Error>({
    queryKey,
    queryFn: () => fetchContract(contractId),
    enabled: !!contractId && isAuthenticated !== null,
  });

  return {
    contract,
    loading,
    error: error ? error.message : null,
    refetch,
  };
} 