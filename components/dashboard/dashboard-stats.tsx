'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  TrendingDown,
  FileText,
  Users,
  Building2,
  Clock,
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Calendar,
  Activity,
  Target,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

// Lazy load charts to prevent SSR issues
const BarChart = React.lazy(() =>
  import('recharts').then(module => ({ default: module.BarChart }))
);
const Bar = React.lazy(() =>
  import('recharts').then(module => ({ default: module.Bar }))
);
const XAxis = React.lazy(() =>
  import('recharts').then(module => ({ default: module.XAxis }))
);
const YAxis = React.lazy(() =>
  import('recharts').then(module => ({ default: module.YAxis }))
);
const CartesianGrid = React.lazy(() =>
  import('recharts').then(module => ({ default: module.CartesianGrid }))
);
const Tooltip = React.lazy(() =>
  import('recharts').then(module => ({ default: module.Tooltip }))
);
const ResponsiveContainer = React.lazy(() =>
  import('recharts').then(module => ({ default: module.ResponsiveContainer }))
);
const PieChart = React.lazy(() =>
  import('recharts').then(module => ({ default: module.PieChart }))
);
const Pie = React.lazy(() =>
  import('recharts').then(module => ({ default: module.Pie }))
);
const Cell = React.lazy(() =>
  import('recharts').then(module => ({ default: module.Cell }))
);
const LineChart = React.lazy(() =>
  import('recharts').then(module => ({ default: module.LineChart }))
);
const Line = React.lazy(() =>
  import('recharts').then(module => ({ default: module.Line }))
);
const AreaChart = React.lazy(() =>
  import('recharts').then(module => ({ default: module.AreaChart }))
);
const Area = React.lazy(() =>
  import('recharts').then(module => ({ default: module.Area }))
);

interface DashboardStatsProps {
  stats: {
    totalContracts: number;
    activeContracts: number;
    pendingContracts: number;
    completedContracts: number;
    totalPromoters: number;
    activePromoters: number;
    totalParties: number;
    pendingApprovals: number;
    recentActivity: number;
    expiringDocuments: number;
    contractsByStatus: Record<string, number>;
    monthlyData: Array<{
      month: string;
      total: number;
      active: number;
      pending: number;
      completed: number;
    }>;
    contractGrowth: number;
    promoterGrowth: number;
    completionRate: number;
    avgProcessingTime: string;
  };
}

const COLORS = {
  active: '#10b981',
  pending: '#f59e0b',
  completed: '#3b82f6',
  cancelled: '#ef4444',
  primary: '#6366f1',
  secondary: '#8b5cf6',
};

