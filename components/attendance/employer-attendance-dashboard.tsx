'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Camera,
  Download,
  Filter,
  Search,
  Calendar,
  BarChart3,
  Bell,
  RefreshCw,
  Eye,
  CheckSquare,
  Square,
} from 'lucide-react';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  isToday,
  isYesterday,
} from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { ManagerApprovalWorkflow } from './manager-approval-workflow';
import { AttendanceReportsAnalytics } from './attendance-reports-analytics';
import { SmartAttendanceFeatures } from './smart-attendance-features';

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  total_hours: number | null;
  overtime_hours: number | null;
  break_duration_minutes: number | null;
  latitude?: number | null;
  longitude?: number | null;
  check_in_photo?: string | null;
  check_out_photo?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  notes?: string | null;
  employee?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string | null;
  };
  employer_employee?: {
    id: string;
    employee_id: string;
    job_title?: string | null;
    department?: string | null;
  };
}

interface AttendanceStats {
  totalEmployees: number;
  checkedInToday: number;
  pendingApprovals: number;
  lateToday: number;
  absentToday: number;
  averageHours: number;
  totalOvertime: number;
}

export function EmployerAttendanceDashboard() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    checkedInToday: 0,
    pendingApprovals: 0,
    lateToday: 0,
    absentToday: 0,
    averageHours: 0,
    totalOvertime: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'approval' | 'analytics' | 'reports'
  >('overview');
  const [dateFilter, setDateFilter] = useState<
    'today' | 'yesterday' | 'week' | 'month'
  >('today');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(
    null
  );
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Get company ID from profile
    fetch('/api/user/profile')
      .then(res => res.json())
      .then(data => {
        if (data.profile?.active_company_id) {
          setCompanyId(data.profile.active_company_id);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchAttendanceData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchAttendanceData(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [dateFilter, statusFilter]);

  const fetchAttendanceData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);

      const params = new URLSearchParams({
        date: dateFilter,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      const [attendanceRes, statsRes] = await Promise.all([
        fetch(`/api/employer/attendance/pending?filter=all&${params}`),
        fetch('/api/employer/attendance/stats'),
      ]);

      const attendanceData = await attendanceRes.json();
      const statsData = await statsRes.json();

      if (attendanceRes.ok) {
        setAttendance(attendanceData.attendance || []);
      }

      if (statsRes.ok) {
        setStats(statsData.stats || stats);
      }
    } catch (error: any) {
      if (!silent) {
        toast({
          title: 'Error',
          description: 'Failed to load attendance data',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredAttendance = useMemo(() => {
    let filtered = attendance;

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        const name = record.employee?.full_name || '';
        const email = record.employee?.email || '';
        return (
          name.toLowerCase().includes(searchLower) ||
          email.toLowerCase().includes(searchLower)
        );
      });
    }

    // Apply date filter
    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(r => isToday(parseISO(r.attendance_date)));
    } else if (dateFilter === 'yesterday') {
      filtered = filtered.filter(r => isYesterday(parseISO(r.attendance_date)));
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(r => parseISO(r.attendance_date) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthStart = startOfMonth(now);
      filtered = filtered.filter(
        r => parseISO(r.attendance_date) >= monthStart
      );
    }

    return filtered;
  }, [attendance, searchTerm, dateFilter]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: any; label: string; icon: any }> = {
      present: { variant: 'default', label: 'Present', icon: CheckCircle2 },
      late: { variant: 'secondary', label: 'Late', icon: AlertTriangle },
      absent: { variant: 'destructive', label: 'Absent', icon: XCircle },
      leave: { variant: 'outline', label: 'On Leave', icon: Calendar },
    };

    const configItem = config[status] || {
      variant: 'outline',
      label: status,
      icon: Clock,
    };
    const Icon = configItem.icon;

    return (
      <Badge variant={configItem.variant} className='flex items-center gap-1'>
        <Icon className='h-3 w-3' />
        {configItem.label}
      </Badge>
    );
  };

  const getApprovalBadge = (status?: string) => {
    if (!status) return null;

    const config: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pending' },
      approved: { variant: 'default', label: 'Approved' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };

    const configItem = config[status] || { variant: 'outline', label: status };
    return <Badge variant={configItem.variant}>{configItem.label}</Badge>;
  };

  const formatTime = (time: string | null) => {
    if (!time) return '--';
    try {
      return format(parseISO(time), 'HH:mm');
    } catch {
      return time;
    }
  };

  const formatHours = (hours: number | null) => {
    if (hours === null || hours === undefined) return '--';
    return `${hours.toFixed(1)}h`;
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <RefreshCw className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Attendance Management</h1>
          <p className='text-muted-foreground'>
            Monitor and manage employee attendance in real-time
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchAttendanceData()}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn('h-4 w-4 mr-2', refreshing && 'animate-spin')}
            />
            Refresh
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={async () => {
              try {
                const params = new URLSearchParams({
                  format: 'csv',
                  company_id: companyId || '',
                });
                const response = await fetch(
                  `/api/employer/attendance/export?${params}`
                );
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `attendance-export-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                toast({
                  title: 'Success',
                  description: 'Attendance data exported successfully',
                });
              } catch (error) {
                toast({
                  title: 'Error',
                  description: 'Failed to export attendance data',
                  variant: 'destructive',
                });
              }
            }}
          >
            <Download className='h-4 w-4 mr-2' />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card className='border-l-4 border-l-blue-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Employees
            </CardTitle>
            <Users className='h-5 w-5 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.totalEmployees}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              Active team members
            </p>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-green-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Checked In Today
            </CardTitle>
            <CheckCircle2 className='h-5 w-5 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.checkedInToday}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              {stats.totalEmployees > 0
                ? `${Math.round((stats.checkedInToday / stats.totalEmployees) * 100)}% attendance`
                : 'No employees'}
            </p>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-orange-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pending Approvals
            </CardTitle>
            <AlertTriangle className='h-5 w-5 text-orange-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.pendingApprovals}</div>
            <p className='text-xs text-muted-foreground mt-1'>
              Requires review
            </p>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-red-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Late Today</CardTitle>
            <Clock className='h-5 w-5 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{stats.lateToday}</div>
            <p className='text-xs text-muted-foreground mt-1'>Late arrivals</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)}>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='approval'>
            Approval
            {stats.pendingApprovals > 0 && (
              <Badge variant='destructive' className='ml-2'>
                {stats.pendingApprovals}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
          <TabsTrigger value='reports'>Reports</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-4'>
          {/* Smart Alerts */}
          {companyId && <SmartAttendanceFeatures companyId={companyId} />}

          {/* Filters */}
          <Card>
            <CardContent className='pt-6'>
              <div className='flex flex-col sm:flex-row gap-4'>
                <div className='relative flex-1'>
                  <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                  <Input
                    placeholder='Search employees...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className='pl-10'
                  />
                </div>
                <Select
                  value={dateFilter}
                  onValueChange={v => setDateFilter(v as any)}
                >
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Date range' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='today'>Today</SelectItem>
                    <SelectItem value='yesterday'>Yesterday</SelectItem>
                    <SelectItem value='week'>Last 7 Days</SelectItem>
                    <SelectItem value='month'>This Month</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='present'>Present</SelectItem>
                    <SelectItem value='late'>Late</SelectItem>
                    <SelectItem value='absent'>Absent</SelectItem>
                    <SelectItem value='leave'>On Leave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Attendance Table */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>
                {filteredAttendance.length} record
                {filteredAttendance.length !== 1 ? 's' : ''} found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Check In</TableHead>
                      <TableHead>Check Out</TableHead>
                      <TableHead>Hours</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Approval</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendance.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className='text-center py-8 text-muted-foreground'
                        >
                          No attendance records found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAttendance.map(record => (
                        <TableRow key={record.id} className='hover:bg-muted/50'>
                          <TableCell>
                            <div className='flex items-center gap-3'>
                              <Avatar className='h-8 w-8'>
                                {record.employee?.avatar_url ? (
                                  <AvatarImage
                                    src={record.employee.avatar_url}
                                  />
                                ) : null}
                                <AvatarFallback>
                                  {record.employee?.full_name
                                    ?.split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className='font-medium'>
                                  {record.employee?.full_name || 'Unknown'}
                                </div>
                                <div className='text-xs text-muted-foreground'>
                                  {record.employee?.email}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(
                              parseISO(record.attendance_date),
                              'MMM dd, yyyy'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Clock className='h-3 w-3 text-muted-foreground' />
                              {formatTime(record.check_in)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-2'>
                              <Clock className='h-3 w-3 text-muted-foreground' />
                              {formatTime(record.check_out)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center gap-1'>
                              {formatHours(record.total_hours)}
                              {record.overtime_hours &&
                                record.overtime_hours > 0 && (
                                  <Badge variant='outline' className='text-xs'>
                                    +{formatHours(record.overtime_hours)} OT
                                  </Badge>
                                )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(record.status)}</TableCell>
                          <TableCell>
                            {getApprovalBadge(record.approval_status)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                setSelectedRecord(record);
                                setShowDetailDialog(true);
                              }}
                            >
                              <Eye className='h-4 w-4' />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Approval Tab */}
        <TabsContent value='approval'>
          <ManagerApprovalWorkflow />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value='analytics'>
          <AttendanceReportsAnalytics />
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value='reports'>
          <Card>
            <CardHeader>
              <CardTitle>Attendance Reports</CardTitle>
              <CardDescription>
                Generate and download attendance reports
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Button
                  variant='outline'
                  className='h-20 flex-col'
                  onClick={async () => {
                    try {
                      const params = new URLSearchParams({
                        format: 'csv',
                        company_id: companyId || '',
                      });
                      const response = await fetch(
                        `/api/employer/attendance/export?${params}`
                      );
                      const blob = await response.blob();
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `attendance-export-${new Date().toISOString().split('T')[0]}.csv`;
                      document.body.appendChild(a);
                      a.click();
                      window.URL.revokeObjectURL(url);
                      document.body.removeChild(a);
                      toast({
                        title: 'Success',
                        description: 'Report exported successfully',
                      });
                    } catch (error) {
                      toast({
                        title: 'Error',
                        description: 'Failed to export report',
                        variant: 'destructive',
                      });
                    }
                  }}
                >
                  <Download className='h-6 w-6 mb-2' />
                  Export to CSV
                </Button>
                <Button
                  variant='outline'
                  className='h-20 flex-col'
                  onClick={() => {
                    toast({
                      title: 'Coming Soon',
                      description: 'PDF export will be available soon',
                    });
                  }}
                >
                  <Download className='h-6 w-6 mb-2' />
                  Export to PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>Attendance Details</DialogTitle>
            <DialogDescription>
              Complete attendance record information
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <Label className='text-xs text-muted-foreground'>
                    Employee
                  </Label>
                  <p className='font-medium'>
                    {selectedRecord.employee?.full_name}
                  </p>
                </div>
                <div>
                  <Label className='text-xs text-muted-foreground'>Date</Label>
                  <p className='font-medium'>
                    {format(
                      parseISO(selectedRecord.attendance_date),
                      'MMM dd, yyyy'
                    )}
                  </p>
                </div>
                <div>
                  <Label className='text-xs text-muted-foreground'>
                    Check In
                  </Label>
                  <p className='font-medium'>
                    {formatTime(selectedRecord.check_in)}
                  </p>
                </div>
                <div>
                  <Label className='text-xs text-muted-foreground'>
                    Check Out
                  </Label>
                  <p className='font-medium'>
                    {formatTime(selectedRecord.check_out)}
                  </p>
                </div>
                <div>
                  <Label className='text-xs text-muted-foreground'>
                    Total Hours
                  </Label>
                  <p className='font-medium'>
                    {formatHours(selectedRecord.total_hours)}
                  </p>
                </div>
                <div>
                  <Label className='text-xs text-muted-foreground'>
                    Overtime
                  </Label>
                  <p className='font-medium'>
                    {formatHours(selectedRecord.overtime_hours)}
                  </p>
                </div>
              </div>
              {selectedRecord.check_in_photo && (
                <div>
                  <Label className='text-xs text-muted-foreground'>
                    Check-In Photo
                  </Label>
                  <img
                    src={selectedRecord.check_in_photo}
                    alt='Check-in'
                    className='mt-2 rounded-lg max-w-full h-auto'
                  />
                </div>
              )}
              {selectedRecord.latitude && selectedRecord.longitude && (
                <div>
                  <Label className='text-xs text-muted-foreground'>
                    Location
                  </Label>
                  <div className='flex items-center gap-2 mt-2'>
                    <MapPin className='h-4 w-4' />
                    <a
                      href={`https://maps.google.com/?q=${selectedRecord.latitude},${selectedRecord.longitude}`}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='text-blue-600 hover:underline'
                    >
                      View on Map
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
