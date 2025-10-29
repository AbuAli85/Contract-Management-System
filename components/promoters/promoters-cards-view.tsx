'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { SafeImage } from '@/components/ui/safe-image';
import {
  Users,
  Mail,
  Phone,
  Building2,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  ShieldCheck,
  Clock,
  AlertTriangle,
  HelpCircle,
  MapPin,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type {
  DocumentStatus,
  OverallStatus,
  DocumentHealth,
  DashboardPromoter,
} from './types';

interface PromotersCardsViewProps {
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
  active: 'Operational',
  warning: 'Attention',
  critical: 'Critical',
  inactive: 'Inactive',
};

interface InfoLineProps {
  icon: typeof Mail;
  text?: string | null;
}

function InfoLine({ icon: Icon, text }: InfoLineProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground/80 flex-shrink-0" />
      <span className="truncate text-xs text-muted-foreground">
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
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <Badge
          variant="outline"
          className={cn(
            'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide',
            DOCUMENT_STATUS_BADGES[health.status]
          )}
        >
          <Icon className="h-3 w-3" />
          {label}
        </Badge>
        <span className="text-[11px] text-muted-foreground truncate">
          {health.label}
        </span>
      </div>
      {health.expiresOn && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {(() => {
            const date = new Date(health.expiresOn);
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}/${month}/${year}`;
          })()}
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
  if (!promoter.mobile_number && !promoter.contactPhone) missingFields.push('Mobile');
  if (!promoter.job_title) missingFields.push('Job Title');
  if (!promoter.id_card_expiry_date) missingFields.push('ID Expiry');
  if (!promoter.passport_expiry_date) missingFields.push('Passport Expiry');
  if (!promoter.email && !promoter.contactEmail) missingFields.push('Email');
  
  return { percentage, filledFields, totalFields, missingFields };
}

// Helper function to get time since last update
function getTimeSinceUpdate(updatedAt?: string | null, createdAt?: string | null) {
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

function PromoterCard({
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
  const completeness = getDataCompleteness(promoter);
  const lastUpdate = getTimeSinceUpdate(promoter.updated_at, promoter.created_at);

  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer',
        promoter.overallStatus === 'critical' &&
          'border-l-4 border-l-red-500 bg-red-50/10',
        promoter.overallStatus === 'warning' &&
          'border-l-4 border-l-amber-400 bg-amber-50/10',
        lastUpdate.isRecent && promoter.overallStatus !== 'critical' && promoter.overallStatus !== 'warning' &&
          'border-l-4 border-l-green-500',
        isSelected && 'ring-2 ring-primary bg-primary/5'
      )}
      onClick={() => onView()}
    >
      <CardHeader className="pb-3 border-b">
        {/* Last Updated & Data Completeness Header */}
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock className={cn(
                    'h-3.5 w-3.5',
                    lastUpdate.isRecent ? 'text-green-600' : 'text-slate-400'
                  )} />
                  <span className={cn(
                    'font-medium',
                    lastUpdate.isRecent && 'text-green-600'
                  )}>
                    {lastUpdate.text}
                  </span>
                  {lastUpdate.isRecent && (
                    <TrendingUp className='h-3 w-3 text-green-600 ml-0.5' />
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Last updated: {promoter.updated_at ? formatDate(promoter.updated_at) : formatDate(promoter.created_at || '')}</p>
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
                  <span className={cn(
                    'text-xs font-semibold',
                    completeness.percentage === 100 ? 'text-green-600' : 'text-amber-600'
                  )}>
                    {completeness.percentage}%
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Data Completeness: {completeness.filledFields}/{completeness.totalFields} fields</p>
                {completeness.missingFields.length > 0 && (
                  <p className='text-xs mt-1'>Missing: {completeness.missingFields.join(', ')}</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e: React.MouseEvent<HTMLInputElement>) => e.stopPropagation()}
            className="mt-1"
          />
          
          <SafeImage
            src={promoter.profile_picture_url ?? null}
            alt={promoter.displayName}
            width={48}
            height={48}
            className="h-12 w-12 transition-transform group-hover:scale-105"
            fallback={
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Users className="h-6 w-6" />
              </div>
            }
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-1">
                  {promoter.displayName}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {promoter.job_title || promoter.organisationLabel || '—'}
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground flex-shrink-0"
                    onClick={(e: React.MouseEvent<HTMLButtonElement>) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onView}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 pb-4 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Status</span>
          <Badge
            variant="outline"
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              OVERALL_STATUS_BADGES[promoter.overallStatus]
            )}
          >
            {promoter.overallStatus === 'critical' && '🔴'}
            {promoter.overallStatus === 'warning' && '🟡'}
            {promoter.overallStatus === 'active' && '🟢'}
            {promoter.overallStatus === 'inactive' && '⚪'}{' '}
            {OVERALL_STATUS_LABELS[promoter.overallStatus]}
          </Badge>
        </div>

        {/* Documents */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Documents</span>
          <div className="space-y-1.5">
            <DocumentStatusPill label="ID" health={promoter.idDocument} />
            <DocumentStatusPill label="Passport" health={promoter.passportDocument} />
          </div>
        </div>

        {/* Assignment */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Assignment</span>
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground/80 flex-shrink-0" />
            <span className="text-sm truncate">
              {promoter.assignmentStatus === 'assigned'
                ? promoter.organisationLabel
                : 'Unassigned'}
            </span>
            <Badge
              variant="outline"
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
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Contact</span>
          <div className="space-y-1.5">
            <InfoLine icon={Mail} text={promoter.contactEmail} />
            <InfoLine icon={Phone} text={promoter.contactPhone} />
          </div>
        </div>

        {/* Created Date */}
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">Created</span>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {promoter.createdLabel}
          </div>
        </div>

        {/* Data Completeness Progress Bar */}
        {completeness.percentage < 100 && (
          <div className='mt-3 pt-3 border-t border-slate-100'>
            <div className='flex items-center justify-between mb-1.5'>
              <span className='text-xs font-medium text-slate-500'>Profile Completeness</span>
              <span className='text-xs font-semibold text-amber-600'>{completeness.percentage}%</span>
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
  );
}

export function PromotersCardsView({
  promoters,
  selectedPromoters,
  onSelectPromoter,
  onViewPromoter,
  onEditPromoter,
}: PromotersCardsViewProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4" data-view-mode="cards">
      {promoters.map((promoter, index) => (
        <div
          key={promoter.id}
          className="animate-in fade-in slide-in-from-bottom-4"
          style={{
            animationDelay: `${index * 40}ms`,
            animationDuration: '400ms',
            animationFillMode: 'backwards',
          }}
        >
          <PromoterCard
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

