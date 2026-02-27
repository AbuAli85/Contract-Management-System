'use client';

import { useEffect, useState } from 'react';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Users, TrendingUp, BarChart3, Activity, AlertTriangle,
  CheckCircle2, Clock, XCircle, RefreshCw, FileText, Award,
  MapPin, Briefcase,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface PromoterMetrics {
  total: number;
  active: number;
  inactive: number;
  expiring_documents: number;
  expired_documents: number;
  by_nationality: Record<string, number>;
  by_department: Record<string, number>;
  by_status: Record<string, number>;
  contracts_active: number;
  contracts_expiring_soon: number;
  new_this_month: number;
  total_last_month: number;
}

function StatCard({
  title, value, subtitle, icon: Icon, color = 'text-foreground', loading,
}: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color?: string; loading?: boolean;
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className='h-8 w-24' />
        ) : (
          <div className={`text-2xl font-bold ${color}`}>{value}</div>
        )}
        {subtitle && (
          <p className='text-xs text-muted-foreground mt-1'>{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function PromoterAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params?.locale as string;
  const [metrics, setMetrics] = useState<PromoterMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function fetchMetrics(forceRefresh = false) {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/promoters/enhanced-metrics${forceRefresh ? '?refresh=true' : ''}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const m = data.metrics;

      // Map the enhanced-metrics response to our local shape
      // Build nationality and department distributions from promoter list
      let byNationality: Record<string, number> = {};
      let byDepartment: Record<string, number> = {};
      let newThisMonth = 0;

      try {
        const listRes = await fetch('/api/promoters?page=1&limit=2000', { credentials: 'include' });
        if (listRes.ok) {
          const listData = await listRes.json();
          const promoters = listData.promoters || listData.data || [];
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          promoters.forEach((p: { nationality?: string | null; department?: string | null; created_at?: string | null }) => {
            const nat = p.nationality || 'Unknown';
            byNationality[nat] = (byNationality[nat] || 0) + 1;
            const dept = p.department || 'Unassigned';
            byDepartment[dept] = (byDepartment[dept] || 0) + 1;
            if (p.created_at && new Date(p.created_at) >= thirtyDaysAgo) newThisMonth++;
          });
        }
      } catch (_) { /* non-critical */ }

      setMetrics({
        total: m?.totalWorkforce ?? 0,
        active: m?.activeOnContracts ?? 0,
        inactive: (m?.inactive ?? 0) + (m?.terminated ?? 0),
        expiring_documents: m?.expiringDocuments ?? 0,
        expired_documents: m?.expiredDocuments ?? 0,
        by_nationality: byNationality,
        by_department: byDepartment,
        by_status: m?.details?.byStatus ?? {},
        contracts_active: m?.activeOnContracts ?? 0,
        contracts_expiring_soon: 0,
        new_this_month: newThisMonth,
        total_last_month: 0,
      });
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchMetrics(); }, []);

  const growthPct = metrics && metrics.total_last_month > 0
    ? (((metrics.total - metrics.total_last_month) / metrics.total_last_month) * 100).toFixed(1)
    : null;

  const topNationalities = metrics
    ? Object.entries(metrics.by_nationality)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  const topDepartments = metrics
    ? Object.entries(metrics.by_department)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
    : [];

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <BarChart3 className='h-8 w-8 text-primary' />
          <div>
            <h1 className='text-3xl font-bold'>Promoter Analysis</h1>
            <p className='text-muted-foreground'>
              Real-time workforce analytics and statistics
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          {lastRefresh && (
            <span className='text-xs text-muted-foreground'>
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchMetrics(true)}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size='sm'
            onClick={() => router.push(`/${locale}/manage-promoters`)}
          >
            <Users className='mr-2 h-4 w-4' />
            Manage Promoters
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Promoters'
          value={metrics?.total ?? 0}
          subtitle={growthPct ? `${Number(growthPct) >= 0 ? '+' : ''}${growthPct}% from last month` : 'All time'}
          icon={Users}
          color='text-blue-600'
          loading={loading}
        />
        <StatCard
          title='Active Promoters'
          value={metrics?.active ?? 0}
          subtitle={metrics ? `${metrics.total > 0 ? Math.round((metrics.active / metrics.total) * 100) : 0}% of workforce` : ''}
          icon={CheckCircle2}
          color='text-green-600'
          loading={loading}
        />
        <StatCard
          title='Expiring Documents'
          value={metrics?.expiring_documents ?? 0}
          subtitle='Require attention within 30 days'
          icon={Clock}
          color={metrics && metrics.expiring_documents > 0 ? 'text-amber-600' : 'text-muted-foreground'}
          loading={loading}
        />
        <StatCard
          title='Expired Documents'
          value={metrics?.expired_documents ?? 0}
          subtitle='Immediate action required'
          icon={XCircle}
          color={metrics && metrics.expired_documents > 0 ? 'text-red-600' : 'text-muted-foreground'}
          loading={loading}
        />
      </div>

      {/* Secondary KPIs */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Active Contracts'
          value={metrics?.contracts_active ?? 0}
          subtitle='Currently running'
          icon={FileText}
          color='text-indigo-600'
          loading={loading}
        />
        <StatCard
          title='Contracts Expiring Soon'
          value={metrics?.contracts_expiring_soon ?? 0}
          subtitle='Within next 30 days'
          icon={AlertTriangle}
          color={metrics && metrics.contracts_expiring_soon > 0 ? 'text-orange-600' : 'text-muted-foreground'}
          loading={loading}
        />
        <StatCard
          title='New This Month'
          value={metrics?.new_this_month ?? 0}
          subtitle='Recently onboarded'
          icon={TrendingUp}
          color='text-teal-600'
          loading={loading}
        />
        <StatCard
          title='Inactive Promoters'
          value={metrics?.inactive ?? 0}
          subtitle='Not currently deployed'
          icon={Activity}
          color='text-slate-500'
          loading={loading}
        />
      </div>

      {/* Breakdown Tables */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* By Nationality */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <MapPin className='h-5 w-5' />
              Top Nationalities
            </CardTitle>
            <CardDescription>Distribution by nationality</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='space-y-2'>
                {[1,2,3,4,5].map(i => <Skeleton key={i} className='h-8 w-full' />)}
              </div>
            ) : topNationalities.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-4'>No data available</p>
            ) : (
              <div className='space-y-2'>
                {topNationalities.map(([nationality, count]) => (
                  <div key={nationality} className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>{nationality || 'Unknown'}</span>
                    <div className='flex items-center gap-2'>
                      <div className='w-24 h-2 bg-muted rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-blue-500 rounded-full'
                          style={{ width: `${metrics ? (count / metrics.total) * 100 : 0}%` }}
                        />
                      </div>
                      <Badge variant='secondary'>{count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Department */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Briefcase className='h-5 w-5' />
              Top Departments
            </CardTitle>
            <CardDescription>Distribution by department</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='space-y-2'>
                {[1,2,3,4,5].map(i => <Skeleton key={i} className='h-8 w-full' />)}
              </div>
            ) : topDepartments.length === 0 ? (
              <p className='text-sm text-muted-foreground text-center py-4'>No data available</p>
            ) : (
              <div className='space-y-2'>
                {topDepartments.map(([dept, count]) => (
                  <div key={dept} className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>{dept || 'Unassigned'}</span>
                    <div className='flex items-center gap-2'>
                      <div className='w-24 h-2 bg-muted rounded-full overflow-hidden'>
                        <div
                          className='h-full bg-green-500 rounded-full'
                          style={{ width: `${metrics ? (count / metrics.total) * 100 : 0}%` }}
                        />
                      </div>
                      <Badge variant='secondary'>{count}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Award className='h-5 w-5' />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 gap-3 md:grid-cols-4'>
            <Button variant='outline' onClick={() => router.push(`/${locale}/manage-promoters/new`)}>
              <Users className='mr-2 h-4 w-4' />
              Add Promoter
            </Button>
            <Button variant='outline' onClick={() => router.push(`/${locale}/csv-import`)}>
              <FileText className='mr-2 h-4 w-4' />
              Import CSV
            </Button>
            <Button variant='outline' onClick={() => router.push(`/${locale}/promoters/performance`)}>
              <TrendingUp className='mr-2 h-4 w-4' />
              Performance
            </Button>
            <Button variant='outline' onClick={() => router.push(`/${locale}/manage-promoters`)}>
              <BarChart3 className='mr-2 h-4 w-4' />
              All Promoters
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export const dynamic = 'force-dynamic';
