/**
 * Infinite scroll hook with intersection observer for dashboard optimization
 * Part of Critical Path Optimization Guide implementation
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

interface UseInfiniteScrollOptions<T> {
  initialData?: T[];
  pageSize?: number;
  fetchNextPage: (
    page: number,
    pageSize: number
  ) => Promise<{
    data: T[];
    hasMore: boolean;
    totalCount?: number;
  }>;
  enabled?: boolean;
  threshold?: number;
  rootMargin?: string;
}

interface UseInfiniteScrollReturn<T> {
  data: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  refresh: () => void;
  totalCount: number;
  ref: (node?: Element | null) => void;
  inView: boolean;
}

export function useInfiniteScroll<T>({
  initialData = [],
  pageSize = 20,
  fetchNextPage,
  enabled = true,
  threshold = 0.1,
  rootMargin = '100px',
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [data, setData] = useState<T[]>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const isInitialLoad = useRef(true);

  // Intersection observer for trigger element
  const { ref, inView } = useInView({
    threshold,
    rootMargin,
  });

  const loadPage = useCallback(
    async (pageNum: number, isRefresh = false) => {
      if (!enabled) return;

      try {
        if (isRefresh) {
          setIsLoading(true);
          setError(null);
        } else {
          setIsLoadingMore(true);
        }

        const result = await fetchNextPage(pageNum, pageSize);

        if (isRefresh || pageNum === 1) {
          setData(result.data);
        } else {
          setData(prev => [...prev, ...result.data]);
        }

        setHasMore(result.hasMore);
        if (result.totalCount !== undefined) {
          setTotalCount(result.totalCount);
        }

        setError(null);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        console.error('Infinite scroll error:', err);
      } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
      }
    },
    [enabled, fetchNextPage, pageSize]
  );

  // Load more data when intersection observer triggers
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && enabled) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadPage(nextPage);
    }
  }, [isLoadingMore, hasMore, page, loadPage, enabled]);

  // Refresh data (reset to page 1)
  const refresh = useCallback(() => {
    setPage(1);
    setHasMore(true);
    loadPage(1, true);
  }, [loadPage]);

  // Auto-load more when scrolled into view
  useEffect(() => {
    if (inView && hasMore && !isLoadingMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isLoadingMore, isLoading, loadMore]);

  // Initial load
  useEffect(() => {
    if (isInitialLoad.current && enabled) {
      isInitialLoad.current = false;
      loadPage(1, true);
    }
  }, [enabled, loadPage]);

  return {
    data,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh,
    totalCount,
    ref,
    inView,
  };
}

// Specialized hook for contracts with search and filters
export function useInfiniteContracts({
  searchQuery = '',
  filters = {},
  enabled = true,
}: {
  searchQuery?: string;
  filters?: Record<string, any>;
  enabled?: boolean;
} = {}) {
  const fetchContractsPage = useCallback(
    async (page: number, pageSize: number) => {
      const response = await fetch('/api/contracts/paginated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          pageSize,
          search: searchQuery,
          filters,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch contracts');
      }

      return response.json();
    },
    [searchQuery, filters]
  );

  return useInfiniteScroll({
    fetchNextPage: fetchContractsPage,
    pageSize: 20,
    enabled,
  });
}

// Hook for dashboard analytics with infinite scroll
export function useInfiniteDashboardData({
  timeRange = '30d',
  enabled = true,
}: {
  timeRange?: string;
  enabled?: boolean;
} = {}) {
  const fetchDashboardPage = useCallback(
    async (page: number, pageSize: number) => {
      const response = await fetch('/api/dashboard/analytics/paginated', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          page,
          pageSize,
          timeRange,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      return response.json();
    },
    [timeRange]
  );

  return useInfiniteScroll({
    fetchNextPage: fetchDashboardPage,
    pageSize: 15,
    enabled,
  });
}
