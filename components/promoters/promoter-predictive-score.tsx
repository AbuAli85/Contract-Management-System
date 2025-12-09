'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Target,
  Activity,
} from 'lucide-react';

interface PromoterPredictiveScoreProps {
  performanceMetrics?: {
    overallScore: number;
    attendanceRate: number;
    taskCompletion: number;
    customerSatisfaction: number;
    totalTasks: number;
    completedTasks: number;
  };
  contracts?: any[];
  documentsCompliant?: boolean;
  lastActive?: string;
}

interface PredictiveAnalysis {
  score: number;
  trend: 'improving' | 'declining' | 'stable';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  factors: {
    label: string;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }[];
  prediction: string;
}

export function PromoterPredictiveScore({
  performanceMetrics,
  contracts = [],
  documentsCompliant = false,
  lastActive,
}: PromoterPredictiveScoreProps) {
  const analysis = useMemo((): PredictiveAnalysis => {
    const factors: PredictiveAnalysis['factors'] = [];
    let totalScore = 0;
    let totalWeight = 0;

    // Factor 1: Current Performance (30% weight)
    const perfScore = performanceMetrics?.overallScore || 75;
    const perfWeight = 0.3;
    totalScore += perfScore * perfWeight;
    totalWeight += perfWeight;
    factors.push({
      label: 'Current Performance',
      impact:
        perfScore >= 80 ? 'positive' : perfScore >= 60 ? 'neutral' : 'negative',
      weight: perfWeight,
    });

    // Factor 2: Task Completion Trend (20% weight)
    const taskRate = performanceMetrics?.taskCompletion || 80;
    const taskWeight = 0.2;
    totalScore += taskRate * taskWeight;
    totalWeight += taskWeight;
    factors.push({
      label: 'Task Completion Trend',
      impact:
        taskRate >= 85 ? 'positive' : taskRate >= 70 ? 'neutral' : 'negative',
      weight: taskWeight,
    });

    // Factor 3: Contract Activity (20% weight)
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    const contractScore = Math.min(100, (activeContracts / 3) * 100);
    const contractWeight = 0.2;
    totalScore += contractScore * contractWeight;
    totalWeight += contractWeight;
    factors.push({
      label: 'Contract Activity',
      impact:
        activeContracts >= 2
          ? 'positive'
          : activeContracts >= 1
            ? 'neutral'
            : 'negative',
      weight: contractWeight,
    });

    // Factor 4: Compliance Status (15% weight)
    const complianceScore = documentsCompliant ? 100 : 50;
    const complianceWeight = 0.15;
    totalScore += complianceScore * complianceWeight;
    totalWeight += complianceWeight;
    factors.push({
      label: 'Document Compliance',
      impact: documentsCompliant ? 'positive' : 'negative',
      weight: complianceWeight,
    });

    // Factor 5: Engagement (15% weight)
    const daysSinceActive = lastActive
      ? Math.floor(
          (Date.now() - new Date(lastActive).getTime()) / (1000 * 60 * 60 * 24)
        )
      : 7;
    const engagementScore = Math.max(0, 100 - daysSinceActive * 10);
    const engagementWeight = 0.15;
    totalScore += engagementScore * engagementWeight;
    totalWeight += engagementWeight;
    factors.push({
      label: 'Platform Engagement',
      impact:
        daysSinceActive <= 3
          ? 'positive'
          : daysSinceActive <= 7
            ? 'neutral'
            : 'negative',
      weight: engagementWeight,
    });

    // Calculate final score
    const finalScore = Math.round(totalScore / totalWeight);

    // Determine trend based on current vs historical average
    const historicalAvg = 75;
    let trend: PredictiveAnalysis['trend'] = 'stable';
    if (finalScore > historicalAvg + 5) trend = 'improving';
    if (finalScore < historicalAvg - 5) trend = 'declining';

    // Determine risk level
    let riskLevel: PredictiveAnalysis['riskLevel'] = 'low';
    if (finalScore < 60) riskLevel = 'critical';
    else if (finalScore < 70) riskLevel = 'high';
    else if (finalScore < 80) riskLevel = 'medium';

    // Generate prediction
    let prediction = '';
    if (finalScore >= 85) {
      prediction =
        'Excellent trajectory. Likely to exceed targets and maintain high performance.';
    } else if (finalScore >= 70) {
      prediction =
        'Stable performance expected. Monitor for optimization opportunities.';
    } else if (finalScore >= 60) {
      prediction =
        'Performance at risk. Intervention recommended to prevent decline.';
    } else {
      prediction = 'High risk of underperformance. Immediate action required.';
    }

    // Confidence based on data completeness
    const dataCompleteness =
      [
        performanceMetrics !== undefined,
        contracts.length > 0,
        documentsCompliant !== undefined,
        lastActive !== undefined,
      ].filter(Boolean).length / 4;
    const confidence = Math.round(dataCompleteness * 100);

    return {
      score: finalScore,
      trend,
      riskLevel,
      confidence,
      factors,
      prediction,
    };
  }, [performanceMetrics, contracts, documentsCompliant, lastActive]);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'from-green-500 to-emerald-600';
    if (score >= 70) return 'from-blue-500 to-cyan-600';
    if (score >= 60) return 'from-yellow-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getRiskBadge = () => {
    switch (analysis.riskLevel) {
      case 'low':
        return (
          <Badge className='bg-green-500'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Low Risk
          </Badge>
        );
      case 'medium':
        return (
          <Badge className='bg-blue-500'>
            <Activity className='h-3 w-3 mr-1' />
            Medium Risk
          </Badge>
        );
      case 'high':
        return (
          <Badge className='bg-orange-500'>
            <AlertTriangle className='h-3 w-3 mr-1' />
            High Risk
          </Badge>
        );
      case 'critical':
        return (
          <Badge className='bg-red-500'>
            <AlertTriangle className='h-3 w-3 mr-1' />
            Critical Risk
          </Badge>
        );
    }
  };

  const getTrendIcon = () => {
    switch (analysis.trend) {
      case 'improving':
        return <TrendingUp className='h-5 w-5 text-green-600' />;
      case 'declining':
        return <TrendingDown className='h-5 w-5 text-red-600' />;
      case 'stable':
        return <Target className='h-5 w-5 text-blue-600' />;
    }
  };

  return (
    <Card className='border-2 border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50'>
      <CardContent className='p-6'>
        {/* Header */}
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <Zap className='h-5 w-5 text-purple-600' />
            <h3 className='text-sm font-semibold text-purple-900'>
              Predictive Performance Score
            </h3>
          </div>
          {getRiskBadge()}
        </div>

        {/* Circular Score Display */}
        <div className='flex items-center justify-center mb-4'>
          <div className='relative'>
            {/* Outer ring */}
            <svg className='w-32 h-32 transform -rotate-90'>
              <circle
                cx='64'
                cy='64'
                r='56'
                stroke='currentColor'
                strokeWidth='8'
                fill='none'
                className='text-gray-200'
              />
              <circle
                cx='64'
                cy='64'
                r='56'
                stroke='url(#gradient)'
                strokeWidth='8'
                fill='none'
                strokeDasharray={`${(analysis.score / 100) * 352} 352`}
                strokeLinecap='round'
                className='transition-all duration-1000'
              />
              <defs>
                <linearGradient
                  id='gradient'
                  x1='0%'
                  y1='0%'
                  x2='100%'
                  y2='100%'
                >
                  <stop
                    offset='0%'
                    className={`text-purple-500`}
                    stopColor='currentColor'
                  />
                  <stop
                    offset='100%'
                    className={`text-pink-500`}
                    stopColor='currentColor'
                  />
                </linearGradient>
              </defs>
            </svg>

            {/* Score text */}
            <div className='absolute inset-0 flex flex-col items-center justify-center'>
              <div className='text-3xl font-bold text-purple-900'>
                {analysis.score}
              </div>
              <div className='text-xs text-purple-600'>/ 100</div>
            </div>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className='flex items-center justify-center gap-2 mb-4'>
          {getTrendIcon()}
          <span
            className={`text-sm font-medium ${
              analysis.trend === 'improving'
                ? 'text-green-700'
                : analysis.trend === 'declining'
                  ? 'text-red-700'
                  : 'text-blue-700'
            }`}
          >
            {analysis.trend === 'improving'
              ? 'Improving'
              : analysis.trend === 'declining'
                ? 'Declining'
                : 'Stable'}
          </span>
        </div>

        {/* Prediction */}
        <div className='p-3 bg-white rounded-lg border border-purple-200 mb-4'>
          <p className='text-xs font-medium text-purple-900 mb-1'>
            30-Day Forecast
          </p>
          <p className='text-xs text-gray-700'>{analysis.prediction}</p>
        </div>

        {/* Contributing Factors */}
        <div className='space-y-2'>
          <p className='text-xs font-semibold text-purple-900'>
            Contributing Factors
          </p>
          {analysis.factors.map((factor, index) => (
            <div key={index} className='flex items-center gap-2'>
              <div
                className={`h-2 w-2 rounded-full ${
                  factor.impact === 'positive'
                    ? 'bg-green-500'
                    : factor.impact === 'negative'
                      ? 'bg-red-500'
                      : 'bg-gray-400'
                }`}
              />
              <span className='text-xs text-gray-700 flex-1'>
                {factor.label}
              </span>
              <span className='text-xs text-gray-500'>
                {Math.round(factor.weight * 100)}%
              </span>
            </div>
          ))}
        </div>

        {/* Confidence Level */}
        <div className='mt-4 pt-3 border-t border-purple-200'>
          <div className='flex items-center justify-between mb-1'>
            <span className='text-xs text-purple-700'>
              Prediction Confidence
            </span>
            <span className='text-xs font-semibold text-purple-900'>
              {analysis.confidence}%
            </span>
          </div>
          <Progress value={analysis.confidence} className='h-1' />
        </div>
      </CardContent>
    </Card>
  );
}
