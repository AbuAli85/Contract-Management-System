'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  TrendingUp,
  CheckCircle,
  Clock,
  Plus,
  Award,
  Zap
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

interface Goal {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  unit: string;
  deadline: string;
  category: 'revenue' | 'contracts' | 'satisfaction' | 'tasks' | 'custom';
  priority: 'high' | 'medium' | 'low';
  color: string;
}

interface PromoterGoalWidgetProps {
  promoterId: string;
  performanceMetrics?: any;
  isAdmin: boolean;
}

export function PromoterGoalWidget({
  promoterId,
  performanceMetrics,
  isAdmin
}: PromoterGoalWidgetProps) {
  const [goals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Monthly Revenue',
      description: 'Generate $5,000 in revenue',
      current: 3850,
      target: 5000,
      unit: '$',
      deadline: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
      category: 'revenue',
      priority: 'high',
      color: '#10B981'
    },
    {
      id: '2',
      title: 'Customer Satisfaction',
      description: 'Achieve 95% satisfaction rate',
      current: performanceMetrics?.customerSatisfaction || 88,
      target: 95,
      unit: '%',
      deadline: format(new Date(new Date().getFullYear(), 11, 31), 'yyyy-MM-dd'),
      category: 'satisfaction',
      priority: 'high',
      color: '#F59E0B'
    },
    {
      id: '3',
      title: 'Active Contracts',
      description: 'Maintain 3 active contracts',
      current: 2,
      target: 3,
      unit: '',
      deadline: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
      category: 'contracts',
      priority: 'medium',
      color: '#3B82F6'
    }
  ]);

  const CircularProgress = ({ goal }: { goal: Goal }) => {
    const percentage = Math.min(100, (goal.current / goal.target) * 100);
    const circumference = 2 * Math.PI * 40;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    const daysRemaining = differenceInDays(new Date(goal.deadline), new Date());

    return (
      <div className="relative flex flex-col items-center">
        {/* SVG Ring */}
        <svg className="w-28 h-28 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="56"
            cy="56"
            r="40"
            stroke="#E5E7EB"
            strokeWidth="8"
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="56"
            cy="56"
            r="40"
            stroke={goal.color}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xl font-bold" style={{ color: goal.color }}>
            {percentage.toFixed(0)}%
          </div>
          <div className="text-xs text-gray-500 mt-0.5">
            {goal.current}{goal.unit}
          </div>
        </div>

        {/* Goal info below */}
        <div className="mt-3 text-center">
          <h4 className="text-sm font-semibold text-gray-900 mb-1">{goal.title}</h4>
          <p className="text-xs text-gray-500 mb-2">
            Target: {goal.target}{goal.unit}
          </p>
          <div className="flex items-center justify-center gap-1">
            <Clock className="h-3 w-3 text-gray-400" />
            <span className={`text-xs font-medium ${
              daysRemaining < 0 ? 'text-red-600' :
              daysRemaining < 7 ? 'text-orange-600' :
              'text-gray-600'
            }`}>
              {daysRemaining < 0 ? 'Overdue' : `${daysRemaining}d left`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const topGoals = goals.slice(0, 3);

  return (
    <Card className="border-2 border-indigo-100">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-indigo-600" />
            Active Goals
          </CardTitle>
          {isAdmin && (
            <Button size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              New Goal
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Goal Progress Rings */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {topGoals.map((goal) => (
            <CircularProgress key={goal.id} goal={goal} />
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t">
          <div className="text-center p-2 bg-green-50 rounded">
            <div className="text-lg font-bold text-green-600">
              {goals.filter(g => (g.current / g.target) >= 1).length}
            </div>
            <div className="text-xs text-gray-600">Achieved</div>
          </div>
          <div className="text-center p-2 bg-blue-50 rounded">
            <div className="text-lg font-bold text-blue-600">
              {goals.filter(g => {
                const pct = (g.current / g.target) * 100;
                return pct >= 75 && pct < 100;
              }).length}
            </div>
            <div className="text-xs text-gray-600">On Track</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded">
            <div className="text-lg font-bold text-orange-600">
              {goals.filter(g => (g.current / g.target) < 0.75).length}
            </div>
            <div className="text-xs text-gray-600">At Risk</div>
          </div>
        </div>

        {/* All Goals Button */}
        {goals.length > 3 && (
          <Button variant="link" className="w-full mt-3 text-xs">
            View all {goals.length} goals
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

