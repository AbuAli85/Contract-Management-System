/**
 * Promoter Mutations Hook
 * Centralized hook for all promoter CRUD operations with optimistic updates
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import type { Promoter } from '@/lib/types';

interface UpdatePromoterData {
  id: string;
  updates: Partial<Promoter>;
}

interface DeletePromoterData {
  id: string;
  reason?: string;
}

interface BulkUpdateData {
  ids: string[];
  updates: Partial<Promoter>;
}

export function usePromoterMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Create promoter
  const createMutation = useMutation({
    mutationFn: async (data: Partial<Promoter>) => {
      const response = await fetch('/api/promoters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create promoter');
      }

      return response.json();
    },
    onMutate: async (newPromoter) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['promoters'] });

      // Snapshot previous value
      const previousPromoters = queryClient.getQueryData(['promoters']);

      // Optimistically update
      queryClient.setQueryData(['promoters'], (old: any) => {
        if (!old) return old;
        
        const optimisticPromoter = {
          ...newPromoter,
          id: `temp-${Date.now()}`,
          created_at: new Date().toISOString(),
        };

        return {
          ...old,
          promoters: [optimisticPromoter, ...(old.promoters || [])],
          total: (old.total || 0) + 1,
        };
      });

      return { previousPromoters };
    },
    onError: (error: any, _newPromoter, context) => {
      // Rollback on error
      if (context?.previousPromoters) {
        queryClient.setQueryData(['promoters'], context.previousPromoters);
      }

      toast({
        title: 'Failed to create promoter',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Promoter created',
        description: `Successfully created ${data.promoter.full_name || 'promoter'}`,
      });
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['promoters'] });
    },
  });

  // Update promoter
  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: UpdatePromoterData) => {
      const response = await fetch(`/api/promoters/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update promoter');
      }

      return response.json();
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['promoters'] });
      const previousPromoters = queryClient.getQueryData(['promoters']);

      // Optimistically update
      queryClient.setQueryData(['promoters'], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          promoters: old.promoters?.map((promoter: Promoter) =>
            promoter.id === id ? { ...promoter, ...updates } : promoter
          ),
        };
      });

      // Also update individual promoter query if exists
      queryClient.setQueryData(['promoter', id], (old: any) => {
        if (!old) return old;
        return { ...old, ...updates };
      });

      return { previousPromoters };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousPromoters) {
        queryClient.setQueryData(['promoters'], context.previousPromoters);
      }

      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Promoter updated',
        description: 'Changes saved successfully',
      });
    },
    onSettled: (_data, _error, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['promoters'] });
      queryClient.invalidateQueries({ queryKey: ['promoter', id] });
    },
  });

  // Delete promoter
  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: DeletePromoterData) => {
      const response = await fetch(`/api/promoters/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete promoter');
      }

      return response.json();
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({ queryKey: ['promoters'] });
      const previousPromoters = queryClient.getQueryData(['promoters']);

      // Optimistically remove
      queryClient.setQueryData(['promoters'], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          promoters: old.promoters?.filter((p: Promoter) => p.id !== id),
          total: Math.max((old.total || 0) - 1, 0),
        };
      });

      return { previousPromoters };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousPromoters) {
        queryClient.setQueryData(['promoters'], context.previousPromoters);
      }

      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Promoter deleted',
        description: 'Successfully removed from system',
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['promoters'] });
    },
  });

  // Bulk update
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, updates }: BulkUpdateData) => {
      const response = await fetch('/api/promoters/bulk-update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, updates }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Bulk update failed');
      }

      return response.json();
    },
    onMutate: async ({ ids, updates }) => {
      await queryClient.cancelQueries({ queryKey: ['promoters'] });
      const previousPromoters = queryClient.getQueryData(['promoters']);

      // Optimistically update all
      queryClient.setQueryData(['promoters'], (old: any) => {
        if (!old) return old;

        return {
          ...old,
          promoters: old.promoters?.map((promoter: Promoter) =>
            ids.includes(promoter.id) ? { ...promoter, ...updates } : promoter
          ),
        };
      });

      return { previousPromoters };
    },
    onError: (error: any, _variables, context) => {
      if (context?.previousPromoters) {
        queryClient.setQueryData(['promoters'], context.previousPromoters);
      }

      toast({
        title: 'Bulk update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
    onSuccess: (data) => {
      toast({
        title: 'Bulk update completed',
        description: `Updated ${data.count || 0} promoters`,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['promoters'] });
    },
  });

  return {
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    bulkUpdate: bulkUpdateMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isBulkUpdating: bulkUpdateMutation.isPending,
  };
}

