import type { ContractWithRelations } from '@/hooks/use-contracts';
import { createClient } from '@/lib/supabase/client';

export const getContract = async (
  contractId: string
): Promise<ContractWithRelations | null> => {
  if (!contractId) {
    console.warn('getContract called with no contractId');
    return null;
  }

  try {
    const supabaseClient = createClient();
    const { data, error } = await supabaseClient
      .from('contracts')
      .select(
        `
        *,
        first_party:parties!contracts_employer_id_fkey(id,name_en,name_ar,crn,type),
        second_party:parties!contracts_client_id_fkey(id,name_en,name_ar,crn,type),
        promoter_id
      `
      )
      .eq('id', contractId)
      .single();

    if (error) {
      console.error('Error fetching contract:', error.message);
      // Consider how to handle errors. Throwing might be appropriate for React Query's error state.
      // If the error is because the contract doesn't exist (e.g., RLS or actual missing row),
      // Supabase often returns a specific error code or null data.
      if (error.code === 'PGRST116') {
        // PGRST116: "The result contains 0 rows"
        return null; // Contract not found
      }
      throw error;
    }
    return data as ContractWithRelations | null;
  } catch (error) {
    console.error('Error in getContract:', error);
    return null;
  }
};
