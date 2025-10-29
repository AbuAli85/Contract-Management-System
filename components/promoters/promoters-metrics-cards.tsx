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
import { TrendIndicator, type TrendData } from '@/components/ui/trend-indicator';
import type { DashboardMetrics } from './types';

interface PromotersMetricsCardsProps {
  metrics: DashboardMetrics;
  onCardClick?: (filterType: 'all' | 'active' | 'alerts' | 'compliance') => void;
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
        'shadow-sm overflow-hidden transition-all duration-300 relative',
        isClickable && 'cursor-pointer hover:shadow-xl hover:scale-[1.03] hover:-translate-y-1 active:scale-[0.98]',
        !isClickable && 'hover:shadow-lg hover:scale-105',
        isActive && 'ring-2 ring-primary ring-offset-2 shadow-xl',
        styles.container
      )}
      onClick={onClick}
      onKeyDown={(e) => {
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
        <div className="absolute top-2 right-2">
          <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        </div>
      )}
      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
        <div className='space-y-1'>
          <div className='flex items-center gap-2'>
            <CardTitle className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
              {title}
            </CardTitle>
            {tooltip && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className='h-4 w-4 text-muted-foreground/60 hover:text-muted-foreground cursor-help transition-colors' />
                  </TooltipTrigger>
                  <TooltipContent className='max-w-xs'>
                    <p className='text-sm'>{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
          <div className='text-3xl font-bold tracking-tight'>{value}</div>
        </div>
        <div
          className={cn(
            'rounded-lg p-3 text-white transition-transform group-hover:scale-110',
            styles.icon
          )}
        >
          <Icon className='h-6 w-6' />
        </div>
      </CardHeader>
      <CardContent className='space-y-2'>
        {helper && <p className='text-sm text-muted-foreground'>{helper}</p>}
        
        {/* Historical Trend Indicator (new feature) */}
        {trendData && (
          <TrendIndicator
            trend={trendData}
            comparisonPeriod={trendLabel}
            variant="detailed"
            showPercent={true}
            invertColors={invertTrendColors}
            className="w-full justify-center"
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
        helper={`${safeMetrics.active} active right now`}
        icon={Users}
        variant='primary'
        trend={
          safeMetrics.recentlyAdded > 0
            ? { value: safeMetrics.recentlyAdded, label: 'new this week' }
            : undefined
        }
        trendData={trends?.totalPromoters}
        trendLabel='from last week'
        tooltip='Total number of registered promoters in the system. Includes active, inactive, and all employment statuses. This is your complete workforce database.'
        {...(onCardClick && { onClick: () => onCardClick('all') })}
        ariaLabel={`Total promoters: ${safeMetrics.total}. Click to view all promoters.`}
        isActive={activeFilter === 'all'}
      />
      <EnhancedStatCard
        title='Active workforce'
        value={safeMetrics.active}
        helper={`${safeMetrics.unassigned} awaiting assignment`}
        icon={UserCheck}
        variant='neutral'
        trendData={trends?.activeWorkforce}
        trendLabel='from last week'
        tooltip={`Currently active promoters who are employed and available in the system. Of these ${safeMetrics.active} active promoters, ${safeMetrics.unassigned} are awaiting assignment to a company, while ${safeMetrics.active - safeMetrics.unassigned} are already assigned.`}
        {...(onCardClick && { onClick: () => onCardClick('active') })}
        ariaLabel={`Active workforce: ${safeMetrics.active}. Click to filter by assigned promoters.`}
        isActive={activeFilter === 'active'}
      />
      <EnhancedStatCard
        title='Document alerts'
        value={safeMetrics.critical}
        helper={`${safeMetrics.expiring} expiring soon`}
        icon={ShieldAlert}
        variant={safeMetrics.critical > 0 ? 'danger' : 'warning'}
        trendData={trends?.criticalDocuments}
        trendLabel='from last week'
        invertTrendColors={true} // Down is good for alerts!
        tooltip={`Promoters with document compliance issues. ${safeMetrics.critical} have expired documents (ID cards or passports) requiring immediate attention. ${safeMetrics.expiring} have documents expiring within 30 days. Take action now to maintain compliance.`}
        {...(onCardClick && { onClick: () => onCardClick('alerts') })}
        ariaLabel={`Document alerts: ${safeMetrics.critical} critical, ${safeMetrics.expiring} expiring soon. Click to filter by document issues.`}
        isActive={activeFilter === 'alerts'}
      />
      <EnhancedStatCard
        title='Compliance rate'
        value={`${safeMetrics.complianceRate}%`}
        helper={`${assignedStaff} assigned staff`}
        icon={CheckCircle}
        variant={safeMetrics.complianceRate >= 90 ? 'success' : 'warning'}
        trendData={trends?.complianceRate}
        trendLabel='from last week'
        tooltip={`Percentage of promoters with all documents valid and up to date. This measures how many promoters have both valid ID cards and passports. Target: 90% or higher for optimal workforce readiness.`}
        {...(onCardClick && { onClick: () => onCardClick('compliance') })}
        ariaLabel={`Compliance rate: ${safeMetrics.complianceRate}%. Click to view compliant promoters.`}
        isActive={activeFilter === 'compliance'}
      />
    </div>
  );
}
