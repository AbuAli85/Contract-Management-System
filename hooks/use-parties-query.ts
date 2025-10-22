'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Party } from '@/lib/types';

// Cache keys
export const partiesKeys = {
  all: ['parties'] as const,
  lists: () => [...partiesKeys.all, 'list'] as const,
  list: (page: number, limit: number) =>
    [...partiesKeys.lists(), { page, limit }] as const,
  details: () => [...partiesKeys.all, 'detail'] as const,
  detail: (id: string) => [...partiesKeys.details(), id] as const,
};

// Types
interface PartiesResponse {
  success: boolean;
  parties: Party[];
  count: number;
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

interface PartyInput {
  name_en: string;
  name_ar: string;
  crn?: string;
  type?: string;
  role?: string;
  cr_expiry?: string;
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  address_en?: string;
  tax_number?: string;
  license_number?: string;
  license_expiry?: string;
  status?: string;
  notes?: string;
}

// Fetch parties with pagination and timeout
async function fetchParties(
  page: number,
  limit: number
): Promise<PartiesResponse> {
  // Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const response = await fetch(`/api/parties?page=${page}&limit=${limit}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch {
        // If parsing fails, use default error message
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || data.details || 'Failed to fetch parties');
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof Error) {
      // Handle abort/timeout errors
      if (error.name === 'AbortError') {
        throw new Error('Request timeout: The server took too long to respond. Please try again.');
      }
      // Handle network errors
      if (error.message.includes('fetch')) {
        throw new Error('Network error: Please check your internet connection and try again.');
      }
    }
    
    throw error;
  }
}

// Fetch single party
async function fetchParty(id: string): Promise<Party> {
  const response = await fetch(`/api/parties/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch party');
  }

  return data.party;
}

// Create party
async function createParty(input: PartyInput): Promise<Party> {
  const response = await fetch('/api/parties', {
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
    throw new Error(data.error || 'Failed to create party');
  }

  return data.party;
}

// Update party
async function updateParty({
  id,
  ...input
}: PartyInput & { id: string }): Promise<Party> {
  const response = await fetch(`/api/parties/${id}`, {
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
    throw new Error(data.error || 'Failed to update party');
  }

  return data.party;
}

// Delete party
async function deleteParty(id: string): Promise<void> {
  const response = await fetch(`/api/parties/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
}

// Hook: usePartiesQuery with retry logic
export function usePartiesQuery(page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: partiesKeys.list(page, limit),
    queryFn: () => fetchParties(page, limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    // Retry configuration with exponential backoff
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // exponential backoff: 1s, 2s, 4s
  });
}

// Hook: usePartyQuery
export function usePartyQuery(id: string, enabled: boolean = true) {
  return useQuery({
    queryKey: partiesKeys.detail(id),
    queryFn: () => fetchParty(id),
    enabled: !!id && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Hook: useCreatePartyMutation
export function useCreatePartyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createParty,
    onMutate: async (newParty) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: partiesKeys.lists() });

      // Snapshot the previous value
      const previousParties = queryClient.getQueriesData({
        queryKey: partiesKeys.lists(),
      });

      // Optimistically update all list queries
      queryClient.setQueriesData<PartiesResponse>(
        { queryKey: partiesKeys.lists() },
        (old) => {
          if (!old) return old;

          // Create optimistic party with temporary ID
          const optimisticParty = {
            ...newParty,
            id: `temp-${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as Party;

          return {
            ...old,
            parties: [optimisticParty, ...old.parties],
            count: old.count + 1,
            total: old.total + 1,
          };
        }
      );

      return { previousParties };
    },
    onError: (err, newParty, context) => {
      // Revert optimistic update on error
      if (context?.previousParties) {
        context.previousParties.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: partiesKeys.lists() });
    },
  });
}

// Hook: useUpdatePartyMutation
export function useUpdatePartyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateParty,
    onMutate: async (updatedParty) => {
      const { id } = updatedParty;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: partiesKeys.detail(id) });
      await queryClient.cancelQueries({ queryKey: partiesKeys.lists() });

      // Snapshot the previous values
      const previousParty = queryClient.getQueryData(partiesKeys.detail(id));
      const previousParties = queryClient.getQueriesData({
        queryKey: partiesKeys.lists(),
      });

      // Optimistically update the party detail
      queryClient.setQueryData(partiesKeys.detail(id), updatedParty);

      // Optimistically update all list queries
      queryClient.setQueriesData(
        { queryKey: partiesKeys.lists() },
        (old: PartiesResponse | undefined): PartiesResponse | undefined => {
          if (!old) return old;

          return {
            ...old,
            parties: old.parties.map((party) =>
              party.id === id ? ({ ...party, ...updatedParty } as Party) : party
            ),
          };
        }
      );

      return { previousParty, previousParties };
    },
    onError: (err, updatedParty, context) => {
      // Revert optimistic updates on error
      if (context?.previousParty) {
        queryClient.setQueryData(
          partiesKeys.detail(updatedParty.id),
          context.previousParty
        );
      }
      if (context?.previousParties) {
        context.previousParties.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch
      queryClient.invalidateQueries({
        queryKey: partiesKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: partiesKeys.lists() });
    },
  });
}

// Hook: useDeletePartyMutation
export function useDeletePartyMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteParty,
    onMutate: async (id) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: partiesKeys.lists() });

      // Snapshot the previous value
      const previousParties = queryClient.getQueriesData({
        queryKey: partiesKeys.lists(),
      });

      // Optimistically remove from all list queries
      queryClient.setQueriesData<PartiesResponse>(
        { queryKey: partiesKeys.lists() },
        (old) => {
          if (!old) return old;

          return {
            ...old,
            parties: old.parties.filter((party) => party.id !== id),
            count: old.count - 1,
            total: old.total - 1,
          };
        }
      );

      return { previousParties };
    },
    onError: (err, id, context) => {
      // Revert optimistic update on error
      if (context?.previousParties) {
        context.previousParties.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: partiesKeys.lists() });
    },
  });
}

