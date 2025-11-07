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
import { Badge } from '@/components/ui/badge';
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
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  Users,
} from 'lucide-react';

interface AttendanceRecord {
  id: number;
  employee_id: number;
  check_in: string;
  check_out: string | null;
  location: string;
  method: string;
  notes: string;
  overtime_hours: number;
  break_duration_minutes: number;
  employees: {
    full_name: string;
    employee_code: string;
    job_title: string;
  };
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchAttendance();
  }, [currentPage, searchTerm, dateFilter, statusFilter]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);

      // Calculate date range based on filter
      let startDate = '';
      let endDate = '';

      const today = new Date();
      switch (dateFilter) {
        case 'today':
          startDate = today.toISOString().split('T')[0] ?? '';
          endDate = today.toISOString().split('T')[0] ?? '';
          break;
        case 'week':
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          startDate = weekStart.toISOString().split('T')[0] ?? '';
          endDate = today.toISOString().split('T')[0] ?? '';
          break;
        case 'month':
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          startDate = monthStart.toISOString().split('T')[0] ?? '';
          endDate = today.toISOString().split('T')[0] ?? '';
          break;
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      });

      const response = await fetch(`/api/hr/attendance?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAttendance(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        console.error('Error fetching attendance:', data.error);
        // Fallback to mock data for demo
        setAttendance([
          {
            id: 1,
            employee_id: 1,
            check_in: '2024-01-20T08:00:00Z',
            check_out: '2024-01-20T17:00:00Z',
            location: 'Main Office',
            method: 'web',
            notes: '',
            overtime_hours: 0,
            break_duration_minutes: 60,
            employees: {
              full_name: 'Ahmed Al-Rashid',
              employee_code: 'EMP0001',
              job_title: 'Software Developer',
            },
          },
          {
            id: 2,
            employee_id: 2,
            check_in: '2024-01-20T08:30:00Z',
            check_out: null,
            location: 'Main Office',
            method: 'mobile',
            notes: '',
            overtime_hours: 0,
            break_duration_minutes: 0,
            employees: {
              full_name: 'Sarah Johnson',
              employee_code: 'EMP0002',
              job_title: 'HR Manager',
            },
          },
        ]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const calculateWorkHours = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return 'In Progress';

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

    return `${diffHours}h`;
  };

  const getStatusBadge = (checkOut: string | null) => {
    if (checkOut) {
      return (
        <Badge variant='default' className='bg-green-100 text-green-800'>
          Completed
        </Badge>
      );
    }
    return (
      <Badge variant='secondary' className='bg-yellow-100 text-yellow-800'>
        In Progress
      </Badge>
    );
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Attendance</h1>
          <p className='text-gray-600 mt-2'>
            Track employee attendance and working hours
          </p>
        </div>
        <div className='flex space-x-3'>
          <Button variant='outline'>
            <Download className='w-4 h-4 mr-2' />
            Export
          </Button>
          <Button variant='outline'>
            <Calendar className='w-4 h-4 mr-2' />
            Calendar View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-green-100 rounded-full'>
                <CheckCircle className='w-6 h-6 text-green-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Present Today
                </p>
                <p className='text-2xl font-bold text-gray-900'>89</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-yellow-100 rounded-full'>
                <Clock className='w-6 h-6 text-yellow-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>In Progress</p>
                <p className='text-2xl font-bold text-gray-900'>12</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-red-100 rounded-full'>
                <XCircle className='w-6 h-6 text-red-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>Absent</p>
                <p className='text-2xl font-bold text-gray-900'>3</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center'>
              <div className='p-2 bg-blue-100 rounded-full'>
                <Users className='w-6 h-6 text-blue-600' />
              </div>
              <div className='ml-4'>
                <p className='text-sm font-medium text-gray-600'>
                  Total Employees
                </p>
                <p className='text-2xl font-bold text-gray-900'>104</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search employees...'
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Date Range' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='today'>Today</SelectItem>
                <SelectItem value='week'>This Week</SelectItem>
                <SelectItem value='month'>This Month</SelectItem>
                <SelectItem value='all'>All Time</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
                <SelectItem value='in_progress'>In Progress</SelectItem>
              </SelectContent>
            </Select>

            <Button variant='outline' onClick={fetchAttendance}>
              <Filter className='w-4 h-4 mr-2' />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>{attendance.length} records found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Work Hours</TableHead>
                  <TableHead>Overtime</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.map(record => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>
                          {record.employees.full_name}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {record.employees.employee_code}
                        </div>
                        <div className='text-sm text-gray-500'>
                          {record.employees.job_title}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{formatDate(record.check_in)}</TableCell>
                    <TableCell>{formatTime(record.check_in)}</TableCell>
                    <TableCell>
                      {record.check_out ? formatTime(record.check_out) : '-'}
                    </TableCell>
                    <TableCell>
                      {calculateWorkHours(record.check_in, record.check_out)}
                    </TableCell>
                    <TableCell>
                      {record.overtime_hours > 0
                        ? `${record.overtime_hours}h`
                        : '-'}
                    </TableCell>
                    <TableCell>{getStatusBadge(record.check_out)}</TableCell>
                    <TableCell>{record.location || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4'>
              <div className='text-sm text-gray-500'>
                Page {currentPage} of {totalPages}
              </div>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
