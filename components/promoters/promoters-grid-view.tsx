'use client';

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
import { SafeImage } from '@/components/ui/safe-image';
import {
  Users,
  Mail,
  Phone,
  Building2,
  MoreHorizontal,
  Eye,
  Edit,
  ShieldCheck,
  Clock,
  AlertTriangle,
  HelpCircle,
} from 'lucide-react';
import type {
  DocumentStatus,
  OverallStatus,
  DocumentHealth,
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
  const StatusIcon = DOCUMENT_STATUS_ICONS[promoter.idDocument.status];

  return (
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
      <CardContent className="p-4">
        {/* Header with checkbox and actions */}
        <div className="flex items-start justify-between mb-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onView();
              }}>
                <Eye className="h-4 w-4 mr-2" />
                View Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Avatar and Name */}
        <div className="flex flex-col items-center text-center mb-4">
          <SafeImage
            src={promoter.profile_picture_url ?? null}
            alt={promoter.displayName}
            width={64}
            height={64}
            className="h-16 w-16 mb-3 transition-transform group-hover:scale-105"
            fallback={
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                <Users className="h-8 w-8" />
              </div>
            }
          />
          <h3 className="font-semibold text-sm leading-tight mb-1 line-clamp-1">
            {promoter.displayName}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {promoter.job_title || promoter.work_location || '—'}
          </p>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center mb-3">
          <Badge
            variant="outline"
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-medium',
              OVERALL_STATUS_BADGES[promoter.overallStatus]
            )}
          >
            {OVERALL_STATUS_LABELS[promoter.overallStatus]}
          </Badge>
        </div>

        {/* Key Info */}
        <div className="space-y-2 text-xs">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-muted-foreground truncate">
                  <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {promoter.assignmentStatus === 'assigned'
                      ? promoter.organisationLabel
                      : 'Unassigned'}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
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
                <div className="flex items-center gap-2 text-muted-foreground truncate">
                  <StatusIcon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">
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
                <div className="text-xs space-y-1">
                  <p>ID: {promoter.idDocument.label}</p>
                  <p>Passport: {promoter.passportDocument.label}</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
      {promoters.map((promoter, index) => (
        <div
          key={promoter.id}
          className="animate-in fade-in slide-in-from-bottom-4"
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

