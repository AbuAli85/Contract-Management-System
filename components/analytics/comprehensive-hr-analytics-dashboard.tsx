'use client';

import React, { useState, useEffect, Suspense } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users,
  Clock,
  FileText,
  Target,
  Calendar,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Download,
  RefreshCw,
  Building2,
  Award,
  Zap,
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';

interface HRMetrics {
  employees: {
    total: number;
    active: number;
    onLeave: number;
    terminated: number;
    byDepartment: Record<string, number>;
    byEmploymentType: Record<string, number>;
    newHires: number;
  };
  attendance: {
    totalDays: number;
    present: number;
    absent: number;
    late: number;
    leave: number;
    totalHours: number;
    overtimeHours: number;
    attendanceRate: number;
    dailyAttendance: Array<{
      date: string;
      present: number;
      absent: number;
      late: number;
    }>;
  };
  documents: {
    total: number;
    expired: number;
    expiringSoon: number;
    compliant: number;
    byType: Record<string, number>;
    complianceRate: number;
  };
  tasks: {
    total: number;
    completed: number;
    pending: number;
    inProgress: number;
    overdue: number;
    byPriority: Record<string, number>;
    completionRate: number;
    avgCompletionTime: number;
  };
  targets: {
    total: number;
    achieved: number;
    inProgress: number;
    notStarted: number;
    achievementRate: number;
    avgProgress: number;
  };
  leave: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    byType: Record<string, number>;
    totalDays: number;
  };
}

interface MonthlyTrend {
  month: string;
  newHires: number;
  attendance: number;
  employees: number;
}

interface HRAnalyticsData {
  period: string;
  dateRange: {
    start: string;
    end: string;
  };
  metrics: HRMetrics;
  trends: {
    monthly: MonthlyTrend[];
  };
}

const CHART_COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
};

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
];

