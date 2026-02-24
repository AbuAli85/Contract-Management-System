'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
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
import { ArrowLeft, CheckCircle, Eye, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import Link from 'next/link';

interface PayrollEntry {
  id: string;
  employer_employee_id: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  overtime_pay: number;
  bonus: number;
  gross_salary: number;
  net_salary: number;
  working_days: number;
  present_days: number;
  absent_days: number;
  leave_days: number;
  payment_status: string;
  employer_employee: {
    employee: {
      name_en?: string;
      name_ar?: string;
      email?: string;
    };
  };
}

export default function PayrollRunDetailPage() {
  const params = useParams();
  const _router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const runId = params.id as string;

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-run', runId],
    queryFn: async () => {
      const response = await fetch(`/api/hr/payroll/runs/${runId}`);
      if (!response.ok) throw new Error('Failed to fetch payroll run');
      return response.json();
    },
  });

  const payrollRun = data?.payroll_run;
  const entries = (data?.entries || []) as PayrollEntry[];

  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/hr/payroll/runs/${runId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' }),
      });
      if (!response.ok) throw new Error('Failed to approve payroll');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-run', runId] });
      toast({
        title: 'Success',
        description: 'Payroll run approved successfully',
      });
    },
  });

  const markPaidMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/hr/payroll/runs/${runId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
        }),
      });
      if (!response.ok) throw new Error('Failed to mark as paid');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-run', runId] });
      toast({
        title: 'Success',
        description: 'Payroll marked as paid',
      });
    },
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  if (!payrollRun) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground'>Payroll run not found</p>
        <Link href='/hr/payroll'>
          <Button variant='outline' className='mt-4'>
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back to Payroll
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <Link href='/hr/payroll'>
            <Button variant='ghost' size='sm' className='mb-2'>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back
            </Button>
          </Link>
          <h1 className='text-3xl font-bold'>
            Payroll Run -{' '}
            {format(new Date(payrollRun.payroll_month), 'MMMM yyyy')}
          </h1>
          <p className='text-muted-foreground mt-1'>
            Review and manage payroll entries
          </p>
        </div>
        <div className='flex gap-2'>
          {payrollRun.status === 'draft' && (
            <Button
              onClick={() => approveMutation.mutate()}
              disabled={approveMutation.isPending}
            >
              <CheckCircle className='h-4 w-4 mr-2' />
              Approve
            </Button>
          )}
          {payrollRun.status === 'approved' && (
            <Button
              onClick={() => markPaidMutation.mutate()}
              disabled={markPaidMutation.isPending}
            >
              <DollarSign className='h-4 w-4 mr-2' />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={payrollRun.status === 'paid' ? 'default' : 'outline'}
            >
              {payrollRun.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {payrollRun.total_amount?.toFixed(2)} OMR
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Employees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {payrollRun.total_employees}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className='text-sm font-medium'>Net Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {payrollRun.total_amount?.toFixed(2)} OMR
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Entries</CardTitle>
          <CardDescription>
            Individual payslips for each employee
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Basic Salary</TableHead>
                <TableHead>Allowances</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Net Salary</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {entry.employer_employee?.employee?.name_en ||
                      entry.employer_employee?.employee?.name_ar ||
                      'Unknown'}
                  </TableCell>
                  <TableCell>{entry.basic_salary?.toFixed(2)} OMR</TableCell>
                  <TableCell>{entry.allowances?.toFixed(2)} OMR</TableCell>
                  <TableCell>{entry.deductions?.toFixed(2)} OMR</TableCell>
                  <TableCell>{entry.overtime_pay?.toFixed(2)} OMR</TableCell>
                  <TableCell className='font-medium'>
                    {entry.net_salary?.toFixed(2)} OMR
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.payment_status === 'paid'
                          ? 'default'
                          : entry.payment_status === 'failed'
                            ? 'destructive'
                            : 'outline'
                      }
                    >
                      {entry.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant='ghost' size='sm'>
                      <Eye className='h-4 w-4 mr-2' />
                      View Payslip
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
