'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Users,
  Briefcase,
  CheckSquare,
  Target,
  Clock,
  Building2,
  Calendar,
  MapPin,
  TrendingUp,
  AlertCircle,
  Eye,
  Link as LinkIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Employee {
  id: string;
  employee_id: string;
  job_title?: string;
  department?: string;
  employment_status: string;
  employee: {
    name_en?: string;
    name_ar?: string;
    email?: string;
  };
}

interface Assignment {
  id: string;
  client_party_id: string;
  job_title: string;
  department?: string;
  work_location?: string;
  start_date: string;
  end_date?: string;
  status: string;
  client?: {
    name_en?: string;
    name_ar?: string;
  };
}

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date?: string;
  progress?: number;
}

interface Target {
  id: string;
  title: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  status: string;
  end_date: string;
}

interface EmployeeOverview {
  employee: Employee;
  assignments: Assignment[];
  tasks: Task[];
  targets: Target[];
  stats: {
    activeAssignments: number;
    completedTasks: number;
    totalTasks: number;
    activeTargets: number;
    targetsProgress: number;
  };
}

interface EmployerEmployeeAlignmentProps {
  employerId?: string;
  locale?: string;
}

// Helper function to safely get assignment client name
function getAssignmentClientName(emp: EmployeeOverview): string {
  const assignments = emp.assignments;
  if (!assignments || assignments.length === 0) {
    return '-';
  }
  const first = assignments[0];
  if (!first || !first.client) {
    return '-';
  }
  return first.client.name_en ?? 'Multiple';
}

