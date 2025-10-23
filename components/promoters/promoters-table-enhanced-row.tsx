'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { SafeImage } from '@/components/ui/safe-image';
import {
  Users,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Edit,
  Send,
  AlertTriangle,
  Building2,
  ShieldCheck,
  Clock,
  HelpCircle,
  ExternalLink,
  FileText,
} from 'lucide-react';
import type { DashboardPromoter, DocumentHealth, DocumentStatus, OverallStatus } from './types';

interface PromotersTableEnhancedRowProps {
  promoter: DashboardPromoter;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  locale?: string;
}

const DOCUMENT_STATUS_ICONS: Record<DocumentStatus, typeof ShieldCheck> = {
  valid: ShieldCheck,
  expiring: Clock,
  expired: AlertTriangle,
  missing: HelpCircle,
};

const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
  valid: 'bg-green-50 text-green-700 border-green-200',
  expiring: 'bg-amber-50 text-amber-700 border-amber-200',
  expired: 'bg-red-50 text-red-700 border-red-200',
  missing: 'bg-gray-50 text-gray-700 border-gray-200',
};

const OVERALL_STATUS_STYLES: Record<OverallStatus, string> = {
  active: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  critical: 'bg-red-50 text-red-700 border-red-200',
  inactive: 'bg-gray-50 text-gray-700 border-gray-200',
};

const OVERALL_STATUS_LABELS: Record<OverallStatus, string> = {
  active: 'Operational',
  warning: 'Attention',
  critical: 'Critical',
  inactive: 'Inactive',
};

