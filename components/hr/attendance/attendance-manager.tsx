'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import {
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  TrendingUp,
  Download,
  Filter,
  Search,
  Users,
  AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AttendanceRecord {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  total_hours: number | null;
  overtime_hours: number;
  location: string | null;
  method: string;
  employer_employee: {
    id: string;
    employee: {
      name_en?: string;
      name_ar?: string;
      email?: string;
    };
    job_title?: string;
    department?: string;
  };
}

interface AttendanceStats {
  total_employees: number;
  present_today: number;
  absent_today: number;
  late_today: number;
  on_leave_today: number;
  average_hours: number;
  total_overtime: number;
}

export function AttendanceManager() {
  const [selectedMonth, setSelectedMonth] = useState(
    format(new Date(), 'yyyy-MM')
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch attendance data
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['hr-attendance', selectedMonth, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        month: selectedMonth,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const response = await fetch(`/api/hr/attendance?${params}`);
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
  });

  const attendance = (attendanceData?.attendance || []) as AttendanceRecord[];
  const stats = (attendanceData?.stats || {}) as AttendanceStats;

  // Filter by search term
  const filteredAttendance = attendance.filter((record) => {
    if (!searchTerm) return true;
    const name =
      record.employer_employee?.employee?.name_en ||
      record.employer_employee?.employee?.name_ar ||
      '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      present: 'default',
      absent: 'destructive',
      late: 'secondary',
      leave: 'outline',
      holiday: 'outline',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Management</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage employee attendance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Present Today</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.present_today || 0}</div>
            <p className="text-xs text-muted-foreground">
              Out of {stats.total_employees || 0} employees
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absent Today</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.absent_today || 0}</div>
            <p className="text-xs text-muted-foreground">Employees absent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Late Arrivals</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.late_today || 0}</div>
            <p className="text-xs text-muted-foreground">Late check-ins</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.average_hours?.toFixed(1) || '0.0'}h
            </div>
            <p className="text-xs text-muted-foreground">Per day this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="leave">On Leave</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {filteredAttendance.length} records for {format(new Date(selectedMonth + '-01'), 'MMMM yyyy')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAttendance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No attendance records found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.employer_employee?.employee?.name_en ||
                            record.employer_employee?.employee?.name_ar ||
                            'Unknown'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.employer_employee?.job_title || 'N/A'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {format(new Date(record.attendance_date), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      {record.check_in
                        ? format(new Date(record.check_in), 'HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.check_out
                        ? format(new Date(record.check_out), 'HH:mm')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.total_hours
                        ? `${record.total_hours.toFixed(1)}h`
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {record.overtime_hours > 0
                        ? `${record.overtime_hours.toFixed(1)}h`
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>{record.location || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

