'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  UserCheck,
  ShieldAlert,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import {
  TrendIndicator,
  type TrendData,
} from '@/components/ui/trend-indicator';
import type { DashboardMetrics } from './types';

interface PromotersMetricsCardsProps {
  metrics: DashboardMetrics;
  onCardClick?: (
    filterType: 'all' | 'active' | 'alerts' | 'compliance'
  ) => void;
  activeFilter?: 'all' | 'active' | 'alerts' | 'compliance' | null;
  trends?: {
    totalPromoters?: TrendData | null;
    activeWorkforce?: TrendData | null;
    criticalDocuments?: TrendData | null;
    complianceRate?: TrendData | null;
  };
}

const STAT_CARD_STYLES = {
  primary: {
    container: 'bg-primary/5 border-primary/10',
    icon: 'bg-primary/15 text-primary',
  },
  neutral: {
    container: 'border-muted-foreground/10',
    icon: 'bg-muted text-muted-foreground',
  },
  warning: {
    container: 'bg-amber-50 border-amber-100',
    icon: 'bg-amber-100 text-amber-600',
  },
  danger: {
    container: 'bg-red-50 border-red-100',
    icon: 'bg-red-100 text-red-600',
  },
  success: {
    container: 'bg-green-50 border-green-100',
    icon: 'bg-green-100 text-green-600',
  },
} as const;

interface EnhancedStatCardProps {
  title: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  variant?: keyof typeof STAT_CARD_STYLES;
  trend?:
    | {
        value: number;
        label: string;
      }
    | undefined;
  onClick?: (() => void) | undefined;
  ariaLabel?: string;
  isActive?: boolean;
  tooltip?: string;
  trendData?: TrendData | null | undefined; // New: Historical trend data
  trendLabel?: string; // e.g., "from last week"
  invertTrendColors?: boolean; // For metrics where decrease is good
}