function DocumentBadge({ label, health }: { label: string; health: DocumentHealth }) {
  const Icon = DOCUMENT_STATUS_ICONS[health.status];
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={cn(
              'flex items-center gap-1.5 text-xs font-medium transition-all cursor-help',
              DOCUMENT_STATUS_STYLES[health.status]
            )}
          >
            <Icon className="h-3 w-3" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-xs">
          <p className="font-medium">{health.label}</p>
          {health.daysRemaining !== null && (
            <p className="text-xs text-muted-foreground mt-1">
              {health.daysRemaining} days {health.status === 'expired' ? 'ago' : 'remaining'}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Enhanced table row with quick actions on hover
 * Provides better UX with immediate access to common operations
 */
export function PromotersTableEnhancedRow({
  promoter,
  isSelected,
  onSelect,
  onView,
  onEdit,
  locale = 'en',
}: PromotersTableEnhancedRowProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleEmailClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (promoter.contactEmail) {
      window.location.href = `mailto:${promoter.contactEmail}`;
    }
  };

  const handlePhoneClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (promoter.contactPhone) {
      window.location.href = `tel:${promoter.contactPhone}`;
    }
  };

  return (
    <TableRow
      className={cn(
        'group transition-all duration-200 hover:bg-muted/50 cursor-pointer',
        promoter.overallStatus === 'critical' &&
          'border-l-4 border-l-red-500 bg-red-50/20 hover:bg-red-50/40',
        promoter.overallStatus === 'warning' &&
          'border-l-4 border-l-amber-400 bg-amber-50/20 hover:bg-amber-50/40',
        isSelected && 'bg-primary/10 border-l-4 border-l-primary hover:bg-primary/20'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onView}
    >
      {/* Selection Checkbox */}
      <TableCell className='w-[50px]' onClick={(e) => e.stopPropagation()}>
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={onSelect}
          aria-label={`Select ${promoter.displayName}`}
        />
      </TableCell>

      {/* Promoter Info with Avatar */}
      <TableCell>
        <div className='flex items-center gap-3'>
          <SafeImage
            src={promoter.profile_picture_url ?? null}
            alt={promoter.displayName}
            width={40}
            height={40}
            className='h-10 w-10 rounded-full border-2 border-white/50 object-cover shadow-sm transition-transform group-hover:scale-110'
            fallback={
              <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold text-sm shadow-sm'>
                {promoter.displayName.charAt(0).toUpperCase()}
              </div>
            }
          />
          <div className='space-y-0.5'>
            <div className='font-semibold leading-none text-foreground group-hover:text-primary transition-colors'>
              {promoter.displayName}
            </div>
            <div className='text-xs text-muted-foreground'>
              {promoter.job_title || promoter.work_location || 'Promoter'}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Documents Status */}
      <TableCell>
        <div className='space-y-1.5'>
          <DocumentBadge label='ID' health={promoter.idDocument} />
          <DocumentBadge label='Passport' health={promoter.passportDocument} />
        </div>
      </TableCell>

      {/* Assignment */}
      <TableCell>
        <div className='space-y-1'>
          <div className='text-sm font-medium text-foreground flex items-center gap-2'>
            {promoter.assignmentStatus === 'assigned' ? (
              <>
                <Building2 className='h-3.5 w-3.5 text-blue-600' />
                <span className='truncate max-w-[200px]' title={promoter.organisationLabel}>
                  {promoter.organisationLabel}
                </span>
              </>
            ) : (
              <span className='text-muted-foreground'>No Assignment</span>
            )}
          </div>
          <Badge
            variant='outline'
            className={cn(
              'w-fit rounded-full px-2.5 py-0.5 text-xs font-medium transition-all',
              promoter.assignmentStatus === 'assigned'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            )}
          >
            {promoter.assignmentStatus === 'assigned' ? '✓ Assigned' : '○ Available'}
          </Badge>
        </div>
      </TableCell>

      {/* Contact Information with Quick Actions */}
      <TableCell>
        <div className='space-y-1 text-sm'>
          <div className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors'>
            <Mail className='h-3.5 w-3.5 flex-shrink-0' />
            {promoter.contactEmail ? (
              <button
                onClick={handleEmailClick}
                className='hover:underline hover:text-blue-600 transition-colors text-left truncate max-w-[180px]'
                title={promoter.contactEmail}
              >
                {promoter.contactEmail}
              </button>
            ) : (
              <span className='text-muted-foreground/50'>No email</span>
            )}
          </div>
          <div className='flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors'>
            <Phone className='h-3.5 w-3.5 flex-shrink-0' />
            {promoter.contactPhone ? (
              <button
                onClick={handlePhoneClick}
                className='hover:underline hover:text-green-600 transition-colors'
                title={`Call ${promoter.contactPhone}`}
              >
                {promoter.contactPhone}
              </button>
            ) : (
              <span className='text-muted-foreground/50'>No phone</span>
            )}
          </div>
        </div>
      </TableCell>

      {/* Created Date */}
      <TableCell className='text-sm text-muted-foreground'>
        <div className='flex items-center gap-2'>
          <Calendar className='h-3.5 w-3.5' />
          {promoter.createdLabel}
        </div>
      </TableCell>

      {/* Overall Status Badge */}
      <TableCell>
        <Badge
          variant='outline'
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-all shadow-sm',
            OVERALL_STATUS_STYLES[promoter.overallStatus]
          )}
        >
          {promoter.overallStatus === 'critical' && '🔴'}
          {promoter.overallStatus === 'warning' && '🟡'}
          {promoter.overallStatus === 'active' && '🟢'}
          {promoter.overallStatus === 'inactive' && '⚪'}{' '}
          {OVERALL_STATUS_LABELS[promoter.overallStatus]}
        </Badge>
      </TableCell>

      {/* Quick Actions (Visible on Hover) */}
      <TableCell className='text-right' onClick={(e) => e.stopPropagation()}>
        <div className={cn(
          'flex items-center justify-end gap-1 transition-opacity duration-200',
          isHovered ? 'opacity-100' : 'opacity-0'
        )}>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-blue-100 hover:text-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onView();
                  }}
                  aria-label={`View ${promoter.displayName}'s profile`}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>View Profile</p></TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-purple-100 hover:text-purple-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  aria-label={`Edit ${promoter.displayName}'s details`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Edit Details</p></TooltipContent>
            </Tooltip>

            {promoter.contactEmail && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-green-100 hover:text-green-600"
                    onClick={handleEmailClick}
                    aria-label={`Email ${promoter.displayName}`}
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Send Email</p></TooltipContent>
              </Tooltip>
            )}

            {promoter.contactPhone && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 hover:bg-yellow-100 hover:text-yellow-600"
                    onClick={handlePhoneClick}
                    aria-label={`Call ${promoter.displayName}`}
                  >
                    <Phone className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Call Promoter</p></TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 hover:bg-indigo-100 hover:text-indigo-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(`/${locale}/manage-promoters/${promoter.id}?tab=documents`, '_blank');
                  }}
                  aria-label={`View ${promoter.displayName}'s documents`}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>View Documents</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Always visible action button for mobile */}
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            'h-8 w-8',
            isHovered && 'opacity-0 pointer-events-none'
          )}
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          aria-label={`View ${promoter.displayName}`}
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

