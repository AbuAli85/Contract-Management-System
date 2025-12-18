'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  User,
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
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Award,
  FileCheck,
  Receipt,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';

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
        .from('employer_employee_tasks')
        .select('*')
        .eq('employer_employee_id', eeId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTasks(data as Task[]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchTargets = async (eeId: string) => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('employer_employee_targets')
        .select('*')
        .eq('employer_employee_id', eeId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setTargets(data as Target[]);
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Portal</h2>
          <p className="text-sm text-muted-foreground">Manage your tasks, targets, and documents</p>
        </div>
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Active Employee
        </Badge>
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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="payroll">Payroll</TabsTrigger>
          <TabsTrigger value="letters">Letters</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Recent Tasks */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CheckSquare className="h-5 w-5" />
                  Recent Tasks
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('tasks')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tasks.slice(0, 5).length > 0 ? (
                <div className="space-y-3">
                  {tasks.slice(0, 5).map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {task.description || 'No description'}
                        </p>
                        {task.due_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Due: {format(parseISO(task.due_date), 'MMM dd, yyyy')}
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
                      >
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No tasks assigned yet
                </p>
              )}
            </CardContent>
          </Card>

          {/* Active Targets */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Targets
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveTab('targets')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {targets.filter(t => t.status === 'active').length > 0 ? (
                <div className="space-y-4">
                  {targets
                    .filter(t => t.status === 'active')
                    .slice(0, 3)
                    .map((target) => {
                      const progress = (target.current_value / target.target_value) * 100;
                      return (
                        <div key={target.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{target.title}</p>
                            <span className="text-sm text-muted-foreground">
                              {target.current_value} / {target.target_value} {target.unit}
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                          {target.deadline && (
                            <p className="text-xs text-muted-foreground">
                              Deadline: {format(parseISO(target.deadline), 'MMM dd, yyyy')}
                            </p>
                          )}
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
                    <div
                      key={task.id}
                      className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
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
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
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
                      </div>
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
                    </div>
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
                            <div>
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
                          <div className="space-y-2">
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

        {/* Contracts Tab */}
        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                My Contracts
              </CardTitle>
              <CardDescription>Employment contracts and agreements</CardDescription>
            </CardHeader>
            <CardContent>
              {promoterDetails?.contracts && promoterDetails.contracts.length > 0 ? (
                <div className="space-y-3">
                  {promoterDetails.contracts.map((contract: any) => (
                    <div
                      key={contract.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className="font-medium">
                          {contract.title || contract.contract_type || 'Contract'}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          {contract.start_date && (
                            <span>
                              Start: {format(parseISO(contract.start_date), 'MMM dd, yyyy')}
                            </span>
                          )}
                          {contract.end_date && (
                            <span>
                              End: {format(parseISO(contract.end_date), 'MMM dd, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            contract.status === 'active'
                              ? 'default'
                              : contract.status === 'completed'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {contract.status}
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(`/${locale}/contracts/${contract.id}`)
                          }
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No contracts available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