export function EmployerEmployeeAlignment({
  employerId,
  locale = 'en',
}: EmployerEmployeeAlignmentProps) {
  const { toast } = useToast();
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(
    null
  );
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  // Fetch all employees with their assignments, tasks, and targets
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employer-employees-alignment', employerId],
    queryFn: async () => {
      const response = await fetch(
        `/api/hr/employer-employees/alignment${employerId ? `?employer_id=${employerId}` : ''}`
      );
      if (!response.ok) throw new Error('Failed to fetch data');
      return response.json();
    },
  });

  const employeesRaw = (employeesData?.employees || []) as EmployeeOverview[];
  const employees: EmployeeOverview[] = employeesRaw.filter(
    (emp: EmployeeOverview): emp is EmployeeOverview =>
      emp !== null && emp !== undefined
  );

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading employee alignment...</p>
        </div>
      </div>
    );
  }

  const selectedEmployee = employees.find(
    e => e.employee.id === selectedEmployeeId
  );

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Employer-Employee Alignment</h1>
          <p className='text-muted-foreground mt-1'>
            Comprehensive view of employees, assignments, tasks, and targets
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant={viewMode === 'overview' ? 'default' : 'outline'}
            onClick={() => setViewMode('overview')}
          >
            Overview
          </Button>
          <Button
            variant={viewMode === 'detailed' ? 'default' : 'outline'}
            onClick={() => setViewMode('detailed')}
          >
            Detailed View
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Employees
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{employees.length}</div>
            <p className='text-xs text-muted-foreground'>
              {
                employees.filter(e => e.employee.employment_status === 'active')
                  .length
              }{' '}
              active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Active Assignments
            </CardTitle>
            <Briefcase className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {employees.reduce((sum, e) => sum + e.stats.activeAssignments, 0)}
            </div>
            <p className='text-xs text-muted-foreground'>
              Across all employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Tasks Progress
            </CardTitle>
            <CheckSquare className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {employees.reduce((sum, e) => sum + e.stats.completedTasks, 0)} /{' '}
              {employees.reduce((sum, e) => sum + e.stats.totalTasks, 0)}
            </div>
            <p className='text-xs text-muted-foreground'>Completed tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Targets Progress
            </CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {employees.length > 0
                ? Math.round(
                    employees.reduce(
                      (sum, e) => sum + e.stats.targetsProgress,
                      0
                    ) / employees.length
                  )
                : 0}
              %
            </div>
            <p className='text-xs text-muted-foreground'>Average progress</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue='employees' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='employees'>Employees & Assignments</TabsTrigger>
          <TabsTrigger value='tasks'>Tasks Overview</TabsTrigger>
          <TabsTrigger value='targets'>Targets Overview</TabsTrigger>
        </TabsList>

        {/* Employees & Assignments Tab */}
        <TabsContent value='employees' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Employees & Their Assignments</CardTitle>
              <CardDescription>
                View all employees and their current client assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                {employees.map(empOverview => (
                  <div
                    key={empOverview.employee.id}
                    className={cn(
                      'border rounded-lg p-4 space-y-4',
                      selectedEmployeeId === empOverview.employee.id &&
                        'ring-2 ring-primary'
                    )}
                  >
                    {/* Employee Header */}
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-4'>
                        <div>
                          <h3 className='font-semibold text-lg'>
                            {empOverview.employee.employee?.name_en ||
                              empOverview.employee.employee?.name_ar ||
                              'Unknown'}
                          </h3>
                          <div className='flex items-center gap-4 mt-1 text-sm text-muted-foreground'>
                            <span>
                              {empOverview.employee.job_title || 'No title'}
                            </span>
                            {empOverview.employee.department && (
                              <>
                                <span>•</span>
                                <span>{empOverview.employee.department}</span>
                              </>
                            )}
                            <Badge
                              variant={
                                empOverview.employee.employment_status ===
                                'active'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {empOverview.employee.employment_status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          setSelectedEmployeeId(
                            selectedEmployeeId === empOverview.employee.id
                              ? null
                              : empOverview.employee.id
                          )
                        }
                      >
                        <Eye className='h-4 w-4 mr-2' />
                        {selectedEmployeeId === empOverview.employee.id
                          ? 'Hide'
                          : 'View'}{' '}
                        Details
                      </Button>
                    </div>

                    {/* Quick Stats */}
                    <div className='grid grid-cols-4 gap-4'>
                      <div className='text-center p-2 bg-muted rounded'>
                        <div className='text-2xl font-bold'>
                          {empOverview.stats.activeAssignments}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Assignments
                        </div>
                      </div>
                      <div className='text-center p-2 bg-muted rounded'>
                        <div className='text-2xl font-bold'>
                          {empOverview.stats.completedTasks}/
                          {empOverview.stats.totalTasks}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Tasks
                        </div>
                      </div>
                      <div className='text-center p-2 bg-muted rounded'>
                        <div className='text-2xl font-bold'>
                          {empOverview.stats.activeTargets}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Targets
                        </div>
                      </div>
                      <div className='text-center p-2 bg-muted rounded'>
                        <div className='text-2xl font-bold'>
                          {empOverview.stats.targetsProgress}%
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          Progress
                        </div>
                      </div>
                    </div>

                    {/* Assignments */}
                    {empOverview.assignments.length > 0 ? (
                      <div>
                        <h4 className='font-medium mb-2 flex items-center gap-2'>
                          <Briefcase className='h-4 w-4' />
                          Client Assignments
                        </h4>
                        <div className='space-y-2'>
                          {empOverview.assignments.map(assignment => (
                            <div
                              key={assignment.id}
                              className='flex items-center justify-between p-3 border rounded-lg'
                            >
                              <div className='flex-1'>
                                <div className='flex items-center gap-2'>
                                  <Building2 className='h-4 w-4 text-muted-foreground' />
                                  <span className='font-medium'>
                                    {assignment.client?.name_en ||
                                      assignment.client?.name_ar ||
                                      'Unknown Client'}
                                  </span>
                                  <Badge variant='outline'>
                                    {assignment.status}
                                  </Badge>
                                </div>
                                <div className='text-sm text-muted-foreground mt-1'>
                                  {assignment.job_title}
                                  {assignment.department &&
                                    ` • ${assignment.department}`}
                                  {assignment.work_location && (
                                    <>
                                      {' • '}
                                      <MapPin className='h-3 w-3 inline mr-1' />
                                      {assignment.work_location}
                                    </>
                                  )}
                                </div>
                                <div className='text-xs text-muted-foreground mt-1'>
                                  <Calendar className='h-3 w-3 inline mr-1' />
                                  {format(
                                    new Date(assignment.start_date),
                                    'MMM dd, yyyy'
                                  )}
                                  {assignment.end_date &&
                                    ` - ${format(new Date(assignment.end_date), 'MMM dd, yyyy')}`}
                                </div>
                              </div>
                              <Link
                                href={`/hr/assignments?employee=${empOverview.employee.id}`}
                              >
                                <Button variant='ghost' size='sm'>
                                  <LinkIcon className='h-4 w-4' />
                                </Button>
                              </Link>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className='text-center py-4 text-muted-foreground'>
                        No active assignments
                      </div>
                    )}

                    {/* Expanded Details */}
                    {selectedEmployeeId === empOverview.employee.id && (
                      <div className='pt-4 border-t space-y-4'>
                        {/* Tasks */}
                        {empOverview.tasks.length > 0 && (
                          <div>
                            <h4 className='font-medium mb-2 flex items-center gap-2'>
                              <CheckSquare className='h-4 w-4' />
                              Recent Tasks
                            </h4>
                            <div className='space-y-2'>
                              {empOverview.tasks.slice(0, 5).map(task => (
                                <div
                                  key={task.id}
                                  className='flex items-center justify-between p-2 border rounded text-sm'
                                >
                                  <div className='flex-1'>
                                    <span className='font-medium'>
                                      {task.title}
                                    </span>
                                    <div className='flex items-center gap-2 mt-1'>
                                      <Badge
                                        variant={
                                          task.status === 'completed'
                                            ? 'default'
                                            : task.priority === 'urgent'
                                              ? 'destructive'
                                              : 'outline'
                                        }
                                        className='text-xs'
                                      >
                                        {task.status}
                                      </Badge>
                                      {task.due_date && (
                                        <span className='text-xs text-muted-foreground'>
                                          Due:{' '}
                                          {format(
                                            new Date(task.due_date),
                                            'MMM dd'
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Targets */}
                        {empOverview.targets.length > 0 && (
                          <div>
                            <h4 className='font-medium mb-2 flex items-center gap-2'>
                              <Target className='h-4 w-4' />
                              Active Targets
                            </h4>
                            <div className='space-y-2'>
                              {empOverview.targets.map(target => (
                                <div
                                  key={target.id}
                                  className='p-3 border rounded-lg'
                                >
                                  <div className='flex items-center justify-between mb-2'>
                                    <span className='font-medium'>
                                      {target.title}
                                    </span>
                                    <Badge variant='outline'>
                                      {target.status}
                                    </Badge>
                                  </div>
                                  <div className='flex items-center gap-2 mb-2'>
                                    <div className='flex-1 bg-muted rounded-full h-2'>
                                      {/* Dynamic width required for progress bar */}
                                      <div
                                        className='bg-primary h-2 rounded-full transition-all'
                                        style={
                                          {
                                            width: `${Math.min(100, Math.max(0, target.progress_percentage || 0))}%`,
                                          } as React.CSSProperties
                                        }
                                      />
                                    </div>
                                    <span className='text-sm font-medium'>
                                      {target.progress_percentage}%
                                    </span>
                                  </div>
                                  <div className='text-xs text-muted-foreground'>
                                    {target.current_value} /{' '}
                                    {target.target_value} • Ends:{' '}
                                    {format(
                                      new Date(target.end_date),
                                      'MMM dd, yyyy'
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Overview Tab */}
        <TabsContent value='tasks'>
          <Card>
            <CardHeader>
              <CardTitle>All Tasks Overview</CardTitle>
              <CardDescription>
                Tasks across all employees and assignments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Task</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Assignment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.flatMap(emp => {
                    // TypeScript type guard: emp is guaranteed to be EmployeeOverview after filter
                    if (!emp || typeof emp !== 'object' || !('tasks' in emp)) {
                      return [];
                    }
                    const employee: EmployeeOverview = emp;
                    const tasks = employee.tasks || [];
                    return tasks.map(task => (
                      <TableRow key={task.id}>
                        <TableCell>
                          {employee.employee?.employee?.name_en ||
                            employee.employee?.employee?.name_ar}
                        </TableCell>
                        <TableCell className='font-medium'>
                          {task.title}
                        </TableCell>
                        <TableCell>
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
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              task.priority === 'urgent'
                                ? 'destructive'
                                : task.priority === 'high'
                                  ? 'default'
                                  : 'outline'
                            }
                          >
                            {task.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {task.due_date
                            ? format(new Date(task.due_date), 'MMM dd, yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          {getAssignmentClientName(employee)}
                        </TableCell>
                      </TableRow>
                    ));
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Targets Overview Tab */}
        <TabsContent value='targets'>
          <Card>
            <CardHeader>
              <CardTitle>All Targets Overview</CardTitle>
              <CardDescription>
                Targets and goals across all employees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {employees.map(emp =>
                  emp.targets.length > 0 ? (
                    <div
                      key={emp.employee.id}
                      className='border rounded-lg p-4'
                    >
                      <h3 className='font-semibold mb-3'>
                        {emp.employee.employee?.name_en ||
                          emp.employee.employee?.name_ar}
                      </h3>
                      <div className='space-y-3'>
                        {emp.targets.map(target => (
                          <div key={target.id}>
                            <div className='flex items-center justify-between mb-2'>
                              <span className='font-medium'>
                                {target.title}
                              </span>
                              <Badge variant='outline'>{target.status}</Badge>
                            </div>
                            <div className='flex items-center gap-2'>
                              <div className='flex-1 bg-muted rounded-full h-2'>
                                {/* Dynamic width required for progress bar */}
                                <div
                                  className={cn(
                                    'h-2 rounded-full transition-all',
                                    target.progress_percentage >= 80
                                      ? 'bg-green-500'
                                      : target.progress_percentage >= 50
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                  )}
                                  style={
                                    {
                                      width: `${Math.min(100, Math.max(0, target.progress_percentage || 0))}%`,
                                    } as React.CSSProperties
                                  }
                                />
                              </div>
                              <span className='text-sm font-medium w-16 text-right'>
                                {target.progress_percentage}%
                              </span>
                            </div>
                            <div className='text-xs text-muted-foreground mt-1'>
                              {target.current_value} / {target.target_value} •
                              Ends:{' '}
                              {format(
                                new Date(target.end_date),
                                'MMM dd, yyyy'
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
