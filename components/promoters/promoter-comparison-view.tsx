'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Award,
  Target,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
  Star,
  CheckCircle,
  Activity,
  Zap
} from 'lucide-react';

interface PerformanceMetrics {
  overallScore: number;
  attendanceRate: number;
  taskCompletion: number;
  customerSatisfaction: number;
  responseTime: number;
  totalTasks: number;
  completedTasks: number;
  averageRating: number;
}

interface PromoterComparisonViewProps {
  promoterMetrics: PerformanceMetrics;
  promoterName: string;
}

interface ComparisonMetric {
  id: string;
  label: string;
  promoterValue: number;
  teamAverage: number;
  topPerformer: number;
  unit: string;
  icon: React.ReactNode;
  higherIsBetter: boolean;
  category: 'performance' | 'quality' | 'efficiency' | 'engagement';
}

export function PromoterComparisonView({
  promoterMetrics,
  promoterName
}: PromoterComparisonViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | ComparisonMetric['category']>('all');
  const [comparisonType, setComparisonType] = useState<'team' | 'top' | 'both'>('both');

  // Generate team benchmarks (in production, this would come from API)
  const teamBenchmarks = useMemo(() => ({
    overallScore: 75,
    attendanceRate: 88,
    taskCompletion: 82,
    customerSatisfaction: 85,
    responseTime: 3.2,
    totalTasks: 18,
    completedTasks: 15,
    averageRating: 4.0
  }), []);

  const topPerformerBenchmarks = useMemo(() => ({
    overallScore: 95,
    attendanceRate: 98,
    taskCompletion: 96,
    customerSatisfaction: 96,
    responseTime: 1.5,
    totalTasks: 28,
    completedTasks: 27,
    averageRating: 4.8
  }), []);

  const comparisonMetrics: ComparisonMetric[] = [
    {
      id: 'overall',
      label: 'Overall Performance Score',
      promoterValue: promoterMetrics.overallScore,
      teamAverage: teamBenchmarks.overallScore,
      topPerformer: topPerformerBenchmarks.overallScore,
      unit: '%',
      icon: <Target className="h-5 w-5" />,
      higherIsBetter: true,
      category: 'performance'
    },
    {
      id: 'attendance',
      label: 'Attendance Rate',
      promoterValue: promoterMetrics.attendanceRate,
      teamAverage: teamBenchmarks.attendanceRate,
      topPerformer: topPerformerBenchmarks.attendanceRate,
      unit: '%',
      icon: <CheckCircle className="h-5 w-5" />,
      higherIsBetter: true,
      category: 'performance'
    },
    {
      id: 'taskCompletion',
      label: 'Task Completion Rate',
      promoterValue: promoterMetrics.taskCompletion,
      teamAverage: teamBenchmarks.taskCompletion,
      topPerformer: topPerformerBenchmarks.taskCompletion,
      unit: '%',
      icon: <Activity className="h-5 w-5" />,
      higherIsBetter: true,
      category: 'efficiency'
    },
    {
      id: 'satisfaction',
      label: 'Customer Satisfaction',
      promoterValue: promoterMetrics.customerSatisfaction,
      teamAverage: teamBenchmarks.customerSatisfaction,
      topPerformer: topPerformerBenchmarks.customerSatisfaction,
      unit: '%',
      icon: <Star className="h-5 w-5" />,
      higherIsBetter: true,
      category: 'quality'
    },
    {
      id: 'responseTime',
      label: 'Average Response Time',
      promoterValue: promoterMetrics.responseTime,
      teamAverage: teamBenchmarks.responseTime,
      topPerformer: topPerformerBenchmarks.responseTime,
      unit: 'h',
      icon: <Zap className="h-5 w-5" />,
      higherIsBetter: false,
      category: 'efficiency'
    },
    {
      id: 'rating',
      label: 'Average Rating',
      promoterValue: promoterMetrics.averageRating,
      teamAverage: teamBenchmarks.averageRating,
      topPerformer: topPerformerBenchmarks.averageRating,
      unit: '/5',
      icon: <Star className="h-5 w-5" />,
      higherIsBetter: true,
      category: 'quality'
    }
  ];

  const filteredMetrics = comparisonMetrics.filter(metric => 
    selectedCategory === 'all' || metric.category === selectedCategory
  );

  const getPerformanceLevel = (value: number, teamAvg: number, topPerf: number, higherIsBetter: boolean) => {
    if (higherIsBetter) {
      if (value >= topPerf * 0.95) return 'top';
      if (value >= teamAvg) return 'above-average';
      if (value >= teamAvg * 0.85) return 'average';
      return 'below-average';
    } else {
      if (value <= topPerf * 1.1) return 'top';
      if (value <= teamAvg) return 'above-average';
      if (value <= teamAvg * 1.15) return 'average';
      return 'below-average';
    }
  };

  const getPerformanceBadge = (level: string) => {
    switch (level) {
      case 'top':
        return <Badge className="bg-purple-500"><Award className="h-3 w-3 mr-1" />Top Performer</Badge>;
      case 'above-average':
        return <Badge className="bg-green-500"><TrendingUp className="h-3 w-3 mr-1" />Above Average</Badge>;
      case 'average':
        return <Badge className="bg-blue-500">Average</Badge>;
      case 'below-average':
        return <Badge className="bg-orange-500"><TrendingDown className="h-3 w-3 mr-1" />Below Average</Badge>;
    }
  };

  const calculateDifference = (value: number, benchmark: number, higherIsBetter: boolean) => {
    const diff = value - benchmark;
    const percentage = ((Math.abs(diff) / benchmark) * 100).toFixed(1);
    const isPositive = higherIsBetter ? diff > 0 : diff < 0;
    
    return {
      value: diff,
      percentage,
      isPositive,
      icon: diff > 0 ? <ArrowUp className="h-3 w-3" /> : diff < 0 ? <ArrowDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />
    };
  };

  const overallRanking = useMemo(() => {
    const totalMetrics = comparisonMetrics.length;
    const topCount = comparisonMetrics.filter(m => 
      getPerformanceLevel(m.promoterValue, m.teamAverage, m.topPerformer, m.higherIsBetter) === 'top'
    ).length;
    const aboveAvgCount = comparisonMetrics.filter(m => 
      getPerformanceLevel(m.promoterValue, m.teamAverage, m.topPerformer, m.higherIsBetter) === 'above-average'
    ).length;

    const score = ((topCount * 2 + aboveAvgCount) / (totalMetrics * 2)) * 100;
    
    return {
      percentile: Math.min(95, Math.max(5, Math.round(score))),
      rank: score >= 90 ? 'Top 10%' : score >= 75 ? 'Top 25%' : score >= 50 ? 'Top 50%' : 'Bottom 50%',
      color: score >= 90 ? 'text-purple-600' : score >= 75 ? 'text-green-600' : score >= 50 ? 'text-blue-600' : 'text-orange-600',
      bgColor: score >= 90 ? 'bg-purple-100' : score >= 75 ? 'bg-green-100' : score >= 50 ? 'bg-blue-100' : 'bg-orange-100'
    };
  }, [comparisonMetrics]);

  return (
    <div className="space-y-6">
      {/* Overall Ranking Card */}
      <Card className={`border-2 ${overallRanking.bgColor} border-opacity-50`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-full ${overallRanking.bgColor}`}>
                <Award className={`h-8 w-8 ${overallRanking.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Overall Team Ranking</p>
                <h3 className={`text-3xl font-bold ${overallRanking.color}`}>
                  {overallRanking.rank}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {promoterName} ranks in the {overallRanking.percentile}th percentile
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {comparisonMetrics.filter(m => 
                    getPerformanceLevel(m.promoterValue, m.teamAverage, m.topPerformer, m.higherIsBetter) === 'above-average' ||
                    getPerformanceLevel(m.promoterValue, m.teamAverage, m.topPerformer, m.higherIsBetter) === 'top'
                  ).length} Strong Areas
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-orange-100 text-orange-700">
                  <Target className="h-3 w-3 mr-1" />
                  {comparisonMetrics.filter(m => 
                    getPerformanceLevel(m.promoterValue, m.teamAverage, m.topPerformer, m.higherIsBetter) === 'below-average'
                  ).length} Improvement Areas
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-700 self-center mr-2">Category:</span>
            {(['all', 'performance', 'quality', 'efficiency', 'engagement'] as const).map((cat) => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <span className="text-sm font-medium text-gray-700 self-center mr-2">Compare to:</span>
          {(['team', 'top', 'both'] as const).map((type) => (
            <Button
              key={type}
              variant={comparisonType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setComparisonType(type)}
            >
              {type === 'team' ? 'Team Avg' : type === 'top' ? 'Top Performer' : 'Both'}
            </Button>
          ))}
        </div>
      </div>

      {/* Comparison Metrics */}
      <div className="grid grid-cols-1 gap-4">
        {filteredMetrics.map((metric) => {
          const performanceLevel = getPerformanceLevel(
            metric.promoterValue,
            metric.teamAverage,
            metric.topPerformer,
            metric.higherIsBetter
          );
          const teamDiff = calculateDifference(metric.promoterValue, metric.teamAverage, metric.higherIsBetter);
          const topDiff = calculateDifference(metric.promoterValue, metric.topPerformer, metric.higherIsBetter);

          return (
            <Card key={metric.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                      {metric.icon}
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm">{metric.label}</h4>
                      <div className="mt-1">
                        {getPerformanceBadge(performanceLevel)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {metric.promoterValue}{metric.unit}
                    </div>
                    <p className="text-xs text-gray-500">Current Value</p>
                  </div>
                </div>

                {/* Visual Comparison Bar */}
                <div className="relative h-12 bg-gray-100 rounded-lg mb-4 overflow-hidden">
                  {/* Team Average Marker */}
                  {(comparisonType === 'team' || comparisonType === 'both') && (
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-blue-400"
                      style={{ left: `${(metric.teamAverage / Math.max(metric.topPerformer, metric.promoterValue, metric.teamAverage)) * 100}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-blue-600 whitespace-nowrap">
                        Team: {metric.teamAverage}{metric.unit}
                      </div>
                    </div>
                  )}

                  {/* Top Performer Marker */}
                  {(comparisonType === 'top' || comparisonType === 'both') && (
                    <div
                      className="absolute top-0 bottom-0 w-1 bg-purple-400"
                      style={{ left: `${(metric.topPerformer / Math.max(metric.topPerformer, metric.promoterValue, metric.teamAverage)) * 100}%` }}
                    >
                      <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs font-medium text-purple-600 whitespace-nowrap">
                        Top: {metric.topPerformer}{metric.unit}
                      </div>
                    </div>
                  )}

                  {/* Promoter Value Bar */}
                  <div
                    className={`absolute top-0 bottom-0 ${
                      performanceLevel === 'top' ? 'bg-purple-500' :
                      performanceLevel === 'above-average' ? 'bg-green-500' :
                      performanceLevel === 'average' ? 'bg-blue-500' :
                      'bg-orange-500'
                    } flex items-center justify-end px-3`}
                    style={{ width: `${(metric.promoterValue / Math.max(metric.topPerformer, metric.promoterValue, metric.teamAverage)) * 100}%` }}
                  >
                    <span className="text-xs font-medium text-white">
                      {metric.promoterValue}{metric.unit}
                    </span>
                  </div>
                </div>

                {/* Difference Indicators */}
                <div className="grid grid-cols-2 gap-4">
                  {(comparisonType === 'team' || comparisonType === 'both') && (
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${teamDiff.isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className={`${teamDiff.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {teamDiff.icon}
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">vs Team Average</p>
                        <p className={`text-sm font-semibold ${teamDiff.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {teamDiff.isPositive ? '+' : ''}{teamDiff.percentage}%
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {(comparisonType === 'top' || comparisonType === 'both') && (
                    <div className={`flex items-center gap-2 p-2 rounded-lg ${topDiff.isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                      <div className={`${topDiff.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {topDiff.icon}
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">vs Top Performer</p>
                        <p className={`text-sm font-semibold ${topDiff.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {topDiff.isPositive ? '+' : ''}{topDiff.percentage}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {comparisonMetrics
            .filter(m => getPerformanceLevel(m.promoterValue, m.teamAverage, m.topPerformer, m.higherIsBetter) === 'top')
            .slice(0, 2)
            .map(m => (
              <div key={m.id} className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Strength: {m.label}</p>
                  <p className="text-sm text-green-700 mt-1">
                    Performing at top tier level ({m.promoterValue}{m.unit}). Continue current strategies.
                  </p>
                </div>
              </div>
            ))
          }
          
          {comparisonMetrics
            .filter(m => getPerformanceLevel(m.promoterValue, m.teamAverage, m.topPerformer, m.higherIsBetter) === 'below-average')
            .slice(0, 2)
            .map(m => (
              <div key={m.id} className="flex items-start gap-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <Target className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900">Growth Area: {m.label}</p>
                  <p className="text-sm text-orange-700 mt-1">
                    Below team average ({m.promoterValue}{m.unit} vs {m.teamAverage}{m.unit}). Consider additional training or support.
                  </p>
                </div>
              </div>
            ))
          }
        </CardContent>
      </Card>
    </div>
  );
}

