'use client';
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { WorkflowStatusBadge } from './workflow-status-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowRight, Loader2 } from 'lucide-react';

interface AvailableTransition {
  trigger_name: string;
  to_state: string;
  requires_comment: boolean;
  allowed_roles: string[] | null;
}

interface WorkflowInstance {
  id: string;
  current_state: string;
}

interface WorkflowActionPanelProps {
  contractId: string;
  companyId: string;
  className?: string;
  onStateChange?: (newState: string) => void;
}

async function fetchWorkflowState(contractId: string): Promise<{
  instance: WorkflowInstance | null;
  transitions: AvailableTransition[];
}> {
  const supabase = createClient();

  const { data: instance } = await supabase
    .from('workflow_instances')
    .select('id, current_state')
    .eq('entity_type', 'contract')
    .eq('entity_id', contractId)
    .single();

  if (!instance) return { instance: null, transitions: [] };

  const { data: transitions } = await supabase
    .from('workflow_transitions')
    .select(`
      trigger_name,
      to_state,
      requires_comment,
      allowed_roles,
      workflow_definitions!inner(entity_type)
    `)
    .eq('from_state', instance.current_state)
    .eq('workflow_definitions.entity_type', 'contract');

  return {
    instance,
    transitions: (transitions ?? []) as AvailableTransition[],
  };
}

export function WorkflowActionPanel({
  contractId,
  companyId,
  className,
  onStateChange,
}: WorkflowActionPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingTrigger, setPendingTrigger] = useState<AvailableTransition | null>(null);
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['workflow-state', contractId],
    queryFn: () => fetchWorkflowState(contractId),
    enabled: !!contractId,
    staleTime: 15_000,
  });

  const transitionMutation = useMutation({
    mutationFn: async ({
      trigger,
      comment,
    }: {
      trigger: string;
      comment: string;
    }) => {
      const res = await fetch(`/api/contracts/${contractId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trigger, comment, companyId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? 'Transition failed');
      }
      return res.json();
    },
    onSuccess: (result) => {
      toast({ title: 'Workflow updated', description: `Contract moved to: ${result.toState}` });
      queryClient.invalidateQueries({ queryKey: ['workflow-state', contractId] });
      queryClient.invalidateQueries({ queryKey: ['workflow-history', contractId] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      onStateChange?.(result.toState);
      setPendingTrigger(null);
      setComment('');
    },
    onError: (err: Error) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
    );
  }

  if (!data?.instance) {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        No workflow instance found for this contract.
      </div>
    );
  }

  const { instance, transitions } = data;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground">Status:</span>
        <WorkflowStatusBadge state={instance.current_state} size="md" />
      </div>

      {transitions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {transitions.map((t) => {
            const label = t.trigger_name
              .replace(/_/g, ' ')
              .replace(/\b\w/g, c => c.toUpperCase());
            return (
              <Button
                key={t.trigger_name}
                size="sm"
                variant="outline"
                className="flex items-center gap-1.5"
                onClick={() => setPendingTrigger(t)}
              >
                {label}
                <ArrowRight className="h-3 w-3" />
                <WorkflowStatusBadge state={t.to_state} size="sm" showIcon={false} />
              </Button>
            );
          })}
        </div>
      )}

      {/* Confirmation dialog */}
      <Dialog open={!!pendingTrigger} onOpenChange={(open) => !open && setPendingTrigger(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Workflow Action</DialogTitle>
            <DialogDescription>
              Move contract from{' '}
              <WorkflowStatusBadge state={instance.current_state} size="sm" className="inline-flex" />{' '}
              to{' '}
              <WorkflowStatusBadge state={pendingTrigger?.to_state} size="sm" className="inline-flex" />
            </DialogDescription>
          </DialogHeader>

          {(pendingTrigger?.requires_comment) && (
            <div className="space-y-2">
              <Label htmlFor="wf-comment">
                Comment <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="wf-comment"
                placeholder="Provide a reason or note for this action..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {!pendingTrigger?.requires_comment && (
            <div className="space-y-2">
              <Label htmlFor="wf-comment-optional">Comment (optional)</Label>
              <Textarea
                id="wf-comment-optional"
                placeholder="Add a note (optional)..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={2}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingTrigger(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!pendingTrigger) return;
                if (pendingTrigger.requires_comment && !comment.trim()) {
                  toast({ title: 'Comment required', description: 'Please add a comment before proceeding.', variant: 'destructive' });
                  return;
                }
                transitionMutation.mutate({ trigger: pendingTrigger.trigger_name, comment });
              }}
              disabled={transitionMutation.isPending}
            >
              {transitionMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
