'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/http/api';
import type { ContractWithRelations } from './use-contracts';

// Cache keys
export const contractsKeys = {
  all: ['contracts'] as const,
  lists: () => [...contractsKeys.all, 'list'] as const,
  list: (page: number, limit: number) =>
    [...contractsKeys.lists(), { page, limit }] as const,
  details: () => [...contractsKeys.all, 'detail'] as const,
  detail: (id: string) => [...contractsKeys.details(), id] as const,
};

// Types
interface ContractsResponse {
  success: boolean;
  contracts: ContractWithRelations[];
  count: number;
  total: number;
  totalContracts: number; // Actual total count from database
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

interface ContractInput {
  first_party_id: string;
  second_party_id: string;
  promoter_id: string;
  contract_start_date: string;
  contract_end_date: string;
  job_title?: string;
  work_location?: string;
  contract_value?: number;
  [key: string]: any;
}

// Fetch contracts with pagination
async function fetchContracts(
  page: number,
  limit: number
): Promise<ContractsResponse> {
  const response = await apiFetch(`/api/contracts?page=${page}&limit=${limit}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch contracts');
  }

  return data;
}

// Fetch single contract
async function fetchContract(id: string): Promise<ContractWithRelations> {
  const response = await apiFetch(`/api/contracts/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch contract');
  }

  return data.contract;
}

// Create contract
async function createContract(
  input: ContractInput
): Promise<ContractWithRelations> {
  const response = await apiFetch('/api/contracts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to create contract');
  }

  return data.contract;
}

// Update contract
async function updateContract({
  id,
  ...input
}: ContractInput & { id: string }): Promise<ContractWithRelations> {
  const response = await apiFetch(`/api/contracts/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to update contract');
  }

  return data.contract;
}

// Delete contract
async function deleteContract(id: string): Promise<void> {
  const response = await apiFetch(`/api/contracts/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

// Hook: useContractsQuery
export function useContractsQuery(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: contractsKeys.list(page, limit),
    queryFn: () => fetchContracts(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });
}

// Hook: useContractQuery
export function useContractQuery(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: contractsKeys.detail(id),
    queryFn: () => fetchContract(id),
    enabled: !!id && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook: useCreateContractMutation
export function useCreateContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createContract,
    onMutate: async (newContract) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contractsKeys.lists() });

      // Snapshot the previous value
      const previousContracts = queryClient.getQueriesData({
        queryKey: contractsKeys.lists(),
      });

      // Optimistically update all list queries
      queryClient.setQueriesData<ContractsResponse>(
        { queryKey: contractsKeys.lists() },
        (old) => {
          if (!old) return old;
          
          // Create optimistic contract with temporary ID
          const optimisticContract = {
            ...newContract,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as ContractWithRelations;

          return {
            ...old,
            contracts: [optimisticContract, ...old.contracts],
            count: old.count + 1,
            total: old.total + 1,
          };
        }
      );

      return { previousContracts };
    },
    onError: (err, newContract, context) => {
      // Revert optimistic update on error
      if (context?.previousContracts) {
        context.previousContracts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
    },
  });
}

// Hook: useUpdateContractMutation
export function useUpdateContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateContract,
    onMutate: async (updatedContract) => {
      const { id } = updatedContract;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contractsKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: contractsKeys.lists() });

      // Snapshot the previous values
      const previousContract = queryClient.getQueryData(
        contractsKeys.detail(id)
      );
      const previousContracts = queryClient.getQueriesData({
        queryKey: contractsKeys.lists(),
      });

      // Optimistically update the contract detail
      queryClient.setQueryData(contractsKeys.detail(id), updatedContract);

      // Optimistically update all list queries
      queryClient.setQueriesData<ContractsResponse>(
        { queryKey: contractsKeys.lists() },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            contracts: old.contracts.map((contract) =>
              contract.id === id
                ? { ...contract, ...updatedContract }
                : contract
            ),
          };
        }
      );

      return { previousContract, previousContracts };
    },
    onError: (err, updatedContract, context) => {
      // Revert optimistic updates on error
      if (context?.previousContract) {
        queryClient.setQueryData(
          contractsKeys.detail(updatedContract.id),
          context.previousContract
        );
      }
      if (context?.previousContracts) {
        context.previousContracts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: contractsKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
    },
  });
}

// Hook: useDeleteContractMutation
export function useDeleteContractMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteContract,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: contractsKeys.lists() });

      // Snapshot the previous value
      const previousContracts = queryClient.getQueriesData({
        queryKey: contractsKeys.lists(),
      });

      // Optimistically remove from all list queries
      queryClient.setQueriesData<ContractsResponse>(
        { queryKey: contractsKeys.lists() },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            contracts: old.contracts.filter((contract) => contract.id !== id),
            count: old.count - 1,
            total: old.total - 1,
          };
        }
      );

      return { previousContracts };
    },
    onError: (err, id, context) => {
      // Revert optimistic update on error
      if (context?.previousContracts) {
        context.previousContracts.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: contractsKeys.lists() });
    },
  });
}

