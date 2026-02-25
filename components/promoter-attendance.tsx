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
import { Textarea } from '@/components/ui/textarea';
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
import {
  Calendar,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  FileText,
} from 'lucide-react';
import { PromoterAttendanceLog, PromoterLeaveRequest } from '@/lib/types';
import { toast } from 'sonner';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  parseISO,
} from 'date-fns';

interface PromoterAttendanceProps {
  promoterId: string;
  isAdmin: boolean;
}

export function PromoterAttendance({
  promoterId,
  isAdmin,
}: PromoterAttendanceProps) {
  const [activeTab, setActiveTab] = useState('calendar');
  const [attendanceLogs, setAttendanceLogs] = useState<PromoterAttendanceLog[]>(
    []
  );
  const [leaveRequests, setLeaveRequests] = useState<PromoterLeaveRequest[]>(
    []
  );
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [isLeaveRequestDialogOpen, setIsLeaveRequestDialogOpen] =
    useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Attendance form
  const [attendanceForm, setAttendanceForm] = useState({
    date: '',
    check_in_time: '',
    check_out_time: '',
    status: 'present',
    notes: '',
  });

  // Leave request form
  const [leaveRequestForm, setLeaveRequestForm] = useState({
    leave_type: '',
    start_date: '',
    end_date: '',
    reason: '',
  });

  // Fetch attendance data
  useEffect(() => {
    fetchAttendanceData();
  }, [promoterId, currentMonth]);

  const fetchAttendanceData = async () => {
    try {
      const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');

      // Fetch attendance logs
      const attendanceResponse = await fetch(
        `/api/promoters/${promoterId}/attendance?start_date=${startDate}&end_date=${endDate}`
      );
      if (attendanceResponse.ok) {
        const attendanceData = await attendanceResponse.json();
        setAttendanceLogs(attendanceData);
      }

      // Fetch leave requests
      const leaveResponse = await fetch(
        `/api/promoters/${promoterId}/leave-requests`
      );
      if (leaveResponse.ok) {
        const leaveData = await leaveResponse.json();
        setLeaveRequests(leaveData);
      }
    } catch (error) {
    }
  };

  // Attendance handlers
  const handleAttendanceSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/attendance`;
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { id: editingItem.id, ...attendanceForm }
        : attendanceForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const newAttendance = await response.json();
        if (editingItem) {
          setAttendanceLogs(
            attendanceLogs.map(a =>
              a.id === editingItem.id ? newAttendance : a
            )
          );
        } else {
          setAttendanceLogs([...attendanceLogs, newAttendance]);
        }
        setAttendanceForm({
          date: '',
          check_in_time: '',
          check_out_time: '',
          status: 'present',
          notes: '',
        });
        setEditingItem(null);
        setIsAttendanceDialogOpen(false);
        toast.success(
          editingItem
            ? 'Attendance updated successfully'
            : 'Attendance added successfully'
        );
      }
    } catch (error) {
      toast.error('Failed to save attendance');
    }
  };

  const handleAttendanceDelete = async (attendanceId: string) => {
    try {
      const response = await fetch(`/api/promoters/${promoterId}/attendance`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: attendanceId }),
      });

      if (response.ok) {
        setAttendanceLogs(attendanceLogs.filter(a => a.id !== attendanceId));
        toast.success('Attendance deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete attendance');
    }
  };

  // Leave request handlers
  const handleLeaveRequestSubmit = async () => {
    try {
      const url = `/api/promoters/${promoterId}/leave-requests`;
      const method = editingItem ? 'PUT' : 'POST';
      const body = editingItem
        ? { id: editingItem.id, ...leaveRequestForm }
        : leaveRequestForm;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const newLeaveRequest = await response.json();
        if (editingItem) {
          setLeaveRequests(
            leaveRequests.map(l =>
              l.id === editingItem.id ? newLeaveRequest : l
            )
          );
        } else {
          setLeaveRequests([...leaveRequests, newLeaveRequest]);
        }
        setLeaveRequestForm({
          leave_type: '',
          start_date: '',
          end_date: '',
          reason: '',
        });
        setEditingItem(null);
        setIsLeaveRequestDialogOpen(false);
        toast.success(
          editingItem
            ? 'Leave request updated successfully'
            : 'Leave request added successfully'
        );
      }
    } catch (error) {
      toast.error('Failed to save leave request');
    }
  };

  const handleLeaveRequestDelete = async (leaveRequestId: string) => {
    try {
      const response = await fetch(
        `/api/promoters/${promoterId}/leave-requests`,
        {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: leaveRequestId }),
        }
      );

      if (response.ok) {
        setLeaveRequests(leaveRequests.filter(l => l.id !== leaveRequestId));
        toast.success('Leave request deleted successfully');
      }
    } catch (error) {
      toast.error('Failed to delete leave request');
    }
  };

  const openEditDialog = (item: any, type: string) => {
    setEditingItem(item);
    if (type === 'attendance') {
      setAttendanceForm({
        date: item.date,
        check_in_time: item.check_in_time || '',
        check_out_time: item.check_out_time || '',
        status: item.status,
        notes: item.notes || '',
      });
      setIsAttendanceDialogOpen(true);
    } else if (type === 'leave') {
      setLeaveRequestForm({
        leave_type: item.leave_type,
        start_date: item.start_date,
        end_date: item.end_date,
        reason: item.reason || '',
      });
      setIsLeaveRequestDialogOpen(true);
    }
  };

  // Calendar helpers
  const getAttendanceForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return attendanceLogs.find(log => log.date === dateStr);
  };

  const getLeaveRequestForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return leaveRequests.find(
      leave => leave.start_date <= dateStr && leave.end_date >= dateStr
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'absent':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'late':
        return <AlertCircle className='h-4 w-4 text-yellow-500' />;
      default:
        return <Clock className='h-4 w-4 text-gray-500' />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge variant='default'>Present</Badge>;
      case 'absent':
        return <Badge variant='destructive'>Absent</Badge>;
      case 'late':
        return <Badge variant='secondary'>Late</Badge>;
      case 'half-day':
        return <Badge variant='outline'>Half Day</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const getLeaveStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant='secondary'>Pending</Badge>;
      case 'approved':
        return <Badge variant='default'>Approved</Badge>;
      case 'rejected':
        return <Badge variant='destructive'>Rejected</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const calendarDays = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className='p-6'>
          <p className='text-center text-muted-foreground'>
            Attendance management is restricted to administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='calendar'>Calendar</TabsTrigger>
          <TabsTrigger value='logs'>Attendance Logs</TabsTrigger>
          <TabsTrigger value='leave'>Leave Requests</TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value='calendar' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Attendance Calendar</h3>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() - 1
                    )
                  )
                }
              >
                Previous
              </Button>
              <span className='px-4 py-2 text-sm font-medium'>
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.getFullYear(),
                      currentMonth.getMonth() + 1
                    )
                  )
                }
              >
                Next
              </Button>
            </div>
          </div>

          <Card>
            <CardContent className='p-4'>
              <div className='grid grid-cols-7 gap-1'>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div
                    key={day}
                    className='p-2 text-center text-sm font-medium text-muted-foreground'
                  >
                    {day}
                  </div>
                ))}
                {calendarDays.map(day => {
                  const attendance = getAttendanceForDate(day);
                  const leaveRequest = getLeaveRequestForDate(day);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <div
                      key={day.toISOString()}
                      className={`min-h-[80px] cursor-pointer rounded-lg border p-2 hover:bg-muted/50 ${
                        isToday ? 'border-blue-200 bg-blue-50' : ''
                      }`}
                      onClick={() => {
                        if (attendance) {
                          openEditDialog(attendance, 'attendance');
                        } else {
                          setAttendanceForm({
                            date: format(day, 'yyyy-MM-dd'),
                            check_in_time: '',
                            check_out_time: '',
                            status: 'present',
                            notes: '',
                          });
                          setEditingItem(null);
                          setIsAttendanceDialogOpen(true);
                        }
                      }}
                    >
                      <div className='text-sm font-medium'>
                        {format(day, 'd')}
                      </div>
                      {attendance && (
                        <div className='mt-1'>
                          {getStatusIcon(attendance.status)}
                          {attendance.check_in_time && (
                            <div className='text-xs text-muted-foreground'>
                              {format(
                                parseISO(attendance.check_in_time),
                                'HH:mm'
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      {leaveRequest && !attendance && (
                        <div className='mt-1'>
                          <FileText className='h-4 w-4 text-blue-500' />
                          <div className='text-xs text-muted-foreground'>
                            {leaveRequest.leave_type}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Logs Tab */}
        <TabsContent value='logs' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Attendance Logs</h3>
            <Dialog
              open={isAttendanceDialogOpen}
              onOpenChange={setIsAttendanceDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size='sm'>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Attendance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Attendance' : 'Add Attendance'}
                  </DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='date'>Date</Label>
                    <Input
                      id='date'
                      type='date'
                      value={attendanceForm.date}
                      onChange={e =>
                        setAttendanceForm({
                          ...attendanceForm,
                          date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='check_in'>Check In</Label>
                      <Input
                        id='check_in'
                        type='time'
                        value={attendanceForm.check_in_time}
                        onChange={e =>
                          setAttendanceForm({
                            ...attendanceForm,
                            check_in_time: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor='check_out'>Check Out</Label>
                      <Input
                        id='check_out'
                        type='time'
                        value={attendanceForm.check_out_time}
                        onChange={e =>
                          setAttendanceForm({
                            ...attendanceForm,
                            check_out_time: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor='status'>Status</Label>
                    <Select
                      value={attendanceForm.status}
                      onValueChange={value =>
                        setAttendanceForm({ ...attendanceForm, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='present'>Present</SelectItem>
                        <SelectItem value='absent'>Absent</SelectItem>
                        <SelectItem value='late'>Late</SelectItem>
                        <SelectItem value='half-day'>Half Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor='notes'>Notes</Label>
                    <Textarea
                      id='notes'
                      value={attendanceForm.notes}
                      onChange={e =>
                        setAttendanceForm({
                          ...attendanceForm,
                          notes: e.target.value,
                        })
                      }
                      placeholder='Additional notes...'
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsAttendanceDialogOpen(false);
                      setEditingItem(null);
                      setAttendanceForm({
                        date: '',
                        check_in_time: '',
                        check_out_time: '',
                        status: 'present',
                        notes: '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAttendanceSubmit}>
                    {editingItem ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className='space-y-3'>
            {attendanceLogs.map(log => (
              <Card key={log.id}>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3'>
                      {getStatusIcon(log.status)}
                      <div>
                        <p className='font-medium'>
                          {format(parseISO(log.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <div className='mt-1 flex items-center gap-2'>
                          {getStatusBadge(log.status)}
                          {log.check_in_time && (
                            <span className='text-sm text-muted-foreground'>
                              In: {format(parseISO(log.check_in_time), 'HH:mm')}
                            </span>
                          )}
                          {log.check_out_time && (
                            <span className='text-sm text-muted-foreground'>
                              Out:{' '}
                              {format(parseISO(log.check_out_time), 'HH:mm')}
                            </span>
                          )}
                        </div>
                        {log.notes && (
                          <p className='mt-1 text-sm text-muted-foreground'>
                            {log.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => openEditDialog(log, 'attendance')}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleAttendanceDelete(log.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {attendanceLogs.length === 0 && (
              <Card>
                <CardContent className='p-8 text-center'>
                  <CalendarDays className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                  <p className='text-muted-foreground'>
                    No attendance logs found.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Leave Requests Tab */}
        <TabsContent value='leave' className='space-y-4'>
          <div className='flex items-center justify-between'>
            <h3 className='text-lg font-semibold'>Leave Requests</h3>
            <Dialog
              open={isLeaveRequestDialogOpen}
              onOpenChange={setIsLeaveRequestDialogOpen}
            >
              <DialogTrigger asChild>
                <Button size='sm'>
                  <Plus className='mr-2 h-4 w-4' />
                  Add Leave Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingItem ? 'Edit Leave Request' : 'Add Leave Request'}
                  </DialogTitle>
                </DialogHeader>
                <div className='space-y-4'>
                  <div>
                    <Label htmlFor='leave-type'>Leave Type</Label>
                    <Select
                      value={leaveRequestForm.leave_type}
                      onValueChange={value =>
                        setLeaveRequestForm({
                          ...leaveRequestForm,
                          leave_type: value,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder='Select leave type' />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='sick'>Sick Leave</SelectItem>
                        <SelectItem value='vacation'>Vacation</SelectItem>
                        <SelectItem value='personal'>Personal Leave</SelectItem>
                        <SelectItem value='other'>Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div>
                      <Label htmlFor='start-date'>Start Date</Label>
                      <Input
                        id='start-date'
                        type='date'
                        value={leaveRequestForm.start_date}
                        onChange={e =>
                          setLeaveRequestForm({
                            ...leaveRequestForm,
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
                        value={leaveRequestForm.end_date}
                        onChange={e =>
                          setLeaveRequestForm({
                            ...leaveRequestForm,
                            end_date: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor='reason'>Reason</Label>
                    <Textarea
                      id='reason'
                      value={leaveRequestForm.reason}
                      onChange={e =>
                        setLeaveRequestForm({
                          ...leaveRequestForm,
                          reason: e.target.value,
                        })
                      }
                      placeholder='Reason for leave request...'
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setIsLeaveRequestDialogOpen(false);
                      setEditingItem(null);
                      setLeaveRequestForm({
                        leave_type: '',
                        start_date: '',
                        end_date: '',
                        reason: '',
                      });
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleLeaveRequestSubmit}>
                    {editingItem ? 'Update' : 'Add'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className='space-y-3'>
            {leaveRequests.map(leave => (
              <Card key={leave.id}>
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center gap-2'>
                        <CalendarIcon className='h-4 w-4 text-blue-500' />
                        <h4 className='font-semibold capitalize'>
                          {leave.leave_type} Leave
                        </h4>
                        {getLeaveStatusBadge(leave.status)}
                      </div>
                      <p className='mb-2 text-sm text-muted-foreground'>
                        {format(parseISO(leave.start_date), 'MMM d, yyyy')} -{' '}
                        {format(parseISO(leave.end_date), 'MMM d, yyyy')}
                      </p>
                      {leave.reason && (
                        <p className='text-sm'>{leave.reason}</p>
                      )}
                      {leave.approved_at && (
                        <p className='mt-2 text-xs text-muted-foreground'>
                          {leave.status === 'approved'
                            ? 'Approved'
                            : 'Rejected'}{' '}
                          on{' '}
                          {format(parseISO(leave.approved_at), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => openEditDialog(leave, 'leave')}
                      >
                        <Edit className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleLeaveRequestDelete(leave.id)}
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {leaveRequests.length === 0 && (
              <Card>
                <CardContent className='p-8 text-center'>
                  <CalendarIcon className='mx-auto mb-4 h-12 w-12 text-muted-foreground' />
                  <p className='text-muted-foreground'>
                    No leave requests found.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
