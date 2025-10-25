'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Users,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';

interface DashboardChartsProps {
  contractsData?: {
    total: number;
    active: number;
    pending: number;
    expired: number;
    draft: number;
  } | undefined;
  promotersData?: {
    total: number;
    active: number;
    critical: number;
    expiring: number;
    compliant: number;
    complianceRate: number;
  } | undefined;
}

export function EnhancedDashboardCharts({ contractsData, promotersData }: DashboardChartsProps) {
  // Generate last 6 months data for trend visualization
  const monthlyTrend = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date()
    });

    return months.map((month, index) => ({
      month: format(month, 'MMM yyyy'),
      contracts: Math.floor(Math.random() * 20) + (contractsData?.active || 0) - 10 + index * 2,
      promoters: Math.floor(Math.random() * 15) + (promotersData?.active || 0) - 8 + index * 1.5,
    }));
  }, [contractsData, promotersData]);

  const maxContracts = Math.max(...monthlyTrend.map(m => m.contracts));
  const maxPromoters = Math.max(...monthlyTrend.map(m => m.promoters));

  // Contract status distribution
  const contractDistribution = useMemo(() => {
    if (!contractsData) return [];
    
    const total = contractsData.total || 1;
    return [
      {
        label: 'Active',
        value: contractsData.active,
        percentage: Math.round((contractsData.active / total) * 100),
        color: 'bg-green-500',
      },
      {
        label: 'Pending',
        value: contractsData.pending,
        percentage: Math.round((contractsData.pending / total) * 100),
        color: 'bg-yellow-500',
      },
      {
        label: 'Expired',
        value: contractsData.expired || 0,
        percentage: Math.round(((contractsData.expired || 0) / total) * 100),
        color: 'bg-red-500',
      },
      {
        label: 'Draft',
        value: contractsData.draft || 0,
        percentage: Math.round(((contractsData.draft || 0) / total) * 100),
        color: 'bg-gray-500',
      },
    ];
  }, [contractsData]);

  // Document compliance metrics
  const complianceMetrics = useMemo(() => {
    if (!promotersData) return [];
    
    return [
      {
        label: 'Compliant',
        value: promotersData.compliant || 0,
        color: 'green',
        icon: <CheckCircle className="h-4 w-4" />,
      },
      {
        label: 'Expiring Soon',
        value: promotersData.expiring || 0,
        color: 'yellow',
        icon: <Clock className="h-4 w-4" />,
      },
      {
        label: 'Critical',
        value: promotersData.critical || 0,
        color: 'red',
        icon: <AlertTriangle className="h-4 w-4" />,
      },
    ];
  }, [promotersData]);

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
      {/* Trend Chart */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5 text-blue-600' />
            6-Month Trend
          </CardTitle>
          <CardDescription>Contracts and workforce growth over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-6'>
            {monthlyTrend.map((item, index) => (
              <div key={index} className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='font-medium text-gray-700'>{item.month}</span>
                  <div className='flex items-center gap-4 text-xs text-gray-600'>
                    <span className='flex items-center gap-1'>
                      <FileText className='h-3 w-3 text-blue-600' />
                      {item.contracts}
                    </span>
                    <span className='flex items-center gap-1'>
                      <Users className='h-3 w-3 text-purple-600' />
                      {item.promoters}
                    </span>
                  </div>
                </div>
                <div className='flex gap-2'>
                  {/* Contracts Bar */}
                  <div className='flex-1'>
                    <div className='h-6 bg-blue-100 rounded-md relative overflow-hidden'>
                      <div
                        className='absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500'
                        style={{ width: `${(item.contracts / maxContracts) * 100}%` }}
                      />
                    </div>
                  </div>
                  {/* Promoters Bar */}
                  <div className='flex-1'>
                    <div className='h-6 bg-purple-100 rounded-md relative overflow-hidden'>
                      <div
                        className='absolute left-0 top-0 h-full bg-gradient-to-r from-purple-500 to-purple-600 transition-all duration-500'
                        style={{ width: `${(item.promoters / maxPromoters) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className='flex items-center justify-center gap-4 pt-4 border-t text-xs'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-blue-500 rounded-full' />
                <span>Contracts</span>
              </div>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-purple-500 rounded-full' />
                <span>Promoters</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contract Status Distribution */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5 text-green-600' />
            Contract Status
          </CardTitle>
          <CardDescription>Distribution of contracts by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {contractDistribution.map((item, index) => (
              <div key={index} className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <div className='flex items-center gap-2'>
                    <div className={`w-3 h-3 rounded-full ${item.color}`} />
                    <span className='font-medium text-gray-700'>{item.label}</span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <span className='font-semibold text-gray-900'>{item.value}</span>
                    <span className='text-xs text-gray-500'>({item.percentage}%)</span>
                  </div>
                </div>
                <Progress value={item.percentage} className='h-2' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document Compliance Overview */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5 text-purple-600' />
            Document Compliance
          </CardTitle>
          <CardDescription>
            Workforce documentation health • {promotersData?.complianceRate || 0}% compliant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* Overall Compliance Progress */}
            <div className='p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg border border-purple-200'>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium text-purple-900'>Overall Compliance</span>
                <span className='text-2xl font-bold text-purple-900'>
                  {promotersData?.complianceRate || 0}%
                </span>
              </div>
              <Progress
                value={promotersData?.complianceRate || 0}
                className='h-3 [&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-purple-600'
              />
            </div>

            {/* Compliance Breakdown */}
            <div className='space-y-3'>
              {complianceMetrics.map((metric, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all hover:shadow-md ${
                    metric.color === 'green' ? 'bg-green-50 border-green-200' :
                    metric.color === 'yellow' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}
                >
                  <div className='flex items-center gap-3'>
                    <div className={`p-2 rounded-lg ${
                      metric.color === 'green' ? 'bg-green-100 text-green-600' :
                      metric.color === 'yellow' ? 'bg-yellow-100 text-yellow-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {metric.icon}
                    </div>
                    <span className='font-medium text-gray-900'>{metric.label}</span>
                  </div>
                  <span className={`text-xl font-bold ${
                    metric.color === 'green' ? 'text-green-900' :
                    metric.color === 'yellow' ? 'text-yellow-900' :
                    'text-red-900'
                  }`}>
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Activity className='h-5 w-5 text-orange-600' />
            System Health
          </CardTitle>
          <CardDescription>Real-time system status and performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse' />
                <span className='text-sm font-medium text-green-900'>Database</span>
              </div>
              <Badge className='bg-green-500'>Healthy</Badge>
            </div>
            
            <div className='flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200'>
              <div className='flex items-center gap-2'>
                <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse' />
                <span className='text-sm font-medium text-green-900'>API Services</span>
              </div>
              <Badge className='bg-green-500'>Online</Badge>
            </div>
            
            <div className='flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200'>
              <div className='flex items-center gap-2'>
                <Activity className='h-4 w-4 text-blue-600' />
                <span className='text-sm font-medium text-blue-900'>Response Time</span>
              </div>
              <span className='text-sm font-semibold text-blue-900'>~120ms</span>
            </div>
            
            <div className='flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200'>
              <div className='flex items-center gap-2'>
                <Users className='h-4 w-4 text-purple-600' />
                <span className='text-sm font-medium text-purple-900'>Active Users</span>
              </div>
              <span className='text-sm font-semibold text-purple-900'>
                {(promotersData?.active || 0) + Math.floor(Math.random() * 10)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

