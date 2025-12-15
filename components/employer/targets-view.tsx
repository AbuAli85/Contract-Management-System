'use client';

/* eslint-disable react/forbid-dom-props */
// Dynamic inline styles are required for progress bar widths

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TargetsViewProps {
  employerEmployeeId: string;
  isEmployeeView?: boolean; // If true, hide "Add Target" and show update controls
}

export function TargetsView({ employerEmployeeId, isEmployeeView = false }: TargetsViewProps) {
  const [targets, setTargets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTarget, setNewTarget] = useState({
    title: '',
    description: '',
    target_type: 'performance',
    target_value: '',
    unit: 'units',
    period_type: 'monthly',
    start_date: '',
    end_date: '',
    notes: '',
  });
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

  const createTarget = async () => {
    if (!newTarget.title.trim() || !newTarget.target_value || !newTarget.start_date || !newTarget.end_date) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields (title, target value, start date, end date)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCreating(true);
      const response = await fetch(
        `/api/employer/team/${employerEmployeeId}/targets`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTarget.title.trim(),
            description: newTarget.description.trim() || null,
            target_type: newTarget.target_type,
            target_value: Number(newTarget.target_value),
            unit: newTarget.unit,
            period_type: newTarget.period_type,
            start_date: newTarget.start_date,
            end_date: newTarget.end_date,
            notes: newTarget.notes.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create target');
      }

      toast({
        title: 'Success',
        description: 'Target created successfully',
      });

      // Reset form and close dialog
      setNewTarget({
        title: '',
        description: '',
        target_type: 'performance',
        target_value: '',
        unit: 'units',
        period_type: 'monthly',
        start_date: '',
        end_date: '',
        notes: '',
      });
      setDialogOpen(false);
      
      // Refresh targets
      fetchTargets();
    } catch (error: any) {
      console.error('Error creating target:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create target',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
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

  const [updatingTargetId, setUpdatingTargetId] = useState<string | null>(null);

  const updateTargetProgress = async (targetId: string, newValue: number) => {
    try {
      setUpdatingTargetId(targetId);
      const endpoint = isEmployeeView 
        ? `/api/employee/my-targets/${targetId}`
        : `/api/employer/team/${employerEmployeeId}/targets/${targetId}`;
      
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_value: newValue }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update target');
      }

      toast({
        title: 'Success',
        description: 'Target progress updated',
      });

      fetchTargets();
    } catch (error: any) {
      console.error('Error updating target:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update target',
        variant: 'destructive',
      });
    } finally {
      setUpdatingTargetId(null);
    }
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
                <CardTitle className="text-lg">{isEmployeeView ? 'My Targets' : 'Targets & Goals'} ({targets.length})</CardTitle>
                <CardDescription>{isEmployeeView ? 'Your performance targets' : 'Performance targets and achievement tracking'}</CardDescription>
              </div>
            </div>
            {!isEmployeeView && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20">
              <Plus className="h-4 w-4 mr-2" />
              Add Target
            </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[550px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-600" />
                    Create New Target
                  </DialogTitle>
                  <DialogDescription>
                    Set a performance target for this team member
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-2">
                    <Label htmlFor="target-title">Target Title *</Label>
                    <Input
                      id="target-title"
                      placeholder="e.g., Monthly Sales Goal"
                      value={newTarget.title}
                      onChange={(e) => setNewTarget({ ...newTarget, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-description">Description</Label>
                    <Textarea
                      id="target-description"
                      placeholder="Target details..."
                      rows={2}
                      value={newTarget.description}
                      onChange={(e) => setNewTarget({ ...newTarget, description: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="target-value">Target Value *</Label>
                      <Input
                        id="target-value"
                        type="number"
                        placeholder="e.g., 100"
                        min="0"
                        value={newTarget.target_value}
                        onChange={(e) => setNewTarget({ ...newTarget, target_value: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Unit</Label>
                      <Select
                        value={newTarget.unit}
                        onValueChange={(value) => setNewTarget({ ...newTarget, unit: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="units">Units</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="hours">Hours</SelectItem>
                          <SelectItem value="percent">Percent</SelectItem>
                          <SelectItem value="currency">Currency</SelectItem>
                          <SelectItem value="tasks">Tasks</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Period</Label>
                      <Select
                        value={newTarget.period_type}
                        onValueChange={(value) => setNewTarget({ ...newTarget, period_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Type</Label>
                      <Select
                        value={newTarget.target_type}
                        onValueChange={(value) => setNewTarget({ ...newTarget, target_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="performance">Performance</SelectItem>
                          <SelectItem value="sales">Sales</SelectItem>
                          <SelectItem value="productivity">Productivity</SelectItem>
                          <SelectItem value="quality">Quality</SelectItem>
                          <SelectItem value="learning">Learning</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date *</Label>
                      <Input
                        id="start-date"
                        type="date"
                        value={newTarget.start_date}
                        onChange={(e) => setNewTarget({ ...newTarget, start_date: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date *</Label>
                      <Input
                        id="end-date"
                        type="date"
                        value={newTarget.end_date}
                        onChange={(e) => setNewTarget({ ...newTarget, end_date: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="target-notes">Notes</Label>
                    <Textarea
                      id="target-notes"
                      placeholder="Additional notes..."
                      rows={2}
                      value={newTarget.notes}
                      onChange={(e) => setNewTarget({ ...newTarget, notes: e.target.value })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={createTarget} 
                    disabled={creating}
                    className="bg-gradient-to-r from-purple-600 to-pink-600"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Target
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            )}
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
                        
                        {/* Employee Update Progress Controls */}
                        {isEmployeeView && target.status === 'active' && (
                          <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={target.target_value * 2}
                                  defaultValue={target.current_value || 0}
                                  className="h-8 w-24 text-sm"
                                  id={`progress-${target.id}`}
                                  placeholder="Current"
                                />
                                <span className="text-xs text-gray-500">/ {target.target_value} {target.unit}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              disabled={updatingTargetId === target.id}
                              onClick={() => {
                                const input = document.getElementById(`progress-${target.id}`) as HTMLInputElement;
                                if (input) {
                                  updateTargetProgress(target.id, Number(input.value));
                                }
                              }}
                              className="h-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                            >
                              {updatingTargetId === target.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <>
                                  <ArrowUpRight className="h-3 w-3 mr-1" />
                                  Update
                                </>
                              )}
                            </Button>
                      </div>
                        )}
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
