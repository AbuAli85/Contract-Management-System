'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  FileText,
  Download,
  Plus,
  BarChart3,
  Activity,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { GeneratedReport, PromoterPerformanceMetric } from '@/lib/types';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';

interface PromoterReportsProps {
  promoterId: string;
  isAdmin: boolean;
}

export function PromoterReports({ promoterId, isAdmin }: PromoterReportsProps) {
  const [activeTab, setActiveTab] = useState('performance');
  const [reports, setReports] = useState<GeneratedReport[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<
    PromoterPerformanceMetric[]
  >([]);
  const [isGenerateReportDialogOpen, setIsGenerateReportDialogOpen] =
    useState(false);
  const [reportForm, setReportForm] = useState({
    report_name: '',
    start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    report_type: 'performance',
  });

  // Fetch data
  useEffect(() => {
    fetchReports();
    fetchPerformanceMetrics();
  }, [promoterId]);

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/reports`);
      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch(
        `/api/promoters/${promoterId}/performance-metrics`
      );
      if (response.ok) {
        const data = await response.json();
        setPerformanceMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching performance metrics:', error);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_name: reportForm.report_name,
          parameters: {
            start_date: reportForm.start_date,
            end_date: reportForm.end_date,
            report_type: reportForm.report_type,
          },
        }),
      });

      if (response.ok) {
        const newReport = await response.json();
        setReports([newReport, ...reports]);
        setReportForm({
          report_name: '',
          start_date: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
          end_date: format(new Date(), 'yyyy-MM-dd'),
          report_type: 'performance',
        });
        setIsGenerateReportDialogOpen(false);
        toast.success('Report generated successfully');
      }
    } catch (error) {
      toast.error('Failed to generate report');
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/reports`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reportId }),
      });

      if (response.ok) {
        setReports(reports.filter(r => r.id !== reportId));
        toast.success('Report deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  // Performance data for charts
  const attendanceData = [
    { name: 'Present', value: 85, color: '#10b981' },
    { name: 'Absent', value: 10, color: '#ef4444' },
    { name: 'Late', value: 5, color: '#f59e0b' },
  ];

  const monthlyPerformance = [
    { month: 'Jan', attendance: 85, performance: 78 },
    { month: 'Feb', attendance: 88, performance: 82 },
    { month: 'Mar', attendance: 92, performance: 85 },
    { month: 'Apr', attendance: 87, performance: 80 },
    { month: 'May', attendance: 90, performance: 83 },
    { month: 'Jun', attendance: 94, performance: 87 },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <TrendingUp className='h-4 w-4 text-green-500' />;
      case 'good':
        return <CheckCircle className='h-4 w-4 text-blue-500' />;
      case 'average':
        return <AlertCircle className='h-4 w-4 text-yellow-500' />;
      case 'poor':
        return <TrendingDown className='h-4 w-4 text-red-500' />;
      default:
        return <Activity className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'excellent':
        return <Badge variant='default'>Excellent</Badge>;
      case 'good':
        return <Badge variant='secondary'>Good</Badge>;
      case 'average':
        return <Badge variant='outline'>Average</Badge>;
      case 'poor':
        return <Badge variant='destructive'>Poor</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p className='text-center text-muted-foreground'>
            Reports are restricted to administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='reports'>Reports</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value='performance' className='space-y-6'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Attendance Rate
                </CardTitle>
                <Calendar className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>85%</div>
                <p className='text-xs text-muted-foreground'>
                  +2.1% from last month
                </p>
                <Progress value={85} className='mt-2' />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Performance Score
                </CardTitle>
                <Target className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>87/100</div>
                <p className='text-xs text-muted-foreground'>
                  +5 points from last month
                </p>
                <Progress value={87} className='mt-2' />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Response Time
                </CardTitle>
                <Clock className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>2.3h</div>
                <p className='text-xs text-muted-foreground'>
                  -0.5h from last month
                </p>
                <Progress value={75} className='mt-2' />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Task Completion
                </CardTitle>
                <CheckCircle className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>92%</div>
                <p className='text-xs text-muted-foreground'>
                  +3% from last month
                </p>
                <Progress value={92} className='mt-2' />
              </CardContent>
            </Card>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Monthly Performance Trend</CardTitle>
                <CardDescription>
                  Performance metrics over the last 6 months
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <LineChart data={monthlyPerformance}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='month' />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type='monotone'
                      dataKey='attendance'
                      stroke='#10b981'
                      strokeWidth={2}
                    />
                    <Line
                      type='monotone'
                      dataKey='performance'
                      stroke='#3b82f6'
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance Distribution</CardTitle>
                <CardDescription>
                  Breakdown of attendance status
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={attendanceData}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`
                      }
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='value'
                    >
                      {attendanceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Detailed performance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {performanceMetrics.map(metric => (
                  <div
                    key={metric.id}
                    className='flex items-center justify-between rounded-lg border p-4'
                  >
                    <div className='flex items-center gap-3'>
                      {getStatusIcon(metric.metric_type)}
                      <div>
                        <p className='font-medium capitalize'>
                          {metric.metric_type.replace('_', ' ')}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {format(new Date(metric.period_start), 'MMM d')} -{' '}
                          {format(new Date(metric.period_end), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='text-right'>
                        <p className='font-semibold'>{metric.value}</p>
                        {metric.target_value && (
                          <p className='text-sm text-muted-foreground'>
                            Target: {metric.target_value}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(
                        metric.value >= (metric.target_value || 80)
                          ? 'excellent'
                          : 'average'
                      )}
                    </div>
                  </div>
                ))}
                {performanceMetrics.length === 0 && (
                  <div className='py-8 text-center'>
                    <BarChart3 className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                    <p className='text-muted-foreground'>
                      No performance metrics available.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value='reports' className='space-y-6'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Generated Reports</h3>
            <Dialog
              open={isGenerateReportDialogOpen}
              onOpenChange={setIsGenerateReportDialogOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className='mr-2 h-4 w-4' />
                  Generate Report
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate New Report</DialogTitle>
                  <DialogDescription>
                    Create a new performance or analytics report for this
                    promoter.
                  </DialogDescription>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='report-name'>Report Name</Label>
                    <Input
                      id='report-name'
                      value={reportForm.report_name}
                      onChange={e =>
                        setReportForm({
                          ...reportForm,
                          report_name: e.target.value,
                        })
                      }
                      placeholder='e.g., Monthly Performance Report'
                    />
                  </div>
                  <div>
                    <Label htmlFor='report-type'>Report Type</Label>
                    <Select
                      value={reportForm.report_type}
                      onValueChange={value =>
                        setReportForm({ ...reportForm, report_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='performance'>
                          Performance Report
                        </SelectItem>
                        <SelectItem value='attendance'>
                          Attendance Report
                        </SelectItem>
                        <SelectItem value='contract'>
                          Contract Report
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='start-date'>Start Date</Label>
                      <Input
                        id='start-date'
                        type='date'
                        value={reportForm.start_date}
                        onChange={e =>
                          setReportForm({
                            ...reportForm,
                            start_date: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor='end-date'>End Date</Label>
                      <Input
                        id='end-date'
                        type='date'
                        value={reportForm.end_date}
                        onChange={e =>
                          setReportForm({
                            ...reportForm,
                            end_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => setIsGenerateReportDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleGenerateReport}>
                    Generate Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className='space-y-4'>
            {reports.map(report => (
              <Card key={report.id}>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center gap-2'>
                        <FileText className='h-4 w-4 text-blue-500' />
                        <h4 className='font-semibold'>{report.report_name}</h4>
                        <Badge variant='outline'>
                          {format(
                            new Date(report.generated_at || ''),
                            'MMM d, yyyy'
                          )}
                        </Badge>
                      </div>
                      {report.report_data && (
                        <div className='text-sm text-muted-foreground'>
                          {report.report_data.attendance_rate && (
                            <p>
                              Attendance Rate:{' '}
                              {report.report_data.attendance_rate.toFixed(1)}%
                            </p>
                          )}
                          {report.report_data.summary && (
                            <p>
                              Total Days:{' '}
                              {report.report_data.summary.total_days}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className='flex gap-2'>
                      {report.file_url && (
                        <Button variant='outline' size='sm'>
                          <Download className='h-4 w-4' />
                        </Button>
                      )}
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {reports.length === 0 && (
              <Card>
                <CardContent className='p-8 text-center'>
                  <FileText className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                  <p className='text-muted-foreground'>
                    No reports generated yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value='analytics' className='space-y-6'>
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>Compare with team averages</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <BarChart
                    data={[
                      { metric: 'Attendance', promoter: 85, team: 78 },
                      { metric: 'Performance', promoter: 87, team: 82 },
                      { metric: 'Response Time', promoter: 75, team: 80 },
                      { metric: 'Task Completion', promoter: 92, team: 88 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='metric' />
                    <YAxis />
                    <Tooltip />
                    <Bar
                      dataKey='promoter'
                      fill='#3b82f6'
                      name='This Promoter'
                    />
                    <Bar dataKey='team' fill='#94a3b8' name='Team Average' />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>Performance trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      Attendance Trend
                    </span>
                    <TrendingUp className='h-4 w-4 text-green-500' />
                  </div>
                  <Progress value={85} className='h-2' />

                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      Performance Trend
                    </span>
                    <TrendingUp className='h-4 w-4 text-green-500' />
                  </div>
                  <Progress value={87} className='h-2' />

                  <div className='flex items-center justify-between'>
                    <span className='text-sm font-medium'>
                      Response Time Trend
                    </span>
                    <TrendingDown className='h-4 w-4 text-green-500' />
                  </div>
                  <Progress value={75} className='h-2' />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Key Insights</CardTitle>
              <CardDescription>
                Automated analysis and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div className='flex items-start gap-3 rounded-lg bg-green-50 p-4'>
                  <TrendingUp className='mt-0.5 h-5 w-5 text-green-600' />
                  <div>
                    <h4 className='font-medium text-green-800'>
                      Strong Performance
                    </h4>
                    <p className='text-sm text-green-700'>
                      Attendance rate is 7% above team average. Consider
                      recognizing this achievement.
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 rounded-lg bg-blue-50 p-4'>
                  <Target className='mt-0.5 h-5 w-5 text-blue-600' />
                  <div>
                    <h4 className='font-medium text-blue-800'>
                      Improvement Opportunity
                    </h4>
                    <p className='text-sm text-blue-700'>
                      Response time could be improved by 5% to match top
                      performers.
                    </p>
                  </div>
                </div>

                <div className='flex items-start gap-3 rounded-lg bg-yellow-50 p-4'>
                  <AlertCircle className='mt-0.5 h-5 w-5 text-yellow-600' />
                  <div>
                    <h4 className='font-medium text-yellow-800'>
                      Attention Required
                    </h4>
                    <p className='text-sm text-yellow-700'>
                      Late arrivals increased by 2% this month. Consider
                      discussing punctuality.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
