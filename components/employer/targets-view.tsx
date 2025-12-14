'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, 
  Plus, 
  TrendingUp,
  Calendar,
  Trophy,
  Zap,
  CheckCircle2,
  Clock,
  Sparkles,
  Rocket,
  ArrowUpRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TargetsViewProps {
  employerEmployeeId: string;
}

export function TargetsView({ employerEmployeeId }: TargetsViewProps) {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchTargets();
  }, [employerEmployeeId]);

  const fetchTargets = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/employer/team/${employerEmployeeId}/targets?period=current`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch targets');
      }

      setTargets(data.targets || []);
    } catch (error) {
      console.error('Error fetching targets:', error);
      toast({
        title: 'Error',
        description: 'Failed to load targets',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          icon: Trophy,
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          text: 'text-emerald-700 dark:text-emerald-400',
          progressColor: 'bg-emerald-500',
          label: 'Completed'
        };
      case 'active':
        return {
          icon: Zap,
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-700 dark:text-blue-400',
          progressColor: 'bg-blue-500',
          label: 'Active'
        };
      case 'pending':
        return {
          icon: Clock,
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-700 dark:text-amber-400',
          progressColor: 'bg-amber-500',
          label: 'Pending'
        };
      default:
        return {
          icon: Target,
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-400',
          progressColor: 'bg-gray-500',
          label: status
        };
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'from-emerald-500 to-green-400';
    if (percentage >= 75) return 'from-blue-500 to-cyan-400';
    if (percentage >= 50) return 'from-amber-500 to-yellow-400';
    if (percentage >= 25) return 'from-orange-500 to-amber-400';
    return 'from-red-500 to-rose-400';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-lg">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Targets & Goals ({targets.length})</CardTitle>
                <CardDescription>Performance targets and achievement tracking</CardDescription>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20">
              <Plus className="h-4 w-4 mr-2" />
              Add Target
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : targets.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center mb-4">
                <Rocket className="h-10 w-10 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No targets assigned
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                Set performance targets to track progress and motivate achievement. Targets help measure success and drive results.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400">
                <Sparkles className="h-4 w-4" />
                <span>Click "Add Target" to set the first goal</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {targets.map(target => {
                const statusConfig = getStatusConfig(target.status);
                const StatusIcon = statusConfig.icon;
                const progressPercent = target.progress_percentage || 0;
                const daysRemaining = getDaysRemaining(target.end_date);
                const isOverdue = daysRemaining < 0 && target.status !== 'completed';
                
                return (
                  <Card 
                    key={target.id} 
                    className={cn(
                      "border overflow-hidden transition-all hover:shadow-lg",
                      isOverdue 
                        ? "border-red-200 dark:border-red-800" 
                        : "border-gray-200 dark:border-gray-800"
                    )}
                  >
                    {/* Progress Gradient Bar */}
                    <div className="h-1 w-full bg-gray-100 dark:bg-gray-800">
                      <div 
                        className={cn(
                          "h-full bg-gradient-to-r transition-all duration-500",
                          getProgressColor(progressPercent)
                        )}
                        style={{ width: `${Math.min(progressPercent, 100)}%` }}
                      />
                    </div>
                    
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className={cn("p-2 rounded-lg", statusConfig.bg)}>
                              <StatusIcon className={cn("h-5 w-5", statusConfig.text)} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                {target.title}
                              </h4>
                              {target.description && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {target.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <Badge 
                            variant="outline"
                            className={cn("font-medium border-0", statusConfig.bg, statusConfig.text)}
                          >
                            {statusConfig.label}
                          </Badge>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-600 dark:text-gray-400">
                                {target.current_value || 0} / {target.target_value} {target.unit}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className={cn(
                                "text-lg font-bold",
                                progressPercent >= 100 
                                  ? "text-emerald-600 dark:text-emerald-400" 
                                  : progressPercent >= 75
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-900 dark:text-white"
                              )}>
                                {progressPercent}%
                              </span>
                              {progressPercent >= 100 && (
                                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              )}
                            </div>
                          </div>
                          <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                            <div 
                              className={cn(
                                "h-full rounded-full bg-gradient-to-r transition-all duration-500",
                                getProgressColor(progressPercent)
                              )}
                              style={{ width: `${Math.min(progressPercent, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-800">
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Start: {formatDate(target.start_date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>End: {formatDate(target.end_date)}</span>
                            </div>
                          </div>
                          {target.status !== 'completed' && (
                            <div className={cn(
                              "text-xs font-medium flex items-center gap-1",
                              isOverdue 
                                ? "text-red-600 dark:text-red-400"
                                : daysRemaining <= 7
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-gray-500 dark:text-gray-400"
                            )}>
                              <Clock className="h-3.5 w-3.5" />
                              {isOverdue 
                                ? `${Math.abs(daysRemaining)} days overdue`
                                : `${daysRemaining} days remaining`
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
