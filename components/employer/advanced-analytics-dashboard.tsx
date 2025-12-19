'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  CheckSquare,
  Target,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  AlertTriangle,
  Download,
  RefreshCw,
  Loader2,
  UserCheck,
  UserX,
  UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/components/providers/company-provider';

interface AnalyticsData {
  overview: {
    totalEmployees: number;
    activeEmployees: number;
    onLeave: number;
    newThisMonth: number;
    trends: {
      totalEmployees: { value: number; change: number };
      activeEmployees: { value: number; change: number };
      onLeave: { value: number; change: number };
    };
  };
  attendance: {
    today: {
      present: number;
      absent: number;
      late: number;
      onLeave: number;
    };
    monthly: {
      averageHours: number;
      presentDays: number;
      absentDays: number;
      lateCount: number;
      overtimeHours: number;
    };
    trends: Array<{
      date: string;
      present: number;
      absent: number;
      late: number;
    }>;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completionRate: number;
    trends: Array<{
      date: string;
      completed: number;
      created: number;
    }>;
  };
  targets: {
    total: number;
    active: number;
    completed: number;
    behindSchedule: number;
    averageProgress: number;
    achievementRate: number;
    trends: Array<{
      date: string;
      achieved: number;
      total: number;
    }>;
  };
  performance: {
    topPerformers: Array<{
      employeeId: string;
      employeeName: string;
      score: number;
      metrics: {
        attendance: number;
        tasks: number;
        targets: number;
      };
    }>;
    needsAttention: Array<{
      employeeId: string;
      employeeName: string;
      issues: string[];
    }>;
  };
  insights: Array<{
    type: 'success' | 'warning' | 'info' | 'alert';
    title: string;
    message: string;
    action?: string;
  }>;
}

