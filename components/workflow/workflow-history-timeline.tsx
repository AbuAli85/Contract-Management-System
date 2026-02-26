'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { WorkflowStatusBadge } from './workflow-status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  ArrowRight,
  User,
  MessageSquare,
  Clock,
} from 'lucide-react';

interface WorkflowEvent {
  id: string;
  from_state: string;
  to_state: string;
  trigger_name: string;
  triggered_by: string | null;
  comment: string | null;
  created_at: string;
  triggered_by_profile?: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
}

interface WorkflowHistoryTimelineProps {
  contractId: string;
  className?: string;
}

async function fetchWorkflowHistory(contractId: string): Promise<WorkflowEvent[]> {
  const supabase = createClient();

  // Get the workflow instance for this contract
  const { data: instance, error: instanceError } = await supabase
    .from('workflow_instances')
    .select('id, current_state')
    .eq('entity_type', 'contract')
    .eq('entity_id', contractId)
    .single();

  if (instanceError || !instance) return [];

  // Get all events for this instance
  const { data: events, error: eventsError } = await supabase
    .from('workflow_events')
    .select(`
      id,
      from_state,
      to_state,
      trigger_name,
      triggered_by,
      comment,
      created_at
    `)
    .eq('instance_id', instance.id)
    .order('created_at', { ascending: true });

  if (eventsError || !events) return [];

  return events as WorkflowEvent[];
}

export function WorkflowHistoryTimeline({
  contractId,
  className,
}: WorkflowHistoryTimelineProps) {
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['workflow-history', contractId],
    queryFn: () => fetchWorkflowHistory(contractId),
    enabled: !!contractId,
    staleTime: 30_000,
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-start gap-3">
            <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !events || events.length === 0) {
    return (
      <div className={cn('text-sm text-muted-foreground py-4 text-center', className)}>
        No workflow history available yet.
      </div>
    );
  }

  return (
    <ol className={cn('relative border-l border-muted ml-3', className)}>
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        const triggerLabel = event.trigger_name
          .replace(/_/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase());

        return (
          <li
            key={event.id}
            className={cn('mb-6 ml-6', isLast && 'mb-0')}
          >
            {/* Timeline dot */}
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-primary">
              <ArrowRight className="h-3 w-3 text-primary" />
            </span>

            {/* Event content */}
            <div className="rounded-lg border bg-card p-3 shadow-sm">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <WorkflowStatusBadge state={event.from_state} size="sm" />
                <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                <WorkflowStatusBadge state={event.to_state} size="sm" />
                <span className="ml-auto text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  {triggerLabel}
                </span>
              </div>

              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(event.created_at), 'MMM d, yyyy HH:mm')}
                </span>
                {event.triggered_by && (
                  <span className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {event.triggered_by_profile?.first_name
                      ? `${event.triggered_by_profile.first_name} ${event.triggered_by_profile.last_name ?? ''}`.trim()
                      : event.triggered_by_profile?.email ?? 'System'}
                  </span>
                )}
              </div>

              {event.comment && (
                <div className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground border-t pt-2">
                  <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                  <span className="italic">{event.comment}</span>
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
