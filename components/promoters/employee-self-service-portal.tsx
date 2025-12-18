'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckSquare,
  Target,
  FileText,
  DollarSign,
  Mail,
  Briefcase,
  Calendar,
  Clock,
  Download,
  Eye,
  CheckCircle,
  LogIn,
  LogOut,
  BarChart3,
  MessageSquare,
  Plus,
  Edit,
  Save,
  X,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { SmartAttendanceCard } from '@/components/employee/smart-attendance-card';

interface EmployeeSelfServicePortalProps {
  promoterId: string;
  promoterDetails: any;
  locale?: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high';
  due_date?: string;
  created_at: string;
}

interface Target {
  id: string;
  title: string;
  description?: string;
  target_value: number;
  current_value: number;
  unit: string;
  deadline?: string;
  status: 'active' | 'completed' | 'cancelled';
}

interface PayrollEntry {
  id: string;
  payroll_run_id: string;
  net_salary: number;
  payment_status: 'pending' | 'paid' | 'processing';
  payment_date?: string;
  period_start: string;
  period_end: string;
}

interface Letter {
  id: string;
  letter_type: string;
  subject: string;
  status: 'draft' | 'issued' | 'signed';
  issued_date?: string;
  document_url?: string;
}

export function EmployeeSelfServicePortal({
  promoterId,
  promoterDetails,
  locale = 'en',
}: EmployeeSelfServicePortalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();
  const [activeTab, setActiveTab] = useState('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [targets, setTargets] = useState<Target[]>([]);
  const [payrollEntries, setPayrollEntries] = useState<PayrollEntry[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [employerEmployeeId, setEmployerEmployeeId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<string>('');
  const [taskNotes, setTaskNotes] = useState<string>('');
  const [editingTarget, setEditingTarget] = useState<string | null>(null);
  const [targetProgress, setTargetProgress] = useState<string>('');
  const [targetNotes, setTargetNotes] = useState<string>('');

  useEffect(() => {
    fetchEmployeeData();
  }, [promoterId]);


  const fetchEmployeeData = async () => {
    if (!supabase) return;
    setIsLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get employer_employee_id
      const { data: employeeRecord } = await supabase
        .from('employer_employees')
        .select('id')
        .eq('employee_id', user.id)
        .eq('employment_status', 'active')
        .maybeSingle();

      if (employeeRecord) {
        setEmployerEmployeeId(employeeRecord.id);

        // Fetch all data in parallel
        await Promise.all([
          fetchTasks(employeeRecord.id),
          fetchTargets(employeeRecord.id),
          fetchPayroll(employeeRecord.id),
          fetchLetters(employeeRecord.id),
        ]);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async (eeId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('employee_tasks')
        .select('*')
        .eq('employer_employee_id', eeId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTasks(data.map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          due_date: task.due_date,
          created_at: task.created_at,
        })));
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTargets = async (eeId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('employee_targets')
        .select('*')
        .eq('employer_employee_id', eeId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTargets(data.map((target: any) => ({
          id: target.id,
          title: target.title,
          description: target.description,
          target_value: parseFloat(target.target_value) || 0,
          current_value: parseFloat(target.current_value) || 0,
          unit: target.unit || '',
          deadline: target.end_date,
          status: target.status,
        })));
      }
    } catch (error) {
      console.error('Error fetching targets:', error);
    }
  };

  const fetchPayroll = async (eeId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('payroll_entries')
        .select('*, payroll_runs(*)')
        .eq('employer_employee_id', eeId)
        .order('created_at', { ascending: false })
        .limit(12);

      if (!error && data) {
        setPayrollEntries(data as PayrollEntry[]);
      }
    } catch (error) {
      console.error('Error fetching payroll:', error);
    }
  };

  const fetchLetters = async (eeId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employer_employee_id', eeId)
        .in('document_type', ['employment_letter', 'salary_certificate', 'official_letter', 'experience_letter', 'no_objection_letter'])
        .order('created_at', { ascending: false });

      if (!error && data) {
        setLetters(data.map((doc: any) => ({
          id: doc.id,
          letter_type: doc.document_type,
          subject: doc.title || doc.document_type.replace('_', ' '),
          status: doc.status || 'issued',
          issued_date: doc.issued_date || doc.created_at,
          document_url: doc.file_url,
        })));
      }
    } catch (error) {
      console.error('Error fetching letters:', error);
    }
  };

  const handleUpdateTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/employee/my-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: taskStatus,
          completion_notes: taskNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update task');
      }

      toast({
        title: 'Success',
        description: 'Task updated successfully',
      });

      setEditingTask(null);
      setTaskStatus('');
      setTaskNotes('');
      if (employerEmployeeId) {
        await fetchTasks(employerEmployeeId);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update task',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateTarget = async (targetId: string) => {
    try {
      const currentTarget = targets.find(t => t.id === targetId);
      if (!currentTarget) return;

      const progressValue = parseFloat(targetProgress);
      if (isNaN(progressValue) || progressValue < 0) {
        toast({
          title: 'Error',
          description: 'Please enter a valid progress value',
          variant: 'destructive',
        });
        return;
      }

      // Use POST to add progress incrementally
      const response = await fetch(`/api/employee/my-targets/${targetId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          progress_value: progressValue,
          notes: targetNotes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update target');
      }

      toast({
        title: 'Success',
        description: `Added ${progressValue} to target progress`,
      });

      setEditingTarget(null);
      setTargetProgress('');
      setTargetNotes('');
      if (employerEmployeeId) {
        await fetchTargets(employerEmployeeId);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update target',
        variant: 'destructive',
      });
    }
  };

  const stats = useMemo(() => {
    const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled');
    const completedTasks = tasks.filter(t => t.status === 'completed');
    const activeTargets = targets.filter(t => t.status === 'active');
    const pendingPayroll = payrollEntries.filter(p => p.payment_status === 'pending');
    const totalEarned = payrollEntries
      .filter(p => p.payment_status === 'paid')
      .reduce((sum, p) => sum + (p.net_salary || 0), 0);

    return {
      activeTasks: activeTasks.length,
      completedTasks: completedTasks.length,
      totalTasks: tasks.length,
      activeTargets: activeTargets.length,
      pendingPayroll: pendingPayroll.length,
      totalEarned,
      lettersCount: letters.length,
    };
  }, [tasks, targets, payrollEntries, letters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading your portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">My Portal</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your tasks, targets, payroll, and documents</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <p className="text-2xl font-bold">{stats.activeTasks}</p>
              </div>
              <CheckSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Targets</p>
                <p className="text-2xl font-bold">{stats.activeTargets}</p>
              </div>
              <Target className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-2xl font-bold">${stats.totalEarned.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Letters</p>
                <p className="text-2xl font-bold">{stats.lettersCount}</p>
              </div>
              <Mail className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 gap-1">
          <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs md:text-sm">Tasks</TabsTrigger>
          <TabsTrigger value="targets" className="text-xs md:text-sm">Targets</TabsTrigger>
          <TabsTrigger value="attendance" className="text-xs md:text-sm">Attendance</TabsTrigger>
          <TabsTrigger value="payroll" className="text-xs md:text-sm">Payroll</TabsTrigger>
          <TabsTrigger value="letters" className="text-xs md:text-sm">Letters</TabsTrigger>
          <TabsTrigger value="reports" className="text-xs md:text-sm">Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recent Tasks */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckSquare className="h-5 w-5" />
                    Recent Tasks
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('tasks')}
                    className="text-xs"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tasks.slice(0, 3).length > 0 ? (
                  <div className="space-y-2">
                    {tasks.slice(0, 3).map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{task.title}</p>
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Due: {format(parseISO(task.due_date), 'MMM dd')}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant={
                            task.status === 'completed'
                              ? 'default'
                              : task.status === 'in_progress'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs ml-2"
                        >
                          {task.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No tasks assigned
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Active Targets */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Target className="h-5 w-5" />
                    Active Targets
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveTab('targets')}
                    className="text-xs"
                  >
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {targets.filter(t => t.status === 'active').length > 0 ? (
                  <div className="space-y-3">
                    {targets
                      .filter(t => t.status === 'active')
                      .slice(0, 2)
                      .map((target) => {
                        const progress = (target.current_value / target.target_value) * 100;
                        return (
                          <div key={target.id} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm">{target.title}</p>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(progress)}%
                              </span>
                            </div>
                            <Progress value={progress} className="h-2" />
                          </div>
                        );
                      })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active targets
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* My Contracts - Quick Access */}
          {promoterDetails?.contracts && promoterDetails.contracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Briefcase className="h-5 w-5" />
                  My Contracts
                </CardTitle>
                <CardDescription>View your employment contracts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {promoterDetails.contracts.slice(0, 3).map((contract: any) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => router.push(`/${locale}/contracts/${contract.id}`)}
                    >
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {contract.title || contract.contract_type || 'Contract'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {contract.start_date && format(parseISO(contract.start_date), 'MMM dd, yyyy')}
                          {contract.end_date && ` - ${format(parseISO(contract.end_date), 'MMM dd, yyyy')}`}
                        </p>
                      </div>
                      <Badge
                        variant={
                          contract.status === 'active'
                            ? 'default'
                            : contract.status === 'completed'
                            ? 'secondary'
                            : 'outline'
                        }
                        className="text-xs"
                      >
                        {contract.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5" />
                My Tasks
              </CardTitle>
              <CardDescription>View and manage your assigned tasks</CardDescription>
            </CardHeader>
            <CardContent>
              {tasks.length > 0 ? (
                <div className="space-y-3">
                  {tasks.map((task) => (
                    <Card key={task.id} className="border">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium">{task.title}</p>
                              <Badge
                                variant={
                                  task.priority === 'high'
                                    ? 'destructive'
                                    : task.priority === 'medium'
                                    ? 'default'
                                    : 'outline'
                                }
                                className="text-xs"
                              >
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {task.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                              {task.due_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Due: {format(parseISO(task.due_date), 'MMM dd, yyyy')}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Created: {format(parseISO(task.created_at), 'MMM dd, yyyy')}
                              </span>
                            </div>
                            
                            {editingTask === task.id ? (
                              <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <label className="text-xs font-medium mb-1 block">Status</label>
                                  <Select value={taskStatus} onValueChange={setTaskStatus}>
                                    <SelectTrigger className="h-8">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="pending">Pending</SelectItem>
                                      <SelectItem value="in_progress">In Progress</SelectItem>
                                      <SelectItem value="completed">Completed</SelectItem>
                                      <SelectItem value="cancelled">Cancelled</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="text-xs font-medium mb-1 block">Notes</label>
                                  <Textarea
                                    value={taskNotes}
                                    onChange={(e) => setTaskNotes(e.target.value)}
                                    placeholder="Add completion notes..."
                                    className="min-h-[80px] text-sm"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateTask(task.id)}
                                    className="flex-1"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingTask(null);
                                      setTaskStatus('');
                                      setTaskNotes('');
                                    }}
                                    className="flex-1"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    task.status === 'completed'
                                      ? 'default'
                                      : task.status === 'in_progress'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                >
                                  {task.status.replace('_', ' ')}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingTask(task.id);
                                    setTaskStatus(task.status);
                                    setTaskNotes('');
                                  }}
                                  className="text-xs"
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Update
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No tasks assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Targets Tab */}
        <TabsContent value="targets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                My Targets
              </CardTitle>
              <CardDescription>Track your performance targets and goals</CardDescription>
            </CardHeader>
            <CardContent>
              {targets.length > 0 ? (
                <div className="space-y-4">
                  {targets.map((target) => {
                    const progress = (target.current_value / target.target_value) * 100;
                    const isCompleted = progress >= 100;
                    return (
                      <Card key={target.id} className={isCompleted ? 'border-green-200 bg-green-50' : ''}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-medium">{target.title}</p>
                              {target.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {target.description}
                                </p>
                              )}
                            </div>
                            {isCompleted && (
                              <Badge className="bg-green-600">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Completed
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">Progress</span>
                              <span className="font-semibold">
                                {target.current_value} / {target.target_value} {target.unit}
                              </span>
                            </div>
                            <Progress value={Math.min(100, progress)} className="h-3" />
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{Math.round(progress)}% complete</span>
                              {target.deadline && (
                                <span>
                                  Deadline: {format(parseISO(target.deadline), 'MMM dd, yyyy')}
                                </span>
                              )}
                            </div>
                            
                            {editingTarget === target.id ? (
                              <div className="space-y-3 mt-3 p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <label className="text-xs font-medium mb-1 block">
                                    Add Progress ({target.unit})
                                  </label>
                                  <Input
                                    type="number"
                                    value={targetProgress}
                                    onChange={(e) => setTargetProgress(e.target.value)}
                                    placeholder="Enter progress amount"
                                    className="h-8"
                                  />
                                </div>
                                <div>
                                  <label className="text-xs font-medium mb-1 block">Notes</label>
                                  <Textarea
                                    value={targetNotes}
                                    onChange={(e) => setTargetNotes(e.target.value)}
                                    placeholder="Add notes about this progress..."
                                    className="min-h-[60px] text-sm"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateTarget(target.id)}
                                    className="flex-1"
                                  >
                                    <Save className="h-3 w-3 mr-1" />
                                    Save Progress
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingTarget(null);
                                      setTargetProgress('');
                                      setTargetNotes('');
                                    }}
                                    className="flex-1"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditingTarget(target.id);
                                  setTargetProgress('');
                                  setTargetNotes('');
                                }}
                                className="w-full"
                                disabled={isCompleted}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Update Progress
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No targets assigned yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payroll & Earnings
              </CardTitle>
              <CardDescription>View your salary and payment history</CardDescription>
            </CardHeader>
            <CardContent>
              {payrollEntries.length > 0 ? (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Earned</p>
                      <p className="text-2xl font-bold text-green-700">
                        ${stats.totalEarned.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Pending Payments</p>
                      <p className="text-2xl font-bold text-orange-700">
                        {stats.pendingPayroll}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Payments</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {payrollEntries.length}
                      </p>
                    </div>
                  </div>

                  {/* Payroll History */}
                  <div className="space-y-2">
                    {payrollEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {format(parseISO(entry.period_start), 'MMM dd')} -{' '}
                            {format(parseISO(entry.period_end), 'MMM dd, yyyy')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Period: {format(parseISO(entry.period_start), 'MMM yyyy')}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">
                            ${entry.net_salary?.toLocaleString() || '0.00'}
                          </p>
                          <Badge
                            variant={
                              entry.payment_status === 'paid'
                                ? 'default'
                                : entry.payment_status === 'processing'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {entry.payment_status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No payroll records yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Letters Tab */}
        <TabsContent value="letters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                My Letters & Documents
              </CardTitle>
              <CardDescription>Employment letters, certificates, and official documents</CardDescription>
            </CardHeader>
            <CardContent>
              {letters.length > 0 ? (
                <div className="space-y-3">
                  {letters.map((letter) => (
                    <div
                      key={letter.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {letter.letter_type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                          </p>
                          <p className="text-sm text-muted-foreground">{letter.subject}</p>
                          {letter.issued_date && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Issued: {format(parseISO(letter.issued_date), 'MMM dd, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            letter.status === 'issued' || letter.status === 'signed'
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {letter.status}
                        </Badge>
                        {letter.document_url && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(letter.document_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No letters available yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <SmartAttendanceCard />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                My Reports
              </CardTitle>
              <CardDescription>View your performance and activity reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Performance Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Tasks Completed</p>
                        <p className="text-2xl font-bold">{stats.completedTasks}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          of {stats.totalTasks} total
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Active Targets</p>
                        <p className="text-2xl font-bold">{stats.activeTargets}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          In progress
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Total Earned</p>
                        <p className="text-2xl font-bold text-green-600">
                          ${stats.totalEarned.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          This period
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Generate and download report
                      toast({
                        title: 'Report Generation',
                        description: 'Report generation feature coming soon',
                      });
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      router.push(`/${locale}/manage-promoters/${promoterId}`);
                    }}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Full Profile
                  </Button>
                </div>

                {/* Recent Activity Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Recent Activity Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-muted-foreground">Tasks completed this month</span>
                        <span className="font-medium">{stats.completedTasks}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-muted-foreground">Active targets</span>
                        <span className="font-medium">{stats.activeTargets}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-muted-foreground">Pending payroll</span>
                        <span className="font-medium">{stats.pendingPayroll}</span>
                      </div>
                      <div className="flex items-center justify-between p-2 border rounded">
                        <span className="text-muted-foreground">Documents available</span>
                        <span className="font-medium">{stats.lettersCount}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

