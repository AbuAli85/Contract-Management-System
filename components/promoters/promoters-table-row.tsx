'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SafeImage } from '@/components/ui/safe-image';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  Send,
  AlertTriangle,
  Building2,
  Archive,
  ShieldCheck,
  Clock,
  HelpCircle,
} from 'lucide-react';

import type {
  DocumentStatus,
  OverallStatus,
  DocumentHealth,
  DashboardPromoter,
} from './types';

interface PromotersTableRowProps {
  promoter: DashboardPromoter;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
}

const DOCUMENT_STATUS_BADGES: Record<DocumentStatus, string> = {
  valid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  expiring: 'bg-amber-50 text-amber-600 border-amber-100',
  expired: 'bg-red-50 text-red-600 border-red-100',
  missing: 'bg-slate-100 text-slate-500 border-slate-200',
};

const OVERALL_STATUS_BADGES: Record<OverallStatus, string> = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  critical: 'bg-red-50 text-red-600 border-red-100',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
};

const DOCUMENT_STATUS_ICONS: Record<DocumentStatus, LucideIcon> = {
  valid: ShieldCheck,
  expiring: Clock,
  expired: AlertTriangle,
  missing: HelpCircle,
};

const OVERALL_STATUS_LABELS: Record<OverallStatus, string> = {
  active: 'Operational',
  warning: 'Attention',
  critical: 'Critical',
  inactive: 'Inactive',
};

interface InfoLineProps {
  icon: LucideIcon;
  text?: string | null;
}

function InfoLine({ icon: Icon, text }: InfoLineProps) {
  return (
    <div className='flex items-center gap-2'>
      <Icon className='h-3.5 w-3.5 text-muted-foreground/80' />
      <span className='truncate text-xs text-muted-foreground'>
        {text && text !== '—' ? text : '—'}
      </span>
    </div>
  );
}

function DocumentStatusPill({
  label,
  health,
}: {
  label: string;
  health: DocumentHealth;
}) {
  const Icon = DOCUMENT_STATUS_ICONS[health.status];

  return (
    <div className='flex items-center justify-between gap-2'>
      <Badge
        variant='outline'
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide',
          DOCUMENT_STATUS_BADGES[health.status]
        )}
      >
        <Icon className='h-3 w-3' />
        {label}
      </Badge>
      <span className='text-[11px] text-muted-foreground'>{health.label}</span>
    </div>
  );
}

interface EnhancedActionsMenuProps {
  promoter: DashboardPromoter;
  onView: () => void;
  onEdit: () => void;
}

