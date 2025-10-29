'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import {
  Download,
  Building2,
  Send,
  Archive,
  Trash2,
  Loader2,
} from 'lucide-react';

interface BulkAction {
  id: string;
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
}

interface PromotersBulkActionsProps {
  selectedCount: number;
  totalCount: number;
  isPerformingAction: boolean;
  onSelectAll: () => void;
  onBulkAction: (actionId: string) => void;
  onClearSelection: () => void;
}

const BULK_ACTIONS: BulkAction[] = [
  {
    id: 'export',
    label: 'Export Selected',
    icon: Download,
    variant: 'default',
  },
  {
    id: 'assign',
    label: 'Assign to Company',
    icon: Building2,
    variant: 'default',
  },
  {
    id: 'notify',
    label: 'Send Notifications',
    icon: Send,
    variant: 'default',
  },
  {
    id: 'remind',
    label: 'Send Reminders',
    icon: Send,
    variant: 'default',
  },
  {
    id: 'archive',
    label: 'Archive Selected',
    icon: Archive,
    variant: 'destructive',
    requiresConfirmation: true,
  },
  {
    id: 'delete',
    label: 'Delete Selected',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirmation: true,
  },
];

export function PromotersBulkActions({
  selectedCount,
  totalCount,
  isPerformingAction,
  onSelectAll,
  onBulkAction,
  onClearSelection,
}: PromotersBulkActionsProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <Card className='border-primary/20 bg-primary/5'>
      <CardContent className='flex items-center justify-between py-4'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2'>
            <Checkbox
              checked={selectedCount === totalCount}
              onCheckedChange={onSelectAll}
            />
            <span className='text-sm font-medium'>
              {selectedCount} of {totalCount} selected
            </span>
          </div>
          <div className='h-4 w-px bg-border' />
          <div className='flex items-center gap-2'>
            {BULK_ACTIONS.map(action => (
              <Button
                key={action.id}
                variant={
                  action.variant === 'destructive' ? 'destructive' : 'outline'
                }
                size='sm'
                onClick={() => onBulkAction(action.id)}
                disabled={isPerformingAction}
              >
                {isPerformingAction ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <action.icon className='mr-2 h-4 w-4' />
                )}
                {action.label}
              </Button>
            ))}
          </div>
        </div>
        <Button
          variant='ghost'
          size='sm'
          onClick={onClearSelection}
          disabled={isPerformingAction}
        >
          Clear selection
        </Button>
      </CardContent>
    </Card>
  );
}
