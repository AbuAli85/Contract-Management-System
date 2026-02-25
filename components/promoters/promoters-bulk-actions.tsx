'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { LucideIcon } from 'lucide-react';
import {
  Download,
  Building2,
  Send,
  Archive,
  Trash2,
  Loader2,
  FileText,
  ChevronDown,
  X,
  CheckSquare,
} from 'lucide-react';

interface BulkAction {
  id: string;
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
  confirmTitle?: string;
  confirmDescription?: string;
  priority?: 'primary' | 'secondary' | 'danger';
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
    id: 'remind',
    label: 'Send Reminders',
    icon: Send,
    variant: 'default',
    priority: 'primary',
  },
  {
    id: 'request_documents',
    label: 'Request Documents',
    icon: FileText,
    variant: 'default',
    priority: 'primary',
  },
  {
    id: 'export',
    label: 'Export Selected',
    icon: Download,
    variant: 'default',
    priority: 'secondary',
  },
  {
    id: 'assign',
    label: 'Assign to Company',
    icon: Building2,
    variant: 'default',
    priority: 'secondary',
  },
  {
    id: 'archive',
    label: 'Archive Selected',
    icon: Archive,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmTitle: 'Archive selected promoters?',
    confirmDescription:
      'This will archive the selected promoters. They will no longer appear in the active list but their data will be preserved.',
    priority: 'danger',
  },
  {
    id: 'delete',
    label: 'Delete Selected',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirmation: true,
    confirmTitle: 'Delete selected promoters?',
    confirmDescription:
      'This action cannot be undone. All data for the selected promoters will be permanently deleted.',
    priority: 'danger',
  },
];

const PRIMARY_ACTIONS = BULK_ACTIONS.filter(a => a.priority === 'primary');
const SECONDARY_ACTIONS = BULK_ACTIONS.filter(
  a => a.priority === 'secondary' || a.priority === 'danger'
);

export function PromotersBulkActions({
  selectedCount,
  totalCount,
  isPerformingAction,
  onSelectAll,
  onBulkAction,
  onClearSelection,
}: PromotersBulkActionsProps) {
  const [pendingAction, setPendingAction] = useState<BulkAction | null>(null);

  if (selectedCount === 0) {
    return null;
  }

  const handleActionClick = (action: BulkAction) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
    } else {
      onBulkAction(action.id);
    }
  };

  const handleConfirm = () => {
    if (pendingAction) {
      onBulkAction(pendingAction.id);
      setPendingAction(null);
    }
  };

  return (
    <>
      <Card className='border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-sm animate-in slide-in-from-top-2 duration-200'>
        <CardContent className='py-3 px-4'>
          <div className='flex flex-wrap items-center gap-3'>
            {/* Selection info */}
            <div className='flex items-center gap-2.5 flex-shrink-0'>
              <Checkbox
                checked={selectedCount === totalCount}
                onCheckedChange={onSelectAll}
                aria-label={
                  selectedCount === totalCount
                    ? 'Deselect all'
                    : 'Select all promoters'
                }
              />
              <div className='flex items-center gap-1.5'>
                <CheckSquare className='h-4 w-4 text-primary' />
                <span className='text-sm font-semibold text-foreground'>
                  {selectedCount} selected
                </span>
                <Badge
                  variant='secondary'
                  className='text-xs px-1.5 py-0 h-5 bg-primary/10 text-primary border-primary/20'
                >
                  of {totalCount}
                </Badge>
              </div>
            </div>

            <div className='h-5 w-px bg-border hidden sm:block flex-shrink-0' />

            {/* Primary actions - always visible */}
            <div className='flex items-center gap-2 flex-wrap'>
              {PRIMARY_ACTIONS.map(action => (
                <Button
                  key={action.id}
                  variant='outline'
                  size='sm'
                  onClick={() => handleActionClick(action)}
                  disabled={isPerformingAction}
                  className='h-8 text-xs font-medium border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-colors'
                >
                  {isPerformingAction ? (
                    <Loader2 className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <action.icon className='mr-1.5 h-3.5 w-3.5' />
                  )}
                  {action.label}
                </Button>
              ))}

              {/* More actions dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={isPerformingAction}
                    className='h-8 text-xs font-medium border-primary/20 hover:bg-primary/10 hover:border-primary/40 transition-colors'
                  >
                    More
                    <ChevronDown className='ml-1 h-3.5 w-3.5' />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='start' className='w-52'>
                  <DropdownMenuLabel className='text-xs text-muted-foreground'>
                    Additional Actions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {SECONDARY_ACTIONS.filter(
                    a => a.priority === 'secondary'
                  ).map(action => (
                    <DropdownMenuItem
                      key={action.id}
                      onClick={() => handleActionClick(action)}
                      className='cursor-pointer'
                    >
                      <action.icon className='mr-2 h-4 w-4 text-muted-foreground' />
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  {SECONDARY_ACTIONS.filter(a => a.priority === 'danger').map(
                    action => (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className='cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10'
                      >
                        <action.icon className='mr-2 h-4 w-4' />
                        {action.label}
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Clear selection - pushed to the right */}
            <div className='ml-auto flex-shrink-0'>
              <Button
                variant='ghost'
                size='sm'
                onClick={onClearSelection}
                disabled={isPerformingAction}
                className='h-8 text-xs text-muted-foreground hover:text-foreground'
                aria-label='Clear selection'
              >
                <X className='mr-1.5 h-3.5 w-3.5' />
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation dialog for destructive actions */}
      <AlertDialog
        open={!!pendingAction}
        onOpenChange={open => !open && setPendingAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.confirmTitle ?? 'Confirm action'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.confirmDescription ??
                `This action will affect ${selectedCount} selected promoter${selectedCount !== 1 ? 's' : ''}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                pendingAction?.variant === 'destructive'
                  ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                  : ''
              }
            >
              Confirm ({selectedCount} promoter
              {selectedCount !== 1 ? 's' : ''})
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
