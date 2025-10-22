'use client';

// --- Supabase setup and core utilities ---
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client'; // Initialized Supabase client
import { createContract, deleteContract } from '@/app/actions/contracts';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-service';
import { useFormContext } from '@/hooks/use-form-context';
import { devLog } from '@/lib/dev-log';
import type { Database } from '@/types';
import { useEffect } from 'react';

// --- Schema definition ---
// Detailed contract type including joined relational data
// This mirrors what the API route selects
export type ContractWithRelations = {
  id: string;
  contract_number: string | null;
  status: string | null;
  contract_start_date: string | null;
  contract_end_date: string | null;
  job_title: string | null;
  work_location: string | null;
  contract_value: number | null;
  email: string | null;
  pdf_url: string | null;
  first_party_id: string | null;
  second_party_id: string | null;
  promoter_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  first_party: {
    id: string;
    name_en: string | null;
    name_ar: string | null;
    type: 'Employer' | 'Client' | 'Generic' | null;
    status: string | null;
    email: string | null;
  } | null;
  second_party: {
    id: string;
    name_en: string | null;
    name_ar: string | null;
    type: 'Employer' | 'Client' | 'Generic' | null;
    status: string | null;
    email: string | null;
  } | null;
  promoters: {
    id: string;
    name_en: string | null;
    name_ar: string | null;
    email: string | null;
    mobile_number: string | null;
    job_title: string | null;
  } | null;
};
// Minimal fields required when creating a new contract
export type ContractInsert =
  Database['public']['Tables']['contracts']['Insert'];

// --- Queries ---
// Fetch all contracts with their related party and promoter info
const fetchContracts = async (): Promise<ContractWithRelations[]> => {
  try {
    const response = await fetch('/api/contracts?page=1&limit=100');
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch contracts');
    }
    
    // Debug: Log the fetched data to see what we're getting
    devLog('📊 Fetched contracts data:', result.contracts);
    if (result.contracts && result.contracts.length > 0) {
      devLog('📊 Sample contract structure:', result.contracts[0]);
    }
    
    return result.contracts || [];
  } catch (error) {
    devLog('Error fetching contracts:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch contracts');
  }
};

export const useContracts = () => {
  const queryClient = useQueryClient();
  const queryKey = ['contracts'];
  const { user } = useAuth();
  const { isFormActive } = useFormContext();

  // --- Data fetching with React Query ---
  const queryResult = useQuery<ContractWithRelations[], Error>({
    queryKey: queryKey,
    queryFn: fetchContracts,
    enabled: user !== null, // Only run query when we know auth status
  });

  // --- Realtime subscription ---
  useEffect(() => {
    if (user === null) {
      return;
    }

    // Don't set up realtime if user is not authenticated
    if (!user) {
      devLog(
        'User not authenticated, skipping realtime subscription for contracts'
      );
      return;
    }

    // Don't set up realtime if forms are active (prevents interruptions)
    if (isFormActive) {
      devLog('Forms are active, skipping realtime subscription for contracts');
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    let retryTimeout: NodeJS.Timeout;
    let channel: any = null;

    const setupSubscription = () => {
      try {
        const supabaseClient = createClient();
        if (!supabaseClient) {
          throw new Error('Failed to initialize Supabase client');
        }
        const newChannel = supabaseClient
          .channel('public-contracts-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'contracts' },
            payload => {
              devLog('Realtime contract change received!', payload);
              queryClient.invalidateQueries({ queryKey: queryKey });
            }
          )
          .subscribe((status, err) => {
            if (status === 'SUBSCRIBED') {
              devLog('Subscribed to contracts channel!');
              retryCount = 0; // Reset retry count on successful connection
            }
            if (status === 'CHANNEL_ERROR') {
              const message = err?.message ?? 'Unknown channel error';
              devLog(`Contracts channel error (${status}): ${message}`);

              // Check if it's an authentication error
              if (
                message.includes('JWT') ||
                message.includes('auth') ||
                message.includes('permission')
              ) {
                devLog(
                  'Authentication error detected for contracts, will retry after auth check'
                );
                // Don't retry immediately, let the auth state change handler deal with it
                return;
              }

              // Retry connection if we haven't exceeded max retries
              if (retryCount < maxRetries) {
                retryCount++;
                devLog(
                  `Retrying contracts subscription (${retryCount}/${maxRetries})...`
                );
                retryTimeout = setTimeout(() => {
                  if (channel) {
                    const supabaseClient = createClient();
                    if (supabaseClient) {
                      supabaseClient.removeChannel(channel);
                    }
                  }
                  setupSubscription();
                }, 2000 * retryCount); // Exponential backoff
              } else {
                devLog('Max retries exceeded for contracts subscription');
              }
            }
            if (status === 'TIMED_OUT') {
              devLog(`Subscription timed out (${status})`);

              // Retry connection if we haven't exceeded max retries
              if (retryCount < maxRetries) {
                retryCount++;
                devLog(
                  `Retrying contracts subscription after timeout (${retryCount}/${maxRetries})...`
                );
                retryTimeout = setTimeout(() => {
                  if (channel) {
                    const supabaseClient = createClient();
                    if (supabaseClient) {
                      supabaseClient.removeChannel(channel);
                    }
                  }
                  setupSubscription();
                }, 2000 * retryCount); // Exponential backoff
              } else {
                devLog(
                  'Max retries exceeded for contracts subscription after timeout'
                );
              }
            }
          });

        return newChannel;
      } catch (error) {
        devLog('Error setting up contracts subscription:', error);
        return null;
      }
    };

    channel = setupSubscription();

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (channel) {
        const supabaseClient = createClient();
        if (supabaseClient) {
          supabaseClient.removeChannel(channel);
        }
      }
    };
  }, [queryClient, queryKey, user, isFormActive]);

  return queryResult;
};

// Create a new contract
const createContractInSupabase = async (
  newContract: ContractInsert
): Promise<ContractWithRelations> => {
  const data = await createContract(newContract);
  return data as ContractWithRelations;
};

// --- Form submission: create contract ---
export const useCreateContractMutation = () => {
  const queryClient = useQueryClient();
  return useMutation<ContractWithRelations, Error, ContractInsert>({
    mutationFn: createContractInSupabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
    },
  });
};

// --- Form submission: delete contract ---
const deleteContractInSupabase = async (contractId: string): Promise<void> => {
  await deleteContract(contractId);
};

export const useDeleteContractMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation<void, Error, string>({
    // contractId is a string
    mutationFn: deleteContractInSupabase,
    onSuccess: (_data, contractId) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      // Optionally, for optimistic updates:
      // queryClient.setQueryData(['contracts'], (oldData: ContractWithRelations[] | undefined) =>
      //   oldData ? oldData.filter(contract => contract.id !== contractId) : []
      // );
    },
    onError: error => {
      devLog('Error deleting contract:', error);
      toast({
        title: 'Error',
        description: `Failed to delete contract: ${error.message}`,
        variant: 'destructive',
      });
    },
  });
};

/*
Enhancement Summary:
- Documented Supabase initialization and utilities.
- Added comments for schema types and data fetching queries.
- Explained realtime subscriptions and mutation logic.
- Provided context for create/delete contract operations.
*/
