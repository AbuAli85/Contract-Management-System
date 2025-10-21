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
} from 'lucide-react';
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
  );
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
  return (
    <Card
      className={cn(
        'group relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer',
        promoter.overallStatus === 'critical' &&
          'border-l-4 border-l-red-500 bg-red-50/10',
        promoter.overallStatus === 'warning' &&
          'border-l-4 border-l-amber-400 bg-amber-50/10',
        isSelected && 'ring-2 ring-primary bg-primary/5'
      )}
      onClick={() => onView()}
    >
      <CardHeader className="pb-3 border-b">
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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
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

