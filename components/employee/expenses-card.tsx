'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Receipt,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  Loader2,
  Calendar,
  Upload,
  CreditCard,
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
  category?: {
    id: string;
    name: string;
  } | null;
  reviewed_by_user?: {
    full_name: string | null;
  } | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
}

interface ExpenseStats {
  pending: number;
  approved: number;
  paid: number;
  total: number;
  pendingCount: number;
}

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ElementType }
> = {
  draft: {
    label: 'Draft',
    color: 'text-gray-600',
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    icon: Clock,
  },
  pending: {
    label: 'Pending',
    color: 'text-amber-600',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-red-600',
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: XCircle,
  },
  paid: {
    label: 'Paid',
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: CreditCard,
  },
};

export function ExpensesCard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<ExpenseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category_id: '',
    expense_date: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    currency: 'OMR',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await fetch('/api/employee/expenses');
      const data = await response.json();

      if (response.ok && data.success) {
        setExpenses(data.expenses || []);
        setCategories(data.categories || []);
        setStats(data.stats || null);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/employee/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '✅ Expense Submitted',
        description: 'Your expense is pending approval',
      });

      setDialogOpen(false);
      setFormData({
        category_id: '',
        expense_date: new Date().toISOString().slice(0, 10),
        description: '',
        amount: '',
        currency: 'OMR',
      });
      fetchExpenses();
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
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
            <Receipt className='h-5 w-5 text-emerald-600' />
            Expense Claims
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size='sm'>
                <Plus className='h-4 w-4 mr-1' />
                New Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Submit Expense</DialogTitle>
                <DialogDescription>
                  Submit an expense claim for reimbursement
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className='space-y-4'>
                <div className='space-y-2'>
                  <Label>Category</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={v =>
                      setFormData(prev => ({ ...prev, category_id: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Select category' />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label>Date</Label>
                    <Input
                      type='date'
                      value={formData.expense_date}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          expense_date: e.target.value,
                        }))
                      }
                      max={new Date().toISOString().slice(0, 10)}
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label>Amount</Label>
                    <div className='relative'>
                      <span className='absolute left-3 top-1/2 -translate-y-1/2 text-gray-500'>
                        {formData.currency}
                      </span>
                      <Input
                        type='number'
                        step='0.01'
                        min='0'
                        value={formData.amount}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            amount: e.target.value,
                          }))
                        }
                        className='pl-14'
                        placeholder='0.00'
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label>Description</Label>
                  <Textarea
                    placeholder='Describe the expense...'
                    value={formData.description}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    rows={3}
                    required
                  />
                </div>

                <DialogFooter>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={submitting}>
                    {submitting && (
                      <Loader2 className='h-4 w-4 animate-spin mr-2' />
                    )}
                    Submit Expense
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Stats */}
        {stats && (
          <div className='grid grid-cols-3 gap-3'>
            <div className='p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-center'>
              <p className='text-lg font-bold text-amber-600'>
                {formData.currency} {stats.pending.toFixed(0)}
              </p>
              <p className='text-xs text-gray-500'>
                Pending ({stats.pendingCount})
              </p>
            </div>
            <div className='p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center'>
              <p className='text-lg font-bold text-green-600'>
                {formData.currency} {stats.approved.toFixed(0)}
              </p>
              <p className='text-xs text-gray-500'>Approved</p>
            </div>
            <div className='p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center'>
              <p className='text-lg font-bold text-blue-600'>
                {formData.currency} {stats.paid.toFixed(0)}
              </p>
              <p className='text-xs text-gray-500'>Paid</p>
            </div>
          </div>
        )}

        {/* Expense List */}
        <div className='space-y-3 max-h-[300px] overflow-y-auto pr-1'>
          {expenses.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <Receipt className='h-12 w-12 mx-auto mb-2 opacity-30' />
              <p>No expense claims</p>
            </div>
          ) : (
            expenses.slice(0, 10).map(expense => {
              const statusCfg =
                statusConfig[expense.status] ?? statusConfig.pending;
              const StatusIcon = statusCfg?.icon ?? Clock;

              return (
                <div
                  key={expense.id}
                  className='p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        {expense.category && (
                          <Badge variant='outline' className='text-xs'>
                            {expense.category.name}
                          </Badge>
                        )}
                        <span className='text-xs text-gray-500'>
                          {format(
                            new Date(expense.expense_date),
                            'MMM d, yyyy'
                          )}
                        </span>
                      </div>
                      <p className='font-medium truncate'>
                        {expense.description}
                      </p>
                      <p className='text-lg font-bold text-emerald-600'>
                        {expense.currency} {expense.amount.toFixed(2)}
                      </p>
                    </div>
                    <Badge
                      className={cn(
                        statusCfg?.bg,
                        statusCfg?.color,
                        'border-0 flex items-center gap-1'
                      )}
                    >
                      <StatusIcon className='h-3 w-3' />
                      {statusCfg?.label}
                    </Badge>
                  </div>
                  {expense.review_notes && expense.status !== 'pending' && (
                    <p className='mt-2 text-xs text-gray-500 italic'>
                      Note: {expense.review_notes}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
