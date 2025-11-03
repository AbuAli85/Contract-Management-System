/**
 * Enhanced Metrics Visualization Component
 * Interactive charts and visualizations for promoter analytics
 */

'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  Activity,
} from 'lucide-react';
import type { DashboardMetrics, DashboardPromoter } from './types';

interface EnhancedMetricsVisualizationProps {
  metrics: DashboardMetrics;
  promoters: DashboardPromoter[];
  previousMetrics?: DashboardMetrics;
}

export function EnhancedMetricsVisualization({
  metrics,
  promoters,
  previousMetrics,
}: EnhancedMetricsVisualizationProps) {
  // Calculate trends
  const trends = useMemo(() => {
    if (!previousMetrics) return null;

    return {
      total: calculateTrend(metrics.total, previousMetrics.total),
      active: calculateTrend(metrics.active, previousMetrics.active),
      critical: calculateTrend(metrics.critical, previousMetrics.critical),
      compliance: calculateTrend(
        metrics.complianceRate,
        previousMetrics.complianceRate
      ),
    };
  }, [metrics, previousMetrics]);

  // Status distribution
  const statusDistribution = useMemo(() => {
    const distribution = promoters.reduce(
      (acc, p) => {
        acc[p.overallStatus] = (acc[p.overallStatus] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return distribution;
  }, [promoters]);

  // Document health breakdown
  const documentHealth = useMemo(() => {
    const health = {
      valid: 0,
      expiring: 0,
      expired: 0,
      missing: 0,
    };

    promoters.forEach((p) => {
      if (p.idDocument.status === 'expired' || p.passportDocument.status === 'expired') {
        health.expired++;
      } else if (
        p.idDocument.status === 'expiring' ||
        p.passportDocument.status === 'expiring'
      ) {
        health.expiring++;
      } else if (
        p.idDocument.status === 'missing' &&
        p.passportDocument.status === 'missing'
      ) {
        health.missing++;
      } else {
        health.valid++;
      }
    });

    return health;
  }, [promoters]);

  // Recent activity insights
  const activityInsights = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivity = promoters.filter((p) => {
      if (!p.created_at) return false;
      const createdDate = new Date(p.created_at);
      return createdDate >= thirtyDaysAgo;
    });

    return {
      newPromoters: recentActivity.length,
      percentageOfTotal: (recentActivity.length / metrics.total) * 100,
    };
  }, [promoters, metrics.total]);

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Promoters */}
        <MetricCard
          title="Total Promoters"
          value={metrics.total}
          icon={<Users className="h-4 w-4" />}
          trend={trends?.total}
          description="Total workforce count"
          color="blue"
        />

        {/* Active Promoters */}
        <MetricCard
          title="Active"
          value={metrics.active}
          icon={<Activity className="h-4 w-4" />}
          trend={trends?.active}
          description={`${((metrics.active / metrics.total) * 100).toFixed(1)}% of total`}
          color="green"
        />

        {/* Critical Issues */}
        <MetricCard
          title="Critical Issues"
          value={metrics.critical}
          icon={<AlertTriangle className="h-4 w-4" />}
          trend={trends?.critical}
          description="Requires immediate attention"
          color="red"
          alert={metrics.critical > 0}
        />

        {/* Compliance Rate */}
        <MetricCard
          title="Compliance Rate"
          value={`${metrics.complianceRate.toFixed(1)}%`}
          icon={<FileText className="h-4 w-4" />}
          trend={trends?.compliance}
          description="Documents up to date"
          color={metrics.complianceRate >= 80 ? 'green' : 'amber'}
        />
      </div>

      {/* Visualizations Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
            <CardDescription>Promoter lifecycle stages</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusDistribution).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${getStatusColor(status)}`}
                    />
                    <span className="text-sm capitalize">{status}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <span className="text-xs text-muted-foreground">
                      ({((count / metrics.total) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Document Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Document Health</CardTitle>
            <CardDescription>Compliance status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <HealthBar
                label="Valid"
                value={documentHealth.valid}
                total={metrics.total}
                color="green"
              />
              <HealthBar
                label="Expiring Soon"
                value={documentHealth.expiring}
                total={metrics.total}
                color="amber"
              />
              <HealthBar
                label="Expired"
                value={documentHealth.expired}
                total={metrics.total}
                color="red"
              />
              <HealthBar
                label="Missing"
                value={documentHealth.missing}
                total={metrics.total}
                color="gray"
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-sm text-muted-foreground">New Promoters</span>
                <span className="text-2xl font-bold">
                  {activityInsights.newPromoters}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all"
                  style={{
                    width: `${Math.min(activityInsights.percentageOfTotal, 100)}%`,
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {activityInsights.percentageOfTotal.toFixed(1)}% of total workforce
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <p className="text-sm font-medium">Documents Expiring</p>
                <p className="text-xs text-muted-foreground">Next 30 days</p>
              </div>
              <Badge variant={metrics.expiring > 0 ? 'destructive' : 'secondary'}>
                {metrics.expiring}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper Components

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  } | null | undefined;
  description?: string;
  color: 'blue' | 'green' | 'red' | 'amber' | 'purple';
  alert?: boolean;
}

function MetricCard({
  title,
  value,
  icon,
  trend,
  description,
  color,
  alert,
}: MetricCardProps) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
    green: 'text-green-600 bg-green-100 dark:bg-green-900/20',
    red: 'text-red-600 bg-red-100 dark:bg-red-900/20',
    amber: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20',
    purple: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
  };

  return (
    <Card className={alert ? 'border-red-300 dark:border-red-700' : ''}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${colorClasses[color]}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center gap-1 mt-1">
            {trend.isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <span
              className={`text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}
            >
              {Math.abs(trend.value).toFixed(1)}%
            </span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface HealthBarProps {
  label: string;
  value: number;
  total: number;
  color: 'green' | 'amber' | 'red' | 'gray';
}

function HealthBar({ label, value, total, color }: HealthBarProps) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  const colorClasses = {
    green: 'bg-green-600',
    amber: 'bg-amber-600',
    red: 'bg-red-600',
    gray: 'bg-gray-400',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm">{label}</span>
        <span className="text-sm font-medium">
          {value} ({percentage.toFixed(0)}%)
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Utility Functions

function calculateTrend(current: number, previous: number) {
  if (previous === 0) return null;

  const change = ((current - previous) / previous) * 100;
  return {
    value: change,
    isPositive: change >= 0,
  };
}

function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    active: 'bg-green-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
    inactive: 'bg-gray-400',
  };

  return colorMap[status] || 'bg-gray-400';
}

