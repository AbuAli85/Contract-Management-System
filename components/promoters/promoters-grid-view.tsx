'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { SafeImage } from '@/components/ui/safe-image';
import {
  Users,
  Building2,
  MoreHorizontal,
  Eye,
  Edit,
  ShieldCheck,
  Clock,
  AlertTriangle,
  HelpCircle,
  Send,
  Archive,
  Loader2,
  Mail,
  Phone,
  Copy,
  Check,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type {
  DocumentStatus,
  OverallStatus,
  DashboardPromoter,
} from './types';

interface PromotersGridViewProps {
  promoters: DashboardPromoter[];
  selectedPromoters: Set<string>;
  onSelectPromoter: (promoterId: string) => void;
  onViewPromoter: (promoter: DashboardPromoter) => void;
  onEditPromoter: (promoter: DashboardPromoter) => void;
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

const DOCUMENT_STATUS_ICONS: Record<DocumentStatus, typeof ShieldCheck> = {
  valid: ShieldCheck,
  expiring: Clock,
  expired: AlertTriangle,
  missing: HelpCircle,
};

const OVERALL_STATUS_LABELS: Record<OverallStatus, string> = {
  active: 'Active',
  warning: 'Warning',
  critical: 'Critical',
  inactive: 'Inactive',
};

function CopyableInfo({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };
  return (
    <button
      onClick={handleCopy}
      className='flex items-center gap-1.5 text-muted-foreground hover:text-foreground w-full truncate group/copy'
      title={`Copy: ${value}`}
    >
      <span className='flex-shrink-0 text-muted-foreground'>{icon}</span>
      <span className='truncate text-xs'>{value}</span>
      <span className='ml-auto flex-shrink-0 opacity-0 group-hover/copy:opacity-100 transition-opacity'>
        {copied ? (
          <Check className='h-3 w-3 text-green-500' />
        ) : (
          <Copy className='h-3 w-3' />
        )}
      </span>
    </button>
  );
}

function PromoterGridCard({
  promoter,
  isSelected,
  onSelect,
  onView,
  onEdit,
}: {
  promoter: DashboardPromoter;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
}) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const StatusIcon = DOCUMENT_STATUS_ICONS[promoter.idDocument.status];

  const handleNotify = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      const response = await fetch(`/api/promoters/${promoter.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'standard' }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Notification failed');
      }
      toast({
        title: '✓ Notification Sent',
        description: `Notification sent to ${promoter.displayName}`,
      });
    } catch {
      toast({
        variant: 'destructive',
        title: '✗ Notification Failed',
        description: 'Could not send the notification.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    try {
      const response = await fetch(`/api/promoters/${promoter.id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Archive request failed');
      }
      toast({
        title: '✓ Record Archived',
        description: `${promoter.displayName} has been archived.`,
      });
      setShowArchiveDialog(false);
    } catch {
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
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-200 hover:shadow-md cursor-pointer',
          promoter.overallStatus === 'critical' &&
            'border-l-4 border-l-red-500 bg-red-50/10',
          promoter.overallStatus === 'warning' &&
            'border-l-4 border-l-amber-400 bg-amber-50/10',
          isSelected && 'ring-2 ring-primary bg-primary/5'
        )}
        onClick={() => onView()}
      >
        <CardContent className='p-4'>
          {/* Header with checkbox and actions */}
          <div className='flex items-start justify-between mb-3'>
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                e.stopPropagation()
              }
              className='mt-1'
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-muted-foreground hover:text-foreground'
                  disabled={isLoading}
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                    e.stopPropagation()
                  }
                >
                  {isLoading ? (
                    <Loader2 className='h-4 w-4 animate-spin' />
                  ) : (
                    <MoreHorizontal className='h-4 w-4' />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' onClick={e => e.stopPropagation()}>
                <DropdownMenuItem onClick={onView}>
                  <Eye className='h-4 w-4 mr-2' />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onEdit}>
                  <Edit className='h-4 w-4 mr-2' />
                  Edit Details
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleNotify} disabled={isLoading}>
                  <Send className='h-4 w-4 mr-2 text-green-500' />
                  Send Notification
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={e => {
                    e.stopPropagation();
                    setShowArchiveDialog(true);
                  }}
                  disabled={isLoading}
                  className='text-destructive focus:text-destructive'
                >
                  <Archive className='h-4 w-4 mr-2' />
                  Archive Record
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Avatar and Name */}
          <div className='flex flex-col items-center text-center mb-4'>
            <SafeImage
              src={promoter.profile_picture_url ?? null}
              alt={promoter.displayName}
              width={64}
              height={64}
              className='h-16 w-16 mb-3 transition-transform group-hover:scale-105'
              fallback={
                <div className='flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
                  <Users className='h-8 w-8' />
                </div>
              }
            />
            <h3 className='font-semibold text-sm leading-tight mb-1 line-clamp-1'>
              {promoter.displayName}
            </h3>
            <p className='text-xs text-muted-foreground line-clamp-1'>
              {promoter.job_title || promoter.organisationLabel || '—'}
            </p>
          </div>

          {/* Status Badge */}
          <div className='flex justify-center mb-3'>
            <Badge
              variant='outline'
              className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-medium',
                OVERALL_STATUS_BADGES[promoter.overallStatus]
              )}
            >
              {OVERALL_STATUS_LABELS[promoter.overallStatus]}
            </Badge>
          </div>

          {/* Contact Info */}
          {(promoter.contactEmail || promoter.contactPhone) && (
            <div className='space-y-1.5 mb-3 border-t pt-3'>
              {promoter.contactEmail && (
                <CopyableInfo
                  icon={<Mail className='h-3 w-3' />}
                  value={promoter.contactEmail}
                />
              )}
              {promoter.contactPhone && (
                <CopyableInfo
                  icon={<Phone className='h-3 w-3' />}
                  value={promoter.contactPhone}
                />
              )}
            </div>
          )}
          {/* Key Info */}
          <div className='space-y-2 text-xs'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-2 text-muted-foreground truncate'>
                    <Building2 className='h-3.5 w-3.5 flex-shrink-0' />
                    <span className='truncate'>
                      {promoter.assignmentStatus === 'assigned'
                        ? promoter.organisationLabel
                        : 'Unassigned'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>
                    {promoter.assignmentStatus === 'assigned'
                      ? promoter.organisationLabel
                      : 'Not assigned to any company'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-2 text-muted-foreground truncate'>
                    <StatusIcon className='h-3.5 w-3.5 flex-shrink-0' />
                    <span className='truncate'>
                      {promoter.idDocument.status === 'valid'
                        ? 'Documents OK'
                        : promoter.idDocument.status === 'expiring'
                          ? 'Expiring Soon'
                          : promoter.idDocument.status === 'expired'
                            ? 'Expired Docs'
                            : 'Missing Docs'}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <div className='text-xs space-y-1'>
                    <p>ID: {promoter.idDocument.label}</p>
                    <p>Passport: {promoter.passportDocument.label}</p>
                  </div>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Quick View Button - appears on hover */}
          <div className='mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-150'>
            <Button
              size='sm'
              variant='outline'
              className='w-full h-7 text-xs gap-1.5'
              onClick={e => { e.stopPropagation(); onView(); }}
            >
              <Eye className='h-3 w-3' />
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this promoter?</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive <strong>{promoter.displayName}</strong>. The
              record will be hidden from the main list but can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              disabled={isLoading}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              {isLoading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Archiving...
                </>
              ) : (
                'Archive'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function PromotersGridView({
  promoters,
  selectedPromoters,
  onSelectPromoter,
  onViewPromoter,
  onEditPromoter,
}: PromotersGridViewProps) {
  return (
    <div
      className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4'
      data-view-mode='grid'
    >
      {promoters.map((promoter, index) => (
        <div
          key={promoter.id}
          className='animate-in fade-in slide-in-from-bottom-4'
          style={{
            animationDelay: `${index * 30}ms`,
            animationDuration: '400ms',
            animationFillMode: 'backwards',
          }}
        >
          <PromoterGridCard
            promoter={promoter}
            isSelected={selectedPromoters.has(promoter.id)}
            onSelect={() => onSelectPromoter(promoter.id)}
            onView={() => onViewPromoter(promoter)}
            onEdit={() => onEditPromoter(promoter)}
          />
        </div>
      ))}
    </div>
  );
}
