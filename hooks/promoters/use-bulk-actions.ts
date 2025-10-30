/**
 * Custom hook for managing bulk actions on promoters
 * 
 * Centralizes bulk action logic, API calls, and error handling.
 */

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import {
  safeFetch,
  extractErrorMessage,
  logAPIError,
} from '@/lib/api/api-error-handler';
import { getPromotersQueryKey } from './use-promoters-data';

export type BulkActionType =
  | 'archive'
  | 'delete'
  | 'notify'
  | 'assign'
  | 'update_status'
  | 'export';

export interface BulkActionOptions {
  promoterIds: string[];
  status?: string;
  notificationType?: 'standard' | 'urgent' | 'reminder';
  companyId?: string;
}

export interface BulkActionResult {
  success: boolean;
  processed: number;
  failed?: number;
  message?: string;
  errors?: any[];
}

/**
 * Hook for performing bulk actions on promoters
 */
export function useBulkActions() {
  const [isPerforming, setIsPerforming] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  /**
   * Perform a bulk action on selected promoters
   */
  const performAction = useCallback(
    async (
      action: BulkActionType,
      options: BulkActionOptions
    ): Promise<BulkActionResult> => {
      const { promoterIds, status, notificationType, companyId } = options;

      if (!promoterIds || promoterIds.length === 0) {
        throw new Error('No promoters selected');
      }

      setIsPerforming(true);

      try {
        // Map action types to API format
        const apiAction =
          action === 'delete' ? 'update_status' : action;

        const response = await safeFetch<BulkActionResult>(
          '/api/promoters/bulk',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: apiAction,
              promoterIds,
              status: action === 'delete' ? 'terminated' : status,
              notificationType,
              companyId,
            }),
          }
        );

        // Invalidate promoters query to refresh data
        await queryClient.invalidateQueries({
          queryKey: getPromotersQueryKey(),
        });

        // Show success toast
        toast({
          title: 'Success',
          description:
            response.message ||
            `${action} completed successfully for ${promoterIds.length} promoter(s)`,
        });

        return response;
      } catch (error) {
        logAPIError(error, { action, promoterCount: promoterIds.length });

        // Show error toast
        toast({
          variant: 'destructive',
          title: 'Action Failed',
          description: extractErrorMessage(error),
        });

        throw error;
      } finally {
        setIsPerforming(false);
      }
    },
    [toast, queryClient]
  );

  /**
   * Archive selected promoters
   */
  const archivePromoters = useCallback(
    async (promoterIds: string[]) => {
      return performAction('archive', { promoterIds });
    },
    [performAction]
  );

  /**
   * Delete (terminate) selected promoters
   */
  const deletePromoters = useCallback(
    async (promoterIds: string[]) => {
      return performAction('delete', { promoterIds });
    },
    [performAction]
  );

  /**
   * Send notifications to selected promoters
   */
  const notifyPromoters = useCallback(
    async (
      promoterIds: string[],
      notificationType: 'standard' | 'urgent' | 'reminder' = 'standard'
    ) => {
      return performAction('notify', { promoterIds, notificationType });
    },
    [performAction]
  );

  /**
   * Assign selected promoters to a company
   */
  const assignPromoters = useCallback(
    async (promoterIds: string[], companyId: string) => {
      if (!companyId) {
        throw new Error('Company ID is required');
      }

      return performAction('assign', { promoterIds, companyId });
    },
    [performAction]
  );

  /**
   * Update status for selected promoters
   */
  const updatePromotersStatus = useCallback(
    async (promoterIds: string[], status: string) => {
      if (!status) {
        throw new Error('Status is required');
      }

      return performAction('update_status', { promoterIds, status });
    },
    [performAction]
  );

  return {
    isPerforming,
    performAction,
    archivePromoters,
    deletePromoters,
    notifyPromoters,
    assignPromoters,
    updatePromotersStatus,
  };
}