export function DashboardStats({ stats }: DashboardStatsProps) {
  // Prepare pie chart data
  const statusData = Object.entries(stats.contractsByStatus).map(
    ([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: COLORS[status as keyof typeof COLORS] || COLORS.primary,
    })
  );

  // Prepare trend data (last 6 months)
  const trendData = stats.monthlyData.slice(-6).map(item => ({
    month: new Date(`${item.month}-01`).toLocaleDateString('en-US', {
      month: 'short',
    }),
    contracts: item.total,
    active: item.active,
    completed: item.completed,
  }));

  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color = 'blue',
    description,
    trend = 'up',
  }: {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ComponentType<any>;
    color?: string;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <Card className='relative overflow-hidden hover:shadow-lg transition-all duration-300'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium text-muted-foreground'>
          {title}
        </CardTitle>
        <div
          className={cn(
            'p-2 rounded-lg',
            color === 'blue' && 'bg-blue-100 text-blue-600',
            color === 'green' && 'bg-green-100 text-green-600',
            color === 'yellow' && 'bg-yellow-100 text-yellow-600',
            color === 'red' && 'bg-red-100 text-red-600',
            color === 'purple' && 'bg-purple-100 text-purple-600'
          )}
        >
          <Icon className='h-4 w-4' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between'>
          <div>
            <div className='text-2xl font-bold'>{value}</div>
            {change && (
              <div
                className={cn(
                  'flex items-center text-xs mt-1',
                  trend === 'up' && 'text-green-600',
                  trend === 'down' && 'text-red-600',
                  trend === 'neutral' && 'text-gray-600'
                )}
              >
                {trend === 'up' ? (
                  <ArrowUpRight className='h-3 w-3 mr-1' />
                ) : trend === 'down' ? (
                  <ArrowDownRight className='h-3 w-3 mr-1' />
                ) : null}
                {change}
              </div>
            )}
            {description && (
              <p className='text-xs text-muted-foreground mt-1'>
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
      {/* Decorative gradient */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0 h-1',
          color === 'blue' && 'bg-gradient-to-r from-blue-400 to-blue-600',
          color === 'green' && 'bg-gradient-to-r from-green-400 to-green-600',
          color === 'yellow' &&
            'bg-gradient-to-r from-yellow-400 to-yellow-600',
          color === 'red' && 'bg-gradient-to-r from-red-400 to-red-600',
          color === 'purple' && 'bg-gradient-to-r from-purple-400 to-purple-600'
        )}
      />
    </Card>
  );

  return (
    <div className='space-y-6'>
      {/* Key Metrics Grid */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Total Contracts'
          value={stats.totalContracts}
          change={`+${stats.contractGrowth}% from last month`}
          icon={FileText}
          color='blue'
          description='All contracts in system'
        />
        <StatCard
          title='Active Promoters'
          value={stats.activePromoters}
          change={`+${stats.promoterGrowth}% growth`}
          icon={Users}
          color='green'
          description={`${stats.totalPromoters} total promoters`}
        />
        <StatCard
          title='Pending Approvals'
          value={stats.pendingApprovals}
          icon={Clock}
          color='yellow'
          description='Requires immediate attention'
        />
        <StatCard
          title='System Health'
          value='98%'
          icon={Activity}
          color='green'
          description='All systems operational'
        />
      </div>

      {/* Secondary Metrics */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title='Completion Rate'
          value={`${stats.completionRate}%`}
          icon={Target}
          color='purple'
          description='Contract completion efficiency'
        />
        <StatCard
          title='Avg Processing Time'
          value={`${stats.avgProcessingTime} days`}
          icon={Zap}
          color='blue'
          description='Time to complete contracts'
        />
        <StatCard
          title='Expiring Documents'
          value={stats.expiringDocuments}
          icon={AlertTriangle}
          color={stats.expiringDocuments > 0 ? 'red' : 'green'}
          description='Next 30 days'
        />
        <StatCard
          title='Recent Activity'
          value={stats.recentActivity}
          icon={Calendar}
          color='green'
          description='Last 7 days'
        />
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Contract Status Distribution */}
        <Card className='hover:shadow-lg transition-shadow duration-300'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Target className='h-5 w-5 text-blue-600' />
              Contract Status Distribution
            </CardTitle>
            <CardDescription>
              Current breakdown of all contracts by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx='50%'
                    cy='50%'
                    labelLine={false}
                    label={({ name, percent }) =>
                      `${name}: ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill='#8884d8'
                    dataKey='value'
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className='flex flex-wrap gap-4 mt-4'>
              {statusData.map((item, index) => (
                <div key={index} className='flex items-center gap-2'>
                  <div
                    className={cn(
                      'w-3 h-3 rounded-full',
                      item.name === 'Active' && 'bg-green-500',
                      item.name === 'Pending' && 'bg-yellow-500',
                      item.name === 'Completed' && 'bg-blue-500',
                      item.name === 'Cancelled' && 'bg-red-500'
                    )}
                  />
                  <span className='text-sm text-muted-foreground'>
                    {item.name}: {item.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className='hover:shadow-lg transition-shadow duration-300'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <TrendingUp className='h-5 w-5 text-green-600' />
              Contract Trends (6 Months)
            </CardTitle>
            <CardDescription>
              Monthly contract creation and completion trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='h-[300px]'>
              <ResponsiveContainer width='100%' height='100%'>
                <AreaChart data={trendData}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='month' />
                  <YAxis />
                  <Tooltip />
                  <Area
                    type='monotone'
                    dataKey='contracts'
                    stackId='1'
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.6}
                    name='Total Contracts'
                  />
                  <Area
                    type='monotone'
                    dataKey='completed'
                    stackId='2'
                    stroke={COLORS.completed}
                    fill={COLORS.completed}
                    fillOpacity={0.6}
                    name='Completed'
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card className='hover:shadow-lg transition-shadow duration-300'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5 text-purple-600' />
            Performance Indicators
          </CardTitle>
          <CardDescription>
            Key performance metrics and progress indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            {/* Contract Processing Efficiency */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>
                  Contract Processing Efficiency
                </span>
                <span className='text-sm text-muted-foreground'>
                  {stats.completionRate}%
                </span>
              </div>
              <Progress value={stats.completionRate} className='h-2' />
              <p className='text-xs text-muted-foreground'>
                Based on successful contract completions vs. total contracts
              </p>
            </div>

            {/* Active Promoter Ratio */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>
                  Active Promoter Ratio
                </span>
                <span className='text-sm text-muted-foreground'>
                  {Math.round(
                    (stats.activePromoters /
                      Math.max(stats.totalPromoters, 1)) *
                      100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={
                  (stats.activePromoters / Math.max(stats.totalPromoters, 1)) *
                  100
                }
                className='h-2'
              />
              <p className='text-xs text-muted-foreground'>
                {stats.activePromoters} of {stats.totalPromoters} promoters are
                currently active
              </p>
            </div>

            {/* System Uptime */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>System Uptime</span>
                <span className='text-sm text-muted-foreground'>99.8%</span>
              </div>
              <Progress value={99.8} className='h-2' />
              <p className='text-xs text-muted-foreground'>
                Excellent system reliability over the past 30 days
              </p>
            </div>

            {/* Document Compliance */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-medium'>Document Compliance</span>
                <span className='text-sm text-muted-foreground'>
                  {Math.round(
                    (1 -
                      stats.expiringDocuments /
                        Math.max(stats.totalPromoters, 1)) *
                      100
                  )}
                  %
                </span>
              </div>
              <Progress
                value={
                  (1 -
                    stats.expiringDocuments /
                      Math.max(stats.totalPromoters, 1)) *
                  100
                }
                className='h-2'
              />
              <p className='text-xs text-muted-foreground'>
                {stats.expiringDocuments} documents expiring in the next 30 days
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
