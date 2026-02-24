'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Plus,
  Loader2,
  Trophy,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isPast } from 'date-fns';

interface TargetType {
  id: string;
  target_name: string;
  description: string | null;
  target_type: string;
  target_value: number;
  current_value: number;
  start_date: string;
  end_date: string;
  status: string;
  priority: string;
}

interface TargetProgress {
  id: string;
  progress_value: number;
  notes: string | null;
  recorded_at: string;
}

function TargetItem({
  target,
  onAddProgress,
}: {
  target: TargetType;
  onAddProgress: (
    targetId: string,
    value: number,
    notes?: string
  ) => Promise<void>;
}) {
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [progressValue, setProgressValue] = useState('');
  const [adding, setAdding] = useState(false);

  const percentage = Math.min(
    100,
    (target.current_value / target.target_value) * 100
  );
  const daysLeft = differenceInDays(new Date(target.end_date), new Date());
  const isOverdue =
    isPast(new Date(target.end_date)) && target.status !== 'completed';
  const isCompleted = target.status === 'completed' || percentage >= 100;

  const getStatusColor = () => {
    if (isCompleted) return 'text-green-500';
    if (isOverdue) return 'text-red-500';
    if (percentage >= 75) return 'text-emerald-500';
    if (percentage >= 50) return 'text-amber-500';
    return 'text-blue-500';
  };

  const getProgressColor = () => {
    if (isCompleted) return 'bg-green-500';
    if (isOverdue) return 'bg-red-500';
    if (percentage >= 75) return 'bg-emerald-500';
    if (percentage >= 50) return 'bg-amber-500';
    return 'bg-blue-500';
  };

  const handleAddProgress = async () => {
    if (!progressValue) return;
    setAdding(true);
    try {
      await onAddProgress(target.id, parseFloat(progressValue));
      setProgressValue('');
      setShowAddProgress(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      className={cn(
        'border rounded-xl p-4 transition-all',
        isCompleted &&
          'border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/10',
        isOverdue &&
          'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10',
        !isCompleted && !isOverdue && 'border-gray-200 dark:border-gray-800'
      )}
    >
      <div className='flex items-start justify-between gap-4 mb-3'>
        <div className='flex-1'>
          <div className='flex items-center gap-2 mb-1'>
            {isCompleted ? (
              <Trophy className='h-5 w-5 text-green-500' />
            ) : (
              <Target className={cn('h-5 w-5', getStatusColor())} />
            )}
            <h4 className='font-medium'>{target.target_name}</h4>
          </div>
          {target.description && (
            <p className='text-sm text-gray-500 ml-7'>{target.description}</p>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {isOverdue && (
            <Badge variant='destructive' className='text-xs'>
              Overdue
            </Badge>
          )}
          {isCompleted && (
            <Badge className='bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs'>
              Completed
            </Badge>
          )}
          {!isCompleted && !isOverdue && daysLeft <= 7 && (
            <Badge variant='outline' className='text-xs'>
              {daysLeft} days left
            </Badge>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className='mb-3'>
        <div className='flex items-center justify-between text-sm mb-1'>
          <span className='text-gray-500'>Progress</span>
          <span className={cn('font-semibold', getStatusColor())}>
            {target.current_value.toLocaleString()} /{' '}
            {target.target_value.toLocaleString()}
          </span>
        </div>
        <div className='h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden'>
          <div
            className={cn(
              'h-full transition-all duration-500 rounded-full',
              getProgressColor()
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className='flex justify-between text-xs text-gray-500 mt-1'>
          <span>{percentage.toFixed(1)}%</span>
          <span>{format(new Date(target.end_date), 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Quick Add Progress */}
      {!isCompleted && (
        <div className='pt-2 border-t'>
          {showAddProgress ? (
            <div className='flex items-center gap-2'>
              <Input
                type='number'
                placeholder='Progress value'
                value={progressValue}
                onChange={e => setProgressValue(e.target.value)}
                className='h-8'
              />
              <Button
                size='sm'
                onClick={handleAddProgress}
                disabled={adding || !progressValue}
              >
                {adding ? <Loader2 className='h-4 w-4 animate-spin' /> : 'Add'}
              </Button>
              <Button
                size='sm'
                variant='ghost'
                onClick={() => setShowAddProgress(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size='sm'
              variant='outline'
              className='w-full'
              onClick={() => setShowAddProgress(true)}
            >
              <Plus className='h-4 w-4 mr-2' />
              Update Progress
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export function TargetsCard() {
  const [targets, setTargets] = useState<TargetType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTargets();
  }, []);

  const fetchTargets = async () => {
    try {
      const response = await fetch('/api/employee/my-targets');
      const data = await response.json();

      if (!response.ok) {
        if (response.status !== 404) {
          throw new Error(data.error);
        }
        return;
      }

      setTargets(data.targets || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProgress = async (
    targetId: string,
    value: number,
    notes?: string
  ) => {
    try {
      const response = await fetch(`/api/employee/my-targets/${targetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress_value: value, notes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '🎯 Progress Updated',
        description: `Added ${value} to your target`,
      });

      // Refresh targets
      fetchTargets();
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const activeTargets = targets.filter(t => t.status === 'active');
  const completedCount = targets.filter(t => t.status === 'completed').length;
  const overdueCount = targets.filter(
    t => isPast(new Date(t.end_date)) && t.status !== 'completed'
  ).length;

  if (loading) {
    return (
      <Card className='border-0 shadow-lg'>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-0 shadow-lg'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl flex items-center gap-2'>
            <Target className='h-5 w-5 text-purple-600' />
            My Targets
          </CardTitle>
          <div className='flex items-center gap-2'>
            {completedCount > 0 && (
              <Badge className='bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'>
                <Trophy className='h-3 w-3 mr-1' />
                {completedCount} completed
              </Badge>
            )}
            {overdueCount > 0 && (
              <Badge variant='destructive'>{overdueCount} overdue</Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Overall Stats */}
        <div className='grid grid-cols-3 gap-3'>
          <div className='p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center'>
            <p className='text-2xl font-bold text-purple-600'>
              {activeTargets.length}
            </p>
            <p className='text-xs text-gray-500'>Active</p>
          </div>
          <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center'>
            <p className='text-2xl font-bold text-green-600'>
              {completedCount}
            </p>
            <p className='text-xs text-gray-500'>Completed</p>
          </div>
          <div className='p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center'>
            <p className='text-2xl font-bold text-amber-600'>
              {activeTargets.length > 0
                ? Math.round(
                    activeTargets.reduce(
                      (sum, t) =>
                        sum + (t.current_value / t.target_value) * 100,
                      0
                    ) / activeTargets.length
                  )
                : 0}
              %
            </p>
            <p className='text-xs text-gray-500'>Avg Progress</p>
          </div>
        </div>

        {/* Target List */}
        <div className='space-y-3 max-h-[400px] overflow-y-auto pr-1'>
          {targets.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <Target className='h-12 w-12 mx-auto mb-2 opacity-30' />
              <p>No targets assigned yet</p>
            </div>
          ) : (
            targets.map(target => (
              <TargetItem
                key={target.id}
                target={target}
                onAddProgress={handleAddProgress}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
