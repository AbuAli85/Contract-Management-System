'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  MapPin,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardPromoter, DashboardMetrics } from './types';

interface PromotersEnhancedChartsProps {
  promoters: DashboardPromoter[];
  metrics: DashboardMetrics;
  className?: string;
}

export function PromotersEnhancedCharts({
  promoters,
  metrics,
  className,
}: PromotersEnhancedChartsProps) {
  // Document Status Distribution
  const documentStatusData = useMemo(() => {
    const statusCounts = {
      valid: 0,
      expiring: 0,
      expired: 0,
      missing: 0,
    };

    promoters.forEach(p => {
      if (
        p.idDocument.status === 'valid' &&
        p.passportDocument.status === 'valid'
      ) {
        statusCounts.valid++;
      } else if (
        p.idDocument.status === 'expiring' ||
        p.passportDocument.status === 'expiring'
      ) {
        statusCounts.expiring++;
      } else if (
        p.idDocument.status === 'expired' ||
        p.passportDocument.status === 'expired'
      ) {
        statusCounts.expired++;
      } else {
        statusCounts.missing++;
      }
    });

    return statusCounts;
  }, [promoters]);

  // Status Distribution
  const statusDistribution = useMemo(() => {
    const counts = {
      active: 0,
      warning: 0,
      critical: 0,
      inactive: 0,
    };

    promoters.forEach(p => {
      counts[p.overallStatus as keyof typeof counts]++;
    });

    return counts;
  }, [promoters]);

  // Job Title Distribution (Top 10)
  const jobTitleDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    promoters.forEach(p => {
      const jobTitle = p.job_title || 'Unknown';
      counts.set(jobTitle, (counts.get(jobTitle) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [promoters]);

  // Company Distribution (Top 10)
  const companyDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    promoters.forEach(p => {
      const company = p.organisationLabel || 'Unassigned';
      counts.set(company, (counts.get(company) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([company, count]) => ({ company, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [promoters]);

  // Monthly Trends (Last 6 months)
  const monthlyTrends = useMemo(() => {
    const months: Record<string, number> = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      });
      months[monthKey] = 0;
    }

    promoters.forEach(p => {
      if (p.created_at) {
        const createdDate = new Date(p.created_at);
        const monthKey = createdDate.toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
        if (months[monthKey] !== undefined) {
          months[monthKey]++;
        }
      }
    });

    return Object.entries(months);
  }, [promoters]);

  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6', className)}>
      {/* Document Status Distribution */}
      <Card className='shadow-xl border-2 border-primary/20'>
        <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20'>
          <CardTitle className='text-lg font-bold flex items-center gap-2'>
            <PieChart className='h-5 w-5 text-primary' />
            Document Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='h-3 w-3 rounded-full bg-green-500' />
                <span className='text-sm font-medium'>Valid</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-bold'>
                  {documentStatusData.valid}
                </span>
                <span className='text-xs text-muted-foreground'>
                  (
                  {Math.round(
                    (documentStatusData.valid / promoters.length) * 100
                  )}
                  %)
                </span>
              </div>
            </div>
            <Progress
              value={(documentStatusData.valid / promoters.length) * 100}
              className='h-2'
            />
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='h-3 w-3 rounded-full bg-amber-500' />
                <span className='text-sm font-medium'>Expiring</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-bold'>
                  {documentStatusData.expiring}
                </span>
                <span className='text-xs text-muted-foreground'>
                  (
                  {Math.round(
                    (documentStatusData.expiring / promoters.length) * 100
                  )}
                  %)
                </span>
              </div>
            </div>
            <Progress
              value={(documentStatusData.expiring / promoters.length) * 100}
              className='h-2'
            />
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='h-3 w-3 rounded-full bg-red-500' />
                <span className='text-sm font-medium'>Expired</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-bold'>
                  {documentStatusData.expired}
                </span>
                <span className='text-xs text-muted-foreground'>
                  (
                  {Math.round(
                    (documentStatusData.expired / promoters.length) * 100
                  )}
                  %)
                </span>
              </div>
            </div>
            <Progress
              value={(documentStatusData.expired / promoters.length) * 100}
              className='h-2'
            />
          </div>

          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <div className='h-3 w-3 rounded-full bg-gray-500' />
                <span className='text-sm font-medium'>Missing</span>
              </div>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-bold'>
                  {documentStatusData.missing}
                </span>
                <span className='text-xs text-muted-foreground'>
                  (
                  {Math.round(
                    (documentStatusData.missing / promoters.length) * 100
                  )}
                  %)
                </span>
              </div>
            </div>
            <Progress
              value={(documentStatusData.missing / promoters.length) * 100}
              className='h-2'
            />
          </div>
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <Card className='shadow-xl border-2 border-primary/20'>
        <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20'>
          <CardTitle className='text-lg font-bold flex items-center gap-2'>
            <BarChart3 className='h-5 w-5 text-primary' />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6 space-y-4'>
          {Object.entries(statusDistribution).map(([status, count]) => {
            const percentage = (count / promoters.length) * 100;
            const colorClass =
              {
                active: 'bg-green-500',
                warning: 'bg-amber-500',
                critical: 'bg-red-500',
                inactive: 'bg-gray-500',
              }[status] || 'bg-gray-500';

            return (
              <div key={status} className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className={cn('h-3 w-3 rounded-full', colorClass)} />
                    <span className='text-sm font-medium capitalize'>
                      {status}
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-bold'>{count}</span>
                    <span className='text-xs text-muted-foreground'>
                      ({Math.round(percentage)}%)
                    </span>
                  </div>
                </div>
                <Progress value={percentage} className='h-2' />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Top Job Titles */}
      <Card className='shadow-xl border-2 border-primary/20'>
        <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20'>
          <CardTitle className='text-lg font-bold flex items-center gap-2'>
            <Award className='h-5 w-5 text-primary' />
            Top Job Titles
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
          <div className='space-y-3'>
            {jobTitleDistribution.map(({ title, count }, index) => {
              const percentage = (count / promoters.length) * 100;
              return (
                <div key={title} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className='w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs'
                      >
                        {index + 1}
                      </Badge>
                      <span className='text-sm font-medium truncate flex-1'>
                        {title}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-bold'>{count}</span>
                      <span className='text-xs text-muted-foreground w-12 text-right'>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className='h-1.5' />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Companies */}
      <Card className='shadow-xl border-2 border-primary/20'>
        <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20'>
          <CardTitle className='text-lg font-bold flex items-center gap-2'>
            <Users className='h-5 w-5 text-primary' />
            Top Companies
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
          <div className='space-y-3'>
            {companyDistribution.map(({ company, count }, index) => {
              const percentage = (count / promoters.length) * 100;
              return (
                <div key={company} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant='outline'
                        className='w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs'
                      >
                        {index + 1}
                      </Badge>
                      <span className='text-sm font-medium truncate flex-1'>
                        {company}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-bold'>{count}</span>
                      <span className='text-xs text-muted-foreground w-12 text-right'>
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                  <Progress value={percentage} className='h-1.5' />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card className='shadow-xl border-2 border-primary/20 lg:col-span-2'>
        <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20'>
          <CardTitle className='text-lg font-bold flex items-center gap-2'>
            <TrendingUp className='h-5 w-5 text-primary' />
            Monthly Growth Trends
          </CardTitle>
        </CardHeader>
        <CardContent className='p-6'>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4'>
            {monthlyTrends.map(([month, count]) => (
              <div key={month} className='text-center space-y-2'>
                <div className='text-2xl font-bold text-primary'>{count}</div>
                <div className='text-xs text-muted-foreground'>{month}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
