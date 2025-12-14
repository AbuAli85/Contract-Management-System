'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  AlertTriangle,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  CheckCircle2,
  Circle,
  Timer,
  CalendarClock,
  ClipboardList,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TasksViewProps {
  employerEmployeeId: string;
}

export function TasksView({ employerEmployeeId }: TasksViewProps) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTasks();
  }, [employerEmployeeId]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/employer/team/${employerEmployeeId}/tasks`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }

      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return {
          icon: AlertTriangle,
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-400',
          iconColor: 'text-red-600',
          label: 'Urgent'
        };
      case 'high':
        return {
          icon: ArrowUp,
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          text: 'text-orange-700 dark:text-orange-400',
          iconColor: 'text-orange-600',
          label: 'High'
        };
      case 'medium':
        return {
          icon: ArrowRight,
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-700 dark:text-amber-400',
          iconColor: 'text-amber-600',
          label: 'Medium'
        };
      default:
        return {
          icon: ArrowDown,
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-700 dark:text-blue-400',
          iconColor: 'text-blue-600',
          label: 'Low'
        };
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          text: 'text-emerald-700 dark:text-emerald-400',
          iconColor: 'text-emerald-600',
          label: 'Completed'
        };
      case 'in_progress':
        return {
          icon: Timer,
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-700 dark:text-blue-400',
          iconColor: 'text-blue-600',
          label: 'In Progress'
        };
      case 'pending':
        return {
          icon: Circle,
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-700 dark:text-amber-400',
          iconColor: 'text-amber-600',
          label: 'Pending'
        };
      default:
        return {
          icon: Circle,
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-400',
          iconColor: 'text-gray-600',
          label: status
        };
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <ClipboardList className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Tasks ({tasks.length})</CardTitle>
                <CardDescription>Assigned tasks and their progress</CardDescription>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/20">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center mb-4">
                <ClipboardList className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No tasks assigned
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                Create tasks to track work progress and deadlines for this team member.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-4 w-4" />
                <span>Click "Add Task" to create the first task</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const priorityConfig = getPriorityConfig(task.priority);
                const statusConfig = getStatusConfig(task.status);
                const PriorityIcon = priorityConfig.icon;
                const StatusIcon = statusConfig.icon;
                const overdue = task.due_date && task.status !== 'completed' && isOverdue(task.due_date);
                
                return (
                  <div
                    key={task.id}
                    className={cn(
                      "p-4 rounded-xl border transition-all hover:shadow-md",
                      overdue 
                        ? "border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10" 
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900"
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={cn("p-2 rounded-lg mt-0.5", statusConfig.bg)}>
                          <StatusIcon className={cn("h-4 w-4", statusConfig.iconColor)} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge 
                              variant="outline"
                              className={cn("font-medium border-0 text-xs", priorityConfig.bg, priorityConfig.text)}
                            >
                              <PriorityIcon className="h-3 w-3 mr-1" />
                              {priorityConfig.label}
                            </Badge>
                            <Badge 
                              variant="outline"
                              className={cn("font-medium border-0 text-xs", statusConfig.bg, statusConfig.text)}
                            >
                              {statusConfig.label}
                            </Badge>
                            {task.due_date && (
                              <div className={cn(
                                "flex items-center gap-1 text-xs",
                                overdue ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"
                              )}>
                                <CalendarClock className="h-3 w-3" />
                                <span>
                                  {overdue && "Overdue: "}
                                  {new Date(task.due_date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
