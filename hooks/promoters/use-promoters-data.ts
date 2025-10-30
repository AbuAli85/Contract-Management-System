/**
 * Custom hook for managing promoters data fetching and caching
 * 
 * Centralizes data fetching logic, error handling, and state management
 * for the promoters list view.
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { safeFetch, logAPIError } from '@/lib/api/api-error-handler';
import type { Promoter } from '@/lib/types';

export interface PromotersResponse {
  success: boolean;
  promoters: Promoter[];
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

export interface UsePromotersDataOptions {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  staleTime?: number;
  refetchInterval?: number | false;
  enabled?: boolean;
}

/**
 * Hook to fetch and manage promoters data
 */
export function usePromotersData(
  options: UsePromotersDataOptions = {}
): UseQueryResult<PromotersResponse, Error> {
  const {
    page = 1,
    limit = 100,
    search,
    status,
    staleTime = 30000, // 30 seconds
    refetchInterval = false,
    enabled = true,
  } = options;

  // Build query parameters
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (search) params.set('search', search);
  if (status && status !== 'all') params.set('status', status);

  return useQuery<PromotersResponse, Error>({
    queryKey: ['promoters', { page, limit, search, status }],
    queryFn: async () => {
      try {
        const url = `/api/promoters?${params.toString()}`;
        const data = await safeFetch<PromotersResponse>(url);

        // Validate response structure
        if (!data.success || !Array.isArray(data.promoters)) {
          throw new Error('Invalid response format from promoters API');
        }

        return data;
      } catch (error) {
        logAPIError(error, { page, limit, search, status });
        throw error;
      }
    },
    staleTime,
    refetchInterval,
    enabled,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
  });
}

/**
 * Hook for single promoter details
 */
export function usePromoterDetails(
  promoterId: string | null
): UseQueryResult<Promoter, Error> {
  return useQuery<Promoter, Error>({
    queryKey: ['promoter', promoterId],
    queryFn: async () => {
      if (!promoterId) {
        throw new Error('Promoter ID is required');
      }

      try {
        const data = await safeFetch<{ success: boolean; promoter: Promoter }>(
          `/api/promoters/${promoterId}`
        );

        if (!data.success || !data.promoter) {
          throw new Error('Promoter not found');
        }

        return data.promoter;
      } catch (error) {
        logAPIError(error, { promoterId });
        throw error;
      }
    },
    enabled: !!promoterId,
    staleTime: 60000, // 1 minute
    retry: 1,
  });
}

/**
 * Build query key for cache invalidation
 */
export function getPromotersQueryKey(filters?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): any[] {
  if (!filters) {
    return ['promoters'];
  }

  return ['promoters', filters];
}

