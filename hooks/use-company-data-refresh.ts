/**
 * Hook for automatically refreshing data when company switches
 *
 * This hook listens to company-switched events and invalidates React Query caches
 * to ensure all components refresh their data when the company changes.
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCompany } from '@/components/providers/company-provider';

export function useCompanyDataRefresh() {
  const queryClient = useQueryClient();
  const { companyId } = useCompany();

  useEffect(() => {
    const handleCompanySwitched = (event: CustomEvent) => {
      const { companyId: newCompanyId } = event.detail || {};

      // Invalidate all queries to force refresh
      queryClient.invalidateQueries();

      // Also clear all caches to ensure fresh data
      queryClient.clear();

      console.log('Company switched - invalidated all queries', {
        newCompanyId,
      });
    };

    // Listen for company switch events
    if (typeof window !== 'undefined') {
      window.addEventListener(
        'company-switched',
        handleCompanySwitched as EventListener
      );

      return () => {
        window.removeEventListener(
          'company-switched',
          handleCompanySwitched as EventListener
        );
      };
    }
  }, [queryClient]);

  // Also invalidate when companyId changes directly (from context)
  useEffect(() => {
    if (companyId) {
      // Invalidate all queries when companyId changes
      queryClient.invalidateQueries();
      console.log('Company ID changed - invalidated all queries', {
        companyId,
      });
    }
  }, [companyId, queryClient]);
}

/**
 * Hook for components that need to refresh specific queries on company switch
 *
 * Note: This is a helper hook. For actual queries, use useQuery directly
 * and include companyId in the queryKey. This hook just handles invalidation.
 *
 * Example:
 * const { companyId } = useCompany();
 * const { data } = useQuery({
 *   queryKey: ['my-data', companyId], // Include companyId!
 *   queryFn: () => fetchData(),
 * });
 */
