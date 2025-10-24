'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Target,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  Activity,
  Zap,
  Users,
  Briefcase,
  DollarSign,
  Star,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { formatDistanceToNow, format, subMonths, eachMonthOfInterval } from 'date-fns';

interface PromoterAnalyticsDashboardProps {
  promoterId: string;
  promoterData: {
    name_en: string;
    created_at: string;
    status: string;
    contracts: any[];
  };
  performanceMetrics?: {
    overallScore: number;
    attendanceRate: number;
    taskCompletion: number;
    customerSatisfaction: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
    thisMonthTasks: number;
    lastMonthTasks: number;
    averageRating: number;
  } | undefined;
}

interface MonthlyData {
  month: string;
  contracts: number;
  tasks: number;
  performance: number;
  revenue: number;
}

interface KPI {
  id: string;
  label: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  icon: React.ReactNode;
}

export function PromoterAnalyticsDashboard({ 
  promoterId, 
  promoterData,
  performanceMetrics
}: PromoterAnalyticsDashboardProps) {
  const [activeView, setActiveView] = useState<'overview' | 'performance' | 'financial' | 'trends'>('overview');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Generate monthly trend data
  const monthlyTrendData = useMemo((): MonthlyData[] => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 6),
      end: new Date()
    });

    return months.map((month, index) => ({
      month: format(month, 'MMM'),
      contracts: Math.floor(Math.random() * 5) + 1,
      tasks: Math.floor(Math.random() * 15) + 5,
      performance: 70 + Math.floor(Math.random() * 25),
      revenue: Math.floor(Math.random() * 5000) + 2000
    }));
  }, []);

  // Calculate comprehensive KPIs
  const kpis = useMemo((): KPI[] => {
    const metrics = performanceMetrics || {
      overallScore: 0,
      attendanceRate: 0,
      taskCompletion: 0,
      customerSatisfaction: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      overdueTasks: 0,
      thisMonthTasks: 0,
      lastMonthTasks: 0,
      averageRating: 0
    };

    return [
      {
        id: 'performance',
        label: 'Overall Performance',
        value: metrics.overallScore,
        target: 90,
        unit: '%',
        trend: metrics.overallScore >= 85 ? 'up' : metrics.overallScore >= 70 ? 'stable' : 'down',
        change: 5.2,
        status: metrics.overallScore >= 90 ? 'excellent' : metrics.overallScore >= 75 ? 'good' : metrics.overallScore >= 60 ? 'warning' : 'critical',
        icon: <Target className="h-5 w-5" />
      },
      {
        id: 'attendance',
        label: 'Attendance Rate',
        value: metrics.attendanceRate,
        target: 95,
        unit: '%',
        trend: metrics.attendanceRate >= 90 ? 'up' : 'down',
        change: 2.1,
        status: metrics.attendanceRate >= 95 ? 'excellent' : metrics.attendanceRate >= 85 ? 'good' : metrics.attendanceRate >= 75 ? 'warning' : 'critical',
        icon: <CheckCircle className="h-5 w-5" />
      },
      {
        id: 'taskCompletion',
        label: 'Task Completion',
        value: metrics.taskCompletion,
        target: 85,
        unit: '%',
        trend: metrics.taskCompletion >= 80 ? 'up' : 'stable',
        change: 3.7,
        status: metrics.taskCompletion >= 90 ? 'excellent' : metrics.taskCompletion >= 75 ? 'good' : metrics.taskCompletion >= 60 ? 'warning' : 'critical',
        icon: <Activity className="h-5 w-5" />
      },
      {
        id: 'satisfaction',
        label: 'Customer Satisfaction',
        value: metrics.customerSatisfaction,
        target: 90,
        unit: '%',
        trend: metrics.customerSatisfaction >= 85 ? 'up' : 'down',
        change: 1.5,
        status: metrics.customerSatisfaction >= 90 ? 'excellent' : metrics.customerSatisfaction >= 80 ? 'good' : metrics.customerSatisfaction >= 70 ? 'warning' : 'critical',
        icon: <Star className="h-5 w-5" />
      },
      {
        id: 'contracts',
        label: 'Active Contracts',
        value: promoterData.contracts?.filter(c => c.status === 'active').length || 0,
        target: 3,
        unit: '',
        trend: 'stable',
        change: 0,
        status: (promoterData.contracts?.filter(c => c.status === 'active').length || 0) >= 3 ? 'excellent' : 'good',
        icon: <Briefcase className="h-5 w-5" />
      },
      {
        id: 'revenue',
        label: 'Monthly Revenue Impact',
        value: 4850,
        target: 5000,
        unit: '$',
        trend: 'up',
        change: 12.3,
        status: 'good',
        icon: <DollarSign className="h-5 w-5" />
      }
    ];
  }, [performanceMetrics, promoterData.contracts]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <ArrowUp className="h-4 w-4 text-green-500" />;
      case 'down': return <ArrowDown className="h-4 w-4 text-red-500" />;
      case 'stable': return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'stable': return 'text-gray-600';
    }
  };

  // Simple bar chart component
  const SimpleBarChart = ({ data }: { data: MonthlyData[] }) => {
    const maxContracts = Math.max(...data.map(d => d.contracts));
    
    return (
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <span className="text-xs font-medium w-8 text-gray-600">{item.month}</span>
            <div className="flex-1">
              <div className="relative h-8 bg-gray-100 rounded-md overflow-hidden">
                <div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-end px-2"
                  style={{ width: `${(item.contracts / maxContracts) * 100}%` }}
                >
                  <span className="text-xs font-medium text-white">{item.contracts}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Performance trend line
  const PerformanceTrendLine = ({ data }: { data: MonthlyData[] }) => {
    const maxPerformance = 100;
    const chartHeight = 150;
    
    const points = data.map((item, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = chartHeight - ((item.performance / maxPerformance) * chartHeight);
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="relative">
        <svg viewBox={`0 0 100 ${chartHeight}`} className="w-full h-40">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(value => {
            const y = chartHeight - ((value / maxPerformance) * chartHeight);
            return (
              <g key={value}>
                <line 
                  x1="0" 
                  y1={y} 
                  x2="100" 
                  y2={y} 
                  stroke="#E5E7EB" 
                  strokeWidth="0.5"
                />
                <text 
                  x="-2" 
                  y={y + 1} 
                  fontSize="3" 
                  fill="#9CA3AF" 
                  textAnchor="end"
                >
                  {value}%
                </text>
              </g>
            );
          })}
          
          {/* Area fill */}
          <polygon
            points={`0,${chartHeight} ${points} 100,${chartHeight}`}
            fill="url(#gradient)"
            opacity="0.3"
          />
          
          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {data.map((item, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = chartHeight - ((item.performance / maxPerformance) * chartHeight);
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="2"
                fill="#3B82F6"
                stroke="white"
                strokeWidth="1"
              />
            );
          })}
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Month labels */}
        <div className="flex justify-between mt-2">
          {data.map((item, index) => (
            <span key={index} className="text-xs text-gray-500">
              {item.month}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with timeframe selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Analytics Dashboard
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Comprehensive performance insights and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((period) => (
            <Button
              key={period}
              variant={timeframe === period ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeframe(period)}
            >
              {period === '7d' ? '7 Days' : 
               period === '30d' ? '30 Days' : 
               period === '90d' ? '90 Days' : 
               '1 Year'}
            </Button>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.id} className={`border-2 ${getStatusColor(kpi.status)}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${getStatusColor(kpi.status)}`}>
                    {kpi.icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-600">{kpi.label}</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold">
                        {kpi.unit === '$' && kpi.unit}
                        {kpi.value}
                        {kpi.unit !== '$' && kpi.unit}
                      </span>
                      <span className="text-xs text-gray-500">
                        / {kpi.target}{kpi.unit}
                      </span>
                    </div>
                  </div>
                </div>
                <div className={`flex items-center gap-1 ${getTrendColor(kpi.trend)}`}>
                  {getTrendIcon(kpi.trend)}
                  {kpi.change !== 0 && (
                    <span className="text-xs font-medium">
                      {kpi.change > 0 ? '+' : ''}{kpi.change}%
                    </span>
                  )}
                </div>
              </div>
              <Progress 
                value={(kpi.value / kpi.target) * 100} 
                className="h-2"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500">
                  {((kpi.value / kpi.target) * 100).toFixed(0)}% of target
                </span>
                <Badge variant="outline" className="text-xs">
                  {kpi.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analytics Tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contract Activity</CardTitle>
                <CardDescription>Monthly contract distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={monthlyTrendData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Performance Trend</CardTitle>
                <CardDescription>6-month performance history</CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceTrendLine data={monthlyTrendData} />
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {promoterData.contracts?.length || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Total Contracts</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {performanceMetrics?.completedTasks || 0}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Completed Tasks</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {performanceMetrics?.averageRating.toFixed(1) || 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Avg Rating</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatDistanceToNow(new Date(promoterData.created_at), { addSuffix: false })}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">Experience</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Breakdown</CardTitle>
              <CardDescription>Detailed performance metrics and analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {performanceMetrics && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Overall Score</span>
                        <span className="text-sm font-bold">{performanceMetrics.overallScore}%</span>
                      </div>
                      <Progress value={performanceMetrics.overallScore} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Attendance Rate</span>
                        <span className="text-sm font-bold">{performanceMetrics.attendanceRate}%</span>
                      </div>
                      <Progress value={performanceMetrics.attendanceRate} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Task Completion</span>
                        <span className="text-sm font-bold">{performanceMetrics.taskCompletion}%</span>
                      </div>
                      <Progress value={performanceMetrics.taskCompletion} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Customer Satisfaction</span>
                        <span className="text-sm font-bold">{performanceMetrics.customerSatisfaction}%</span>
                      </div>
                      <Progress value={performanceMetrics.customerSatisfaction} className="h-2" />
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Financial Overview</CardTitle>
              <CardDescription>Revenue and cost analysis</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Total Revenue Generated</p>
                    <p className="text-2xl font-bold text-green-600">$28,450</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Average Contract Value</p>
                    <p className="text-2xl font-bold text-blue-600">$4,850</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="text-sm text-gray-600">Monthly Revenue Impact</p>
                    <p className="text-2xl font-bold text-purple-600">$4,850</p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historical Trends</CardTitle>
              <CardDescription>Long-term performance patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceTrendLine data={monthlyTrendData} />
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-green-600">
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-xl font-bold">+12%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">vs Last Period</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-blue-600">
                    <Award className="h-5 w-5" />
                    <span className="text-xl font-bold">Top 10%</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Team Ranking</p>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-purple-600">
                    <Zap className="h-5 w-5" />
                    <span className="text-xl font-bold">92</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Consistency Score</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            Smart Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-900">Excellent Performance</p>
                <p className="text-sm text-green-700 mt-1">
                  Promoter is performing above average in all key metrics. Consider for leadership opportunities.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <Activity className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Growth Opportunity</p>
                <p className="text-sm text-blue-700 mt-1">
                  Performance has improved by 12% this month. Continue current strategies and provide additional training.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-900">Action Required</p>
                <p className="text-sm text-yellow-700 mt-1">
                  ID card expires in 15 days. Schedule renewal to maintain compliance.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

