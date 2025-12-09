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
} from 'lucide-react';
import { format, addDays } from 'date-fns';

interface PromoterFinancialSummaryProps {
  promoterId: string;
  contracts?: any[];
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
    calculateFinancials();
  }, [promoterId, contracts]);

  const calculateFinancials = () => {
    // Calculate from contracts (in production, this would come from a financial service)
    const completedContracts = contracts.filter(c => c.status === 'completed');
    const activeContracts = contracts.filter(c => c.status === 'active');

    // Mock calculations - replace with actual financial data
    const totalEarned = completedContracts.length * 2500 + Math.random() * 5000;
    const pendingPayout = activeContracts.length * 1200 + Math.random() * 2000;
    const ytdEarnings = totalEarned * 0.7;
    const averageMonthly = ytdEarnings / 10; // Assuming 10 months YTD

    // Next payout is typically 15th of next month
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);

    // Generate mock payout history
    const history: PayoutRecord[] = [
      {
        id: '1',
        amount: 3250.0,
        date: format(addDays(now, -30), 'yyyy-MM-dd'),
        status: 'completed',
        method: 'Bank Transfer',
      },
      {
        id: '2',
        amount: 2890.5,
        date: format(addDays(now, -60), 'yyyy-MM-dd'),
        status: 'completed',
        method: 'Bank Transfer',
      },
      {
        id: '3',
        amount: 4125.75,
        date: format(addDays(now, -90), 'yyyy-MM-dd'),
        status: 'completed',
        method: 'Bank Transfer',
      },
    ];

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
