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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Calendar,
  User,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Mail,
  Share2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/components/providers/company-provider';
import { format } from 'date-fns';

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  total_hours: number | null;
  status: string;
  approval_status: string;
  latitude: number | null;
  longitude: number | null;
  check_in_photo: string | null;
  employee: {
    full_name: string;
    email: string;
    employee_code: string | null;
  };
}

interface ReportData {
  employee: {
    id: string;
    full_name: string;
    email: string;
    employee_code: string | null;
    job_title: string | null;
    department: string | null;
  };
  period: {
    start_date: string;
    end_date: string;
  };
  summary: {
    total_days: number;
    present_days: number;
    absent_days: number;
    total_hours: number;
    average_hours: number;
    late_count: number;
    approved_count: number;
    pending_count: number;
  };
  records: AttendanceRecord[];
}

export function ClientAttendanceReport() {
  const [employeeId, setEmployeeId] = useState<string>('');
  const [employees, setEmployees] = useState<
    Array<{ id: string; full_name: string; email: string }>
  >([]);
  const [reportType, setReportType] = useState<
    'daily' | 'weekly' | 'monthly' | 'custom'
  >('monthly');
  const [startDate, setStartDate] = useState<string>(
    format(
      new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      'yyyy-MM-dd'
    )
  );
  const [endDate, setEndDate] = useState<string>(
    format(new Date(), 'yyyy-MM-dd')
  );
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const { companyId } = useCompany();
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, [companyId]);

  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employer/team');
      if (!response.ok) throw new Error('Failed to fetch employees');

      const data = await response.json();
      if (data.team) {
        setEmployees(
          data.team.map((emp: any) => ({
            id: emp.id,
            full_name:
              emp.employee?.full_name || emp.promoter?.name_en || 'Unknown',
            email: emp.employee?.email || emp.promoter?.email || '',
          }))
        );
      }
    } catch (error) {
    }
  };

  const generateReport = async () => {
    if (!employeeId) {
      toast({
        title: 'Error',
        description: 'Please select an employee',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        employee_id: employeeId,
        start_date: startDate,
        end_date: endDate,
        format: 'json',
      });

      const response = await fetch(
        `/api/employer/team/attendance/report?${params}`
      );
      if (!response.ok) throw new Error('Failed to generate report');

      const data = await response.json();
      setReportData(data.data);
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!employeeId || !reportData) {
      toast({
        title: 'Error',
        description: 'Please generate a report first',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);
    try {
      const params = new URLSearchParams({
        employee_id: employeeId,
        start_date: startDate,
        end_date: endDate,
        format,
      });

      const response = await fetch(
        `/api/employer/team/attendance/report?${params}`
      );
      if (!response.ok) throw new Error('Failed to export report');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-report-${format === 'excel' ? 'xlsx' : format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: `Report exported as ${format.toUpperCase()}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to export report',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleReportTypeChange = (
    type: 'daily' | 'weekly' | 'monthly' | 'custom'
  ) => {
    setReportType(type);
    const today = new Date();

    switch (type) {
      case 'daily':
        setStartDate(format(today, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'weekly':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        setStartDate(format(weekStart, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'monthly':
        setStartDate(
          format(
            new Date(today.getFullYear(), today.getMonth(), 1),
            'yyyy-MM-dd'
          )
        );
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
    }
  };

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Client Attendance Report</h2>
          <p className='text-sm text-gray-500 mt-1'>
            Generate professional attendance reports for clients
          </p>
        </div>
      </div>

      {/* Report Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>
            Select employee and date range for the report
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label>Employee</Label>
              <Select value={employeeId} onValueChange={setEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder='Select employee' />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.full_name} ({emp.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Report Type</Label>
              <Select
                value={reportType}
                onValueChange={value =>
                  handleReportTypeChange(
                    value as 'daily' | 'weekly' | 'monthly' | 'custom'
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='daily'>Daily</SelectItem>
                  <SelectItem value='weekly'>Weekly</SelectItem>
                  <SelectItem value='monthly'>Monthly</SelectItem>
                  <SelectItem value='custom'>Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Start Date</Label>
              <Input
                type='date'
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                disabled={reportType !== 'custom'}
              />
            </div>

            <div className='space-y-2'>
              <Label>End Date</Label>
              <Input
                type='date'
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                disabled={reportType !== 'custom'}
              />
            </div>
          </div>

          <div className='flex items-center gap-2'>
            <Button onClick={generateReport} disabled={loading || !employeeId}>
              {loading && <Loader2 className='h-4 w-4 mr-2 animate-spin' />}
              Generate Report
            </Button>

            {reportData && (
              <>
                <Button
                  variant='outline'
                  onClick={() => exportReport('pdf')}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  ) : (
                    <FileText className='h-4 w-4 mr-2' />
                  )}
                  Export PDF
                </Button>
                <Button
                  variant='outline'
                  onClick={() => exportReport('excel')}
                  disabled={generating}
                >
                  {generating ? (
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  ) : (
                    <FileSpreadsheet className='h-4 w-4 mr-2' />
                  )}
                  Export Excel
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Report Preview</CardTitle>
            <CardDescription>
              {format(new Date(reportData.period.start_date), 'MMM dd, yyyy')} -{' '}
              {format(new Date(reportData.period.end_date), 'MMM dd, yyyy')}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-6'>
            {/* Employee Info */}
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <p className='text-sm text-gray-500'>Employee Name</p>
                <p className='font-semibold'>{reportData.employee.full_name}</p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Employee Code</p>
                <p className='font-semibold'>
                  {reportData.employee.employee_code || 'N/A'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Job Title</p>
                <p className='font-semibold'>
                  {reportData.employee.job_title || 'N/A'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Department</p>
                <p className='font-semibold'>
                  {reportData.employee.department || 'N/A'}
                </p>
              </div>
            </div>

            {/* Summary */}
            <div className='grid gap-4 md:grid-cols-4'>
              <div className='p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg'>
                <p className='text-sm text-gray-500'>Total Days</p>
                <p className='text-2xl font-bold'>
                  {reportData.summary.total_days}
                </p>
              </div>
              <div className='p-4 bg-green-50 dark:bg-green-900/10 rounded-lg'>
                <p className='text-sm text-gray-500'>Present Days</p>
                <p className='text-2xl font-bold'>
                  {reportData.summary.present_days}
                </p>
              </div>
              <div className='p-4 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg'>
                <p className='text-sm text-gray-500'>Total Hours</p>
                <p className='text-2xl font-bold'>
                  {reportData.summary.total_hours.toFixed(1)}h
                </p>
              </div>
              <div className='p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg'>
                <p className='text-sm text-gray-500'>Avg Hours/Day</p>
                <p className='text-2xl font-bold'>
                  {reportData.summary.average_hours.toFixed(1)}h
                </p>
              </div>
            </div>

            {/* Attendance Records - Matching Manual Format */}
            <div>
              <h3 className='font-semibold mb-4'>Daily Attendance Records</h3>
              <div className='overflow-x-auto'>
                <table className='w-full border-collapse border border-gray-300'>
                  <thead>
                    <tr className='bg-gray-100 dark:bg-gray-800'>
                      <th className='border border-gray-300 px-4 py-2 text-left font-semibold'>
                        DATE
                      </th>
                      <th className='border border-gray-300 px-4 py-2 text-left font-semibold'>
                        TIME IN
                      </th>
                      <th className='border border-gray-300 px-4 py-2 text-left font-semibold'>
                        TIME OUT
                      </th>
                      <th className='border border-gray-300 px-4 py-2 text-left font-semibold'>
                        WORKING HOURS
                      </th>
                      <th className='border border-gray-300 px-4 py-2 text-left font-semibold'>
                        STATUS
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.records.map(record => {
                      const recordDate = new Date(record.attendance_date);
                      const isWeekOff =
                        record.status === 'week_off' || isTuesday(recordDate);

                      return (
                        <tr
                          key={record.id}
                          className='hover:bg-gray-50 dark:hover:bg-gray-900'
                        >
                          <td className='border border-gray-300 px-4 py-2 font-medium'>
                            {format(recordDate, 'dd-MM-yyyy')}
                          </td>
                          <td className='border border-gray-300 px-4 py-2'>
                            {isWeekOff ? (
                              <span className='text-gray-600 dark:text-gray-400 font-medium'>
                                WEEK OFF
                              </span>
                            ) : record.check_in_time ? (
                              format(new Date(record.check_in_time), 'hh:mm a')
                            ) : (
                              <span className='text-gray-400'>-</span>
                            )}
                          </td>
                          <td className='border border-gray-300 px-4 py-2'>
                            {isWeekOff ? (
                              <span className='text-gray-600 dark:text-gray-400 font-medium'>
                                WEEK OFF
                              </span>
                            ) : record.check_out_time ? (
                              format(new Date(record.check_out_time), 'hh:mm a')
                            ) : (
                              <span className='text-gray-400'>-</span>
                            )}
                          </td>
                          <td className='border border-gray-300 px-4 py-2'>
                            {isWeekOff ? (
                              <span className='text-gray-600 dark:text-gray-400 font-medium'>
                                WEEK OFF
                              </span>
                            ) : record.total_hours ? (
                              <span className='font-medium'>
                                {record.total_hours.toFixed(0)}
                              </span>
                            ) : (
                              <span className='text-gray-400'>-</span>
                            )}
                          </td>
                          <td className='border border-gray-300 px-4 py-2'>
                            {isWeekOff ? (
                              <span className='text-gray-500 text-sm'>✓</span>
                            ) : (
                              <Badge
                                variant={
                                  record.approval_status === 'approved'
                                    ? 'default'
                                    : record.approval_status === 'rejected'
                                      ? 'destructive'
                                      : 'secondary'
                                }
                                className='text-xs'
                              >
                                {record.approval_status === 'approved' && (
                                  <CheckCircle2 className='h-3 w-3 mr-1' />
                                )}
                                {record.approval_status === 'rejected' && (
                                  <XCircle className='h-3 w-3 mr-1' />
                                )}
                                {record.approval_status === 'pending' && (
                                  <AlertCircle className='h-3 w-3 mr-1' />
                                )}
                                {record.approval_status}
                              </Badge>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