const MetricCard = ({
  title,
  value,
  change,
  icon: Icon,
  trend,
  subtitle,
}: {
  title: string;
  value: number | string;
  change?: number;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
}) => {
  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
            )}
            {change !== undefined && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-xs font-medium",
                isPositive && "text-green-600 dark:text-green-400",
                isNegative && "text-red-600 dark:text-red-400",
                !isPositive && !isNegative && "text-gray-500"
              )}>
                {isPositive && <TrendingUp className="h-3 w-3" />}
                {isNegative && <TrendingDown className="h-3 w-3" />}
                <span>{Math.abs(change)}% from last period</span>
              </div>
            )}
          </div>
          <div className={cn(
            "p-3 rounded-lg",
            trend === 'up' && "bg-green-100 dark:bg-green-900/20",
            trend === 'down' && "bg-red-100 dark:bg-red-900/20",
            trend === 'neutral' && "bg-blue-100 dark:bg-blue-900/20"
          )}>
            <Icon className={cn(
              "h-6 w-6",
              trend === 'up' && "text-green-600 dark:text-green-400",
              trend === 'down' && "text-red-600 dark:text-red-400",
              trend === 'neutral' && "text-blue-600 dark:text-blue-400"
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InsightCard = ({
  type,
  title,
  message,
  action,
}: {
  type: 'success' | 'warning' | 'info' | 'alert';
  title: string;
  message: string;
  action?: string;
}) => {
  const icons = {
    success: CheckSquare,
    warning: AlertTriangle,
    info: Activity,
    alert: AlertTriangle,
  };

  const colors = {
    success: 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800',
    alert: 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800',
  };

  const Icon = icons[type];

  return (
    <Card className={cn("border", colors[type])}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Icon className={cn(
            "h-5 w-5 mt-0.5",
            type === 'success' && "text-green-600",
            type === 'warning' && "text-yellow-600",
            type === 'info' && "text-blue-600",
            type === 'alert' && "text-red-600"
          )} />
          <div className="flex-1">
            <h4 className="font-semibold text-sm">{title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{message}</p>
            {action && (
              <Button variant="link" className="p-0 h-auto mt-2 text-xs">
                {action} →
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function AdvancedAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { companyId } = useCompany();
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/employer/team/analytics/advanced?company_id=${companyId || ''}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const result = await response.json();
      setData(result.data);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      toast({
        title: 'Error',
        description: 'Failed to load analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (companyId) {
      fetchAnalytics();
    }
  }, [companyId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAnalytics();
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    try {
      const response = await fetch(
        `/api/employer/team/analytics/export?format=${format}&company_id=${companyId || ''}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to export analytics');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-report.${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Analytics report exported successfully',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to export analytics',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="mt-4 text-sm text-gray-500">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Failed to load analytics</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchAnalytics} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <BarChart3 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No analytics data</h3>
            <p className="text-sm text-gray-500">Analytics data will appear here once you have team activity.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-sm text-gray-500 mt-1">Comprehensive insights into your team performance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={cn("h-4 w-4 mr-2", refreshing && "animate-spin")} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('pdf')}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Insights */}
      {data.insights && data.insights.length > 0 && (
        <div className="grid gap-4">
          <h3 className="text-lg font-semibold">Key Insights</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {data.insights.map((insight, index) => (
              <InsightCard key={index} {...insight} />
            ))}
          </div>
        </div>
      )}

      {/* Overview Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Team Overview</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Employees"
            value={data.overview.totalEmployees}
            change={data.overview.trends.totalEmployees.change}
            icon={Users}
            trend={data.overview.trends.totalEmployees.change > 0 ? 'up' : 'down'}
          />
          <MetricCard
            title="Active Employees"
            value={data.overview.activeEmployees}
            change={data.overview.trends.activeEmployees.change}
            icon={UserCheck}
            trend={data.overview.trends.activeEmployees.change > 0 ? 'up' : 'down'}
          />
          <MetricCard
            title="On Leave"
            value={data.overview.onLeave}
            change={data.overview.trends.onLeave.change}
            icon={Calendar}
            trend="neutral"
          />
          <MetricCard
            title="New This Month"
            value={data.overview.newThisMonth}
            icon={UserPlus}
            trend="up"
          />
        </div>
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance">
            <Clock className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="targets">
            <Target className="h-4 w-4 mr-2" />
            Targets
          </TabsTrigger>
          <TabsTrigger value="performance">
            <Activity className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Today Present"
              value={data.attendance.today.present}
              icon={UserCheck}
              trend="up"
            />
            <MetricCard
              title="Today Absent"
              value={data.attendance.today.absent}
              icon={UserX}
              trend="down"
            />
            <MetricCard
              title="Today Late"
              value={data.attendance.today.late}
              icon={Clock}
              trend="neutral"
            />
            <MetricCard
              title="Avg Hours/Month"
              value={`${data.attendance.monthly.averageHours.toFixed(1)}h`}
              icon={Clock}
              trend="up"
            />
          </div>
          {/* Chart placeholder - would integrate with recharts or similar */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Trends</CardTitle>
              <CardDescription>30-day attendance overview</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <LineChart className="h-12 w-12 mx-auto mb-2" />
                  <p>Chart visualization would appear here</p>
                  <p className="text-xs">Integrate with recharts or chart.js</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Tasks"
              value={data.tasks.total}
              icon={CheckSquare}
              trend="neutral"
            />
            <MetricCard
              title="Completed"
              value={data.tasks.completed}
              icon={CheckSquare}
              trend="up"
            />
            <MetricCard
              title="In Progress"
              value={data.tasks.inProgress}
              icon={Activity}
              trend="neutral"
            />
            <MetricCard
              title="Completion Rate"
              value={`${data.tasks.completionRate.toFixed(1)}%`}
              icon={TrendingUp}
              trend={data.tasks.completionRate > 80 ? 'up' : 'down'}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Task Completion Trends</CardTitle>
              <CardDescription>Task creation and completion over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Chart visualization would appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targets" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Active Targets"
              value={data.targets.active}
              icon={Target}
              trend="neutral"
            />
            <MetricCard
              title="Completed"
              value={data.targets.completed}
              icon={CheckSquare}
              trend="up"
            />
            <MetricCard
              title="Behind Schedule"
              value={data.targets.behindSchedule}
              icon={AlertTriangle}
              trend="down"
            />
            <MetricCard
              title="Achievement Rate"
              value={`${data.targets.achievementRate.toFixed(1)}%`}
              icon={TrendingUp}
              trend={data.targets.achievementRate > 70 ? 'up' : 'down'}
            />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Target Achievement Trends</CardTitle>
              <CardDescription>Target progress and achievement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-2" />
                  <p>Chart visualization would appear here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Employees with highest performance scores</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.performance.topPerformers.map((performer, index) => (
                    <div key={performer.employeeId} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{performer.employeeName}</p>
                          <p className="text-xs text-gray-500">Score: {performer.score}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        Top Performer
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Needs Attention</CardTitle>
                <CardDescription>Employees requiring management attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.performance.needsAttention.map((employee) => (
                    <div key={employee.employeeId} className="p-3 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                      <p className="font-medium">{employee.employeeName}</p>
                      <ul className="text-xs text-gray-600 dark:text-gray-400 mt-1 list-disc list-inside">
                        {employee.issues.map((issue, idx) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

