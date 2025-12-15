'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Clock,
  CheckSquare,
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  UserCheck,
  UserX,
  Timer,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Analytics {
  team: {
    total: number;
    active: number;
    onLeave: number;
    newThisMonth: number;
  };
  attendance: {
    todayPresent: number;
    todayAbsent: number;
    todayLate: number;
    monthlyPresent: number;
    monthlyAbsent: number;
    monthlyLate: number;
    averageHours: number;
  };
  tasks: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    overdue: number;
    completedThisMonth: number;
  };
  targets: {
    total: number;
    active: number;
    completed: number;
    behindSchedule: number;
    averageProgress: number;
  };
  recentActivity: Array<{
    type: string;
    message: string;
    timestamp: string;
    status?: string;
  }>;
}

interface Period {
  month: string;
  today: string;
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  className,
}: {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}) => (
  <Card className={cn("border-0 shadow-lg hover:shadow-xl transition-shadow", className)}>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
          {trend && trendValue && (
            <div className={cn(
              "flex items-center gap-1 mt-2 text-xs font-medium",
              trend === 'up' && "text-green-600",
              trend === 'down' && "text-red-600",
              trend === 'neutral' && "text-gray-500"
            )}>
              {trend === 'up' && <TrendingUp className="h-3 w-3" />}
              {trend === 'down' && <TrendingDown className="h-3 w-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <Icon className="h-6 w-6 text-gray-600 dark:text-gray-400" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function AnalyticsOverview() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [period, setPeriod] = useState<Period | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/employer/analytics');
      const data = await response.json();

      if (response.ok && data.success) {
        setAnalytics(data.analytics);
        setPeriod(data.period);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const attendanceRate = analytics.team.active > 0
    ? Math.round(((analytics.attendance.todayPresent + analytics.attendance.todayLate) / analytics.team.active) * 100)
    : 0;

  const taskCompletionRate = analytics.tasks.total > 0
    ? Math.round((analytics.tasks.completed / analytics.tasks.total) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Period Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Overview</h2>
          <p className="text-gray-500">{period?.month}</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Activity className="h-3 w-3 mr-1" />
          Live
        </Badge>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Team Size"
          value={analytics.team.total}
          subtitle={`${analytics.team.active} active`}
          icon={Users}
          trend={analytics.team.newThisMonth > 0 ? 'up' : 'neutral'}
          trendValue={analytics.team.newThisMonth > 0 ? `+${analytics.team.newThisMonth} this month` : undefined}
        />
        <StatCard
          title="Today's Attendance"
          value={`${attendanceRate}%`}
          subtitle={`${analytics.attendance.todayPresent + analytics.attendance.todayLate} / ${analytics.team.active}`}
          icon={Clock}
          trend={attendanceRate >= 90 ? 'up' : attendanceRate >= 70 ? 'neutral' : 'down'}
          trendValue={analytics.attendance.todayLate > 0 ? `${analytics.attendance.todayLate} late` : 'On time'}
        />
        <StatCard
          title="Tasks Completed"
          value={analytics.tasks.completed}
          subtitle={`${taskCompletionRate}% completion rate`}
          icon={CheckSquare}
          trend={analytics.tasks.overdue > 0 ? 'down' : 'up'}
          trendValue={analytics.tasks.overdue > 0 ? `${analytics.tasks.overdue} overdue` : 'All on track'}
        />
        <StatCard
          title="Target Progress"
          value={`${Math.round(analytics.targets.averageProgress)}%`}
          subtitle={`${analytics.targets.active} active targets`}
          icon={Target}
          trend={analytics.targets.behindSchedule > 0 ? 'down' : 'up'}
          trendValue={analytics.targets.behindSchedule > 0 ? `${analytics.targets.behindSchedule} behind` : 'On track'}
        />
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Attendance Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <UserCheck className="h-5 w-5 mx-auto text-green-600 mb-1" />
                <p className="text-2xl font-bold text-green-600">
                  {analytics.attendance.todayPresent}
                </p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Timer className="h-5 w-5 mx-auto text-amber-600 mb-1" />
                <p className="text-2xl font-bold text-amber-600">
                  {analytics.attendance.todayLate}
                </p>
                <p className="text-xs text-gray-500">Late</p>
              </div>
              <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <UserX className="h-5 w-5 mx-auto text-red-600 mb-1" />
                <p className="text-2xl font-bold text-red-600">
                  {analytics.attendance.todayAbsent}
                </p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500">
                Avg. daily hours: <span className="font-semibold">{analytics.attendance.averageHours.toFixed(1)}h</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tasks Breakdown */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-purple-600" />
              Task Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Pending</span>
                <Badge variant="outline">{analytics.tasks.pending}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">In Progress</span>
                <Badge className="bg-blue-100 text-blue-700">{analytics.tasks.inProgress}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Completed</span>
                <Badge className="bg-green-100 text-green-700">{analytics.tasks.completed}</Badge>
              </div>
              {analytics.tasks.overdue > 0 && (
                <div className="flex items-center justify-between text-red-600">
                  <span className="text-sm flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Overdue
                  </span>
                  <Badge variant="destructive">{analytics.tasks.overdue}</Badge>
                </div>
              )}
            </div>
            <div className="pt-2 border-t">
              <p className="text-sm text-gray-500">
                Completed this month: <span className="font-semibold">{analytics.tasks.completedThisMonth}</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[200px] overflow-y-auto">
              {analytics.recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No recent activity
                </p>
              ) : (
                analytics.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 text-sm"
                  >
                    <div className={cn(
                      "w-2 h-2 rounded-full mt-1.5 flex-shrink-0",
                      activity.type === 'attendance' && "bg-blue-500",
                      activity.type === 'task' && "bg-green-500"
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className="truncate">{activity.message}</p>
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

