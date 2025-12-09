'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Award,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Flag,
  BarChart3,
  Clock,
  Zap,
  Star,
  Trophy,
} from 'lucide-react';
import { format, differenceInDays, isPast, addDays } from 'date-fns';

interface KPI {
  id: string;
  name: string;
  description: string;
  category: 'performance' | 'quality' | 'efficiency' | 'growth' | 'custom';
  currentValue: number;
  targetValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'on-track' | 'at-risk' | 'off-track' | 'achieved';
  milestones: Milestone[];
  history: HistoryPoint[];
}

interface Milestone {
  id: string;
  name: string;
  targetValue: number;
  targetDate: string;
  isAchieved: boolean;
  achievedDate?: string;
}

interface HistoryPoint {
  date: string;
  value: number;
  note?: string;
}

interface PromoterKPITrackerProps {
  promoterId: string;
  isAdmin: boolean;
}

export function PromoterKPITracker({
  promoterId,
  isAdmin,
}: PromoterKPITrackerProps) {
  const [kpis, setKpis] = useState<KPI[]>(getInitialKPIs());
  const [showAddKPI, setShowAddKPI] = useState(false);
  const [editingKPI, setEditingKPI] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | KPI['category']
  >('all');

  function getInitialKPIs(): KPI[] {
    const today = new Date();
    return [
      {
        id: '1',
        name: 'Monthly Revenue Target',
        description: 'Generate $5,000 in monthly revenue',
        category: 'performance',
        currentValue: 3850,
        targetValue: 5000,
        unit: '$',
        startDate: new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        ).toISOString(),
        targetDate: new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        ).toISOString(),
        priority: 'high',
        status: 'on-track',
        milestones: [
          {
            id: 'm1',
            name: 'First Quarter',
            targetValue: 1250,
            targetDate: addDays(new Date(), -15).toISOString(),
            isAchieved: true,
            achievedDate: addDays(new Date(), -14).toISOString(),
          },
          {
            id: 'm2',
            name: 'Mid-Month',
            targetValue: 2500,
            targetDate: addDays(new Date(), -5).toISOString(),
            isAchieved: true,
            achievedDate: addDays(new Date(), -3).toISOString(),
          },
          {
            id: 'm3',
            name: 'Three Quarters',
            targetValue: 3750,
            targetDate: addDays(new Date(), 5).toISOString(),
            isAchieved: false,
          },
          {
            id: 'm4',
            name: 'Month End',
            targetValue: 5000,
            targetDate: addDays(new Date(), 15).toISOString(),
            isAchieved: false,
          },
        ],
        history: [
          { date: addDays(today, -20).toISOString(), value: 800 },
          { date: addDays(today, -15).toISOString(), value: 1500 },
          { date: addDays(today, -10).toISOString(), value: 2200 },
          { date: addDays(today, -5).toISOString(), value: 2900 },
          { date: today.toISOString(), value: 3850 },
        ],
      },
      {
        id: '2',
        name: 'Customer Satisfaction Score',
        description: 'Achieve 95% customer satisfaction rating',
        category: 'quality',
        currentValue: 88,
        targetValue: 95,
        unit: '%',
        startDate: new Date(today.getFullYear(), 0, 1).toISOString(),
        targetDate: new Date(today.getFullYear(), 11, 31).toISOString(),
        priority: 'critical',
        status: 'at-risk',
        milestones: [
          {
            id: 'm1',
            name: 'Q1 Target',
            targetValue: 85,
            targetDate: new Date(today.getFullYear(), 2, 31).toISOString(),
            isAchieved: true,
          },
          {
            id: 'm2',
            name: 'Q2 Target',
            targetValue: 90,
            targetDate: new Date(today.getFullYear(), 5, 30).toISOString(),
            isAchieved: false,
          },
          {
            id: 'm3',
            name: 'Q3 Target',
            targetValue: 92,
            targetDate: new Date(today.getFullYear(), 8, 30).toISOString(),
            isAchieved: false,
          },
          {
            id: 'm4',
            name: 'Year End',
            targetValue: 95,
            targetDate: new Date(today.getFullYear(), 11, 31).toISOString(),
            isAchieved: false,
          },
        ],
        history: [
          {
            date: new Date(today.getFullYear(), 0, 1).toISOString(),
            value: 82,
          },
          {
            date: new Date(today.getFullYear(), 1, 1).toISOString(),
            value: 84,
          },
          {
            date: new Date(today.getFullYear(), 2, 1).toISOString(),
            value: 86,
          },
          {
            date: new Date(today.getFullYear(), 3, 1).toISOString(),
            value: 87,
          },
          { date: today.toISOString(), value: 88 },
        ],
      },
      {
        id: '3',
        name: 'Task Completion Rate',
        description: 'Complete 90% of assigned tasks on time',
        category: 'efficiency',
        currentValue: 92,
        targetValue: 90,
        unit: '%',
        startDate: new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        ).toISOString(),
        targetDate: new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        ).toISOString(),
        priority: 'medium',
        status: 'achieved',
        milestones: [
          {
            id: 'm1',
            name: 'Week 1',
            targetValue: 85,
            targetDate: addDays(new Date(), -21).toISOString(),
            isAchieved: true,
          },
          {
            id: 'm2',
            name: 'Week 2',
            targetValue: 88,
            targetDate: addDays(new Date(), -14).toISOString(),
            isAchieved: true,
          },
          {
            id: 'm3',
            name: 'Week 3',
            targetValue: 90,
            targetDate: addDays(new Date(), -7).toISOString(),
            isAchieved: true,
          },
        ],
        history: [
          { date: addDays(today, -21).toISOString(), value: 86 },
          { date: addDays(today, -14).toISOString(), value: 89 },
          { date: addDays(today, -7).toISOString(), value: 91 },
          { date: today.toISOString(), value: 92 },
        ],
      },
      {
        id: '4',
        name: 'Skills Development',
        description: 'Complete 5 training courses this quarter',
        category: 'growth',
        currentValue: 3,
        targetValue: 5,
        unit: ' courses',
        startDate: new Date(
          today.getFullYear(),
          Math.floor(today.getMonth() / 3) * 3,
          1
        ).toISOString(),
        targetDate: new Date(
          today.getFullYear(),
          Math.floor(today.getMonth() / 3) * 3 + 3,
          0
        ).toISOString(),
        priority: 'medium',
        status: 'on-track',
        milestones: [
          {
            id: 'm1',
            name: 'Month 1',
            targetValue: 2,
            targetDate: addDays(new Date(), -30).toISOString(),
            isAchieved: true,
          },
          {
            id: 'm2',
            name: 'Month 2',
            targetValue: 3,
            targetDate: addDays(new Date(), -10).toISOString(),
            isAchieved: true,
          },
          {
            id: 'm3',
            name: 'Month 3',
            targetValue: 5,
            targetDate: addDays(new Date(), 20).toISOString(),
            isAchieved: false,
          },
        ],
        history: [
          { date: addDays(today, -60).toISOString(), value: 1 },
          { date: addDays(today, -30).toISOString(), value: 2 },
          { date: addDays(today, -10).toISOString(), value: 3 },
        ],
      },
    ];
  }

  const getStatusColor = (status: KPI['status']) => {
    switch (status) {
      case 'achieved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'on-track':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'at-risk':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'off-track':
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getStatusIcon = (status: KPI['status']) => {
    switch (status) {
      case 'achieved':
        return <Trophy className='h-4 w-4' />;
      case 'on-track':
        return <TrendingUp className='h-4 w-4' />;
      case 'at-risk':
        return <AlertTriangle className='h-4 w-4' />;
      case 'off-track':
        return <TrendingDown className='h-4 w-4' />;
    }
  };

  const getPriorityColor = (priority: KPI['priority']) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
    }
  };

  const getCategoryIcon = (category: KPI['category']) => {
    switch (category) {
      case 'performance':
        return <BarChart3 className='h-4 w-4' />;
      case 'quality':
        return <Star className='h-4 w-4' />;
      case 'efficiency':
        return <Zap className='h-4 w-4' />;
      case 'growth':
        return <TrendingUp className='h-4 w-4' />;
      case 'custom':
        return <Target className='h-4 w-4' />;
    }
  };

  const calculateProgress = (kpi: KPI) => {
    return Math.min(
      100,
      Math.round((kpi.currentValue / kpi.targetValue) * 100)
    );
  };

  const getDaysRemaining = (targetDate: string) => {
    return differenceInDays(new Date(targetDate), new Date());
  };

  const calculateVelocity = (kpi: KPI) => {
    if (kpi.history.length < 2) return 0;

    const recent = kpi.history.slice(-2);
    if (!recent[0] || !recent[1]) return 0;

    const daysDiff = differenceInDays(
      new Date(recent[1].date),
      new Date(recent[0].date)
    );
    const valueDiff = recent[1].value - recent[0].value;

    return daysDiff > 0 ? valueDiff / daysDiff : 0;
  };

  const estimateCompletionDate = (kpi: KPI) => {
    const velocity = calculateVelocity(kpi);
    if (velocity <= 0) return null;

    const remaining = kpi.targetValue - kpi.currentValue;
    const daysNeeded = Math.ceil(remaining / velocity);

    return addDays(new Date(), daysNeeded);
  };

  const filteredKPIs = kpis.filter(
    kpi => selectedCategory === 'all' || kpi.category === selectedCategory
  );

  // Summary statistics
  const summary = useMemo(() => {
    return {
      total: kpis.length,
      achieved: kpis.filter(k => k.status === 'achieved').length,
      onTrack: kpis.filter(k => k.status === 'on-track').length,
      atRisk: kpis.filter(k => k.status === 'at-risk').length,
      offTrack: kpis.filter(k => k.status === 'off-track').length,
      avgProgress: Math.round(
        kpis.reduce((sum, k) => sum + calculateProgress(k), 0) / kpis.length
      ),
    };
  }, [kpis]);

  return (
    <div className='space-y-6'>
      {/* Summary Dashboard */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Target className='h-5 w-5' />
                KPI Dashboard
              </CardTitle>
              <CardDescription>
                Track goals, milestones, and performance targets
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setShowAddKPI(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Add KPI
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-5 gap-4'>
            <div className='text-center p-4 bg-gray-50 rounded-lg'>
              <div className='text-2xl font-bold text-gray-900'>
                {summary.total}
              </div>
              <div className='text-sm text-gray-600 mt-1'>Total KPIs</div>
            </div>
            <div className='text-center p-4 bg-green-50 rounded-lg'>
              <div className='text-2xl font-bold text-green-600'>
                {summary.achieved}
              </div>
              <div className='text-sm text-gray-600 mt-1'>Achieved</div>
            </div>
            <div className='text-center p-4 bg-blue-50 rounded-lg'>
              <div className='text-2xl font-bold text-blue-600'>
                {summary.onTrack}
              </div>
              <div className='text-sm text-gray-600 mt-1'>On Track</div>
            </div>
            <div className='text-center p-4 bg-yellow-50 rounded-lg'>
              <div className='text-2xl font-bold text-yellow-600'>
                {summary.atRisk}
              </div>
              <div className='text-sm text-gray-600 mt-1'>At Risk</div>
            </div>
            <div className='text-center p-4 bg-purple-50 rounded-lg'>
              <div className='text-2xl font-bold text-purple-600'>
                {summary.avgProgress}%
              </div>
              <div className='text-sm text-gray-600 mt-1'>Avg Progress</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className='flex flex-wrap gap-2'>
        {(
          [
            'all',
            'performance',
            'quality',
            'efficiency',
            'growth',
            'custom',
          ] as const
        ).map(cat => (
          <Button
            key={cat}
            variant={selectedCategory === cat ? 'default' : 'outline'}
            size='sm'
            onClick={() => setSelectedCategory(cat)}
          >
            {cat === 'all'
              ? 'All KPIs'
              : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </Button>
        ))}
      </div>

      {/* KPI Cards */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {filteredKPIs.map(kpi => {
          const progress = calculateProgress(kpi);
          const daysRemaining = getDaysRemaining(kpi.targetDate);
          const velocity = calculateVelocity(kpi);
          const estimatedCompletion = estimateCompletionDate(kpi);
          const achievedMilestones = kpi.milestones.filter(
            m => m.isAchieved
          ).length;

          return (
            <Card
              key={kpi.id}
              className={`border-2 ${getStatusColor(kpi.status)}`}
            >
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-2 mb-2'>
                      <div
                        className={`p-2 rounded-lg ${getStatusColor(kpi.status)}`}
                      >
                        {getCategoryIcon(kpi.category)}
                      </div>
                      <div>
                        <h4 className='font-semibold text-sm'>{kpi.name}</h4>
                        <p className='text-xs text-gray-500'>
                          {kpi.description}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-2 mt-2'>
                      <Badge className={getPriorityColor(kpi.priority)}>
                        {kpi.priority}
                      </Badge>
                      <Badge
                        variant='outline'
                        className={getStatusColor(kpi.status)}
                      >
                        {getStatusIcon(kpi.status)}
                        {kpi.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className='flex gap-1'>
                      <Button variant='ghost' size='sm' className='h-7 w-7 p-0'>
                        <Edit className='h-3 w-3' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-7 w-7 p-0 hover:text-red-500'
                      >
                        <Trash2 className='h-3 w-3' />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className='space-y-4'>
                {/* Progress */}
                <div>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='text-sm font-medium'>Progress</span>
                    <div className='text-right'>
                      <span className='text-2xl font-bold'>
                        {kpi.currentValue}
                        {kpi.unit}
                      </span>
                      <span className='text-sm text-gray-500'>
                        {' '}
                        / {kpi.targetValue}
                        {kpi.unit}
                      </span>
                    </div>
                  </div>
                  <Progress value={progress} className='h-2 mb-1' />
                  <div className='flex items-center justify-between text-xs text-gray-500'>
                    <span>{progress}% Complete</span>
                    <span>
                      {kpi.targetValue - kpi.currentValue}
                      {kpi.unit} remaining
                    </span>
                  </div>
                </div>

                {/* Timeline */}
                <div className='grid grid-cols-2 gap-3 text-xs'>
                  <div className='p-2 bg-gray-50 rounded'>
                    <div className='flex items-center gap-1 text-gray-600 mb-1'>
                      <Calendar className='h-3 w-3' />
                      Target Date
                    </div>
                    <div className='font-medium'>
                      {format(new Date(kpi.targetDate), 'MMM dd, yyyy')}
                    </div>
                    <div
                      className={`${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-yellow-600' : 'text-gray-500'}`}
                    >
                      {daysRemaining < 0
                        ? `${Math.abs(daysRemaining)} days overdue`
                        : `${daysRemaining} days left`}
                    </div>
                  </div>
                  <div className='p-2 bg-gray-50 rounded'>
                    <div className='flex items-center gap-1 text-gray-600 mb-1'>
                      <Zap className='h-3 w-3' />
                      Velocity
                    </div>
                    <div className='font-medium'>
                      {velocity.toFixed(1)}
                      {kpi.unit}/day
                    </div>
                    {estimatedCompletion && (
                      <div
                        className={`${
                          estimatedCompletion > new Date(kpi.targetDate)
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        ETA: {format(estimatedCompletion, 'MMM dd')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Milestones */}
                {kpi.milestones.length > 0 && (
                  <div>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-sm font-medium'>Milestones</span>
                      <span className='text-xs text-gray-500'>
                        {achievedMilestones} / {kpi.milestones.length} completed
                      </span>
                    </div>
                    <div className='space-y-2'>
                      {kpi.milestones.map(milestone => (
                        <div
                          key={milestone.id}
                          className={`flex items-center gap-2 p-2 rounded ${
                            milestone.isAchieved ? 'bg-green-50' : 'bg-gray-50'
                          }`}
                        >
                          {milestone.isAchieved ? (
                            <CheckCircle className='h-4 w-4 text-green-600' />
                          ) : isPast(new Date(milestone.targetDate)) ? (
                            <AlertTriangle className='h-4 w-4 text-red-600' />
                          ) : (
                            <Flag className='h-4 w-4 text-gray-400' />
                          )}
                          <div className='flex-1 min-w-0'>
                            <div className='text-sm font-medium truncate'>
                              {milestone.name}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {milestone.targetValue}
                              {kpi.unit} •{' '}
                              {format(new Date(milestone.targetDate), 'MMM dd')}
                            </div>
                          </div>
                          {milestone.isAchieved && milestone.achievedDate && (
                            <Badge
                              variant='outline'
                              className='text-xs bg-green-100 text-green-700'
                            >
                              {format(
                                new Date(milestone.achievedDate),
                                'MMM dd'
                              )}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Trend Indicator */}
                {kpi.history.length >= 2 && (
                  <div className='pt-3 border-t'>
                    <div className='flex items-center justify-between text-xs'>
                      <span className='text-gray-600'>Recent Trend</span>
                      <div
                        className={`flex items-center gap-1 font-medium ${
                          velocity > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {velocity > 0 ? (
                          <>
                            <TrendingUp className='h-3 w-3' />
                            Improving
                          </>
                        ) : (
                          <>
                            <TrendingDown className='h-3 w-3' />
                            Declining
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
