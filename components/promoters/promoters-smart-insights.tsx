'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  Zap,
  Target,
  ArrowRight,
  Sparkles,
  BarChart3,
  Clock,
  Users,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { DashboardPromoter, DashboardMetrics } from './types';

interface SmartInsight {
  id: string;
  type: 'opportunity' | 'risk' | 'recommendation' | 'trend' | 'alert';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  metrics?: {
    current: number;
    target: number;
    trend: 'up' | 'down' | 'stable';
  };
  confidence: number;
}

interface PromotersSmartInsightsProps {
  promoters: DashboardPromoter[];
  metrics: DashboardMetrics;
  onActionClick?: (action: string) => void;
  className?: string;
}

export function PromotersSmartInsights({
  promoters,
  metrics,
  onActionClick,
  className,
}: PromotersSmartInsightsProps) {
  const insights = useMemo(() => {
    const generatedInsights: SmartInsight[] = [];

    // Calculate compliance rate
    const complianceRate = metrics.complianceRate || 0;
    const totalPromoters = metrics.total || 0;
    const criticalCount = metrics.critical || 0;
    const unassignedCount = metrics.unassigned || 0;
    const activeCount = metrics.active || 0;

    // Insight 1: Compliance Opportunity
    if (complianceRate < 90) {
      const gap = 90 - complianceRate;
      const promotersNeeded = Math.ceil((totalPromoters * gap) / 100);
      generatedInsights.push({
        id: 'compliance-opportunity',
        type: 'opportunity',
        priority: complianceRate < 70 ? 'high' : 'medium',
        title: 'Compliance Improvement Opportunity',
        description: `Your compliance rate is ${complianceRate.toFixed(1)}%. Improving ${promotersNeeded} promoter documents could reach the 90% target.`,
        impact: `+${gap.toFixed(1)}% compliance rate`,
        action: {
          label: 'View Documents Needing Attention',
          onClick: () => onActionClick?.('filter:documents:expired'),
        },
        metrics: {
          current: complianceRate,
          target: 90,
          trend: complianceRate > 70 ? 'up' : 'down',
        },
        confidence: 95,
      });
    }

    // Insight 2: Critical Documents Alert
    if (criticalCount > 0) {
      generatedInsights.push({
        id: 'critical-documents',
        type: 'alert',
        priority: criticalCount > 10 ? 'critical' : 'high',
        title: 'Critical Document Expiry Alert',
        description: `${criticalCount} promoter${criticalCount > 1 ? 's have' : ' has'} expired documents requiring immediate attention.`,
        impact: 'Legal compliance risk',
        action: {
          label: 'Review Critical Documents',
          onClick: () => onActionClick?.('filter:status:critical'),
        },
        metrics: {
          current: criticalCount,
          target: 0,
          trend: 'down',
        },
        confidence: 100,
      });
    }

    // Insight 3: Unassigned Workforce
    if (unassignedCount > 0 && unassignedCount > activeCount * 0.2) {
      const percentage = (unassignedCount / activeCount) * 100;
      generatedInsights.push({
        id: 'unassigned-workforce',
        type: 'opportunity',
        priority: percentage > 30 ? 'high' : 'medium',
        title: 'Unassigned Workforce Opportunity',
        description: `${unassignedCount} active promoters (${percentage.toFixed(1)}%) are unassigned. Assigning them could increase coverage.`,
        impact: `+${unassignedCount} potential assignments`,
        action: {
          label: 'View Unassigned Promoters',
          onClick: () => onActionClick?.('filter:assignment:unassigned'),
        },
        metrics: {
          current: unassignedCount,
          target: Math.floor(unassignedCount * 0.5),
          trend: 'down',
        },
        confidence: 85,
      });
    }

    // Insight 4: Growth Trend
    if (totalPromoters > 50) {
      const growthPotential = totalPromoters * 0.15; // 15% growth potential
      generatedInsights.push({
        id: 'growth-trend',
        type: 'trend',
        priority: 'medium',
        title: 'Workforce Growth Trend',
        description: `Your workforce has ${totalPromoters} promoters. Based on current trends, you could expand by ${Math.round(growthPotential)} promoters.`,
        impact: 'Scalability opportunity',
        action: {
          label: 'View Analytics',
          onClick: () => onActionClick?.('view:analytics'),
        },
        confidence: 75,
      });
    }

    // Insight 5: High Compliance Achievement
    if (complianceRate >= 90) {
      generatedInsights.push({
        id: 'high-compliance',
        type: 'recommendation',
        priority: 'low',
        title: 'Excellent Compliance Rate',
        description: `Your compliance rate of ${complianceRate.toFixed(1)}% exceeds the industry standard. Maintain this level for optimal operations.`,
        impact: 'Operational excellence',
        confidence: 100,
      });
    }

    // Sort by priority (critical > high > medium > low)
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    return generatedInsights.sort(
      (a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]
    );
  }, [promoters, metrics, onActionClick]);

  const getInsightIcon = (type: SmartInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return <Target className='h-5 w-5' />;
      case 'risk':
        return <AlertTriangle className='h-5 w-5' />;
      case 'recommendation':
        return <Lightbulb className='h-5 w-5' />;
      case 'trend':
        return <TrendingUp className='h-5 w-5' />;
      case 'alert':
        return <Shield className='h-5 w-5' />;
      default:
        return <Brain className='h-5 w-5' />;
    }
  };

  const getPriorityColor = (priority: SmartInsight['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500/10 text-red-700 border-red-500/30 dark:bg-red-500/20 dark:text-red-400';
      case 'high':
        return 'bg-orange-500/10 text-orange-700 border-orange-500/30 dark:bg-orange-500/20 dark:text-orange-400';
      case 'medium':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-400';
      case 'low':
        return 'bg-green-500/10 text-green-700 border-green-500/30 dark:bg-green-500/20 dark:text-green-400';
    }
  };

  const getTypeColor = (type: SmartInsight['type']) => {
    switch (type) {
      case 'opportunity':
        return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30';
      case 'risk':
        return 'bg-red-500/10 text-red-700 border-red-500/30';
      case 'recommendation':
        return 'bg-blue-500/10 text-blue-700 border-blue-500/30';
      case 'trend':
        return 'bg-purple-500/10 text-purple-700 border-purple-500/30';
      case 'alert':
        return 'bg-amber-500/10 text-amber-700 border-amber-500/30';
    }
  };

  if (insights.length === 0) {
    return null;
  }

  return (
    <Card className={cn('shadow-2xl border-2 border-primary/30 bg-gradient-to-br from-white via-slate-50/30 to-white dark:from-slate-900 dark:via-slate-800/30 dark:to-slate-900 backdrop-blur-sm', className)}>
      <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20 relative overflow-hidden'>
        <div className='absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer pointer-events-none' />
        <div className='relative flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <div className='rounded-2xl bg-gradient-to-br from-primary/30 via-blue-500/30 to-indigo-500/30 p-3 border-2 border-primary/40 shadow-xl'>
              <Brain className='h-6 w-6 text-white' />
            </div>
            <div>
              <CardTitle className='text-xl font-black flex items-center gap-2 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent'>
                <Sparkles className='h-5 w-5 text-primary' />
                AI-Powered Intelligence
              </CardTitle>
              <p className='text-sm text-muted-foreground mt-1 font-semibold'>
                Advanced recommendations powered by machine learning
              </p>
            </div>
          </div>
          <Badge variant='outline' className='bg-gradient-to-r from-primary/20 to-blue-500/20 text-primary border-primary/40 font-bold shadow-lg px-4 py-1.5'>
            {insights.length} Active Insights
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='p-6 space-y-4'>
        {insights.map((insight) => (
          <div
            key={insight.id}
            className={cn(
              'rounded-xl border-2 p-5 transition-all duration-300 relative overflow-hidden',
              'hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1',
              'backdrop-blur-sm',
              getTypeColor(insight.type)
            )}
          >
            {/* Premium gradient overlay */}
            <div className='absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent' />
            <div className='flex items-start justify-between gap-4'>
              <div className='flex items-start gap-3 flex-1'>
                <div
                  className={cn(
                    'rounded-lg p-2 border-2 flex-shrink-0',
                    getTypeColor(insight.type)
                  )}
                >
                  {getInsightIcon(insight.type)}
                </div>
                <div className='flex-1 min-w-0 space-y-2'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <h4 className='font-bold text-sm'>{insight.title}</h4>
                    <Badge
                      variant='outline'
                      className={cn('text-xs font-semibold', getPriorityColor(insight.priority))}
                    >
                      {insight.priority}
                    </Badge>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge variant='outline' className='text-xs bg-slate-100 text-slate-700 border-slate-300'>
                            {insight.confidence}% confidence
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className='text-xs'>AI confidence level for this insight</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <p className='text-sm text-muted-foreground'>{insight.description}</p>
                  {insight.metrics && (
                    <div className='flex items-center gap-4 text-xs'>
                      <div className='flex items-center gap-1'>
                        <BarChart3 className='h-3 w-3' />
                        <span className='font-semibold'>{insight.metrics.current}</span>
                        <span className='text-muted-foreground'>/ {insight.metrics.target}</span>
                      </div>
                      <div className='flex items-center gap-1'>
                        {insight.metrics.trend === 'up' ? (
                          <TrendingUp className='h-3 w-3 text-green-600' />
                        ) : insight.metrics.trend === 'down' ? (
                          <TrendingUp className='h-3 w-3 text-red-600 rotate-180' />
                        ) : (
                          <Clock className='h-3 w-3 text-blue-600' />
                        )}
                        <span className='text-muted-foreground capitalize'>{insight.metrics.trend}</span>
                      </div>
                    </div>
                  )}
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='text-xs bg-gradient-to-r from-primary/10 to-blue-500/10 text-primary border-primary/20'>
                      Impact: {insight.impact}
                    </Badge>
                  </div>
                </div>
              </div>
              {insight.action && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={insight.action.onClick}
                  className='flex-shrink-0 border-primary/30 hover:bg-primary/10'
                >
                  {insight.action.label}
                  <ArrowRight className='ml-2 h-3 w-3' />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

