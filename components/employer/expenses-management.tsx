'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Receipt,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  CreditCard,
  Loader2,
  Filter,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface Expense {
  id: string;
  expense_date: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  receipt_url: string | null;
  review_notes: string | null;
  created_at: string;
  category?: {
    id: string;
    name: string;
  } | null;
  employer_employee?: {
    job_title: string | null;
    department: string | null;
    employee?: {
      full_name: string | null;
      email: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

interface ExpenseStats {
  pending: number;
  approved: number;
  paid: number;
  total: number;
  pendingCount: number;
  approvedCount: number;
}

export function ExpensesManagement() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'paid'>(
    'all'
  );
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'pay'>(
    'approve'
  );
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/employer/expenses');
      const data = await response.json();

      if (response.ok && data.success) {
        setExpenses(data.expenses || []);
        setStats(data.stats || null);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedExpense) return;
    setProcessing(true);

    try {
      const response = await fetch(
        `/api/employer/expenses/${selectedExpense.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionType,
            review_notes: reviewNotes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      const actionLabels = {
        approve: 'Approved',
        reject: 'Rejected',
        pay: 'Marked as Paid',
      };
      toast({
        title: `✅ Expense ${actionLabels[actionType]}`,
        description: `${selectedExpense.currency} ${selectedExpense.amount.toFixed(2)}`,
      });

      setActionDialogOpen(false);
      setSelectedExpense(null);
      setReviewNotes('');
      fetchExpenses();
    } catch (error: any) {
      toast({
        title: 'Action Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (
    expense: Expense,
    action: 'approve' | 'reject' | 'pay'
  ) => {
    setSelectedExpense(expense);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const filteredExpenses =
    filter === 'all' ? expenses : expenses.filter(e => e.status === filter);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats */}
      {stats && (
        <div className='grid grid-cols-4 gap-4'>
          <Card
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg',
              filter === 'pending' && 'ring-2 ring-amber-400'
            )}
            onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
          >
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-500'>Pending</p>
                  <p className='text-2xl font-bold text-amber-600'>
                    OMR {stats.pending.toFixed(0)}
                  </p>
                  <p className='text-xs text-gray-400'>
                    {stats.pendingCount} claims
                  </p>
                </div>
                <Clock className='h-8 w-8 text-amber-500 opacity-50' />
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg',
              filter === 'approved' && 'ring-2 ring-green-400'
            )}
            onClick={() =>
              setFilter(filter === 'approved' ? 'all' : 'approved')
            }
          >
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-500'>Approved</p>
                  <p className='text-2xl font-bold text-green-600'>
                    OMR {stats.approved.toFixed(0)}
                  </p>
                  <p className='text-xs text-gray-400'>
                    {stats.approvedCount} awaiting payment
                  </p>
                </div>
                <CheckCircle2 className='h-8 w-8 text-green-500 opacity-50' />
              </div>
            </CardContent>
          </Card>
          <Card
            className={cn(
              'cursor-pointer transition-all hover:shadow-lg',
              filter === 'paid' && 'ring-2 ring-blue-400'
            )}
            onClick={() => setFilter(filter === 'paid' ? 'all' : 'paid')}
          >
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-500'>Paid</p>
                  <p className='text-2xl font-bold text-blue-600'>
                    OMR {stats.paid.toFixed(0)}
                  </p>
                </div>
                <CreditCard className='h-8 w-8 text-blue-500 opacity-50' />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='pt-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-gray-500'>Total Claims</p>
                  <p className='text-2xl font-bold text-gray-900 dark:text-white'>
                    OMR {stats.total.toFixed(0)}
                  </p>
                </div>
                <Receipt className='h-8 w-8 text-gray-500 opacity-50' />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Expense List */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <Receipt className='h-5 w-5' />
                Expense Claims
              </CardTitle>
              <CardDescription>
                {filter === 'all' ? 'All claims' : `Filtered: ${filter}`}
              </CardDescription>
            </div>
            {filter !== 'all' && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setFilter('all')}
              >
                <Filter className='h-4 w-4 mr-1' />
                Clear Filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {filteredExpenses.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <Receipt className='h-12 w-12 mx-auto mb-2 opacity-30' />
                <p>
                  No expense claims{' '}
                  {filter !== 'all' ? `with status "${filter}"` : ''}
                </p>
              </div>
            ) : (
              filteredExpenses.map(expense => {
                const employee = expense.employer_employee?.employee;

                return (
                  <div
                    key={expense.id}
                    className='p-4 border rounded-xl hover:shadow-md transition-all'
                  >
                    <div className='flex items-start gap-4'>
                      <Avatar className='h-12 w-12'>
                        <AvatarImage src={employee?.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(employee?.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between gap-4'>
                          <div>
                            <h4 className='font-medium'>
                              {employee?.full_name || 'Unknown'}
                            </h4>
                            <p className='text-sm text-gray-500'>
                              {expense.employer_employee?.job_title ||
                                'No title'}
                            </p>
                          </div>
                          <div className='text-right'>
                            <p className='text-xl font-bold text-emerald-600'>
                              {expense.currency} {expense.amount.toFixed(2)}
                            </p>
                            <Badge
                              className={cn(
                                expense.status === 'pending' &&
                                  'bg-amber-100 text-amber-700',
                                expense.status === 'approved' &&
                                  'bg-green-100 text-green-700',
                                expense.status === 'rejected' &&
                                  'bg-red-100 text-red-700',
                                expense.status === 'paid' &&
                                  'bg-blue-100 text-blue-700',
                                'border-0'
                              )}
                            >
                              {expense.status.charAt(0).toUpperCase() +
                                expense.status.slice(1)}
                            </Badge>
                          </div>
                        </div>

                        <div className='mt-2'>
                          {expense.category && (
                            <Badge variant='outline' className='mr-2'>
                              {expense.category.name}
                            </Badge>
                          )}
                          <span className='text-sm text-gray-500'>
                            {format(
                              new Date(expense.expense_date),
                              'MMM d, yyyy'
                            )}
                          </span>
                        </div>

                        <p className='mt-2 text-sm text-gray-700 dark:text-gray-300'>
                          {expense.description}
                        </p>

                        {expense.receipt_url && (
                          <a
                            href={expense.receipt_url}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='inline-flex items-center gap-1 mt-2 text-sm text-blue-600 hover:underline'
                          >
                            <ExternalLink className='h-3 w-3' />
                            View Receipt
                          </a>
                        )}

                        {/* Action Buttons */}
                        <div className='mt-4 flex gap-2'>
                          {expense.status === 'pending' && (
                            <>
                              <Button
                                size='sm'
                                className='bg-green-600 hover:bg-green-700'
                                onClick={() =>
                                  openActionDialog(expense, 'approve')
                                }
                              >
                                <CheckCircle2 className='h-4 w-4 mr-1' />
                                Approve
                              </Button>
                              <Button
                                size='sm'
                                variant='destructive'
                                onClick={() =>
                                  openActionDialog(expense, 'reject')
                                }
                              >
                                <XCircle className='h-4 w-4 mr-1' />
                                Reject
                              </Button>
                            </>
                          )}
                          {expense.status === 'approved' && (
                            <Button
                              size='sm'
                              className='bg-blue-600 hover:bg-blue-700'
                              onClick={() => openActionDialog(expense, 'pay')}
                            >
                              <CreditCard className='h-4 w-4 mr-1' />
                              Mark as Paid
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve'
                ? 'Approve Expense'
                : actionType === 'reject'
                  ? 'Reject Expense'
                  : 'Mark as Paid'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' &&
                'This will approve the expense for payment.'}
              {actionType === 'reject' && 'This will reject the expense claim.'}
              {actionType === 'pay' && 'This will mark the expense as paid.'}
            </DialogDescription>
          </DialogHeader>

          {selectedExpense && (
            <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-lg'>
              <p className='font-medium'>
                {selectedExpense.employer_employee?.employee?.full_name}
              </p>
              <p className='text-sm text-gray-500'>
                {selectedExpense.description}
              </p>
              <p className='text-lg font-bold text-emerald-600 mt-1'>
                {selectedExpense.currency} {selectedExpense.amount.toFixed(2)}
              </p>
            </div>
          )}

          {actionType !== 'pay' && (
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Notes (Optional)</label>
              <Textarea
                placeholder={
                  actionType === 'reject'
                    ? 'Reason for rejection...'
                    : 'Any notes...'
                }
                value={reviewNotes}
                onChange={e => setReviewNotes(e.target.value)}
                rows={3}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={cn(
                actionType === 'approve' && 'bg-green-600 hover:bg-green-700',
                actionType === 'pay' && 'bg-blue-600 hover:bg-blue-700'
              )}
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing && <Loader2 className='h-4 w-4 animate-spin mr-2' />}
              {actionType === 'approve'
                ? 'Approve'
                : actionType === 'reject'
                  ? 'Reject'
                  : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
