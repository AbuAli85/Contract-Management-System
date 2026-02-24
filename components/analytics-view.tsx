'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  FileText,
  Building2,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
  Download,
  AlertTriangle,
} from 'lucide-react';

interface AnalyticsOverview {
  total_contracts: number;
  active_contracts: number;
  total_value: number;
  avg_approval_time: number;
  expiring_soon: number;
  obligations_pending: number;
}

interface AnalyticsData {
  overview: AnalyticsOverview;
  trends: {
    contracts_by_month: { month: string; count: number }[];
    value_by_month: { month: string; value: number }[];
    approval_times: { month: string; hours: number }[];
  };
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  top_vendors: { name: string; contracts: number; value: number }[];
  performance: {
    on_time_completion: number;
    average_cycle_time: number;
    obligations_completed_on_time: number;
  };
}

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  pending: '#f59e0b',
  expired: '#ef4444',
  draft: '#94a3b8',
  signed: '#3b82f6',
  terminated: '#6b7280',
};

const CHART_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
];

function SkeletonCard() {
  return (
    <Card className='animate-pulse'>
      <CardHeader>
        <div className='h-4 bg-muted rounded w-3/4' />
      </CardHeader>
      <CardContent>
        <div className='h-8 bg-muted rounded w-1/2 mb-2' />
        <div className='h-3 bg-muted rounded w-2/3' />
      </CardContent>
    </Card>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: string;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  color = 'text-muted-foreground',
}: MetricCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <span className={color}>{icon}</span>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold'>{value}</div>
        {subtitle && (
          <p className='text-xs text-muted-foreground mt-1'>{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState('30');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/analytics/contracts?days=${days}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      const json = await res.json();
      if (!json.success)
        throw new Error(json.error || 'Failed to fetch analytics');
      setData(json.data as AnalyticsData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch analytics data'
      );
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const statusPieData = data
    ? Object.entries(data.by_status).map(([name, value]) => ({ name, value }))
    : [];

  const typeBarData = data
    ? Object.entries(data.by_type).map(([name, value]) => ({ name, value }))
    : [];

  return (
    <div className='p-6 space-y-6'>
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Analytics</h1>
          <p className='text-muted-foreground'>
            Contract management insights and reports
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className='w-36'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>Last 7 days</SelectItem>
              <SelectItem value='30'>Last 30 days</SelectItem>
              <SelectItem value='90'>Last 90 days</SelectItem>
              <SelectItem value='365'>Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            size='icon'
            onClick={fetchAnalytics}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
        </div>
      </div>

      {error && (
        <Card className='border-destructive'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 text-destructive'>
              <AlertCircle className='h-5 w-5 flex-shrink-0' />
              <span className='text-sm'>{error}</span>
              <Button
                onClick={fetchAnalytics}
                size='sm'
                variant='outline'
                className='ml-auto'
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : data ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4'>
          <MetricCard
            title='Total Contracts'
            value={data.overview.total_contracts}
            subtitle='All time'
            icon={<FileText className='h-4 w-4' />}
          />
          <MetricCard
            title='Active Contracts'
            value={data.overview.active_contracts}
            subtitle={`${data.overview.total_contracts > 0 ? Math.round((data.overview.active_contracts / data.overview.total_contracts) * 100) : 0}% of total`}
            icon={<CheckCircle className='h-4 w-4' />}
            color='text-green-600'
          />
          <MetricCard
            title='Total Value'
            value={`$${(data.overview.total_value / 1000).toFixed(0)}K`}
            subtitle='Contract portfolio'
            icon={<DollarSign className='h-4 w-4' />}
            color='text-blue-600'
          />
          <MetricCard
            title='Avg. Approval'
            value={`${data.overview.avg_approval_time}h`}
            subtitle='Hours to approve'
            icon={<Clock className='h-4 w-4' />}
            color='text-purple-600'
          />
          <MetricCard
            title='Expiring Soon'
            value={data.overview.expiring_soon}
            subtitle='Within 30 days'
            icon={<AlertTriangle className='h-4 w-4' />}
            color={
              data.overview.expiring_soon > 0
                ? 'text-orange-500'
                : 'text-muted-foreground'
            }
          />
          <MetricCard
            title='Pending Obligations'
            value={data.overview.obligations_pending}
            subtitle='Awaiting action'
            icon={<BarChart3 className='h-4 w-4' />}
            color='text-yellow-600'
          />
        </div>
      ) : null}

      {data && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TrendingUp className='h-5 w-5 text-blue-600' />
                Monthly Contract Volume
              </CardTitle>
              <CardDescription>
                Number of contracts created per month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={240}>
                <LineChart data={data.trends.contracts_by_month}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type='monotone'
                    dataKey='count'
                    stroke='#3b82f6'
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name='Contracts'
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5 text-purple-600' />
                Status Distribution
              </CardTitle>
              <CardDescription>
                Breakdown of contracts by current status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {statusPieData.length > 0 ? (
                <ResponsiveContainer width='100%' height={240}>
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx='50%'
                      cy='50%'
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey='value'
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            STATUS_COLORS[entry.name] ||
                            CHART_COLORS[index % CHART_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-[240px] flex items-center justify-center text-muted-foreground'>
                  No status data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {data && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <DollarSign className='h-5 w-5 text-green-600' />
                Monthly Contract Value
              </CardTitle>
              <CardDescription>
                Total contract value created per month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={240}>
                <BarChart data={data.trends.value_by_month}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' tick={{ fontSize: 12 }} />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    formatter={(v: number) => [
                      `$${v.toLocaleString()}`,
                      'Value',
                    ]}
                  />
                  <Bar
                    dataKey='value'
                    fill='#22c55e'
                    radius={[4, 4, 0, 0]}
                    name='Value ($)'
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <FileText className='h-5 w-5 text-orange-600' />
                Contract Types
              </CardTitle>
              <CardDescription>
                Distribution of contracts by type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {typeBarData.length > 0 ? (
                <ResponsiveContainer width='100%' height={240}>
                  <BarChart data={typeBarData} layout='vertical'>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis type='number' tick={{ fontSize: 12 }} />
                    <YAxis
                      dataKey='name'
                      type='category'
                      tick={{ fontSize: 11 }}
                      width={100}
                    />
                    <Tooltip />
                    <Bar
                      dataKey='value'
                      fill='#f59e0b'
                      radius={[0, 4, 4, 0]}
                      name='Count'
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className='h-[240px] flex items-center justify-center text-muted-foreground'>
                  No type data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {data && (
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <CheckCircle className='h-5 w-5 text-green-600' />
                Performance Metrics
              </CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {[
                {
                  label: 'On-Time Completion',
                  value: data.performance.on_time_completion,
                  color: 'bg-green-500',
                },
                {
                  label: 'Obligations On Time',
                  value: data.performance.obligations_completed_on_time,
                  color: 'bg-blue-500',
                },
              ].map(metric => (
                <div key={metric.label} className='space-y-1'>
                  <div className='flex items-center justify-between text-sm'>
                    <span>{metric.label}</span>
                    <Badge variant='outline'>{metric.value}%</Badge>
                  </div>
                  <div className='h-2 bg-muted rounded-full overflow-hidden'>
                    <div
                      className={`h-full ${metric.color} rounded-full transition-all duration-700`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className='flex items-center justify-between pt-2 border-t'>
                <span className='text-sm text-muted-foreground'>
                  Avg. Cycle Time
                </span>
                <Badge variant='secondary'>
                  {data.performance.average_cycle_time} days
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Building2 className='h-5 w-5 text-indigo-600' />
                Top Vendors
              </CardTitle>
              <CardDescription>
                Vendors by contract volume and value
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {data.top_vendors.map((vendor, index) => (
                  <div
                    key={vendor.name}
                    className='flex items-center justify-between'
                  >
                    <div className='flex items-center gap-3'>
                      <div
                        className='w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold'
                        style={{
                          backgroundColor:
                            CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className='text-sm font-medium'>{vendor.name}</div>
                        <div className='text-xs text-muted-foreground'>
                          {vendor.contracts} contracts
                        </div>
                      </div>
                    </div>
                    <Badge variant='outline'>
                      ${(vendor.value / 1000).toFixed(0)}K
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {data && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Clock className='h-5 w-5 text-purple-600' />
              Approval Time Trend
            </CardTitle>
            <CardDescription>
              Average hours from submission to approval per month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={200}>
              <LineChart data={data.trends.approval_times}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='month' tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} unit='h' />
                <Tooltip
                  formatter={(v: number) => [`${v}h`, 'Avg. Approval Time']}
                />
                <Line
                  type='monotone'
                  dataKey='hours'
                  stroke='#8b5cf6'
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  name='Hours'
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {loading && data && (
        <div className='fixed inset-0 bg-background/50 flex items-center justify-center z-50 pointer-events-none'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </div>
      )}
    </div>
  );
}
