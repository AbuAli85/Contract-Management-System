'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  ArrowUpRight,
  Wallet,
  CreditCard,
  AlertCircle,
  Send,
  CheckCircle,
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface PromoterFinancialSummaryProps {
  promoterId: string;
  contracts?: any[];
  isAdmin?: boolean;
  onProcessPayment?: (amount: number) => void;
}

interface FinancialData {
  totalEarned: number;
  pendingPayout: number;
  nextPayoutDate: string;
  lastPayoutAmount: number;
  lastPayoutDate: string;
  ytdEarnings: number;
  averageMonthly: number;
  payoutHistory: PayoutRecord[];
}

interface PayoutRecord {
  id: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'processing';
  method: string;
}

export function PromoterFinancialSummary({
  promoterId,
  contracts = [],
  isAdmin = false,
  onProcessPayment,
}: PromoterFinancialSummaryProps) {
  const [financialData, setFinancialData] = useState<FinancialData>({
    totalEarned: 0,
    pendingPayout: 0,
    nextPayoutDate: '',
    lastPayoutAmount: 0,
    lastPayoutDate: '',
    ytdEarnings: 0,
    averageMonthly: 0,
    payoutHistory: [],
  });
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    fetchFinancialData();
  }, [promoterId, contracts]);

  const fetchFinancialData = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      if (!supabase) {
        calculateFromContracts();
        return;
      }

      // Try to fetch from payroll_entries via employer_employees
      let totalEarned = 0;
      let pendingPayout = 0;
      const payoutHistory: PayoutRecord[] = [];

      // Get employer_employee_id for this promoter
      const { data: employerEmployee } = await supabase
        .from('employer_employees')
        .select('id')
        .eq('employee_id', promoterId)
        .single()
        .catch(() => ({ data: null, error: null }));

      if (employerEmployee?.id) {
        // Fetch payroll entries
        const { data: payrollEntries } = await supabase
          .from('payroll_entries')
          .select(
            'net_salary, payment_status, payment_date, payment_method, created_at'
          )
          .eq('employer_employee_id', employerEmployee.id)
          .order('created_at', { ascending: false })
          .catch(() => ({ data: [], error: null }));

        if (payrollEntries && payrollEntries.length > 0) {
          // Calculate totals from real payroll data
          const completedPayments = payrollEntries.filter(
            (p: any) => p.payment_status === 'paid'
          );
          const pendingPayments = payrollEntries.filter(
            (p: any) => p.payment_status === 'pending'
          );

          totalEarned = completedPayments.reduce(
            (sum: number, p: any) => sum + (Number(p.net_salary) || 0),
            0
          );
          pendingPayout = pendingPayments.reduce(
            (sum: number, p: any) => sum + (Number(p.net_salary) || 0),
            0
          );

          // Build payout history from payroll entries
          payrollEntries.slice(0, 10).forEach((entry: any) => {
            if (entry.payment_status === 'paid' && entry.payment_date) {
              payoutHistory.push({
                id: entry.id || `payout-${payoutHistory.length}`,
                amount: Number(entry.net_salary) || 0,
                date: entry.payment_date,
                status: 'completed',
                method: entry.payment_method || 'Bank Transfer',
              });
            }
          });
        }
      }

      // Fallback to contract-based calculation if no payroll data
      if (totalEarned === 0 && pendingPayout === 0) {
        calculateFromContracts();
        return;
      }

      // Calculate YTD and monthly averages
      const now = new Date();
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const ytdPayments = payoutHistory.filter(
        p => new Date(p.date) >= yearStart
      );
      const ytdEarnings = ytdPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthsElapsed = Math.max(1, now.getMonth() + 1);
      const averageMonthly = ytdEarnings / monthsElapsed;

      // Next payout is typically 15th of next month
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);

      setFinancialData({
        totalEarned: Math.round(totalEarned * 100) / 100,
        pendingPayout: Math.round(pendingPayout * 100) / 100,
        nextPayoutDate: format(nextMonth, 'yyyy-MM-dd'),
        lastPayoutAmount: payoutHistory[0]?.amount || 0,
        lastPayoutDate: payoutHistory[0]?.date || '',
        ytdEarnings: Math.round(ytdEarnings * 100) / 100,
        averageMonthly: Math.round(averageMonthly * 100) / 100,
        payoutHistory: payoutHistory.slice(0, 10),
      });
    } catch (error) {
      console.error('Error fetching financial data:', error);
      calculateFromContracts();
    }
  };

  const calculateFromContracts = () => {
    // Fallback calculation from contracts
    const completedContracts = contracts.filter(
      (c: any) => c.status === 'completed'
    );
    const activeContracts = contracts.filter((c: any) => c.status === 'active');

    // Calculate from contract amounts
    const totalEarned = completedContracts.reduce(
      (sum: number, c: any) => sum + (Number(c.amount) || 0),
      0
    );
    const pendingPayout = activeContracts.reduce(
      (sum: number, c: any) => sum + (Number(c.amount) || 0) * 0.5, // Estimate 50% pending
      0
    );

    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const ytdContracts = completedContracts.filter(
      (c: any) => c.end_date && new Date(c.end_date) >= yearStart
    );
    const ytdEarnings = ytdContracts.reduce(
      (sum: number, c: any) => sum + (Number(c.amount) || 0),
      0
    );
    const monthsElapsed = Math.max(1, now.getMonth() + 1);
    const averageMonthly = ytdEarnings / monthsElapsed;

    // Next payout is typically 15th of next month
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);

    // Generate payout history from completed contracts
    const history: PayoutRecord[] = completedContracts
      .slice(0, 10)
      .map((contract: any, index: number) => ({
        id: contract.id || `contract-${index}`,
        amount: Number(contract.amount) || 0,
        date: contract.end_date || contract.updated_at || contract.created_at,
        status: 'completed' as const,
        method: 'Contract Payment',
      }));

    setFinancialData({
      totalEarned: Math.round(totalEarned * 100) / 100,
      pendingPayout: Math.round(pendingPayout * 100) / 100,
      nextPayoutDate: format(nextMonth, 'yyyy-MM-dd'),
      lastPayoutAmount: history[0]?.amount || 0,
      lastPayoutDate: history[0]?.date || '',
      ytdEarnings: Math.round(ytdEarnings * 100) / 100,
      averageMonthly: Math.round(averageMonthly * 100) / 100,
      payoutHistory: history,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className='border-2 border-blue-100'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-lg'>
          <Wallet className='h-5 w-5 text-blue-600' />
          Financial Summary
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Total Earned */}
        <div className='p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-green-700'>
              Total Earned
            </span>
            <TrendingUp className='h-4 w-4 text-green-600' />
          </div>
          <div className='text-2xl font-bold text-green-900'>
            {formatCurrency(financialData.totalEarned)}
          </div>
          <div className='text-xs text-green-600 mt-1'>Lifetime earnings</div>
        </div>

        {/* Pending Payout */}
        <div className='p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-200'>
          <div className='flex items-center justify-between mb-2'>
            <span className='text-sm font-medium text-blue-700'>
              Pending Payout
            </span>
            <Clock className='h-4 w-4 text-blue-600' />
          </div>
          <div className='text-2xl font-bold text-blue-900'>
            {formatCurrency(financialData.pendingPayout)}
          </div>
          <div className='text-xs text-blue-600 mt-1'>Awaiting processing</div>
        </div>

        {/* Next Payout */}
        <div className='p-3 bg-purple-50 rounded-lg border border-purple-200'>
          <div className='flex items-center gap-2 mb-2'>
            <Calendar className='h-4 w-4 text-purple-600' />
            <span className='text-sm font-medium text-purple-900'>
              Next Payout
            </span>
          </div>
          <div className='text-lg font-semibold text-purple-900'>
            {financialData.nextPayoutDate
              ? format(new Date(financialData.nextPayoutDate), 'MMM dd, yyyy')
              : 'Not scheduled'}
          </div>
          <div className='text-xs text-purple-600 mt-1'>
            Estimated: {formatCurrency(financialData.pendingPayout)}
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className='grid grid-cols-2 gap-3'>
          <div className='p-3 bg-gray-50 rounded-lg border'>
            <div className='text-xs text-gray-600 mb-1'>YTD Earnings</div>
            <div className='text-lg font-bold text-gray-900'>
              {formatCurrency(financialData.ytdEarnings)}
            </div>
          </div>
          <div className='p-3 bg-gray-50 rounded-lg border'>
            <div className='text-xs text-gray-600 mb-1'>Avg Monthly</div>
            <div className='text-lg font-bold text-gray-900'>
              {formatCurrency(financialData.averageMonthly)}
            </div>
          </div>
        </div>

        {/* Last Payout */}
        {financialData.lastPayoutAmount > 0 && (
          <div className='p-3 bg-green-50 rounded-lg border border-green-100'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='text-xs text-green-600 mb-1'>Last Payout</div>
                <div className='text-lg font-semibold text-green-900'>
                  {formatCurrency(financialData.lastPayoutAmount)}
                </div>
              </div>
              <div className='text-right'>
                <Badge
                  variant='outline'
                  className='bg-green-100 text-green-700'
                >
                  Completed
                </Badge>
                <div className='text-xs text-green-600 mt-1'>
                  {format(new Date(financialData.lastPayoutDate), 'MMM dd')}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className='space-y-2 pt-2 border-t'>
          <Button
            variant='outline'
            className='w-full justify-start'
            onClick={() => setShowHistory(!showHistory)}
          >
            <CreditCard className='h-4 w-4 mr-2' />
            {showHistory ? 'Hide' : 'View'} Payout History
          </Button>
          <Button variant='outline' className='w-full justify-start'>
            <ArrowUpRight className='h-4 w-4 mr-2' />
            Request Statement
          </Button>
        </div>

        {/* Payout History */}
        {showHistory && (
          <div className='space-y-2 pt-2 border-t'>
            <h4 className='text-sm font-semibold text-gray-700 mb-2'>
              Recent Payouts
            </h4>
            {financialData.payoutHistory.map(payout => (
              <div
                key={payout.id}
                className='p-2 bg-gray-50 rounded border flex items-center justify-between'
              >
                <div>
                  <div className='text-sm font-medium'>
                    {formatCurrency(payout.amount)}
                  </div>
                  <div className='text-xs text-gray-500'>{payout.method}</div>
                </div>
                <div className='text-right'>
                  <Badge
                    variant='outline'
                    className={
                      payout.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : payout.status === 'processing'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {payout.status}
                  </Badge>
                  <div className='text-xs text-gray-500 mt-1'>
                    {format(new Date(payout.date), 'MMM dd, yyyy')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alert for pending items */}
        {financialData.pendingPayout > 5000 && (
          <div className='flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg'>
            <AlertCircle className='h-4 w-4 text-yellow-600 mt-0.5' />
            <div>
              <p className='text-xs font-medium text-yellow-900'>
                High Pending Balance
              </p>
              <p className='text-xs text-yellow-700 mt-1'>
                Consider processing early payout or reviewing contract
                completion status.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
