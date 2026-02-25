'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Circle,
  Timer,
  Play,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isPast } from 'date-fns';

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  priority: string;
  due_date: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  completion_notes: string | null;
  created_at: string;
  assigned_by_user?: {
    full_name: string | null;
    email: string | null;
  } | null;
}

const priorityConfig = {
  high: {
    icon: ArrowUp,
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/20',
  },
  medium: {
    icon: ArrowRight,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/20',
  },
  low: {
    icon: ArrowDown,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/20',
  },
};

const statusConfig = {
  pending: {
    icon: Circle,
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-900',
  },
  in_progress: {
    icon: Timer,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/20',
  },
  completed: {
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-100 dark:bg-green-900/20',
  },
  cancelled: {
    icon: Circle,
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/20',
  },
};

function TaskItem({
  task,
  onUpdate,
}: {
  task: Task;
  onUpdate: (id: string, data: any) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState(task.completion_notes || '');

  const priority =
    priorityConfig[task.priority as keyof typeof priorityConfig] ||
    priorityConfig.medium;
  const status =
    statusConfig[task.status as keyof typeof statusConfig] ||
    statusConfig.pending;
  const StatusIcon = status.icon;
  const PriorityIcon = priority.icon;

  const isOverdue =
    task.due_date &&
    isPast(new Date(task.due_date)) &&
    task.status !== 'completed';

  const handleStatusChange = async (newStatus: string) => {
    setUpdating(true);
    try {
      await onUpdate(task.id, { status: newStatus });
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    setUpdating(true);
    try {
      await onUpdate(task.id, { completion_notes: notes });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={cn(
        'border rounded-xl p-4 transition-all duration-200',
        isOverdue &&
          'border-red-300 bg-red-50/50 dark:border-red-800 dark:bg-red-900/10',
        !isOverdue && 'border-gray-200 dark:border-gray-800 hover:shadow-md'
      )}
    >
      <div className='flex items-start gap-3'>
        {/* Quick Status Toggle */}
        <button
          onClick={() =>
            handleStatusChange(
              task.status === 'completed'
                ? 'in_progress'
                : task.status === 'in_progress'
                  ? 'completed'
                  : 'in_progress'
            )
          }
          disabled={updating}
          className={cn('mt-1 p-1 rounded-full transition-colors', status.bg)}
        >
          {updating ? (
            <Loader2 className='h-5 w-5 animate-spin text-gray-400' />
          ) : (
            <StatusIcon className={cn('h-5 w-5', status.color)} />
          )}
        </button>

        <div className='flex-1 min-w-0'>
          <div className='flex items-start justify-between gap-2'>
            <div>
              <h4
                className={cn(
                  'font-medium',
                  task.status === 'completed' && 'line-through text-gray-500'
                )}
              >
                {task.title}
              </h4>
              {task.description && !expanded && (
                <p className='text-sm text-gray-500 truncate mt-1'>
                  {task.description}
                </p>
              )}
            </div>

            <div className='flex items-center gap-2 flex-shrink-0'>
              <div className={cn('p-1.5 rounded', priority.bg)}>
                <PriorityIcon className={cn('h-3.5 w-3.5', priority.color)} />
              </div>
              {isOverdue && (
                <Badge variant='destructive' className='text-xs'>
                  Overdue
                </Badge>
              )}
            </div>
          </div>

          <div className='flex items-center gap-3 mt-2 text-sm text-gray-500'>
            {task.due_date && (
              <span className='flex items-center gap-1'>
                <Clock className='h-3.5 w-3.5' />
                {format(new Date(task.due_date), 'MMM d')}
              </span>
            )}
            {task.estimated_hours && (
              <span className='flex items-center gap-1'>
                <Timer className='h-3.5 w-3.5' />
                {task.estimated_hours}h
              </span>
            )}
            {task.assigned_by_user?.full_name && (
              <span className='text-xs'>
                From: {task.assigned_by_user.full_name}
              </span>
            )}
          </div>

          {/* Expanded Section */}
          {expanded && (
            <div className='mt-4 space-y-4'>
              {task.description && (
                <p className='text-sm text-gray-600 dark:text-gray-400'>
                  {task.description}
                </p>
              )}

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Status</label>
                <Select
                  value={task.status}
                  onValueChange={handleStatusChange}
                  disabled={updating}
                >
                  <SelectTrigger className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='pending'>
                      <div className='flex items-center gap-2'>
                        <Circle className='h-4 w-4 text-gray-500' />
                        Pending
                      </div>
                    </SelectItem>
                    <SelectItem value='in_progress'>
                      <div className='flex items-center gap-2'>
                        <Play className='h-4 w-4 text-blue-500' />
                        In Progress
                      </div>
                    </SelectItem>
                    <SelectItem value='completed'>
                      <div className='flex items-center gap-2'>
                        <CheckCircle2 className='h-4 w-4 text-green-500' />
                        Completed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium'>Notes</label>
                <Textarea
                  placeholder='Add your notes here...'
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
                {notes !== (task.completion_notes || '') && (
                  <Button
                    size='sm'
                    onClick={handleSaveNotes}
                    disabled={updating}
                  >
                    {updating && (
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    )}
                    Save Notes
                  </Button>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => setExpanded(!expanded)}
            className='mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1'
          >
            {expanded ? (
              <>
                <ChevronUp className='h-3 w-3' />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className='h-3 w-3' />
                Show more
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function TasksCard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'in_progress' | 'completed'
  >('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/employee/my-tasks');
      const data = await response.json();

      if (!response.ok) {
        if (response.status !== 404) {
          throw new Error(data.error);
        }
        return;
      }

      setTasks(data.tasks || []);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updateData: any) => {
    try {
      const response = await fetch(`/api/employee/my-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '✅ Task Updated',
        description: 'Your changes have been saved',
      });

      // Update local state
      setTasks(
        tasks.map(t =>
          t.id === taskId ? { ...t, ...updateData, ...data.task } : t
        )
      );
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
      throw error;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'all') return true;
    return task.status === filter;
  });

  const stats = {
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(
      t =>
        t.due_date && isPast(new Date(t.due_date)) && t.status !== 'completed'
    ).length,
  };

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
            <CheckSquare className='h-5 w-5 text-blue-600' />
            My Tasks
          </CardTitle>
          {stats.overdue > 0 && (
            <Badge variant='destructive' className='flex items-center gap-1'>
              <AlertTriangle className='h-3 w-3' />
              {stats.overdue} Overdue
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Quick Stats */}
        <div className='grid grid-cols-3 gap-3'>
          <button
            onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
            className={cn(
              'p-3 rounded-lg text-center transition-all',
              filter === 'pending'
                ? 'bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-400'
                : 'bg-gray-100 dark:bg-gray-900 hover:bg-gray-200'
            )}
          >
            <p className='text-2xl font-bold text-gray-700 dark:text-gray-300'>
              {stats.pending}
            </p>
            <p className='text-xs text-gray-500'>Pending</p>
          </button>
          <button
            onClick={() =>
              setFilter(filter === 'in_progress' ? 'all' : 'in_progress')
            }
            className={cn(
              'p-3 rounded-lg text-center transition-all',
              filter === 'in_progress'
                ? 'bg-blue-200 dark:bg-blue-900 ring-2 ring-blue-400'
                : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100'
            )}
          >
            <p className='text-2xl font-bold text-blue-600'>
              {stats.inProgress}
            </p>
            <p className='text-xs text-gray-500'>In Progress</p>
          </button>
          <button
            onClick={() =>
              setFilter(filter === 'completed' ? 'all' : 'completed')
            }
            className={cn(
              'p-3 rounded-lg text-center transition-all',
              filter === 'completed'
                ? 'bg-green-200 dark:bg-green-900 ring-2 ring-green-400'
                : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100'
            )}
          >
            <p className='text-2xl font-bold text-green-600'>
              {stats.completed}
            </p>
            <p className='text-xs text-gray-500'>Completed</p>
          </button>
        </div>

        {/* Task List */}
        <div className='space-y-3 max-h-[400px] overflow-y-auto pr-1'>
          {filteredTasks.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <CheckSquare className='h-12 w-12 mx-auto mb-2 opacity-30' />
              <p>
                No tasks{' '}
                {filter !== 'all'
                  ? `with status "${filter.replace('_', ' ')}"`
                  : ''}
              </p>
            </div>
          ) : (
            filteredTasks.map(task => (
              <TaskItem key={task.id} task={task} onUpdate={handleUpdateTask} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
