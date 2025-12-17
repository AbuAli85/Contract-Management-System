'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DollarSign,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Eye,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface PayrollRun {
  id: string;
  company_id: string;
  payroll_month: string;
  payroll_period: string;
  status: string;
  total_amount: number;
  total_employees: number;
  total_basic_salary: number;
  total_allowances: number;
  total_deductions: number;
  total_overtime: number;
  total_bonus: number;
  processed_at: string | null;
  approved_at: string | null;
  payment_date: string | null;
  created_at: string;
}

export function PayrollDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), 'yyyy-MM-01')
  );
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch payroll runs
  const { data: payrollData, isLoading } = useQuery({
    queryKey: ['payroll-runs', selectedMonth],
    queryFn: async () => {
      const response = await fetch(`/api/hr/payroll/runs?month=${selectedMonth}`);
      if (!response.ok) throw new Error('Failed to fetch payroll runs');
      return response.json();
    },
  });

  const payrollRuns = (payrollData?.payroll_runs || []) as PayrollRun[];

  // Create payroll run mutation
  const createPayrollMutation = useMutation({
    mutationFn: async (data: { company_id: string; payroll_month: string }) => {
      const response = await fetch('/api/hr/payroll/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create payroll run');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-runs'] });
      setCreateDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Payroll run created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleCreatePayroll = async () => {
    // Get company ID from user profile
    const response = await fetch('/api/user/profile');
    const profile = await response.json();
    
    if (!profile?.active_company_id) {
      toast({
        title: 'Error',
        description: 'No active company found',
        variant: 'destructive',
      });
      return;
    }

    createPayrollMutation.mutate({
      company_id: profile.active_company_id,
      payroll_month: selectedMonth,
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      processing: 'secondary',
      review: 'secondary',
      approved: 'default',
      paid: 'default',
      cancelled: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage payroll runs, process salaries, and generate payslips
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="month"
            value={format(new Date(selectedMonth), 'yyyy-MM')}
            onChange={(e) => setSelectedMonth(e.target.value + '-01')}
            className="px-3 py-2 border rounded-md"
          />
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Payroll Run
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Payroll Run</DialogTitle>
                <DialogDescription>
                  Create a new payroll run for {format(new Date(selectedMonth), 'MMMM yyyy')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Payroll Month</label>
                  <input
                    type="month"
                    value={format(new Date(selectedMonth), 'yyyy-MM')}
                    onChange={(e) => setSelectedMonth(e.target.value + '-01')}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  />
                </div>
                <Button
                  onClick={handleCreatePayroll}
                  disabled={createPayrollMutation.isPending}
                  className="w-full"
                >
                  {createPayrollMutation.isPending ? 'Creating...' : 'Create Payroll Run'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{payrollRuns.length}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrollRuns.reduce((sum, run) => sum + (run.total_amount || 0), 0).toFixed(2)} OMR
            </div>
            <p className="text-xs text-muted-foreground">Total processed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employees</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrollRuns.reduce((sum, run) => sum + (run.total_employees || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total employees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {payrollRuns.filter((r) => r.status === 'paid').length} / {payrollRuns.length}
            </div>
            <p className="text-xs text-muted-foreground">Paid runs</p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Runs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Runs</CardTitle>
          <CardDescription>
            All payroll runs for {format(new Date(selectedMonth), 'MMMM yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payrollRuns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payroll runs found for this month. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Allowances</TableHead>
                  <TableHead>Deductions</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRuns.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell>
                      {format(new Date(run.payroll_month), 'MMM yyyy')}
                    </TableCell>
                    <TableCell>{getStatusBadge(run.status)}</TableCell>
                    <TableCell>{run.total_employees}</TableCell>
                    <TableCell className="font-medium">
                      {run.total_amount?.toFixed(2)} OMR
                    </TableCell>
                    <TableCell>{run.total_basic_salary?.toFixed(2)} OMR</TableCell>
                    <TableCell>{run.total_allowances?.toFixed(2)} OMR</TableCell>
                    <TableCell>{run.total_deductions?.toFixed(2)} OMR</TableCell>
                    <TableCell>
                      <Link href={`/hr/payroll/runs/${run.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

