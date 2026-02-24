// app/[locale]/contracts/analytics/page.tsx
// Contract Analytics Dashboard

'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  FileText,
  Clock,
  AlertCircle,
  Download,
  RefreshCw,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ContractAnalytics {
  submissionsOverTime: Array<{
    date: string;
    submissions: number;
    approvals: number;
    rejections: number;
    pending: number;
  }>;
  approvalTimes: Array<{
    contract_type: string;
    avg_approval_hours: number;
    min_approval_hours: number;
    max_approval_hours: number;
    total_contracts: number;
  }>;
  contractsRequiringAttention: Array<{
    id: string;
    contract_number: string;
    job_title: string;
    status: string;
    priority: string;
    days_pending: number;
    reminder_count: number;
    assigned_reviewer: string;
    escalation_needed: boolean;
  }>;
  summary: {
    totalContracts: number;
    pendingContracts: number;
    approvedContracts: number;
    rejectedContracts: number;
    avgApprovalTime: number;
    contractsNeedingAttention: number;
  };
}

export default function ContractAnalyticsPage() {
  const [analytics, setAnalytics] = useState<ContractAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
  });
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const { toast } = useToast();
  const supabase = createClient();

  // Color palette for charts
  const _COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedPeriod]);

  const fetchAnalytics = async () => {
    if (!supabase) {
      console.error('Supabase client not available');
      return;
    }

    setLoading(true);
    try {
      // Fetch submissions over time
      const { data: submissionsData, error: submissionsError } = await (
        supabase as any
      ).rpc('get_contract_submissions_over_time', {
        start_date: dateRange.startDate.toISOString().split('T')[0],
        end_date: dateRange.endDate.toISOString().split('T')[0],
      });

      if (submissionsError) throw submissionsError;

      // Fetch approval times
      const { data: approvalData, error: approvalError } = await (
        supabase as any
      ).rpc('get_average_approval_time');

      if (approvalError) throw approvalError;

      // Fetch contracts requiring attention
      const { data: attentionData, error: attentionError } = await (
        supabase as any
      ).rpc('get_contracts_requiring_attention');

      if (attentionError) throw attentionError;

      // Calculate summary statistics
      const summary = calculateSummary(
        submissionsData,
        approvalData,
        attentionData
      );

      setAnalytics({
        submissionsOverTime: submissionsData || [],
        approvalTimes: approvalData || [],
        contractsRequiringAttention: attentionData || [],
        summary,
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast({
        title: 'Analytics Error',
        description: 'Failed to load contract analytics data.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (
    submissions: any[],
    approvals: any[],
    attention: any[]
  ) => {
    const totalSubmissions = submissions.reduce(
      (sum, day) =>
        sum + day.submissions + day.approvals + day.rejections + day.pending,
      0
    );

    const totalPending = submissions.reduce((sum, day) => sum + day.pending, 0);
    const totalApproved = submissions.reduce(
      (sum, day) => sum + day.approvals,
      0
    );
    const totalRejected = submissions.reduce(
      (sum, day) => sum + day.rejections,
      0
    );

    const avgApprovalTime =
      approvals.length > 0
        ? approvals.reduce((sum, type) => sum + type.avg_approval_hours, 0) /
          approvals.length
        : 0;

    return {
      totalContracts: totalSubmissions,
      pendingContracts: totalPending,
      approvedContracts: totalApproved,
      rejectedContracts: totalRejected,
      avgApprovalTime: Math.round(avgApprovalTime * 100) / 100,
      contractsNeedingAttention: attention.length,
    };
  };

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period);
    const endDate = new Date();
    const startDate = new Date();

    switch (period) {
      case '7':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '365':
        startDate.setDate(endDate.getDate() - 365);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    setDateRange({ startDate, endDate });
  };

  const exportAnalytics = async () => {
    if (!analytics) return;

    try {
      const csvData = [
        ['Date', 'Submissions', 'Approvals', 'Rejections', 'Pending'],
        ...analytics.submissionsOverTime.map(day => [
          day.date,
          day.submissions,
          day.approvals,
          day.rejections,
          day.pending,
        ]),
      ];

      const csvContent = csvData.map(row => row.join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract_analytics_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Export Successful',
        description: 'Analytics data has been exported to CSV.',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export analytics data.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex h-64 items-center justify-center'>
          <RefreshCw className='h-8 w-8 animate-spin' />
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className='container mx-auto p-6'>
        <div className='text-center'>
          <AlertCircle className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
          <h2 className='mb-2 text-xl font-semibold'>No Analytics Data</h2>
          <p className='text-muted-foreground'>
            Unable to load contract analytics data.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Contract Analytics</h1>
          <p className='text-muted-foreground'>
            Comprehensive insights into contract performance and trends
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className='w-32'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='7'>Last 7 days</SelectItem>
              <SelectItem value='30'>Last 30 days</SelectItem>
              <SelectItem value='90'>Last 90 days</SelectItem>
              <SelectItem value='365'>Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportAnalytics} variant='outline' size='sm'>
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Contracts
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics.summary.totalContracts}
            </div>
            <p className='text-xs text-muted-foreground'>All time contracts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pending Approval
            </CardTitle>
            <Clock className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics.summary.pendingContracts}
            </div>
            <p className='text-xs text-muted-foreground'>Awaiting review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Avg Approval Time
            </CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics.summary.avgApprovalTime}h
            </div>
            <p className='text-xs text-muted-foreground'>
              Average processing time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Need Attention
            </CardTitle>
            <AlertCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics.summary.contractsNeedingAttention}
            </div>
            <p className='text-xs text-muted-foreground'>
              Require immediate action
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
        {/* Submissions Over Time */}
        <Card>
          <CardHeader>
            <CardTitle>Contract Submissions Over Time</CardTitle>
            <CardDescription>
              Daily contract submissions, approvals, and rejections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={analytics.submissionsOverTime}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='date' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey='submissions' fill='#0088FE' name='Submissions' />
                <Bar dataKey='approvals' fill='#00C49F' name='Approvals' />
                <Bar dataKey='rejections' fill='#FF8042' name='Rejections' />
                <Bar dataKey='pending' fill='#FFBB28' name='Pending' />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Approval Times by Contract Type */}
        <Card>
          <CardHeader>
            <CardTitle>Approval Times by Contract Type</CardTitle>
            <CardDescription>
              Average approval time for different contract types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <BarChart data={analytics.approvalTimes}>
                <CartesianGrid strokeDasharray='3 3' />
                <XAxis dataKey='contract_type' />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar
                  dataKey='avg_approval_hours'
                  fill='#8884D8'
                  name='Avg Hours'
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Requiring Attention */}
      <Card>
        <CardHeader>
          <CardTitle>Contracts Requiring Attention</CardTitle>
          <CardDescription>
            Contracts that need immediate review or escalation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {analytics.contractsRequiringAttention.length === 0 ? (
              <div className='py-8 text-center text-muted-foreground'>
                No contracts currently require attention
              </div>
            ) : (
              analytics.contractsRequiringAttention.map(contract => (
                <div
                  key={contract.id}
                  className='flex items-center justify-between rounded-lg border p-4'
                >
                  <div className='flex items-center gap-4'>
                    <div>
                      <div className='font-medium'>
                        {contract.contract_number}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        {contract.job_title}
                      </div>
                    </div>
                    <Badge
                      variant={
                        contract.priority === 'high' ? 'destructive' : 'default'
                      }
                    >
                      {contract.priority}
                    </Badge>
                  </div>
                  <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                    <div className='flex items-center gap-1'>
                      <Clock className='h-4 w-4' />
                      {contract.days_pending} days
                    </div>
                    <div className='flex items-center gap-1'>
                      <AlertCircle className='h-4 w-4' />
                      {contract.reminder_count} reminders
                    </div>
                    {contract.escalation_needed && (
                      <Badge variant='destructive'>Escalation Needed</Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Approval Time Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Status Distribution</CardTitle>
          <CardDescription>Current status of all contracts</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width='100%' height={300}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: 'Approved',
                    value: analytics.summary.approvedContracts,
                    color: '#00C49F',
                  },
                  {
                    name: 'Pending',
                    value: analytics.summary.pendingContracts,
                    color: '#FFBB28',
                  },
                  {
                    name: 'Rejected',
                    value: analytics.summary.rejectedContracts,
                    color: '#FF8042',
                  },
                ]}
                cx='50%'
                cy='50%'
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill='#8884d8'
                dataKey='value'
              >
                {[
                  {
                    name: 'Approved',
                    value: analytics.summary.approvedContracts,
                    color: '#00C49F',
                  },
                  {
                    name: 'Pending',
                    value: analytics.summary.pendingContracts,
                    color: '#FFBB28',
                  },
                  {
                    name: 'Rejected',
                    value: analytics.summary.rejectedContracts,
                    color: '#FF8042',
                  },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
