'use client';

import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  trend?: {
    value: number;
    label: string;
  } | undefined;
}

function EnhancedStatCard({
  title,
  value,
  helper,
  icon: Icon,
  variant = 'neutral',
  trend,
}: EnhancedStatCardProps) {
  const styles = STAT_CARD_STYLES[variant];

  return (
    <Card className={cn(
      'shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105',
      styles.container
    )}>
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
        {helper && (
          <p className='text-sm text-muted-foreground'>{helper}</p>
        )}
        {trend && (
          <div className='flex items-center gap-2 rounded-lg bg-green-50/50 p-2 text-xs text-green-700'>
            <TrendingUp className='h-4 w-4' />
            <span className='font-semibold'>+{trend.value} {trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PromotersMetricsCards({ metrics }: PromotersMetricsCardsProps) {
  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
      <EnhancedStatCard
        title='Total promoters'
        value={metrics.total}
        helper={`${metrics.active} active right now`}
        icon={Users}
        variant='primary'
        trend={metrics.recentlyAdded > 0 ? { value: metrics.recentlyAdded, label: 'new this week' } : undefined}
      />
      <EnhancedStatCard
        title='Active workforce'
        value={metrics.active}
        helper={`${metrics.unassigned} awaiting assignment`}
        icon={UserCheck}
        variant='neutral'
      />
      <EnhancedStatCard
        title='Document alerts'
        value={metrics.critical}
        helper={`${metrics.expiring} expiring soon`}
        icon={ShieldAlert}
        variant={metrics.critical > 0 ? 'danger' : 'warning'}
      />
      <EnhancedStatCard
        title='Compliance rate'
        value={`${metrics.complianceRate}%`}
        helper={`${metrics.total - metrics.unassigned} assigned staff`}
        icon={CheckCircle}
        variant={metrics.complianceRate >= 90 ? 'success' : 'warning'}
      />
    </div>
  );
}