function EnhancedStatCard({
  title,
  value,
  helper,
  icon: Icon,
  variant = 'neutral',
  trend,
  onClick,
  ariaLabel,
  isActive = false,
  tooltip,
  trendData,
  trendLabel = 'from last week',
  invertTrendColors = false,
}: EnhancedStatCardProps) {
  const styles = STAT_CARD_STYLES[variant];
  const isClickable = !!onClick;

  return (
    <Card
      className={cn(
        'shadow-2xl overflow-hidden transition-all duration-300 relative border-2',
        'bg-gradient-to-br from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-800 dark:to-slate-900',
        'backdrop-blur-sm',
        isClickable &&
          'cursor-pointer hover:shadow-3xl hover:scale-[1.03] hover:-translate-y-2 active:scale-[0.97] hover:border-primary/60',
        !isClickable && 'hover:shadow-2xl hover:scale-[1.02]',
        isActive &&
          'ring-4 ring-primary ring-offset-4 shadow-3xl border-primary/70 bg-gradient-to-br from-primary/5 via-blue-500/5 to-primary/5',
        styles.container
      )}
      onClick={onClick}
      onKeyDown={e => {
        if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={ariaLabel || `${title}: ${value}`}
      aria-pressed={isClickable && isActive ? true : undefined}
    >
      {isActive && (
        <div className='absolute top-3 right-3 z-10'>
          <div className='h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-lg' />
        </div>
      )}
      {/* Premium gradient accent with animation */}
      <div className='absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary/60 via-primary to-primary/60 opacity-80' />
      <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer' />

      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-5 pt-6'>
        <div className='space-y-3 flex-1 min-w-0'>
          <div className='flex items-center gap-2 flex-wrap'>
            <CardTitle className='text-xs font-black text-muted-foreground uppercase tracking-widest'>
              {title}
            </CardTitle>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className='h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors flex-shrink-0 hover:scale-110' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs bg-slate-900 border-slate-700 shadow-2xl'>
                    <p className='text-sm text-white font-medium'>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className='text-5xl font-black tracking-tight bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-slate-200 bg-clip-text text-transparent drop-shadow-lg'>
            {value}
          </div>
        </div>
        <div
          className={cn(
            'rounded-2xl p-4 shadow-xl flex-shrink-0 border-2 border-white/20',
            'bg-gradient-to-br backdrop-blur-sm',
            'hover:scale-110 transition-transform duration-300',
            styles.icon
          )}
        >
          <Icon className='h-7 w-7' />
        </div>
      </CardHeader>
      <CardContent className='space-y-2'>
        {helper && <p className='text-sm text-muted-foreground'>{helper}</p>}

        {/* Historical Trend Indicator (new feature) */}
        {trendData && (
          <TrendIndicator
            trend={trendData}
            comparisonPeriod={trendLabel}
            variant='detailed'
            showPercent={true}
            invertColors={invertTrendColors}
            className='w-full justify-center'
          />
        )}

        {/* Legacy trend display (keep for backwards compatibility) */}
        {trend && !trendData && (
          <div className='flex items-center gap-2 rounded-lg bg-green-50/50 p-2 text-xs text-green-700'>
            <TrendingUp className='h-4 w-4' />
            <span className='font-semibold'>
              +{trend.value} {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PromotersMetricsCards({
  metrics,
  onCardClick,
  activeFilter,
  trends,
}: PromotersMetricsCardsProps) {
  // ✅ Safety: Ensure all metric values are numbers, not undefined or NaN
  const safeMetrics = {
    total: Number(metrics.total) || 0,
    active: Number(metrics.active) || 0,
    critical: Number(metrics.critical) || 0,
    expiring: Number(metrics.expiring) || 0,
    unassigned: Number(metrics.unassigned) || 0,
    companies: Number(metrics.companies) || 0,
    recentlyAdded: Number(metrics.recentlyAdded) || 0,
    complianceRate: Number(metrics.complianceRate) || 0,
  };

  // Calculate assigned staff safely
  const assignedStaff = Math.max(0, safeMetrics.total - safeMetrics.unassigned);

  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      <EnhancedStatCard
        title='Total promoters'
        value={safeMetrics.total}
        helper={`${safeMetrics.active} active right now • Click to view all`}
        icon={Users}
        variant='primary'
        trend={
          safeMetrics.recentlyAdded > 0
            ? { value: safeMetrics.recentlyAdded, label: 'new this week' }
            : undefined
        }
        trendData={trends?.totalPromoters}
        trendLabel='from last week'
        tooltip='Total number of registered promoters in the system. Includes active, inactive, and all employment statuses. This is your complete workforce database. Click this card to view the full list of all promoters.'
        {...(onCardClick && { onClick: () => onCardClick('all') })}
        ariaLabel={`Total promoters: ${safeMetrics.total}. Click to view all promoters.`}
        isActive={activeFilter === 'all'}
      />
      <EnhancedStatCard
        title='Active workforce'
        value={safeMetrics.active}
        helper={`${safeMetrics.unassigned} awaiting assignment • Click to view active`}
        icon={UserCheck}
        variant='neutral'
        trendData={trends?.activeWorkforce}
        trendLabel='from last week'
        tooltip={`Currently active promoters who are employed and available in the system. Of these ${safeMetrics.active} active promoters, ${safeMetrics.unassigned} are awaiting assignment to a company, while ${safeMetrics.active - safeMetrics.unassigned} are already assigned. Click this card to view the filtered list of active promoters.`}
        {...(onCardClick && { onClick: () => onCardClick('active') })}
        ariaLabel={`Active workforce: ${safeMetrics.active}. Click to view filtered list of active promoters.`}
        isActive={activeFilter === 'active'}
      />
      <EnhancedStatCard
        title='Document alerts'
        value={safeMetrics.critical}
        helper={
          safeMetrics.critical > 0
            ? `${safeMetrics.expiring} expiring soon • Click to view all`
            : 'All documents are valid'
        }
        icon={ShieldAlert}
        variant={safeMetrics.critical > 0 ? 'danger' : 'warning'}
        trendData={trends?.criticalDocuments}
        trendLabel='from last week'
        invertTrendColors={true} // Down is good for alerts!
        tooltip={`Promoters with document compliance issues. ${safeMetrics.critical} have expired documents (ID cards or passports) requiring immediate attention. ${safeMetrics.expiring} have documents expiring within 30 days. Click this card to view the filtered list of promoters with document issues.`}
        {...(onCardClick && { onClick: () => onCardClick('alerts') })}
        ariaLabel={`Document alerts: ${safeMetrics.critical} critical, ${safeMetrics.expiring} expiring soon. Click to view filtered list of promoters with document issues.`}
        isActive={activeFilter === 'alerts'}
      />
      <EnhancedStatCard
        title='Compliance rate'
        value={`${safeMetrics.complianceRate}%`}
        helper={
          safeMetrics.complianceRate >= 90
            ? `${assignedStaff} assigned staff • Target met ✓`
            : `${assignedStaff} assigned staff • Click to improve`
        }
        icon={CheckCircle}
        variant={safeMetrics.complianceRate >= 90 ? 'success' : 'warning'}
        trendData={trends?.complianceRate}
        trendLabel='from last week'
        tooltip={`Percentage of promoters with all documents valid and up to date. This measures how many promoters have both valid ID cards and passports. Target: 90% or higher for optimal workforce readiness. ${safeMetrics.complianceRate < 90 ? 'Click this card to view compliant promoters and identify areas for improvement.' : 'Click this card to view the list of compliant promoters.'}`}
        {...(onCardClick && { onClick: () => onCardClick('compliance') })}
        ariaLabel={`Compliance rate: ${safeMetrics.complianceRate}%. Click to view compliant promoters.`}
        isActive={activeFilter === 'compliance'}
      />
    </div>
  );
}
