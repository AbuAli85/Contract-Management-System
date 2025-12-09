'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { maskIdNumber } from '@/lib/utils/id-masking';
import {
  Building2,
  Users,
  Mail,
  Phone,
  Calendar,
  MapPin,
  MoreVertical,
  Edit,
  Eye,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Clock,
  Settings,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardPromoter } from './types';
import { PartyAssignmentDialog } from './party-assignment-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';

interface SafeImageProps {
  src: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  fallback?: React.ReactNode;
}

function SafeImage({
  src,
  alt,
  width,
  height,
  className,
  fallback,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-slate-100 rounded-full',
          className
        )}
      >
        {fallback}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={cn('rounded-full object-cover', className)}
      onError={() => setHasError(true)}
    />
  );
}

function InfoLine({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<any>;
  text: string;
}) {
  if (!text || text === '—') return null;

  return (
    <div className='flex items-center gap-1.5'>
      <Icon className='h-3.5 w-3.5 text-muted-foreground/80 flex-shrink-0' />
      <span className='text-sm truncate'>{text}</span>
    </div>
  );
}

function DocumentStatusPill({
  label,
  health,
  expiryDate,
}: {
  label: string;
  health: {
    status:
      | 'valid'
      | 'expiring'
      | 'expired'
      | 'missing'
      | 'warning'
      | 'critical'
      | 'good';
    label: string;
  };
  expiryDate?: string | null | undefined;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid':
      case 'good':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'expiring':
      case 'warning':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'expired':
      case 'missing':
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex items-center gap-2'>
        <span className='text-xs font-medium text-muted-foreground'>
          {label}
        </span>
        <span
          className={cn(
            'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
            getStatusColor(health.status)
          )}
        >
          {health.label}
        </span>
      </div>
      {expiryDate && (
        <span className='text-[10px] text-muted-foreground font-mono'>
          {formatDate(expiryDate)}
        </span>
      )}
    </div>
  );
}

// Helper function to format date
function formatDate(dateString: string) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

// Helper function to calculate data completeness
function getDataCompleteness(promoter: DashboardPromoter) {
  const fields = [
    promoter.name_en,
    promoter.name_ar,
    promoter.mobile_number || promoter.contactPhone,
    promoter.id_card_number,
    promoter.job_title,
    promoter.id_card_expiry_date,
    promoter.passport_expiry_date,
    promoter.email || promoter.contactEmail,
  ];

  const filledFields = fields.filter(field => field && field !== '').length;
  const totalFields = fields.length;
  const percentage = Math.round((filledFields / totalFields) * 100);

  const missingFields = [];
  if (!promoter.name_ar) missingFields.push('Arabic Name');
  if (!promoter.mobile_number && !promoter.contactPhone)
    missingFields.push('Mobile');
  if (!promoter.job_title) missingFields.push('Job Title');
  if (!promoter.id_card_expiry_date) missingFields.push('ID Expiry');
  if (!promoter.passport_expiry_date) missingFields.push('Passport Expiry');
  if (!promoter.email && !promoter.contactEmail) missingFields.push('Email');

  return { percentage, filledFields, totalFields, missingFields };
}

// Helper function to get time since last update
function getTimeSinceUpdate(
  updatedAt?: string | null,
  createdAt?: string | null
) {
  const dateToUse = updatedAt || createdAt;
  if (!dateToUse) return { text: 'Unknown', isRecent: false };

  const now = new Date();
  const updated = new Date(dateToUse);
  const diffInMs = now.getTime() - updated.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));

  if (diffInMinutes < 60) {
    return { text: `${diffInMinutes}m ago`, isRecent: true };
  } else if (diffInHours < 24) {
    return { text: `${diffInHours}h ago`, isRecent: true };
  } else if (diffInDays === 0) {
    return { text: 'Today', isRecent: true };
  } else if (diffInDays === 1) {
    return { text: 'Yesterday', isRecent: true };
  } else if (diffInDays < 7) {
    return { text: `${diffInDays}d ago`, isRecent: true };
  } else if (diffInDays < 30) {
    return { text: `${Math.floor(diffInDays / 7)}w ago`, isRecent: false };
  } else {
    return { text: formatDate(dateToUse), isRecent: false };
  }
}

interface EnhancedPromoterCardProps {
  promoter: DashboardPromoter;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
  onPartyAssignmentUpdate?: (
    promoterId: string,
    partyId: string | null
  ) => void;
}

