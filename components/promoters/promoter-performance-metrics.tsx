'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface PerformanceMetricsProps {
  metrics: {
    overallScore: number;
    attendanceRate: number;
    taskCompletion: number;
    customerSatisfaction: number;
    responseTime: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    thisMonthTasks: number;
    lastMonthTasks: number;
    averageRating: number;
    totalContracts: number;
    activeContracts: number;
    completedContracts: number;
  };
}

export function PromoterPerformanceMetrics({
  metrics,
}: PerformanceMetricsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous)
      return <TrendingUp className='h-4 w-4 text-green-500' />;
    if (current < previous)
      return <TrendingDown className='h-4 w-4 text-red-500' />;
    return <Target className='h-4 w-4 text-gray-500' />;
  };

  const getTrendText = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff > 0) return `+${diff.toFixed(1)}%`;
    if (diff < 0) return `${diff.toFixed(1)}%`;
    return 'No change';
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className='space-y-6'>
      {/* Overall Performance Score */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Overall Performance Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-between mb-4'>
            <div className='flex items-center gap-3'>
              <div
                className={`text-3xl font-bold ${getScoreColor(metrics.overallScore)}`}
              >
                {metrics.overallScore.toFixed(1)}
              </div>
              <Badge variant={getScoreBadgeVariant(metrics.overallScore)}>
                {metrics.overallScore >= 90
                  ? 'Excellent'
                  : metrics.overallScore >= 70
                    ? 'Good'
                    : 'Needs Improvement'}
              </Badge>
            </div>
            <div className='text-right'>
              <div className='text-sm text-gray-500'>vs Last Month</div>
              <div
                className={`flex items-center gap-1 ${getTrendColor(metrics.overallScore, 75)}`}
              >
                {getTrendIcon(metrics.overallScore, 75)}
                <span className='text-sm font-medium'>
                  {getTrendText(metrics.overallScore, 75)}
                </span>
              </div>
            </div>
          </div>
          <Progress value={metrics.overallScore} className='h-2' />
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {/* Attendance Rate */}
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-500' />
                <span className='text-sm font-medium'>Attendance</span>
              </div>
              <span className='text-lg font-bold text-green-600'>
                {metrics.attendanceRate.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.attendanceRate} className='h-1' />
          </CardContent>
        </Card>

        {/* Task Completion */}
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <Target className='h-4 w-4 text-blue-500' />
                <span className='text-sm font-medium'>Tasks</span>
              </div>
              <span className='text-lg font-bold text-blue-600'>
                {metrics.taskCompletion.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.taskCompletion} className='h-1' />
          </CardContent>
        </Card>

        {/* Customer Satisfaction */}
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <TrendingUp className='h-4 w-4 text-purple-500' />
                <span className='text-sm font-medium'>Satisfaction</span>
              </div>
              <span className='text-lg font-bold text-purple-600'>
                {metrics.customerSatisfaction.toFixed(1)}%
              </span>
            </div>
            <Progress value={metrics.customerSatisfaction} className='h-1' />
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center justify-between mb-2'>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 text-orange-500' />
                <span className='text-sm font-medium'>Response</span>
              </div>
              <span className='text-lg font-bold text-orange-600'>
                {metrics.responseTime.toFixed(1)}h
              </span>
            </div>
            <div className='text-xs text-gray-500'>Avg response time</div>
          </CardContent>
        </Card>
      </div>

      {/* Task Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Calendar className='h-5 w-5' />
            Task Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {metrics.totalTasks}
              </div>
              <div className='text-sm text-gray-500'>Total Tasks</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {metrics.completedTasks}
              </div>
              <div className='text-sm text-gray-500'>Completed</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-yellow-600'>
                {metrics.pendingTasks}
              </div>
              <div className='text-sm text-gray-500'>Pending</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-red-600'>
                {metrics.overdueTasks}
              </div>
              <div className='text-sm text-gray-500'>Overdue</div>
            </div>
          </div>

          {/* Monthly Comparison */}
          <div className='mt-4 pt-4 border-t'>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-medium'>
                This Month vs Last Month
              </span>
              <div className='flex items-center gap-1'>
                {getTrendIcon(metrics.thisMonthTasks, metrics.lastMonthTasks)}
                <span
                  className={`text-sm ${getTrendColor(metrics.thisMonthTasks, metrics.lastMonthTasks)}`}
                >
                  {getTrendText(metrics.thisMonthTasks, metrics.lastMonthTasks)}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Summary */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Target className='h-5 w-5' />
            Contract Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='text-center'>
              <div className='text-2xl font-bold text-blue-600'>
                {metrics.totalContracts}
              </div>
              <div className='text-sm text-gray-500'>Total Contracts</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-green-600'>
                {metrics.activeContracts}
              </div>
              <div className='text-sm text-gray-500'>Active</div>
            </div>
            <div className='text-center'>
              <div className='text-2xl font-bold text-gray-600'>
                {metrics.completedContracts}
              </div>
              <div className='text-sm text-gray-500'>Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
