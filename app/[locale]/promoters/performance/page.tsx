'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users,
  TrendingUp,
  Award,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowLeft,
  RefreshCw,
} from 'lucide-react';

interface PerformanceMetrics {
  totalPromoters: number;
  activePromoters: number;
  inactivePromoters: number;
  expiredDocuments: number;
  expiringDocuments: number;
  validDocuments: number;
  missingDocuments: number;
  complianceRate: number;
}

export default function PromotersPerformancePage() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const locale =
    typeof window !== 'undefined'
      ? window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] || 'en'
      : 'en';

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, metricsRes] = await Promise.all([
        fetch('/api/promoters?page=1&limit=1', { credentials: 'include' }),
        fetch('/api/promoters/enhanced-metrics', { credentials: 'include' }),
      ]);

      if (!listRes.ok) throw new Error('Failed to fetch promoter data');
      const listData = await listRes.json();
      const total = listData.total || 0;

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        if (metricsData.success && metricsData.metrics) {
          const m = metricsData.metrics;
          const active = m.activeOnContracts || m.active || m.activeCount || 0;
          const expired = m.expiredDocuments || m.expired || 0;
          const expiring = m.expiringDocuments || m.expiring || 0;
          const missing = m.missingDocuments || m.missing || 0;
          const realTotal = m.totalWorkforce || m.total || total;
          const valid = Math.max(0, realTotal - expired - expiring - missing);
          const complianceRate =
            realTotal > 0 ? Math.round(((realTotal - expired - missing) / realTotal) * 100) : 0;
          setMetrics({
            totalPromoters: realTotal,
            activePromoters: active,
            inactivePromoters: realTotal - active,
            expiredDocuments: expired,
            expiringDocuments: expiring,
            validDocuments: valid,
            missingDocuments: missing,
            complianceRate,
          });
          return;
        }
      }

      setMetrics({
        totalPromoters: total,
        activePromoters: 0,
        inactivePromoters: 0,
        expiredDocuments: 0,
        expiringDocuments: 0,
        validDocuments: 0,
        missingDocuments: 0,
        complianceRate: 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className='container mx-auto space-y-6 py-6'>
      <div className='flex items-center justify-between'>
        <Button
          variant='ghost'
          size='sm'
          onClick={() => router.push(`/${locale}/promoters`)}
        >
          <ArrowLeft className='h-4 w-4 mr-2' />
          Back to Promoters
        </Button>
        <Button variant='outline' size='sm' onClick={fetchMetrics} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className='flex items-center gap-3'>
        <Award className='h-8 w-8 text-primary' />
        <div>
          <h1 className='text-3xl font-bold'>Promoter Performance</h1>
          <p className='text-muted-foreground'>Track and analyze promoter performance metrics</p>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Promoters</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className='h-8 w-16' /> : (
              <>
                <div className='text-2xl font-bold'>{metrics?.totalPromoters ?? 0}</div>
                <p className='text-xs text-muted-foreground'>Registered in the system</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Promoters</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className='h-8 w-16' /> : (
              <>
                <div className='text-2xl font-bold text-green-600'>{metrics?.activePromoters ?? 0}</div>
                <p className='text-xs text-muted-foreground'>Currently active</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Compliance Rate</CardTitle>
            <TrendingUp className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className='h-8 w-16' /> : (
              <>
                <div className='text-2xl font-bold text-blue-600'>{metrics?.complianceRate ?? 0}%</div>
                <p className='text-xs text-muted-foreground'>Valid documents rate</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Expiring Soon</CardTitle>
            <Clock className='h-4 w-4 text-amber-500' />
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className='h-8 w-16' /> : (
              <>
                <div className='text-2xl font-bold text-amber-600'>{metrics?.expiringDocuments ?? 0}</div>
                <p className='text-xs text-muted-foreground'>Documents expiring in 30 days</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle>Document Status Overview</CardTitle>
            <CardDescription>Current status of all promoter documents</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {isLoading ? (
              <div className='space-y-2'>
                {[1,2,3,4].map(i => <Skeleton key={i} className='h-12 w-full' />)}
              </div>
            ) : (
              <>
                <div className='flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-950/30 p-3'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                    <span className='text-sm font-medium'>Valid Documents</span>
                  </div>
                  <Badge variant='outline' className='bg-green-100 text-green-700 border-green-300'>
                    {metrics?.validDocuments ?? 0}
                  </Badge>
                </div>
                <div className='flex items-center justify-between rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3'>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-amber-600' />
                    <span className='text-sm font-medium'>Expiring Soon</span>
                  </div>
                  <Badge variant='outline' className='bg-amber-100 text-amber-700 border-amber-300'>
                    {metrics?.expiringDocuments ?? 0}
                  </Badge>
                </div>
                <div className='flex items-center justify-between rounded-lg bg-red-50 dark:bg-red-950/30 p-3'>
                  <div className='flex items-center gap-2'>
                    <AlertTriangle className='h-4 w-4 text-red-600' />
                    <span className='text-sm font-medium'>Expired Documents</span>
                  </div>
                  <Badge variant='outline' className='bg-red-100 text-red-700 border-red-300'>
                    {metrics?.expiredDocuments ?? 0}
                  </Badge>
                </div>
                <div className='flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-950/30 p-3'>
                  <div className='flex items-center gap-2'>
                    <AlertTriangle className='h-4 w-4 text-gray-500' />
                    <span className='text-sm font-medium'>Missing Documents</span>
                  </div>
                  <Badge variant='outline' className='bg-gray-100 text-gray-700 border-gray-300'>
                    {metrics?.missingDocuments ?? 0}
                  </Badge>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workforce Status</CardTitle>
            <CardDescription>Active vs inactive promoter breakdown</CardDescription>
          </CardHeader>
          <CardContent className='space-y-3'>
            {isLoading ? (
              <div className='space-y-2'>
                <Skeleton className='h-12 w-full' />
                <Skeleton className='h-12 w-full' />
              </div>
            ) : (
              <>
                <div className='flex items-center justify-between rounded-lg bg-green-50 dark:bg-green-950/30 p-3'>
                  <div className='flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-600' />
                    <span className='text-sm font-medium'>Active</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='bg-green-100 text-green-700 border-green-300'>
                      {metrics?.activePromoters ?? 0}
                    </Badge>
                    <span className='text-xs text-muted-foreground'>
                      {metrics?.totalPromoters
                        ? `${Math.round(((metrics.activePromoters ?? 0) / metrics.totalPromoters) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
                <div className='flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-950/30 p-3'>
                  <div className='flex items-center gap-2'>
                    <Users className='h-4 w-4 text-gray-500' />
                    <span className='text-sm font-medium'>Inactive / Other</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='bg-gray-100 text-gray-700 border-gray-300'>
                      {metrics?.inactivePromoters ?? 0}
                    </Badge>
                    <span className='text-xs text-muted-foreground'>
                      {metrics?.totalPromoters
                        ? `${Math.round(((metrics.inactivePromoters ?? 0) / metrics.totalPromoters) * 100)}%`
                        : '0%'}
                    </span>
                  </div>
                </div>
                <div className='mt-4 pt-4 border-t'>
                  <Button className='w-full' onClick={() => router.push(`/${locale}/promoters`)}>
                    <Users className='h-4 w-4 mr-2' />
                    View All Promoters
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
