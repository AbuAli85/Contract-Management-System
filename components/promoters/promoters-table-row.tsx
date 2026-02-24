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
import { InlineEditableCell, validators } from './inline-editable-cell';
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
  onEdit?: () => void;
  isColumnVisible?: (columnId: string) => boolean;
  onInlineUpdate?:
    | ((promoterId: string, field: string, value: string) => Promise<void>)
    | undefined;
  enableInlineEdit?: boolean;
}

const DOCUMENT_STATUS_BADGES: Record<DocumentStatus, string> = {
  valid: 'bg-green-50 text-green-700 border-green-200',
  expiring: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  missing: 'bg-gray-50 text-gray-700 border-gray-200',
};

const OVERALL_STATUS_BADGES: Record<OverallStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  inactive: 'bg-gray-50 text-gray-700 border-gray-200',
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
    <div className='flex items-center gap-2.5 min-w-0'>
      <Badge
        variant='outline'
        className={cn(
          'flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm transition-all hover:shadow-md flex-shrink-0',
          health.status === 'valid' &&
            'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-300 hover:from-emerald-100 hover:to-green-100',
          health.status === 'expiring' &&
            'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-300 hover:from-amber-100 hover:to-yellow-100',
          health.status === 'expired' &&
            'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300 hover:from-red-100 hover:to-rose-100',
          health.status === 'missing' &&
            'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 border-slate-300 hover:from-slate-100 hover:to-gray-100'
        )}
      >
        <Icon className='h-3 w-3 flex-shrink-0' />
        <span className='whitespace-nowrap'>{label}</span>
      </Badge>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className='text-xs text-slate-600 dark:text-slate-400 font-medium min-w-0 flex-1 line-clamp-1 cursor-help'>
              {health.label}
            </span>
          </TooltipTrigger>
          <TooltipContent className='max-w-xs'>
            <p className='text-xs font-medium'>{label} Document Status</p>
            <p className='text-xs text-muted-foreground mt-1'>{health.label}</p>
            {health.expiresOn && (
              <p className='text-xs text-muted-foreground mt-1'>
                Expiry Date:{' '}
                {new Date(health.expiresOn).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
            {health.daysRemaining !== null && (
              <p className='text-xs text-muted-foreground mt-1'>
                {health.daysRemaining > 0
                  ? `${health.daysRemaining} days remaining`
                  : `Expired ${Math.abs(health.daysRemaining)} days ago`}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
      onEdit?.();
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
        title: `✓ ${notificationText}`,
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
  isColumnVisible = () => true, // Default to showing all columns
  onInlineUpdate,
  enableInlineEdit = false,
}: PromotersTableRowProps) {
  const handleFieldUpdate = async (field: string, value: string) => {
    if (!onInlineUpdate) {
      throw new Error('Inline update handler not provided');
    }
    await onInlineUpdate(promoter.id, field, value);
  };
  return (
    <TableRow
      onClick={onView}
      className={cn(
        'group transition-all duration-200 hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-indigo-50/30 dark:hover:from-slate-800/50 dark:hover:to-indigo-900/20 border-b border-slate-100 dark:border-slate-800 cursor-pointer',
        promoter.overallStatus === 'critical' &&
          'border-l-4 border-l-red-500 bg-gradient-to-r from-red-50/30 to-transparent hover:from-red-50/50 hover:to-red-100/20 dark:from-red-900/20 dark:hover:from-red-900/30',
        promoter.overallStatus === 'warning' &&
          'border-l-4 border-l-amber-400 bg-gradient-to-r from-amber-50/30 to-transparent hover:from-amber-50/50 hover:to-amber-100/20 dark:from-amber-900/20 dark:hover:from-amber-900/30',
        isSelected &&
          'bg-gradient-to-r from-indigo-50/40 to-blue-50/20 border-l-4 border-l-indigo-500 dark:from-indigo-900/20 dark:to-blue-900/10'
      )}
    >
      {isColumnVisible('checkbox') && (
        <TableCell className='w-[50px] py-4' onClick={e => e.stopPropagation()}>
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className='border-slate-300 dark:border-slate-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600'
          />
        </TableCell>
      )}
      {isColumnVisible('name') && (
        <TableCell className='py-4'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className='flex cursor-help items-center gap-4'>
                  <div className='relative'>
                    <SafeImage
                      src={promoter.profile_picture_url ?? null}
                      alt={promoter.displayName}
                      width={48}
                      height={48}
                      className='h-12 w-12 rounded-full border-2 border-white shadow-lg object-cover transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl group-hover:border-indigo-200'
                      fallback={
                        <div className='flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 text-indigo-600 shadow-lg transition-all duration-200 group-hover:scale-110 group-hover:shadow-xl'>
                          <Users className='h-6 w-6' />
                        </div>
                      }
                    />
                    {/* Status indicator dot */}
                    <div
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-white shadow-sm',
                        promoter.overallStatus === 'active' && 'bg-emerald-500',
                        promoter.overallStatus === 'warning' && 'bg-amber-500',
                        promoter.overallStatus === 'critical' && 'bg-red-500',
                        promoter.overallStatus === 'inactive' && 'bg-slate-400'
                      )}
                    />
                  </div>
                  <div className='space-y-1.5 min-w-0 flex-1'>
                    <div className='font-bold text-slate-900 dark:text-slate-100 text-base leading-tight break-words'>
                      {promoter.displayName}
                    </div>
                    <div className='text-sm text-slate-600 dark:text-slate-400 font-medium capitalize'>
                      {promoter.job_title ? (
                        <span className='inline-flex items-center gap-1.5'>
                          <span className='px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-md text-xs font-semibold border border-blue-200 dark:border-blue-800'>
                            {promoter.job_title.replace(/_/g, ' ')}
                          </span>
                        </span>
                      ) : (
                        <span className='text-slate-500 dark:text-slate-400 italic'>
                          Team Member
                        </span>
                      )}
                    </div>
                    {promoter.work_location && (
                      <div className='text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1'>
                        <MapPin className='h-3 w-3 flex-shrink-0' />
                        <span className='truncate'>
                          {promoter.work_location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side='right'
                className='max-w-xs bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700'
              >
                <div className='space-y-2 p-2'>
                  <div className='font-bold text-slate-900 dark:text-slate-100'>
                    {promoter.displayName}
                  </div>
                  <div className='text-sm text-slate-600 dark:text-slate-400'>
                    {promoter.contactEmail}
                  </div>
                  <div className='text-sm text-slate-600 dark:text-slate-400'>
                    {promoter.contactPhone}
                  </div>
                  <div className='text-xs text-slate-500 dark:text-slate-500 pt-1 border-t border-slate-200 dark:border-slate-700'>
                    Click to view full profile
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </TableCell>
      )}
      {isColumnVisible('documents') && (
        <TableCell className='py-4 min-w-[240px]'>
          <div className='space-y-2.5'>
            <DocumentStatusPill label='ID' health={promoter.idDocument} />
            <DocumentStatusPill
              label='Passport'
              health={promoter.passportDocument}
            />
          </div>
        </TableCell>
      )}
      {isColumnVisible('assignment') && (
        <TableCell className='py-4 min-w-[160px]'>
          <div className='space-y-2.5'>
            <div className='text-sm font-bold text-slate-900 dark:text-slate-100 leading-tight break-words'>
              {promoter.assignmentStatus === 'assigned'
                ? promoter.organisationLabel
                : 'Unassigned'}
            </div>
            <Badge
              variant='outline'
              className={cn(
                'w-fit rounded-full border px-3 py-1 text-xs font-bold transition-all shadow-sm whitespace-nowrap',
                promoter.assignmentStatus === 'assigned'
                  ? 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-300 hover:from-emerald-100 hover:to-green-100 hover:shadow-md'
                  : 'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 border-slate-300 hover:from-slate-100 hover:to-gray-100'
              )}
            >
              {promoter.assignmentStatus === 'assigned'
                ? '✓ Assigned'
                : '○ Available'}
            </Badge>
          </div>
        </TableCell>
      )}
      {isColumnVisible('contact') && (
        <TableCell className='py-4'>
          {enableInlineEdit && onInlineUpdate ? (
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Mail className='h-4 w-4 text-slate-400 flex-shrink-0' />
                <InlineEditableCell
                  value={promoter.contactEmail}
                  fieldName='email'
                  fieldLabel='Email'
                  onSave={value => handleFieldUpdate('email', value)}
                  placeholder='email@example.com'
                  type='email'
                  validator={validators.email}
                  displayClassName='text-slate-700 dark:text-slate-300 font-medium'
                />
              </div>
              <div className='flex items-center gap-2'>
                <Phone className='h-4 w-4 text-slate-400 flex-shrink-0' />
                <InlineEditableCell
                  value={promoter.contactPhone}
                  fieldName='phone'
                  fieldLabel='Phone'
                  onSave={value => handleFieldUpdate('mobile_number', value)}
                  placeholder='+1 234 567 8900'
                  type='tel'
                  validator={validators.phone}
                  displayClassName='text-slate-700 dark:text-slate-300 font-medium'
                />
              </div>
            </div>
          ) : (
            <div className='space-y-2 text-sm'>
              <div className='flex items-center gap-2 text-slate-700 dark:text-slate-300'>
                <Mail className='h-4 w-4 text-slate-400' />
                <span className='font-medium truncate min-w-0 flex-1'>
                  {promoter.contactEmail || '—'}
                </span>
              </div>
              <div className='flex items-center gap-2 text-slate-700 dark:text-slate-300'>
                <Phone className='h-4 w-4 text-slate-400' />
                <span className='font-medium'>
                  {promoter.contactPhone || '—'}
                </span>
              </div>
            </div>
          )}
        </TableCell>
      )}
      {isColumnVisible('created') && (
        <TableCell className='py-4'>
          <div className='flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400'>
            <Calendar className='h-4 w-4 text-slate-400' />
            <span className='font-medium'>{promoter.createdLabel}</span>
          </div>
        </TableCell>
      )}
      {isColumnVisible('status') && (
        <TableCell className='py-4'>
          <Badge
            variant='outline'
            className={cn(
              'rounded-full px-4 py-2 text-sm font-bold transition-all shadow-md border-2',
              promoter.overallStatus === 'active' &&
                'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-300 hover:from-emerald-100 hover:to-green-100',
              promoter.overallStatus === 'warning' &&
                'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-300 hover:from-amber-100 hover:to-yellow-100',
              promoter.overallStatus === 'critical' &&
                'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-red-300 hover:from-red-100 hover:to-rose-100',
              promoter.overallStatus === 'inactive' &&
                'bg-gradient-to-r from-slate-50 to-gray-50 text-slate-600 border-slate-300 hover:from-slate-100 hover:to-gray-100'
            )}
          >
            <div className='flex items-center gap-2'>
              <div
                className={cn(
                  'h-2 w-2 rounded-full',
                  promoter.overallStatus === 'active' && 'bg-emerald-500',
                  promoter.overallStatus === 'warning' && 'bg-amber-500',
                  promoter.overallStatus === 'critical' && 'bg-red-500',
                  promoter.overallStatus === 'inactive' && 'bg-slate-400'
                )}
              />
              {OVERALL_STATUS_LABELS[promoter.overallStatus]}
            </div>
          </Badge>
        </TableCell>
      )}
      {isColumnVisible('actions') && (
        <TableCell
          className='text-right py-4'
          onClick={e => e.stopPropagation()}
        >
          <EnhancedActionsMenu
            promoter={promoter}
            onView={onView}
            onEdit={onEdit}
          />
        </TableCell>
      )}
    </TableRow>
  );
}
