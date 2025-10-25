import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-service';
import { useCallback } from 'react';
import type { Database } from '@/types/supabase';

export type ContractWithRelations =
  Database['public']['Tables']['contracts']['Row'] & {
    // Override status to be required
    status: string;
    // Additional fields that exist in the database but may not be in the base type
    pdf_url?: string | null;
    work_location?: string | null;
    contract_value?: number | null;
    email?: string | null;
    // Relational data
    first_party?: {
      id: string;
      name_en: string;
      name_ar: string | null;
      email: string | null;
      phone: string | null;
      type?: string | null;
      crn?: string | null;
      address?: string | null;
    } | null;
    second_party?: {
      id: string;
      name_en: string;
      name_ar: string | null;
      email: string | null;
      phone: string | null;
      type?: string | null;
      crn?: string | null;
      address?: string | null;
    } | null;
    promoter?: {
      id: string;
      name_en: string;
      name_ar: string | null;
      email: string | null;
      phone: string | null;
      id_card_number: string | null;
      id_card_url: string | null;
      passport_url: string | null;
      status: string | null;
    } | null;
    // Legacy fields for backward compatibility
    promoters?: {
      id: string;
      name_en: string;
      name_ar: string | null; 
      email: string | null;
      id_card_number: string | null;
      id_card_url: string | null;
      passport_url: string | null;
      status: string | null;
    } | null;
    // Additional contract-specific fields that might come from promoter
    id_card_number?: string | null;
  };

const fetchContract = async (
  contractId: string
): Promise<ContractWithRelations | null> => {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contracts')
      .select(
        `*,
        first_party:parties!contracts_employer_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_client_id_fkey(id,name_en,name_ar,crn,type),
        promoter_id`
      )
      .eq('id', contractId)
      .single();

    if (error) {
      console.error('Error fetching contract:', error);
      if (error.code === 'PGRST116') {
        // No rows returned - contract not found
        return null;
      }
      throw new Error(error.message);
    }

    return data as ContractWithRelations;
  } catch (error) {
    console.error('Error in fetchContract:', error);
    throw error;
  }
};

export function useContract(contractId: string) {
  const { user } = useAuth();
  const queryKey = ['contract', contractId];

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
      if (
        error.message.includes('No rows returned') ||
        error.message.includes('PGRST116')
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  return {
    contract,
    loading,
    error: error ? error.message : null,
    refetch,
  };
}
