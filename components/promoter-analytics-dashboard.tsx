'use client';

import { useMemo, useState } from 'react';
import { format, subDays, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Promoter } from '@/lib/types';

interface DashboardPromoter extends Promoter {
  displayName: string;
  assignmentStatus: 'assigned' | 'unassigned';
  organisationLabel: string;
  idDocument: any;
  passportDocument: any;
  overallStatus: 'active' | 'warning' | 'critical' | 'inactive';
  contactEmail: string;
  contactPhone: string;
  createdLabel: string;
}

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import {
  TrendingUp,
  TrendingDown,
  Users,
  Building2,
  ShieldAlert,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';

interface PromoterAnalyticsProps {
  promoters: DashboardPromoter[];
}

interface TimeSeriesData {
  date: string;
  value: number;
  label: string;
}

interface AnalyticsMetrics {
  totalPromoters: number;
  activePromoters: number;
  criticalAlerts: number;
  complianceRate: number;
  growthRate: number;
  avgDocumentsPerPromoter: number;
  topCompanies: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  statusDistribution: Array<{
    status: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  documentHealthTrend: TimeSeriesData[];
  monthlyGrowth: TimeSeriesData[];
}

export function PromoterAnalyticsDashboard({
  promoters,
}: PromoterAnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>(
    '30d'
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'trends' | 'health'>(
    'overview'
  );

  const analytics = useMemo<AnalyticsMetrics>(() => {
    const totalPromoters = promoters.length;
    const activePromoters = promoters.filter(
      p => p.overallStatus === 'active'
    ).length;
    const criticalAlerts = promoters.filter(
      p => p.overallStatus === 'critical'
    ).length;

    // Compliance rate calculation
    const compliantPromoters = promoters.filter(
      p =>
        p.idDocument.status === 'valid' && p.passportDocument.status === 'valid'
    ).length;
    const complianceRate =
      totalPromoters > 0
        ? Math.round((compliantPromoters / totalPromoters) * 100)
        : 0;

    // Growth rate calculation (comparing last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    const sixtyDaysAgo = subDays(now, 60);

    const recentPromoters = promoters.filter(p => {
      if (!p.created_at) return false;
      const created = new Date(p.created_at);
      return created >= thirtyDaysAgo;
    }).length;

    const previousPromoters = promoters.filter(p => {
      if (!p.created_at) return false;
      const created = new Date(p.created_at);
      return created >= sixtyDaysAgo && created < thirtyDaysAgo;
    }).length;

    const growthRate =
      previousPromoters > 0
        ? Math.round(
            ((recentPromoters - previousPromoters) / previousPromoters) * 100
          )
        : recentPromoters > 0
          ? 100
          : 0;

    // Average documents per promoter
    const promotersWithDocuments = promoters.filter(
      p =>
        p.idDocument.status !== 'missing' ||
        p.passportDocument.status !== 'missing'
    ).length;
    const avgDocumentsPerPromoter =
      totalPromoters > 0
        ? Math.round((promotersWithDocuments / totalPromoters) * 100)
        : 0;

    // Top companies
    const companyCounts = new Map<string, number>();
    promoters.forEach(p => {
      if (p.employer_id && p.organisationLabel !== 'Unassigned') {
        companyCounts.set(
          p.organisationLabel,
          (companyCounts.get(p.organisationLabel) || 0) + 1
        );
      }
    });

    const topCompanies = Array.from(companyCounts.entries())
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalPromoters) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Status distribution
    const statusCounts = new Map<string, number>();
    promoters.forEach(p => {
      statusCounts.set(
        p.overallStatus,
        (statusCounts.get(p.overallStatus) || 0) + 1
      );
    });

    const statusColors = {
      active: 'bg-emerald-500',
      warning: 'bg-amber-500',
      critical: 'bg-red-500',
      inactive: 'bg-slate-500',
    };

    const statusLabels = {
      active: 'Operational',
      warning: 'Attention',
      critical: 'Critical',
      inactive: 'Inactive',
    };

    const statusDistribution = Array.from(statusCounts.entries())
      .map(([status, count]) => ({
        status: statusLabels[status as keyof typeof statusLabels] || status,
        count,
        percentage: Math.round((count / totalPromoters) * 100),
        color:
          statusColors[status as keyof typeof statusColors] || 'bg-slate-500',
      }))
      .sort((a, b) => b.count - a.count);

    // Document health trend (simplified - showing current state)
    const documentHealthTrend: TimeSeriesData[] = [
      {
        date: 'Current',
        value: complianceRate,
        label: `${complianceRate}% Compliant`,
      },
    ];

    // Monthly growth trend (simplified)
    const monthlyGrowth: TimeSeriesData[] = [
      {
        date: 'This Month',
        value: recentPromoters,
        label: `${recentPromoters} New`,
      },
      {
        date: 'Last Month',
        value: previousPromoters,
        label: `${previousPromoters} New`,
      },
    ];

    return {
      totalPromoters,
      activePromoters,
      criticalAlerts,
      complianceRate,
      growthRate,
      avgDocumentsPerPromoter,
      topCompanies,
      statusDistribution,
      documentHealthTrend,
      monthlyGrowth,
    };
  }, [promoters]);

  return (
    <div className='space-y-6'>
      {/* Analytics Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>
            Analytics Dashboard
          </h2>
          <p className='text-muted-foreground'>
            Insights into your promoter workforce and compliance metrics
          </p>
        </div>
        <Select
          value={timeRange}
          onValueChange={(value: any) => setTimeRange(value)}
        >
          <SelectTrigger className='w-32'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='7d'>Last 7 days</SelectItem>
            <SelectItem value='30d'>Last 30 days</SelectItem>
            <SelectItem value='90d'>Last 90 days</SelectItem>
            <SelectItem value='1y'>Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <AnalyticsCard
          title='Total Promoters'
          value={analytics.totalPromoters}
          change={analytics.growthRate}
          icon={Users}
          description='Active workforce'
        />
        <AnalyticsCard
          title='Compliance Rate'
          value={`${analytics.complianceRate}%`}
          change={analytics.complianceRate - 85} // Assuming 85% baseline
          icon={CheckCircle}
          description='Document compliance'
          variant={analytics.complianceRate >= 90 ? 'success' : 'warning'}
        />
        <AnalyticsCard
          title='Critical Alerts'
          value={analytics.criticalAlerts}
          change={-analytics.criticalAlerts}
          icon={AlertTriangle}
          description='Require attention'
          variant={analytics.criticalAlerts > 0 ? 'destructive' : 'success'}
        />
        <AnalyticsCard
          title='Active Workforce'
          value={analytics.activePromoters}
          change={
            analytics.activePromoters -
            (analytics.totalPromoters - analytics.activePromoters)
          }
          icon={Activity}
          description='Currently operational'
        />
      </div>

      {/* Detailed Analytics */}
      <Tabs
        value={activeTab}
        onValueChange={(value: any) => setActiveTab(value)}
      >
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='trends'>Trends</TabsTrigger>
          <TabsTrigger value='health'>Health</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <PieChart className='h-5 w-5' />
                  Status Distribution
                </CardTitle>
                <CardDescription>
                  Current workforce status breakdown
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {analytics.statusDistribution.map(status => (
                    <div key={status.status} className='space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='font-medium'>{status.status}</span>
                        <span className='text-muted-foreground'>
                          {status.count} ({status.percentage}%)
                        </span>
                      </div>
                      <Progress value={status.percentage} className='h-2' />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Companies */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Building2 className='h-5 w-5' />
                  Top Companies
                </CardTitle>
                <CardDescription>Promoters by organization</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {analytics.topCompanies.map((company, index) => (
                    <div
                      key={company.name}
                      className='flex items-center justify-between'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium'>
                          {index + 1}
                        </div>
                        <div>
                          <div className='font-medium text-sm'>
                            {company.name}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {company.count} promoters
                          </div>
                        </div>
                      </div>
                      <Badge variant='outline'>{company.percentage}%</Badge>
                    </div>
                  ))}
                  {analytics.topCompanies.length === 0 && (
                    <div className='text-center py-8 text-muted-foreground'>
                      No company assignments found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='trends' className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            {/* Growth Trend */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BarChart3 className='h-5 w-5' />
                  Growth Trend
                </CardTitle>
                <CardDescription>Promoter additions over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {analytics.monthlyGrowth.map(data => (
                    <div
                      key={data.date}
                      className='flex items-center justify-between p-3 rounded-lg bg-muted/50'
                    >
                      <div>
                        <div className='font-medium'>{data.date}</div>
                        <div className='text-sm text-muted-foreground'>
                          {data.label}
                        </div>
                      </div>
                      <div className='text-2xl font-bold'>{data.value}</div>
                    </div>
                  ))}
                  <div className='flex items-center gap-2 pt-2 border-t'>
                    {analytics.growthRate > 0 ? (
                      <TrendingUp className='h-4 w-4 text-green-500' />
                    ) : (
                      <TrendingDown className='h-4 w-4 text-red-500' />
                    )}
                    <span className='text-sm font-medium'>
                      {analytics.growthRate > 0 ? '+' : ''}
                      {analytics.growthRate}% growth rate
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Compliance Trend */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ShieldAlert className='h-5 w-5' />
                  Compliance Trend
                </CardTitle>
                <CardDescription>Document compliance over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {analytics.documentHealthTrend.map(data => (
                    <div key={data.date} className='space-y-2'>
                      <div className='flex items-center justify-between text-sm'>
                        <span className='font-medium'>{data.date}</span>
                        <span className='text-muted-foreground'>
                          {data.label}
                        </span>
                      </div>
                      <Progress value={data.value} className='h-3' />
                    </div>
                  ))}
                  <div className='flex items-center gap-2 pt-2 border-t'>
                    <CheckCircle className='h-4 w-4 text-green-500' />
                    <span className='text-sm font-medium'>
                      Target: 95% compliance
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='health' className='space-y-4'>
          <div className='grid gap-4'>
            {/* Document Health Overview */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <ShieldAlert className='h-5 w-5' />
                  Document Health Overview
                </CardTitle>
                <CardDescription>
                  Detailed breakdown of document compliance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                  <HealthMetricCard
                    title='Valid Documents'
                    value={
                      promoters.filter(
                        p =>
                          p.idDocument.status === 'valid' &&
                          p.passportDocument.status === 'valid'
                      ).length
                    }
                    total={promoters.length}
                    icon={CheckCircle}
                    color='text-green-600'
                    bgColor='bg-green-50'
                  />
                  <HealthMetricCard
                    title='Expiring Soon'
                    value={
                      promoters.filter(
                        p =>
                          p.idDocument.status === 'expiring' ||
                          p.passportDocument.status === 'expiring'
                      ).length
                    }
                    total={promoters.length}
                    icon={Clock}
                    color='text-amber-600'
                    bgColor='bg-amber-50'
                  />
                  <HealthMetricCard
                    title='Expired'
                    value={
                      promoters.filter(
                        p =>
                          p.idDocument.status === 'expired' ||
                          p.passportDocument.status === 'expired'
                      ).length
                    }
                    total={promoters.length}
                    icon={XCircle}
                    color='text-red-600'
                    bgColor='bg-red-50'
                  />
                  <HealthMetricCard
                    title='Missing'
                    value={
                      promoters.filter(
                        p =>
                          p.idDocument.status === 'missing' ||
                          p.passportDocument.status === 'missing'
                      ).length
                    }
                    total={promoters.length}
                    icon={AlertTriangle}
                    color='text-slate-600'
                    bgColor='bg-slate-50'
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ComponentType<any>;
  description: string;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

function AnalyticsCard({
  title,
  value,
  change,
  icon: Icon,
  description,
  variant = 'default',
}: AnalyticsCardProps) {
  const isPositive = change > 0;
  const isNegative = change < 0;

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        <div className='flex items-center gap-1 text-xs text-muted-foreground'>
          {isPositive && <TrendingUp className='h-3 w-3 text-green-500' />}
          {isNegative && <TrendingDown className='h-3 w-3 text-red-500' />}
          <span>
            {isPositive && '+'}
            {change}% from last period
          </span>
        </div>
        <p className='text-xs text-muted-foreground mt-1'>{description}</p>
      </CardContent>
    </Card>
  );
}

interface HealthMetricCardProps {
  title: string;
  value: number;
  total: number;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

function HealthMetricCard({
  title,
  value,
  total,
  icon: Icon,
  color,
  bgColor,
}: HealthMetricCardProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <div className={cn('rounded-lg p-4', bgColor)}>
      <div className='flex items-center justify-between mb-2'>
        <div className={cn('rounded-full p-2', bgColor)}>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <span className={cn('text-lg font-bold', color)}>{value}</span>
      </div>
      <div className='space-y-1'>
        <div className='text-sm font-medium'>{title}</div>
        <div className='text-xs text-muted-foreground'>
          {percentage}% of total
        </div>
      </div>
    </div>
  );
}
