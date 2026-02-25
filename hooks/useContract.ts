import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-service';
import { useState, useEffect } from 'react';
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
    // Date fields (database uses start_date and end_date)
    start_date?: string | null;
    end_date?: string | null;
    // Legacy field names for backward compatibility
    contract_start_date?: string | null;
    contract_end_date?: string | null;
    // Title fields (database uses 'title' but some code uses 'job_title')
    title?: string | null;
    job_title?: string | null;
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

    // Use API route for better reliability and server-side auth handling
    const response = await fetch(`/api/contracts/${contractId}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error fetching contract:', errorData);

      if (response.status === 404) {
        // Contract not found
        return null;
      }

      throw new Error(
        errorData.error || errorData.message || `HTTP ${response.status}`
      );
    }

    const result = await response.json();

    if (!result.success || !result.contract) {
      console.warn('⚠️ Contract fetch returned no data');
      return null;
    }

    // Transform the API response to match ContractWithRelations type
    const contract = result.contract;

    // Handle promoter data - API returns promoters array, we need promoter object
    const promoter = contract.promoters?.[0] || null;

    const transformed: ContractWithRelations = {
      ...contract,
      promoter,
      // Ensure date fields are properly mapped
      contract_start_date: contract.contract_start_date || contract.start_date,
      contract_end_date: contract.contract_end_date || contract.end_date,
      job_title: contract.job_title || contract.title,
    };

    return transformed;
  } catch (error) {
    console.error('Error in fetchContract:', error);
    throw error;
  }
};

export function useContract(contractId: string) {
  const { user, loading: authLoading, initialLoading } = useAuth();
  const queryKey = ['contract', contractId];

  // Add timeout to prevent infinite loading if auth is stuck
  const [authTimeout, setAuthTimeout] = useState(false);

  useEffect(() => {
    // If auth is still loading after 10 seconds, proceed anyway
    const timer = setTimeout(() => {
      if (authLoading || initialLoading) {
        console.warn(
          '⚠️ Auth loading timeout reached in useContract, proceeding with query'
        );
        setAuthTimeout(true);
      }
    }, 10000);

    return () => clearTimeout(timer);
  }, [authLoading, initialLoading]);

  // Enable query after auth completes OR after timeout
  const shouldEnableQuery =
    !!contractId && ((!initialLoading && !authLoading) || authTimeout);

  const {
    data: contract,
    isLoading: queryLoading,
    error,
    refetch,
  } = useQuery<ContractWithRelations | null, Error>({
    queryKey,
    queryFn: () => fetchContract(contractId),
    // Enable query only after auth initialization is complete OR timeout
    enabled: shouldEnableQuery,
    retry: (failureCount, error) => {
      // Don't retry if contract is not found
      if (
        error?.message?.includes('No rows returned') ||
        error?.message?.includes('PGRST116')
      ) {
        return false;
      }
      return failureCount < 3;
    },
  });

  // Return loading state that includes auth initialization (but respect timeout)
  const loading =
    (!authTimeout && (authLoading || initialLoading)) || queryLoading;

  return {
    contract,
    loading,
    error: error ? error.message : null,
    refetch,
  };
}