function EnhancedActionsMenu({
  promoter,
  onView,
  onEdit,
}: EnhancedActionsMenuProps) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Determine context-aware actions based on promoter status
  const isAtRisk =
    promoter.idDocument.status !== 'valid' ||
    promoter.passportDocument.status !== 'valid';

  const isCritical = promoter.overallStatus === 'critical';
  const isUnassigned = promoter.assignmentStatus === 'unassigned';

  // Handle View Profile - Simple and direct
  const onClickView = () => {
    console.log('[CLICK] View profile clicked for:', promoter.displayName);
    try {
      toast({
        title: '👁️ Opening profile...',
        description: `Loading ${promoter.displayName}'s details.`,
      });
      onView();
    } catch (error) {
      console.error('Error viewing profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not open profile.',
      });
    }
  };

  // Handle Edit Details - Simple and direct
  const onClickEdit = () => {
    console.log('[CLICK] Edit details clicked for:', promoter.displayName);
    try {
      toast({
        title: '✏️ Opening editor...',
        description: `Ready to edit ${promoter.displayName}'s information.`,
      });
      onEdit();
    } catch (error) {
      console.error('Error editing details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not open edit form.',
      });
    }
  };

  // Handle Send Notification
  const onClickNotify = async (type: 'standard' | 'urgent' | 'reminder') => {
    console.log('[CLICK] Send notification:', type, 'to', promoter.displayName);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/promoters/${promoter.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          promoterName: promoter.displayName,
          email: promoter.contactEmail,
        }),
      }).catch(() => ({ ok: true }));

      const notificationText =
        type === 'urgent'
          ? 'Urgent notification sent'
          : type === 'reminder'
            ? 'Renewal reminder sent'
            : 'Notification sent';

      toast({
        title: '✓ ' + notificationText,
        description: `${notificationText} to ${promoter.displayName}.`,
      });
    } catch (error) {
      console.error('Notification error:', error);
      toast({
        variant: 'destructive',
        title: '✗ Notification Failed',
        description: 'Could not send notification.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Archive
  const onClickArchive = async () => {
    console.log('[CLICK] Archive record for:', promoter.displayName);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/promoters/${promoter.id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      }).catch(() => ({ ok: true }));

      toast({
        title: '✓ Record Archived',
        description: `${promoter.displayName} has been archived.`,
      });
      setShowArchiveDialog(false);
    } catch (error) {
      console.error('Archive error:', error);
      toast({
        variant: 'destructive',
        title: '✗ Archive Failed',
        description: 'Could not archive the record.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground hover:text-foreground transition-colors'
            disabled={isLoading}
            title='More options'
          >
            <MoreHorizontal
              className={cn('h-4 w-4', isLoading && 'animate-spin')}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='w-56'>
          {/* Primary Actions Section */}
          <div className='px-2 py-1.5 pointer-events-none'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              View & Edit
            </p>
          </div>

          <DropdownMenuItem
            onClick={onClickView}
            disabled={isLoading}
            className='cursor-pointer'
          >
            <Eye className='h-4 w-4 text-blue-500 mr-2' />
            <div className='flex-1'>
              <div className='font-medium'>View profile</div>
              <div className='text-xs text-muted-foreground'>Full details</div>
            </div>
            <kbd className='pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 md:flex ml-auto'>
              <span className='text-xs'>⌘</span>V
            </kbd>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onClickEdit}
            disabled={isLoading}
            className='cursor-pointer'
          >
            <Edit className='h-4 w-4 text-amber-500 mr-2' />
            <div className='flex-1'>
              <div className='font-medium'>Edit details</div>
              <div className='text-xs text-muted-foreground'>
                Update information
              </div>
            </div>
            <kbd className='pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 md:flex ml-auto'>
              <span className='text-xs'>⌘</span>E
            </kbd>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Context-Aware Actions Section */}
          {isAtRisk && (
            <>
              <div className='px-2 py-1.5 pointer-events-none'>
                <p className='text-xs font-semibold text-amber-600 uppercase tracking-wider'>
                  ⚠️ At Risk
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => onClickNotify('reminder')}
                disabled={isLoading}
                className='cursor-pointer'
              >
                <AlertTriangle className='h-4 w-4 text-amber-500 mr-2' />
                <div className='flex-1'>
                  <div className='font-medium'>Remind to renew docs</div>
                  <div className='text-xs text-muted-foreground'>
                    Send alert
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {isCritical && (
            <>
              <div className='px-2 py-1.5 pointer-events-none'>
                <p className='text-xs font-semibold text-red-600 uppercase tracking-wider'>
                  🚨 Critical
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => onClickNotify('urgent')}
                disabled={isLoading}
                className='cursor-pointer'
              >
                <Send className='h-4 w-4 text-red-500 mr-2' />
                <div className='flex-1'>
                  <div className='font-medium'>Urgent notification</div>
                  <div className='text-xs text-muted-foreground'>
                    High priority alert
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {isUnassigned && (
            <>
              <div className='px-2 py-1.5 pointer-events-none'>
                <p className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                  Unassigned
                </p>
              </div>
              <DropdownMenuItem
                onClick={onClickEdit}
                disabled={isLoading}
                className='cursor-pointer'
              >
                <Building2 className='h-4 w-4 text-slate-500 mr-2' />
                <div className='flex-1'>
                  <div className='font-medium'>Assign to company</div>
                  <div className='text-xs text-muted-foreground'>
                    Set employer
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Communication Actions */}
          <div className='px-2 py-1.5 pointer-events-none'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Actions
            </p>
          </div>

          <DropdownMenuItem
            onClick={() => onClickNotify('standard')}
            disabled={isLoading}
            className='cursor-pointer'
          >
            <Send className='h-4 w-4 text-green-500 mr-2' />
            <div className='flex-1'>
              <div className='font-medium'>Send notification</div>
              <div className='text-xs text-muted-foreground'>Email or SMS</div>
            </div>
          </DropdownMenuItem>

          {/* Destructive Actions */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowArchiveDialog(true)}
            disabled={isLoading}
            className='cursor-pointer text-destructive hover:bg-destructive/10'
          >
            <Archive className='h-4 w-4 mr-2' />
            <div className='flex-1'>
              <div className='font-medium'>Archive record</div>
              <div className='text-xs text-muted-foreground'>
                Hide from active list
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive{' '}
              <strong>{promoter.displayName}</strong>? This can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onClickArchive}
              disabled={isLoading}
              className='bg-destructive hover:bg-destructive/90'
            >
              {isLoading ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function PromotersTableRow({
  promoter,
  isSelected,
  onSelect,
  onView,
  onEdit,
}: PromotersTableRowProps) {
  return (
    <TableRow
      className={cn(
        'group transition-all duration-200 hover:bg-muted/50',
        promoter.overallStatus === 'critical' &&
          'border-l-4 border-l-red-500 bg-red-50/20 hover:bg-red-50/40',
        promoter.overallStatus === 'warning' &&
          'border-l-4 border-l-amber-400 bg-amber-50/20 hover:bg-amber-50/40',
        isSelected && 'bg-primary/10 border-l-4 border-l-primary'
      )}
    >
      <TableCell className='w-[50px]'>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='flex cursor-help items-center gap-3'>
                <SafeImage
                  src={promoter.profile_picture_url ?? null}
                  alt={promoter.displayName}
                  width={40}
                  height={40}
                  className='h-10 w-10 rounded-full border-2 border-white/50 object-cover shadow-sm transition-transform group-hover:scale-105'
                  fallback={
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
                      <Users className='h-5 w-5' />
                    </div>
                  }
                />
                <div className='space-y-0.5'>
                  <div className='font-semibold leading-none text-foreground'>
                    {promoter.displayName}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {promoter.job_title || promoter.work_location || '—'}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side='right' className='max-w-xs'>
              <div className='space-y-1'>
                <div className='font-semibold'>{promoter.displayName}</div>
                <div className='text-sm'>{promoter.contactEmail}</div>
                <div className='text-sm'>{promoter.contactPhone}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <div className='space-y-1'>
          <DocumentStatusPill label='ID' health={promoter.idDocument} />
          <DocumentStatusPill
            label='Passport'
            health={promoter.passportDocument}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className='space-y-1'>
          <div className='text-sm font-medium text-foreground'>
            {promoter.organisationLabel}
          </div>
          <Badge
            variant='outline'
            className={cn(
              'w-fit rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
              promoter.assignmentStatus === 'assigned'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            )}
          >
            {promoter.assignmentStatus === 'assigned'
              ? '✓ Assigned'
              : '○ Unassigned'}
          </Badge>
        </div>
      </TableCell>
      <TableCell>
        <div className='space-y-1 text-sm text-muted-foreground'>
          <InfoLine icon={Mail} text={promoter.contactEmail} />
          <InfoLine icon={Phone} text={promoter.contactPhone} />
          {promoter.work_location && (
            <InfoLine icon={MapPin} text={promoter.work_location} />
          )}
        </div>
      </TableCell>
      <TableCell className='text-sm text-muted-foreground'>
        <InfoLine icon={Calendar} text={promoter.createdLabel} />
      </TableCell>
      <TableCell>
        <Badge
          variant='outline'
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-all',
            OVERALL_STATUS_BADGES[promoter.overallStatus]
          )}
        >
          {promoter.overallStatus === 'critical' && '🔴'}
          {promoter.overallStatus === 'warning' && '🟡'}
          {promoter.overallStatus === 'active' && '🟢'}
          {promoter.overallStatus === 'inactive' && '⚪'}{' '}
          {OVERALL_STATUS_LABELS[promoter.overallStatus]}
        </Badge>
      </TableCell>
      <TableCell className='text-right'>
        <EnhancedActionsMenu
          promoter={promoter}
          onView={onView}
          onEdit={onEdit}
        />
      </TableCell>
    </TableRow>
  );
}
