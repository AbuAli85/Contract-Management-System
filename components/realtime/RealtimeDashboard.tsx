'use client';

import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRealtimeMetrics } from '@/hooks/useRealtimeUpdates';
import { useToast } from '@/hooks/use-toast';

/**
 * Realtime Dashboard Wrapper
 *
 * Automatically refreshes dashboard data when changes occur
 * Wraps dashboard content with real-time subscriptions
 *
 * @example
 * ```tsx
 * <RealtimeDashboard>
 *   <DashboardContent />
 * </RealtimeDashboard>
 * ```
 */
export function RealtimeDashboard({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Subscribe to real-time updates
  useRealtimeMetrics(() => {
    // Invalidate all dashboard queries to trigger refetch
    queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    queryClient.invalidateQueries({ queryKey: ['promoter-metrics'] });
    queryClient.invalidateQueries({ queryKey: ['contract-metrics'] });

    // Optional: Show a toast notification
    toast({
      title: 'Data updated',
      description: 'Dashboard metrics have been refreshed',
      duration: 2000,
    });
  });

  return <>{children}</>;
}

/**
 * Realtime Contract List
 * Auto-updates when contracts change
 */
export function RealtimeContracts({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useRealtimeMetrics(() => {
    queryClient.invalidateQueries({ queryKey: ['contracts'] });
  });

  return <>{children}</>;
}

/**
 * Realtime Promoters List
 * Auto-updates when promoters change
 */
export function RealtimePromoters({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  useRealtimeMetrics(() => {
    queryClient.invalidateQueries({ queryKey: ['promoters'] });
  });

  return <>{children}</>;
}
