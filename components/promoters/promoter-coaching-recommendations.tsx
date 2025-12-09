'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  BookOpen,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface PromoterCoachingRecommendationsProps {
  performanceMetrics?: {
    overallScore: number;
    attendanceRate: number;
    taskCompletion: number;
    customerSatisfaction: number;
    totalTasks: number;
    completedTasks: number;
    pendingTasks: number;
    overdueTasks: number;
  };
  contracts?: any[];
  isAdmin: boolean;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'performance' | 'engagement' | 'development' | 'support';
  action: string;
  icon: React.ReactNode;
  expectedImpact: string;
  aiGenerated: boolean;
}

export function PromoterCoachingRecommendations({
  performanceMetrics,
  contracts = [],
  isAdmin,
}: PromoterCoachingRecommendationsProps) {
  const recommendations = useMemo((): Recommendation[] => {
    const recs: Recommendation[] = [];
    const metrics = performanceMetrics || {
      overallScore: 75,
      attendanceRate: 90,
      taskCompletion: 85,
      customerSatisfaction: 88,
      totalTasks: 10,
      completedTasks: 8,
      pendingTasks: 2,
      overdueTasks: 0,
    };

    // Recommendation 1: Low Task Completion
    if (metrics.taskCompletion < 80) {
      recs.push({
        id: 'task-completion-low',
        title: 'Improve Task Completion Rate',
        description: `Current task completion at ${metrics.taskCompletion}%. Focus on time management and prioritization strategies.`,
        priority: 'high',
        category: 'performance',
        action: 'Schedule 1:1 coaching session',
        icon: <Target className='h-5 w-5' />,
        expectedImpact: '+15% task completion in 30 days',
        aiGenerated: true,
      });
    }

    // Recommendation 2: Attendance Issues
    if (metrics.attendanceRate < 90) {
      recs.push({
        id: 'attendance-improvement',
        title: 'Address Attendance Concerns',
        description: `Attendance at ${metrics.attendanceRate}% is below target. Discuss barriers and flexible scheduling options.`,
        priority: 'high',
        category: 'engagement',
        action: 'Review attendance patterns',
        icon: <Calendar className='h-5 w-5' />,
        expectedImpact: 'Identify root causes, improve retention',
        aiGenerated: true,
      });
    }

    // Recommendation 3: Customer Satisfaction Optimization
    if (
      metrics.customerSatisfaction < 90 &&
      metrics.customerSatisfaction >= 80
    ) {
      recs.push({
        id: 'customer-satisfaction',
        title: 'Enhance Customer Experience',
        description: `Good customer satisfaction at ${metrics.customerSatisfaction}%. Additional training can push to excellence.`,
        priority: 'medium',
        category: 'development',
        action: 'Enroll in advanced customer service workshop',
        icon: <Users className='h-5 w-5' />,
        expectedImpact: '+10% customer satisfaction score',
        aiGenerated: true,
      });
    }

    // Recommendation 4: Overdue Tasks
    if (metrics.overdueTasks > 0) {
      recs.push({
        id: 'overdue-tasks',
        title: 'Clear Overdue Task Backlog',
        description: `${metrics.overdueTasks} overdue task${metrics.overdueTasks > 1 ? 's' : ''}. Immediate action needed to prevent performance impact.`,
        priority: 'high',
        category: 'support',
        action: 'Provide additional resources or delegate',
        icon: <AlertCircle className='h-5 w-5' />,
        expectedImpact: 'Reduce stress, improve productivity',
        aiGenerated: true,
      });
    }

    // Recommendation 5: High Performer Recognition
    if (metrics.overallScore >= 90) {
      recs.push({
        id: 'recognition',
        title: 'Recognize Top Performance',
        description: `Exceptional performance at ${metrics.overallScore}%. Consider for Employee of the Month nomination.`,
        priority: 'medium',
        category: 'engagement',
        action: 'Nominate for recognition program',
        icon: <Award className='h-5 w-5' />,
        expectedImpact: 'Boost morale, retention',
        aiGenerated: true,
      });
    }

    // Recommendation 6: Contract Activity
    const activeContracts = contracts.filter(c => c.status === 'active').length;
    if (activeContracts === 0) {
      recs.push({
        id: 'contract-pipeline',
        title: 'Build Contract Pipeline',
        description:
          'No active contracts. Assign new leads or review sales process.',
        priority: 'high',
        category: 'performance',
        action: 'Assign high-potential leads',
        icon: <TrendingUp className='h-5 w-5' />,
        expectedImpact: 'Increase revenue opportunity',
        aiGenerated: true,
      });
    } else if (activeContracts >= 3) {
      recs.push({
        id: 'capacity-management',
        title: 'Manage Workload Capacity',
        description: `Currently managing ${activeContracts} active contracts. Monitor for burnout and provide support.`,
        priority: 'medium',
        category: 'support',
        action: 'Check workload balance in next 1:1',
        icon: <Users className='h-5 w-5' />,
        expectedImpact: 'Prevent burnout, sustain performance',
        aiGenerated: true,
      });
    }

    // Recommendation 7: Skill Development
    if (metrics.overallScore >= 70 && metrics.overallScore < 85) {
      recs.push({
        id: 'skill-development',
        title: 'Invest in Skill Development',
        description:
          'Solid foundation with room for growth. Target specific skills to reach next performance tier.',
        priority: 'medium',
        category: 'development',
        action: 'Create personalized learning plan',
        icon: <BookOpen className='h-5 w-5' />,
        expectedImpact: '+10-15 point performance increase',
        aiGenerated: true,
      });
    }

    // Sort by priority
    return recs.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }, [performanceMetrics, contracts]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'performance':
        return 'text-blue-600';
      case 'engagement':
        return 'text-purple-600';
      case 'development':
        return 'text-green-600';
      case 'support':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <Card className='border-2 border-purple-100'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Lightbulb className='h-5 w-5 text-purple-600' />
          AI Coaching Recommendations
          <Badge
            variant='outline'
            className='ml-2 bg-purple-100 text-purple-700'
          >
            <Sparkles className='h-3 w-3 mr-1' />
            {recommendations.length} insights
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className='text-center py-8'>
            <CheckCircle className='h-12 w-12 mx-auto text-green-500 mb-3' />
            <p className='text-sm font-medium text-gray-900'>
              All Systems Optimal
            </p>
            <p className='text-xs text-gray-500 mt-1'>
              No immediate coaching recommendations. Continue current
              strategies.
            </p>
          </div>
        ) : (
          <div className='space-y-3'>
            {recommendations.map(rec => (
              <div
                key={rec.id}
                className='p-4 border-2 rounded-lg hover:shadow-md transition-all bg-white'
              >
                <div className='flex items-start gap-3'>
                  <div
                    className={`p-2 rounded-lg ${getPriorityColor(rec.priority)}`}
                  >
                    {rec.icon}
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2 mb-2'>
                      <div>
                        <h4 className='text-sm font-semibold text-gray-900'>
                          {rec.title}
                        </h4>
                        <div className='flex items-center gap-2 mt-1'>
                          <Badge
                            variant='outline'
                            className={getPriorityColor(rec.priority)}
                          >
                            {rec.priority} priority
                          </Badge>
                          <span
                            className={`text-xs font-medium ${getCategoryColor(rec.category)}`}
                          >
                            {rec.category}
                          </span>
                          {rec.aiGenerated && (
                            <Badge
                              variant='outline'
                              className='bg-purple-50 text-purple-700 text-xs'
                            >
                              <Sparkles className='h-2 w-2 mr-1' />
                              AI
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className='text-sm text-gray-700 mb-3'>
                      {rec.description}
                    </p>

                    <div className='flex items-center justify-between gap-3'>
                      <div className='flex-1'>
                        <p className='text-xs text-gray-500 mb-1'>
                          Expected Impact
                        </p>
                        <p className='text-xs font-medium text-green-700'>
                          {rec.expectedImpact}
                        </p>
                      </div>
                      <Button
                        size='sm'
                        variant='outline'
                        className='flex items-center gap-1'
                      >
                        {rec.action}
                        <ArrowRight className='h-3 w-3' />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        <div className='mt-4 pt-4 border-t'>
          <div className='flex items-center justify-between text-xs text-gray-600'>
            <span>
              {recommendations.filter(r => r.priority === 'high').length} high
              priority •{' '}
              {recommendations.filter(r => r.priority === 'medium').length}{' '}
              medium priority
            </span>
            <Button variant='link' size='sm' className='text-xs'>
              Export Coaching Plan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
