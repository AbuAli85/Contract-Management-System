'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';
import {
  Users,
  UserCheck,
  ShieldAlert,
  CheckCircle,
  TrendingUp,
} from 'lucide-react';
import type { DashboardMetrics } from './types';

interface PromotersMetricsCardsProps {
  metrics: DashboardMetrics;
  onCardClick?: (filterType: 'all' | 'active' | 'alerts' | 'compliance') => void;
  activeFilter?: 'all' | 'active' | 'alerts' | 'compliance' | null;
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
          <CardTitle className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
            {title}
          </CardTitle>
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
        {trend && (
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
        {...(onCardClick && { onClick: () => onCardClick('compliance') })}
        ariaLabel={`Compliance rate: ${safeMetrics.complianceRate}%. Click to view compliant promoters.`}
        isActive={activeFilter === 'compliance'}
      />
    </div>
  );
}