export function ComprehensiveHRAnalyticsDashboard() {
  const { toast } = useToast();
  const [data, setData] = useState<HRAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/analytics/hr?period=${period}`);
      const result = await response.json();

      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || 'Failed to fetch analytics');
      }
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className='text-center py-12'>
        <AlertTriangle className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
        <p className='text-muted-foreground'>No analytics data available</p>
        <Button onClick={fetchAnalytics} className='mt-4'>
          <RefreshCw className='h-4 w-4 mr-2' />
          Retry
        </Button>
      </div>
    );
  }

  const { metrics, trends } = data;

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-3'>
            <BarChart3 className='h-8 w-8 text-blue-600' />
            HR Analytics Dashboard
          </h1>
          <p className='text-muted-foreground mt-1'>
            Comprehensive insights into your HR operations
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className='w-40'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='month'>This Month</SelectItem>
              <SelectItem value='quarter'>This Quarter</SelectItem>
              <SelectItem value='year'>This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant='outline' onClick={fetchAnalytics}>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
          <Button variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Employees
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{metrics.employees.total}</div>
            <p className='text-xs text-muted-foreground'>
              {metrics.employees.active} active • {metrics.employees.newHires}{' '}
              new this {period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Attendance Rate
            </CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {metrics.attendance.attendanceRate.toFixed(1)}%
            </div>
            <Progress
              value={metrics.attendance.attendanceRate}
              className='mt-2'
            />
            <p className='text-xs text-muted-foreground mt-1'>
              {metrics.attendance.present} present • {metrics.attendance.absent}{' '}
              absent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Document Compliance
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {metrics.documents.complianceRate.toFixed(1)}%
            </div>
            <Progress
              value={metrics.documents.complianceRate}
              className='mt-2'
            />
            <p className='text-xs text-muted-foreground mt-1'>
              {metrics.documents.compliant} compliant •{' '}
              {metrics.documents.expired} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Task Completion
            </CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {metrics.tasks.completionRate.toFixed(1)}%
            </div>
            <Progress value={metrics.tasks.completionRate} className='mt-2' />
            <p className='text-xs text-muted-foreground mt-1'>
              {metrics.tasks.completed} completed • {metrics.tasks.overdue}{' '}
              overdue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-6'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='employees'>Employees</TabsTrigger>
          <TabsTrigger value='attendance'>Attendance</TabsTrigger>
          <TabsTrigger value='documents'>Documents</TabsTrigger>
          <TabsTrigger value='tasks'>Tasks</TabsTrigger>
          <TabsTrigger value='targets'>Targets</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Trends</CardTitle>
                <CardDescription>Employee growth and activity</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <RechartsLineChart data={trends.monthly}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type='monotone'
                      dataKey='employees'
                      stroke={CHART_COLORS.primary}
                      name='Total Employees'
                    />
                    <Line
                      type='monotone'
                      dataKey='newHires'
                      stroke={CHART_COLORS.success}
                      name='New Hires'
                    />
                    <Line
                      type='monotone'
                      dataKey='attendance'
                      stroke={CHART_COLORS.info}
                      name='Attendance Days'
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Department Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Department Distribution</CardTitle>
                <CardDescription>Employees by department</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(metrics.employees.byDepartment).map(
                        ([name, value]) => ({
                          name,
                          value,
                        })
                      )}
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
                      {Object.entries(metrics.employees.byDepartment).map(
                        (_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Employees Tab */}
        <TabsContent value='employees' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Employment Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={250}>
                  <RechartsBarChart
                    data={[
                      { name: 'Active', value: metrics.employees.active },
                      { name: 'On Leave', value: metrics.employees.onLeave },
                      {
                        name: 'Terminated',
                        value: metrics.employees.terminated,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='value' fill={CHART_COLORS.primary} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Employment Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(
                        metrics.employees.byEmploymentType
                      ).map(([name, value]) => ({
                        name,
                        value,
                      }))}
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
                      {Object.entries(metrics.employees.byEmploymentType).map(
                        (_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value='attendance' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Daily Attendance Trend</CardTitle>
              <CardDescription>Attendance patterns over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width='100%' height={400}>
                <RechartsAreaChart data={metrics.attendance.dailyAttendance}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis
                    dataKey='date'
                    tickFormatter={value => {
                      if (!value) return '';
                      try {
                        const date =
                          typeof value === 'string'
                            ? parseISO(value)
                            : new Date(value);
                        if (isNaN(date.getTime())) return value;
                        return format(date, 'MMM dd');
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={value => {
                      if (!value) return '';
                      try {
                        const date =
                          typeof value === 'string'
                            ? parseISO(value)
                            : new Date(value);
                        if (isNaN(date.getTime())) return value;
                        return format(date, 'MMM dd, yyyy');
                      } catch {
                        return value;
                      }
                    }}
                  />
                  <Legend />
                  <Area
                    type='monotone'
                    dataKey='present'
                    stackId='1'
                    stroke={CHART_COLORS.success}
                    fill={CHART_COLORS.success}
                    name='Present'
                  />
                  <Area
                    type='monotone'
                    dataKey='absent'
                    stackId='1'
                    stroke={CHART_COLORS.danger}
                    fill={CHART_COLORS.danger}
                    name='Absent'
                  />
                  <Area
                    type='monotone'
                    dataKey='late'
                    stackId='1'
                    stroke={CHART_COLORS.warning}
                    fill={CHART_COLORS.warning}
                    name='Late'
                  />
                </RechartsAreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Total Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {metrics.attendance.totalHours.toFixed(0)}
                </div>
                <p className='text-xs text-muted-foreground'>Hours worked</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Overtime Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {metrics.attendance.overtimeHours.toFixed(0)}
                </div>
                <p className='text-xs text-muted-foreground'>Overtime</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className='text-sm'>Leave Days</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>
                  {metrics.attendance.leave}
                </div>
                <p className='text-xs text-muted-foreground'>Days on leave</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Documents Tab */}
        <TabsContent value='documents' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Document Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        {
                          name: 'Compliant',
                          value: metrics.documents.compliant,
                        },
                        {
                          name: 'Expiring Soon',
                          value: metrics.documents.expiringSoon,
                        },
                        { name: 'Expired', value: metrics.documents.expired },
                      ]}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      <Cell fill={CHART_COLORS.success} />
                      <Cell fill={CHART_COLORS.warning} />
                      <Cell fill={CHART_COLORS.danger} />
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Documents by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <RechartsBarChart
                    data={Object.entries(metrics.documents.byType).map(
                      ([name, value]) => ({
                        name,
                        value,
                      })
                    )}
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='value' fill={CHART_COLORS.primary} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value='tasks' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
            <Card>
              <CardHeader>
                <CardTitle>Task Status</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <RechartsBarChart
                    data={[
                      { name: 'Completed', value: metrics.tasks.completed },
                      { name: 'In Progress', value: metrics.tasks.inProgress },
                      { name: 'Pending', value: metrics.tasks.pending },
                      { name: 'Overdue', value: metrics.tasks.overdue },
                    ]}
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='name' />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey='value' fill={CHART_COLORS.primary} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={Object.entries(metrics.tasks.byPriority).map(
                        ([name, value]) => ({
                          name,
                          value,
                        })
                      )}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={100}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      {Object.entries(metrics.tasks.byPriority).map(
                        (_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        )
                      )}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Task Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Completion Rate
                  </p>
                  <div className='text-2xl font-bold'>
                    {metrics.tasks.completionRate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Avg Completion Time
                  </p>
                  <div className='text-2xl font-bold'>
                    {metrics.tasks.avgCompletionTime.toFixed(1)} days
                  </div>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Total Tasks</p>
                  <div className='text-2xl font-bold'>
                    {metrics.tasks.total}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Targets Tab */}
        <TabsContent value='targets' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Target Achievement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div>
                  <p className='text-sm text-muted-foreground'>Total Targets</p>
                  <div className='text-2xl font-bold'>
                    {metrics.targets.total}
                  </div>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Achieved</p>
                  <div className='text-2xl font-bold text-green-600'>
                    {metrics.targets.achieved}
                  </div>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>
                    Achievement Rate
                  </p>
                  <div className='text-2xl font-bold'>
                    {metrics.targets.achievementRate.toFixed(1)}%
                  </div>
                </div>
                <div>
                  <p className='text-sm text-muted-foreground'>Avg Progress</p>
                  <div className='text-2xl font-bold'>
                    {metrics.targets.avgProgress.toFixed(1)}%
                  </div>
                </div>
              </div>
              <div className='mt-4'>
                <Progress value={metrics.targets.avgProgress} className='h-3' />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
