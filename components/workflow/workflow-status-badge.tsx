'use client';
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  FileEdit,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export type WorkflowState =
  | 'draft'
  | 'pending_review'
  | 'pending_approval'
  | 'approved'
  | 'active'
  | 'expired'
  | 'terminated'
  | 'rejected'
  | string;

interface WorkflowStatusBadgeProps {
  state: WorkflowState | null | undefined;
  className?: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const STATE_CONFIG: Record<
  string,
  {
    label: string;
    variant: 'default' | 'secondary' | 'destructive' | 'outline';
    className: string;
    Icon: React.ElementType;
  }
> = {
  draft: {
    label: 'Draft',
    variant: 'outline',
    className: 'border-slate-400 text-slate-600 bg-slate-50',
    Icon: FileEdit,
  },
  pending_review: {
    label: 'Pending Review',
    variant: 'outline',
    className: 'border-amber-400 text-amber-700 bg-amber-50',
    Icon: Clock,
  },
  pending_approval: {
    label: 'Pending Approval',
    variant: 'outline',
    className: 'border-blue-400 text-blue-700 bg-blue-50',
    Icon: Loader2,
  },
  approved: {
    label: 'Approved',
    variant: 'outline',
    className: 'border-green-400 text-green-700 bg-green-50',
    Icon: CheckCircle2,
  },
  active: {
    label: 'Active',
    variant: 'default',
    className: 'bg-green-600 text-white border-green-600',
    Icon: PlayCircle,
  },
  expired: {
    label: 'Expired',
    variant: 'secondary',
    className: 'bg-slate-200 text-slate-600 border-slate-300',
    Icon: AlertCircle,
  },
  terminated: {
    label: 'Terminated',
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 border-red-300',
    Icon: XCircle,
  },
  rejected: {
    label: 'Rejected',
    variant: 'destructive',
    className: 'bg-red-100 text-red-700 border-red-300',
    Icon: XCircle,
  },
};

export function WorkflowStatusBadge({
  state,
  className,
  showIcon = true,
  size = 'sm',
}: WorkflowStatusBadgeProps) {
  if (!state) return null;

  const config = STATE_CONFIG[state] ?? {
    label: state.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    variant: 'outline' as const,
    className: 'border-slate-300 text-slate-600',
    Icon: AlertCircle,
  };

  const { label, className: stateClass, Icon } = config;

  return (
    <Badge
      variant="outline"
      className={cn(
        'inline-flex items-center gap-1 font-medium',
        size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-sm px-2.5 py-1',
        stateClass,
        className
      )}
    >
      {showIcon && (
        <Icon
          className={cn(
            size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5',
            state === 'pending_approval' ? 'animate-spin' : ''
          )}
        />
      )}
      {label}
    </Badge>
  );
}
