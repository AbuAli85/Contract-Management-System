'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  Building2,
  Send,
  Archive,
  Trash2,
  Loader2,
  MoreHorizontal,
  Mail,
  FileText,
  UserCheck,
  AlertCircle,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface PromotersBulkActionsEnhancedProps {
  selectedCount: number;
  totalCount: number;
  isPerformingAction: boolean;
  onSelectAll: () => void;
  onBulkAction: (actionId: string) => void;
  onClearSelection: () => void;
}

/**
 * Enhanced bulk actions bar with more options and better UX
 * Shows when promoters are selected with quick access to common operations
 */
export function PromotersBulkActionsEnhanced({
  selectedCount,
  totalCount,
  isPerformingAction,
  onSelectAll,
  onBulkAction,
  onClearSelection,
}: PromotersBulkActionsEnhancedProps) {
  if (selectedCount === 0) {
    return null;
  }

  const isAllSelected = selectedCount === totalCount;

  return (
    <Card className='border-l-4 border-l-primary bg-gradient-to-r from-primary/5 via-primary/3 to-background shadow-md'>
      <CardContent className='flex items-center justify-between py-3 px-4'>
        <div className='flex items-center gap-4 flex-wrap'>
          {/* Selection Info */}
          <div className='flex items-center gap-3'>
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label={isAllSelected ? 'Deselect all' : 'Select all on page'}
            />
            <div className='flex flex-col'>
              <span className='text-sm font-semibold'>
                {selectedCount} {selectedCount === 1 ? 'promoter' : 'promoters'}{' '}
                selected
              </span>
              <span className='text-xs text-muted-foreground'>
                of {totalCount} on this page
              </span>
            </div>
          </div>

          <div className='h-8 w-px bg-border' />

          {/* Quick Actions */}
          <div className='flex items-center gap-2 flex-wrap'>
            {/* Send Document Reminders */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => onBulkAction('send_reminders')}
              disabled={isPerformingAction}
              className='hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
            >
              {isPerformingAction ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Mail className='mr-2 h-4 w-4' />
              )}
              Send Reminders
            </Button>

            {/* Assign to Company */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => onBulkAction('assign_company')}
              disabled={isPerformingAction}
              className='hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600'
            >
              <Building2 className='mr-2 h-4 w-4' />
              Assign to Company
            </Button>

            {/* Export Selected */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => onBulkAction('export')}
              disabled={isPerformingAction}
              className='hover:bg-green-50 hover:border-green-200 hover:text-green-600'
            >
              <Download className='mr-2 h-4 w-4' />
              Export
            </Button>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={isPerformingAction}
                >
                  <MoreHorizontal className='h-4 w-4' />
                  <span className='ml-2 hidden sm:inline'>More</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuLabel>Bulk Operations</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => onBulkAction('update_status')}>
                  <UserCheck className='mr-2 h-4 w-4' />
                  Update Status
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onBulkAction('request_documents')}
                >
                  <FileText className='mr-2 h-4 w-4' />
                  Request Documents
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onBulkAction('send_notification')}
                >
                  <Send className='mr-2 h-4 w-4' />
                  Send Custom Notification
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onBulkAction('archive')}
                  className='text-amber-600 focus:text-amber-600 focus:bg-amber-50'
                >
                  <Archive className='mr-2 h-4 w-4' />
                  Archive Selected
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => onBulkAction('delete')}
                  className='text-destructive focus:text-destructive focus:bg-destructive/10'
                >
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Clear Selection */}
        <Button
          variant='ghost'
          size='sm'
          onClick={onClearSelection}
          disabled={isPerformingAction}
          className='hover:bg-destructive/10 hover:text-destructive'
        >
          <X className='mr-2 h-4 w-4' />
          <span className='hidden sm:inline'>Clear</span>
        </Button>
      </CardContent>
    </Card>
  );
}
