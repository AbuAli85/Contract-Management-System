'use client';

import { useQuery } from '@tanstack/react-query';

// Cache keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

// Types
interface DashboardStats {
  total_contracts: number;
  active_contracts: number;
  expired_contracts: number;
  expiring_soon: number;
  total_parties: number;
  total_promoters: number;
  total_value: number;
  [key: string]: any;
}

// Fetch dashboard stats
async function fetchDashboardStats(): Promise<DashboardStats> {
  const response = await fetch('/api/dashboard/stats');

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch dashboard stats');
  }

  return data.stats;
}

// Hook: useDashboardStatsQuery
export function useDashboardStatsQuery() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: fetchDashboardStats,
    staleTime: 1 * 60 * 1000, // 1 minute - stats change frequently
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

