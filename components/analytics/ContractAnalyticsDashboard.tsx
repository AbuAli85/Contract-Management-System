'use client';

/**
 * Contract Analytics Dashboard
 * Comprehensive performance metrics and insights
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Users,
  BarChart3,
  Download,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface AnalyticsData {
  overview: {
    total_contracts: number;
    active_contracts: number;
    total_value: number;
    avg_approval_time: number;
    expiring_soon: number;
    obligations_pending: number;
  };
  trends: {
    contracts_by_month: Array<{ month: string; count: number }>;
    value_by_month: Array<{ month: string; value: number }>;
    approval_times: Array<{ month: string; hours: number }>;
  };
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  top_vendors: Array<{ name: string; contracts: number; value: number }>;
  performance: {
    on_time_completion: number;
    average_cycle_time: number;
    obligations_completed_on_time: number;
  };
}

export default function ContractAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('30');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/contracts?days=${timeRange}`
      );
      const result = await response.json();
      setData(result.data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await fetch(`/api/analytics/export?days=${timeRange}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contract-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  if (loading || !data) {
    return (
      <div className='flex items-center justify-center p-12'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-sm text-gray-600'>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>
            Contract Analytics
          </h1>
          <p className='text-sm text-gray-600 mt-1'>
            Performance metrics and insights
          </p>
        </div>
        <div className='flex gap-2'>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>Last 7 days</SelectItem>
              <SelectItem value='30'>Last 30 days</SelectItem>
              <SelectItem value='90'>Last 90 days</SelectItem>
              <SelectItem value='365'>Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport} variant='outline'>
            <Download className='h-4 w-4 mr-2' />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium text-gray-600'>
                Total Contracts
              </CardTitle>
              <FileText className='h-5 w-5 text-blue-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {formatNumber(data.overview.total_contracts)}
            </div>
            <p className='text-xs text-gray-600 mt-1'>
              {data.overview.active_contracts} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium text-gray-600'>
                Total Value
              </CardTitle>
              <DollarSign className='h-5 w-5 text-green-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {formatCurrency(data.overview.total_value)}
            </div>
            <div className='flex items-center gap-1 mt-1'>
              <TrendingUp className='h-3 w-3 text-green-600' />
              <p className='text-xs text-green-600'>+12% vs last period</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium text-gray-600'>
                Avg Approval Time
              </CardTitle>
              <Clock className='h-5 w-5 text-orange-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {Math.round(data.overview.avg_approval_time)}h
            </div>
            <p className='text-xs text-gray-600 mt-1'>-15% improvement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='pb-3'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-sm font-medium text-gray-600'>
                Expiring Soon
              </CardTitle>
              <AlertCircle className='h-5 w-5 text-red-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>
              {data.overview.expiring_soon}
            </div>
            <p className='text-xs text-gray-600 mt-1'>In next 30 days</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Different Views */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='breakdown'>Breakdown</TabsTrigger>
          <TabsTrigger value='vendors'>Vendors</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Contract Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Status Distribution</CardTitle>
                <CardDescription>Current contract statuses</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {Object.entries(data.by_status).map(([status, count]) => (
                  <div key={status} className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-medium capitalize'>
                        {status.replace('_', ' ')}
                      </span>
                      <span className='text-sm text-gray-600'>{count}</span>
                    </div>
                    <Progress
                      value={(count / data.overview.total_contracts) * 100}
                      className='h-2'
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Contract Types */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Types</CardTitle>
                <CardDescription>Distribution by type</CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                {Object.entries(data.by_type)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 5)
                  .map(([type, count]) => (
                    <div
                      key={type}
                      className='flex items-center justify-between'
                    >
                      <div className='flex items-center gap-2'>
                        <BarChart3 className='h-4 w-4 text-gray-400' />
                        <span className='text-sm capitalize'>{type}</span>
                      </div>
                      <Badge variant='secondary'>{count}</Badge>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* Trends Chart (Placeholder - would use recharts/chart.js in production) */}
          <Card>
            <CardHeader>
              <CardTitle>Contract Trends</CardTitle>
              <CardDescription>Contracts created over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='h-[300px] flex items-center justify-center bg-gray-50 rounded-lg'>
                <div className='text-center text-gray-500'>
                  <BarChart3 className='h-12 w-12 mx-auto mb-2' />
                  <p className='text-sm'>Chart visualization would be here</p>
                  <p className='text-xs'>Using Chart.js or Recharts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value='performance' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  On-Time Completion
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-green-600'>
                  {data.performance.on_time_completion}%
                </div>
                <Progress
                  value={data.performance.on_time_completion}
                  className='mt-2'
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  Avg Cycle Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold'>
                  {data.performance.average_cycle_time} days
                </div>
                <p className='text-xs text-gray-600 mt-2'>
                  From creation to signature
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  Obligations On-Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='text-3xl font-bold text-blue-600'>
                  {data.performance.obligations_completed_on_time}%
                </div>
                <Progress
                  value={data.performance.obligations_completed_on_time}
                  className='mt-2'
                />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
              <CardDescription>
                Key findings and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-start gap-3 p-3 bg-green-50 rounded-lg'>
                <CheckCircle2 className='h-5 w-5 text-green-600 mt-0.5' />
                <div className='flex-1'>
                  <p className='font-medium text-sm text-green-900'>
                    Excellent Approval Time
                  </p>
                  <p className='text-sm text-green-700 mt-1'>
                    Your average approval time is 40% faster than industry
                    benchmark
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3 p-3 bg-yellow-50 rounded-lg'>
                <AlertCircle className='h-5 w-5 text-yellow-600 mt-0.5' />
                <div className='flex-1'>
                  <p className='font-medium text-sm text-yellow-900'>
                    Expiring Contracts Attention
                  </p>
                  <p className='text-sm text-yellow-700 mt-1'>
                    {data.overview.expiring_soon} contracts expiring in the next
                    30 days require review
                  </p>
                </div>
              </div>

              <div className='flex items-start gap-3 p-3 bg-blue-50 rounded-lg'>
                <TrendingUp className='h-5 w-5 text-blue-600 mt-0.5' />
                <div className='flex-1'>
                  <p className='font-medium text-sm text-blue-900'>
                    Growing Contract Value
                  </p>
                  <p className='text-sm text-blue-700 mt-1'>
                    Total contract value has increased by 12% compared to
                    previous period
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Breakdown Tab */}
        <TabsContent value='breakdown' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Value by Status</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                {Object.entries(data.by_status).map(([status, count]) => {
                  const percentage =
                    (count / data.overview.total_contracts) * 100;
                  return (
                    <div
                      key={status}
                      className='flex items-center justify-between p-2 hover:bg-gray-50 rounded'
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className={`w-3 h-3 rounded-full ${
                            status === 'active'
                              ? 'bg-green-500'
                              : status === 'pending'
                                ? 'bg-yellow-500'
                                : status === 'draft'
                                  ? 'bg-gray-500'
                                  : 'bg-blue-500'
                          }`}
                        />
                        <span className='text-sm capitalize'>
                          {status.replace('_', ' ')}
                        </span>
                      </div>
                      <div className='text-right'>
                        <div className='text-sm font-medium'>{count}</div>
                        <div className='text-xs text-gray-500'>
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Renewals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <div className='flex items-center justify-between p-3 border rounded-lg'>
                    <div>
                      <p className='font-medium text-sm'>Next 30 days</p>
                      <p className='text-xs text-gray-600'>5 contracts</p>
                    </div>
                    <Calendar className='h-5 w-5 text-gray-400' />
                  </div>
                  <div className='flex items-center justify-between p-3 border rounded-lg'>
                    <div>
                      <p className='font-medium text-sm'>30-60 days</p>
                      <p className='text-xs text-gray-600'>8 contracts</p>
                    </div>
                    <Calendar className='h-5 w-5 text-gray-400' />
                  </div>
                  <div className='flex items-center justify-between p-3 border rounded-lg'>
                    <div>
                      <p className='font-medium text-sm'>60-90 days</p>
                      <p className='text-xs text-gray-600'>12 contracts</p>
                    </div>
                    <Calendar className='h-5 w-5 text-gray-400' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value='vendors' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Top Vendors</CardTitle>
              <CardDescription>By contract volume and value</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {data.top_vendors.map((vendor, index) => (
                  <div
                    key={vendor.name}
                    className='flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50'
                  >
                    <div className='flex items-center gap-4'>
                      <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                        <Users className='h-5 w-5 text-blue-600' />
                      </div>
                      <div>
                        <p className='font-medium'>{vendor.name}</p>
                        <p className='text-sm text-gray-600'>
                          {vendor.contracts} contracts
                        </p>
                      </div>
                    </div>
                    <div className='text-right'>
                      <p className='font-semibold'>
                        {formatCurrency(vendor.value)}
                      </p>
                      <Badge variant='secondary'>#{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