export function EnhancedPromoterCardWithPartyEdit({
  promoter,
  isSelected,
  onSelect,
  onView,
  onEdit,
  onPartyAssignmentUpdate,
}: EnhancedPromoterCardProps) {
  const [showPartyDialog, setShowPartyDialog] = useState(false);
  const completeness = getDataCompleteness(promoter);
  const lastUpdate = getTimeSinceUpdate(
    promoter.updated_at,
    promoter.created_at
  );

  const handlePartyAssignmentUpdate = (
    promoterId: string,
    partyId: string | null
  ) => {
    onPartyAssignmentUpdate?.(promoterId, partyId);
    setShowPartyDialog(false);
  };

  const getOverallStatusIcon = (status: string) => {
    switch (status) {
      case 'critical':
        return <AlertTriangle className='h-4 w-4 text-red-600' />;
      case 'warning':
        return <Clock className='h-4 w-4 text-amber-600' />;
      case 'active':
        return <CheckCircle className='h-4 w-4 text-emerald-600' />;
      default:
        return <UserCheck className='h-4 w-4 text-slate-600' />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'secondary';
      case 'active':
        return 'default';
      default:
        return 'outline';
    }
  };

  return (
    <>
      <Card
        className={cn(
          'group relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer',
          promoter.overallStatus === 'critical' &&
            'border-l-4 border-l-red-500 bg-red-50/10',
          promoter.overallStatus === 'warning' &&
            'border-l-4 border-l-amber-400 bg-amber-50/10',
          lastUpdate.isRecent &&
            promoter.overallStatus !== 'critical' &&
            promoter.overallStatus !== 'warning' &&
            'border-l-4 border-l-green-500',
          isSelected && 'ring-2 ring-primary bg-primary/5'
        )}
        onClick={() => onView()}
      >
        <CardHeader className='pb-3 border-b'>
          {/* Last Updated & Data Completeness Header */}
          <div className='flex items-center justify-between mb-3 pb-2 border-b border-slate-100'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-1.5 text-xs text-slate-500'>
                    <Clock
                      className={cn(
                        'h-3.5 w-3.5',
                        lastUpdate.isRecent
                          ? 'text-green-600'
                          : 'text-slate-400'
                      )}
                    />
                    <span
                      className={cn(
                        'font-medium',
                        lastUpdate.isRecent && 'text-green-600'
                      )}
                    >
                      {lastUpdate.text}
                    </span>
                    {lastUpdate.isRecent && (
                      <TrendingUp className='h-3 w-3 text-green-600 ml-0.5' />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Last updated:{' '}
                    {promoter.updated_at
                      ? formatDate(promoter.updated_at)
                      : formatDate(promoter.created_at || '')}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className='flex items-center gap-1.5'>
                    {completeness.percentage === 100 ? (
                      <CheckCircle2 className='h-3.5 w-3.5 text-green-600' />
                    ) : (
                      <AlertCircle className='h-3.5 w-3.5 text-amber-600' />
                    )}
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        completeness.percentage === 100
                          ? 'text-green-600'
                          : 'text-amber-600'
                      )}
                    >
                      {completeness.percentage}%
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    Data Completeness: {completeness.filledFields}/
                    {completeness.totalFields} fields
                  </p>
                  {completeness.missingFields.length > 0 && (
                    <p className='text-xs mt-1'>
                      Missing: {completeness.missingFields.join(', ')}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className='flex items-start gap-3'>
            <Checkbox
              checked={isSelected}
              onCheckedChange={onSelect}
              onClick={(e: React.MouseEvent<HTMLInputElement>) =>
                e.stopPropagation()
              }
              className='mt-1'
            />

            <SafeImage
              src={promoter.profile_picture_url ?? null}
              alt={promoter.displayName}
              width={48}
              height={48}
              className='h-12 w-12 transition-transform group-hover:scale-105'
              fallback={
                <div className='flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
                  <Users className='h-6 w-6' />
                </div>
              }
            />

            <div className='flex-1 min-w-0'>
              <div className='flex items-start justify-between gap-2'>
                <div className='min-w-0'>
                  <h3 className='font-semibold text-base leading-tight truncate'>
                    {promoter.displayName}
                  </h3>
                  {promoter.name_ar &&
                    promoter.name_ar !== promoter.name_en && (
                      <p className='text-sm text-muted-foreground truncate mt-0.5'>
                        {promoter.name_ar}
                      </p>
                    )}
                  {promoter.id_card_number && (
                    <p className='text-xs text-muted-foreground font-mono mt-1'>
                      ID: {maskIdNumber(promoter.id_card_number)}
                    </p>
                  )}
                </div>

                <div className='flex items-center gap-2 flex-shrink-0'>
                  {getOverallStatusIcon(promoter.overallStatus)}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-8 w-8 p-0'
                        onClick={e => e.stopPropagation()}
                      >
                        <MoreVertical className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end' className='w-48'>
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onView()}>
                        <Eye className='mr-2 h-4 w-4' />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit()}>
                        <Edit className='mr-2 h-4 w-4' />
                        Edit Profile
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setShowPartyDialog(true)}
                        className='text-blue-600'
                      >
                        <Building2 className='mr-2 h-4 w-4' />
                        Manage Party Assignment
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className='flex items-center gap-2 mt-2'>
                <Badge
                  variant={getStatusBadgeVariant(promoter.overallStatus)}
                  className='text-xs'
                >
                  {promoter.overallStatus?.charAt(0).toUpperCase() +
                    promoter.overallStatus?.slice(1)}
                </Badge>
                {promoter.job_title && (
                  <Badge variant='outline' className='text-xs'>
                    {promoter.job_title}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-4 pt-4'>
          {/* Documents Status */}
          <div className='space-y-2'>
            <span className='text-xs font-medium text-muted-foreground'>
              Document Status
            </span>
            <div className='space-y-1.5'>
              <DocumentStatusPill
                label='ID Card'
                health={promoter.idDocument}
                expiryDate={promoter.id_card_expiry_date}
              />
              <DocumentStatusPill
                label='Passport'
                health={promoter.passportDocument}
                expiryDate={promoter.passport_expiry_date}
              />
            </div>
          </div>

          {/* Assignment - Enhanced with Party Management */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between'>
              <span className='text-xs font-medium text-muted-foreground'>
                Assignment
              </span>
              <Button
                variant='ghost'
                size='sm'
                className='h-6 px-2 text-xs text-blue-600 hover:text-blue-700'
                onClick={e => {
                  e.stopPropagation();
                  setShowPartyDialog(true);
                }}
              >
                <Settings className='h-3 w-3 mr-1' />
                Edit
              </Button>
            </div>
            <div className='flex items-center gap-2'>
              <Building2 className='h-3.5 w-3.5 text-muted-foreground/80 flex-shrink-0' />
              <span className='text-sm truncate'>
                {promoter.assignmentStatus === 'assigned'
                  ? promoter.organisationLabel
                  : 'Unassigned'}
              </span>
              <Badge
                variant='outline'
                className={cn(
                  'ml-auto rounded-full border px-2 py-0.5 text-xs font-medium flex-shrink-0',
                  promoter.assignmentStatus === 'assigned'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200'
                )}
              >
                {promoter.assignmentStatus === 'assigned' ? '✓' : '○'}
              </Badge>
            </div>
          </div>

          {/* Contact */}
          <div className='space-y-2'>
            <span className='text-xs font-medium text-muted-foreground'>
              Contact
            </span>
            <div className='space-y-1.5'>
              <InfoLine icon={Mail} text={promoter.contactEmail} />
              <InfoLine icon={Phone} text={promoter.contactPhone} />
              {promoter.work_location && (
                <InfoLine icon={MapPin} text={promoter.work_location} />
              )}
            </div>
          </div>

          {/* Created Date */}
          <div className='flex items-center justify-between pt-2 border-t'>
            <span className='text-xs text-muted-foreground'>Created</span>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
              <Calendar className='h-3.5 w-3.5' />
              {promoter.createdLabel}
            </div>
          </div>

          {/* Data Completeness Progress Bar */}
          {completeness.percentage < 100 && (
            <div className='mt-3 pt-3 border-t border-slate-100'>
              <div className='flex items-center justify-between mb-1.5'>
                <span className='text-xs font-medium text-slate-500'>
                  Profile Completeness
                </span>
                <span className='text-xs font-semibold text-amber-600'>
                  {completeness.percentage}%
                </span>
              </div>
              <Progress value={completeness.percentage} className='h-1.5' />
              {completeness.missingFields.length > 0 && (
                <div className='mt-2 flex items-start gap-1'>
                  <AlertCircle className='h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0' />
                  <p className='text-xs text-amber-600 line-clamp-2'>
                    Missing: {completeness.missingFields.join(', ')}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Party Assignment Dialog */}
      <PartyAssignmentDialog
        isOpen={showPartyDialog}
        onClose={() => setShowPartyDialog(false)}
        promoter={promoter}
        onAssignmentUpdate={handlePartyAssignmentUpdate}
      />
    </>
  );
}

// Enhanced Cards View component that uses the new card with party edit functionality
interface EnhancedPromotersCardsViewProps {
  promoters: DashboardPromoter[];
  selectedPromoters: Set<string>;
  onSelectPromoter: (id: string) => void;
  onViewPromoter: (promoter: DashboardPromoter) => void;
  onEditPromoter: (promoter: DashboardPromoter) => void;
  onPartyAssignmentUpdate?: (
    promoterId: string,
    partyId: string | null
  ) => void;
}

export function EnhancedPromotersCardsViewWithPartyEdit({
  promoters,
  selectedPromoters,
  onSelectPromoter,
  onViewPromoter,
  onEditPromoter,
  onPartyAssignmentUpdate,
}: EnhancedPromotersCardsViewProps) {
  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 p-4'>
      {promoters.map((promoter, index) => (
        <div
          key={promoter.id}
          className='animate-in fade-in slide-in-from-bottom-4'
          style={{
            animationDelay: `${index * 40}ms`,
            animationDuration: '400ms',
            animationFillMode: 'backwards',
          }}
        >
          <EnhancedPromoterCardWithPartyEdit
            promoter={promoter}
            isSelected={selectedPromoters.has(promoter.id)}
            onSelect={() => onSelectPromoter(promoter.id)}
            onView={() => onViewPromoter(promoter)}
            onEdit={() => onEditPromoter(promoter)}
            {...(onPartyAssignmentUpdate && { onPartyAssignmentUpdate })}
          />
        </div>
      ))}
    </div>
  );
}
