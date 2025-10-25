'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  AlertTriangle, 
  CheckCircle, 
  Target,
  Lightbulb,
  ArrowRight,
  Users,
  Calendar,
  Shield,
  Building2,
  Zap,
  Award
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DashboardPromoter } from './types';

interface AnalyticsInsightsPanelProps {
  promoters: DashboardPromoter[];
  className?: string;
}

interface Insight {
  id: string;
  type: 'success' | 'warning' | 'critical' | 'info';
  icon: React.ReactNode;
  title: string;
  description: string;
  value?: string;
  trend?: 'up' | 'down' | 'stable';
  action?: {
    label: string;
    onClick: () => void;
  };
  priority: 'high' | 'medium' | 'low';
}

export function AnalyticsInsightsPanel({ promoters, className }: AnalyticsInsightsPanelProps) {
  
  const insights = useMemo((): Insight[] => {
    const total = promoters.length;
    const now = new Date();
    
    // Calculate key metrics
    const active = promoters.filter(p => p.overallStatus === 'active').length;
    const critical = promoters.filter(p => p.overallStatus === 'critical').length;
    const expiredDocs = promoters.filter(p => 
      p.idDocument.status === 'expired' || p.passportDocument.status === 'expired'
    ).length;
    const expiringDocs = promoters.filter(p => 
      p.idDocument.status === 'expiring' || p.passportDocument.status === 'expiring'
    ).length;
    const unassigned = promoters.filter(p => p.assignmentStatus === 'unassigned').length;
    
    // Calculate trends (mock data - in real app, compare with historical data)
    const activeRate = total > 0 ? (active / total) * 100 : 0;
    const complianceRate = total > 0 ? ((total - expiredDocs) / total) * 100 : 0;
    const assignmentRate = total > 0 ? ((total - unassigned) / total) * 100 : 0;
    
    const generatedInsights: Insight[] = [];

    // High Priority Insights
    if (critical > 0) {
      generatedInsights.push({
        id: 'critical-status',
        type: 'critical',
        icon: <AlertTriangle className="h-5 w-5" />,
        title: 'Critical Status Members',
        description: `${critical} workforce members require immediate attention due to critical status issues.`,
        value: `${critical} members`,
        priority: 'high',
        action: {
          label: 'Review Critical Cases',
          onClick: () => console.log('Navigate to critical cases')
        }
      });
    }

    if (expiredDocs > 0) {
      generatedInsights.push({
        id: 'expired-documents',
        type: 'critical',
        icon: <Shield className="h-5 w-5" />,
        title: 'Expired Documents Alert',
        description: `${expiredDocs} workforce members have expired identification documents that need immediate renewal.`,
        value: `${expiredDocs} expired`,
        priority: 'high',
        action: {
          label: 'View Document Status',
          onClick: () => console.log('Navigate to document management')
        }
      });
    }

    // Medium Priority Insights
    if (expiringDocs > 0) {
      generatedInsights.push({
        id: 'expiring-documents',
        type: 'warning',
        icon: <Calendar className="h-5 w-5" />,
        title: 'Documents Expiring Soon',
        description: `${expiringDocs} workforce members have documents expiring within the next 30 days.`,
        value: `${expiringDocs} expiring`,
        priority: 'medium',
        action: {
          label: 'Schedule Renewals',
          onClick: () => console.log('Navigate to renewal scheduling')
        }
      });
    }

    if (unassigned > 0) {
      generatedInsights.push({
        id: 'unassigned-members',
        type: 'warning',
        icon: <Building2 className="h-5 w-5" />,
        title: 'Unassigned Workforce',
        description: `${unassigned} qualified members are not currently assigned to any company or project.`,
        value: `${unassigned} unassigned`,
        priority: 'medium',
        action: {
          label: 'Assign to Companies',
          onClick: () => console.log('Navigate to assignment management')
        }
      });
    }

    // Positive Insights
    if (activeRate >= 85) {
      generatedInsights.push({
        id: 'high-activity',
        type: 'success',
        icon: <CheckCircle className="h-5 w-5" />,
        title: 'Excellent Activity Rate',
        description: `${activeRate.toFixed(1)}% of your workforce is currently active, which is above the industry standard of 80%.`,
        value: `${activeRate.toFixed(1)}%`,
        trend: 'up',
        priority: 'low'
      });
    }

    if (complianceRate >= 90) {
      generatedInsights.push({
        id: 'high-compliance',
        type: 'success',
        icon: <Award className="h-5 w-5" />,
        title: 'Strong Compliance Rate',
        description: `${complianceRate.toFixed(1)}% document compliance rate demonstrates excellent workforce management.`,
        value: `${complianceRate.toFixed(1)}%`,
        trend: 'up',
        priority: 'low'
      });
    }

    // Smart Recommendations
    if (assignmentRate < 70) {
      generatedInsights.push({
        id: 'assignment-optimization',
        type: 'info',
        icon: <Lightbulb className="h-5 w-5" />,
        title: 'Assignment Optimization',
        description: `Consider reviewing assignment strategies to improve the ${assignmentRate.toFixed(1)}% assignment rate.`,
        value: 'Opportunity',
        priority: 'medium',
        action: {
          label: 'View Recommendations',
          onClick: () => console.log('Show assignment recommendations')
        }
      });
    }

    // Diversity Insight
    const countries = new Set(promoters.map(p => p.nationality).filter(Boolean)).size;
    if (countries >= 5) {
      generatedInsights.push({
        id: 'workforce-diversity',
        type: 'info',
        icon: <Users className="h-5 w-5" />,
        title: 'Diverse Workforce',
        description: `Your workforce represents ${countries} different nationalities, promoting cultural diversity and global perspectives.`,
        value: `${countries} countries`,
        priority: 'low'
      });
    }

    return generatedInsights.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [promoters]);

  const getInsightStyle = (type: Insight['type']) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20';
      case 'warning':
        return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20';
      case 'success':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20';
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20';
      default:
        return 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800';
    }
  };

  const getIconColor = (type: Insight['type']) => {
    switch (type) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-amber-600 dark:text-amber-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'info':
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getTrendIcon = (trend?: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const highPriorityInsights = insights.filter(i => i.priority === 'high');
  const otherInsights = insights.filter(i => i.priority !== 'high');

  return (
    <div className={cn("space-y-6", className)}>
      <Card className="shadow-lg border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-500" />
            Smart Insights & Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered workforce analytics insights based on real-time data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* High Priority Alerts */}
          {highPriorityInsights.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                Immediate Attention Required
              </h4>
              {highPriorityInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    "p-4 rounded-lg border-l-4 border-l-red-500",
                    getInsightStyle(insight.type)
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className={cn("mt-0.5", getIconColor(insight.type))}>
                        {insight.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-sm">{insight.title}</h5>
                          {insight.value && (
                            <Badge variant="outline" className="text-xs">
                              {insight.value}
                            </Badge>
                          )}
                          {getTrendIcon(insight.trend)}
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                    {insight.action && (
                      <Button
                        size="sm"
                        onClick={insight.action.onClick}
                        className="ml-4 gap-2"
                      >
                        {insight.action.label}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Other Insights */}
          {otherInsights.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Performance Insights
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {otherInsights.map((insight) => (
                  <div
                    key={insight.id}
                    className={cn(
                      "p-4 rounded-lg border",
                      getInsightStyle(insight.type)
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5", getIconColor(insight.type))}>
                        {insight.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-semibold text-sm">{insight.title}</h5>
                          {insight.value && (
                            <Badge variant="outline" className="text-xs">
                              {insight.value}
                            </Badge>
                          )}
                          {getTrendIcon(insight.trend)}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          {insight.description}
                        </p>
                        {insight.action && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={insight.action.onClick}
                            className="mt-2 h-7 px-2 gap-1 text-xs"
                          >
                            {insight.action.label}
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {insights.length === 0 && (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <h4 className="font-semibold text-slate-700 dark:text-slate-300">
                All Systems Optimal
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Your workforce analytics show no immediate concerns or recommendations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
