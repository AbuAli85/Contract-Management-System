'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Calendar,
  Clock,
  MapPin,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Coffee,
  TrendingUp,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  total_hours: number | null;
  overtime_hours: number | null;
  break_duration_minutes: number | null;
  location: string | null;
  latitude?: number | null;
  longitude?: number | null;
  check_in_photo?: string | null;
  check_out_photo?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  notes?: string | null;
}

interface AttendanceHistoryViewProps {
  employeeId?: string; // Optional - if provided, shows specific employee, otherwise shows current user
}

export function AttendanceHistoryView({ employeeId }: AttendanceHistoryViewProps) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvalFilter, setApprovalFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'quarter' | 'year' | 'all'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendance();
  }, [selectedMonth, dateRange, employeeId]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const url = employeeId 
        ? `/api/employer/team/${employeeId}/attendance?month=${selectedMonth}`
        : `/api/employee/attendance?month=${selectedMonth}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attendance');
      }

      setAttendance(data.attendance || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load attendance history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
      present: { variant: 'default', className: 'bg-green-100 text-green-800 border-green-300' },
      late: { variant: 'default', className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      absent: { variant: 'destructive', className: 'bg-red-100 text-red-800 border-red-300' },
      half_day: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 border-blue-300' },
      leave: { variant: 'outline', className: 'bg-purple-100 text-purple-800 border-purple-300' },
      holiday: { variant: 'outline', className: 'bg-gray-100 text-gray-800 border-gray-300' },
    };

    const config = variants[status] || { variant: 'outline' as const, className: '' };
    return (
      <Badge variant={config.variant} className={cn('text-xs', config.className)}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const getApprovalBadge = (status?: string) => {
    if (!status) return null;
    
    const variants = {
      approved: { className: 'bg-green-100 text-green-800 border-green-300' },
      pending: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      rejected: { className: 'bg-red-100 text-red-800 border-red-300' },
    };

    const config = variants[status as keyof typeof variants] || { className: '' };
    return (
      <Badge variant="outline" className={cn('text-xs', config.className)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const formatTime = (time: string | null) => {
    if (!time) return '--:--';
    try {
      return format(parseISO(time), 'hh:mm a');
    } catch {
      return '--:--';
    }
  };

  const formatHours = (hours: number | null) => {
    if (hours === null || hours === undefined) return '--';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const filteredAttendance = attendance.filter((record) => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const dateStr = format(parseISO(record.attendance_date), 'MMM dd, yyyy').toLowerCase();
      const statusStr = record.status.toLowerCase();
      if (!dateStr.includes(searchLower) && !statusStr.includes(searchLower)) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && record.status !== statusFilter) {
      return false;
    }

    // Approval filter
    if (approvalFilter !== 'all') {
      if (approvalFilter === 'pending' && record.approval_status !== 'pending') return false;
      if (approvalFilter === 'approved' && record.approval_status !== 'approved') return false;
      if (approvalFilter === 'rejected' && record.approval_status !== 'rejected') return false;
      if (approvalFilter === 'none' && record.approval_status) return false;
    }

    return true;
  });

  const exportToCSV = () => {
    const headers = ['Date', 'Check In', 'Check Out', 'Status', 'Total Hours', 'Overtime', 'Break', 'Approval Status'];
    const rows = filteredAttendance.map(record => [
      format(parseISO(record.attendance_date), 'yyyy-MM-dd'),
      formatTime(record.check_in),
      formatTime(record.check_out),
      record.status,
      record.total_hours?.toFixed(2) || '0',
      record.overtime_hours?.toFixed(2) || '0',
      record.break_duration_minutes ? `${Math.floor(record.break_duration_minutes / 60)}h ${record.break_duration_minutes % 60}m` : '0h 0m',
      record.approval_status || 'N/A',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: 'Export Successful',
      description: 'Attendance data exported to CSV',
    });
  };

  // Calculate statistics - ensure it's always a valid object
  const stats = useMemo(() => {
    const present = filteredAttendance.filter(r => r.status === 'present' || r.status === 'late').length;
    const late = filteredAttendance.filter(r => r.status === 'late').length;
    const absent = filteredAttendance.filter(r => r.status === 'absent').length;
    const totalHours = filteredAttendance.reduce((sum, r) => sum + (r.total_hours || 0), 0);
    const overtimeHours = filteredAttendance.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
    const averageHours = filteredAttendance.length > 0 
      ? filteredAttendance.reduce((sum, r) => sum + (r.total_hours || 0), 0) / filteredAttendance.length 
      : 0;
    
    return {
      total: filteredAttendance.length,
      present,
      late,
      absent,
      totalHours,
      overtimeHours,
      averageHours,
    };
  }, [filteredAttendance]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading attendance history...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.present}</div>
              <div className="text-sm text-gray-600">Present Days</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
              <div className="text-sm text-gray-600">Late Days</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.totalHours.toFixed(1)}h</div>
              <div className="text-sm text-gray-600">Total Hours</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.overtimeHours.toFixed(1)}h</div>
              <div className="text-sm text-gray-600">Overtime</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance History</CardTitle>
              <CardDescription>View and filter your attendance records</CardDescription>
            </div>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by date or status..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
              </SelectContent>
            </Select>
            <Select value={approvalFilter} onValueChange={setApprovalFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Approval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Approval</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="none">No Status</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Break</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {format(parseISO(record.attendance_date), 'MMM dd, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {formatTime(record.check_in)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {formatTime(record.check_out)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>{formatHours(record.total_hours)}</TableCell>
                      <TableCell>
                        {record.overtime_hours && record.overtime_hours > 0 ? (
                          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                            {formatHours(record.overtime_hours)}
                          </Badge>
                        ) : (
                          '--'
                        )}
                      </TableCell>
                      <TableCell>
                        {record.break_duration_minutes ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Coffee className="h-3 w-3 text-gray-400" />
                            {Math.floor(record.break_duration_minutes / 60)}h {record.break_duration_minutes % 60}m
                          </div>
                        ) : (
                          '--'
                        )}
                      </TableCell>
                      <TableCell>{getApprovalBadge(record.approval_status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="text-sm text-gray-600 text-center">
            Showing {filteredAttendance.length} of {attendance.length} records
            {stats && typeof stats === 'object' && 'averageHours' in stats && stats.averageHours > 0 && (
              <span className="ml-4">
                • Average: {stats.averageHours.toFixed(1)} hours/day
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

