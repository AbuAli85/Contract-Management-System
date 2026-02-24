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
import { Checkbox } from '@/components/ui/checkbox';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Camera,
  User,
  Calendar,
  AlertCircle,
  CheckSquare,
  Square,
  Download,
  Filter,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
}

export function ManagerApprovalWorkflow() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecords, setSelectedRecords] = useState<Set<string>>(
    new Set()
  );
  const [approvalDialog, setApprovalDialog] = useState<{
    open: boolean;
    action: 'approve' | 'reject' | null;
  }>({
    open: false,
    action: null,
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending');
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingAttendance();
  }, [filter]);

  const fetchPendingAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/employer/attendance/pending?filter=${filter}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attendance');
      }

      setAttendance(data.attendance || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load attendance records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const newSelection = new Set(selectedRecords);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedRecords(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedRecords.size === attendance.length) {
      setSelectedRecords(new Set());
    } else {
      setSelectedRecords(new Set(attendance.map(r => r.id)));
    }
  };

  const handleBulkAction = (action: 'approve' | 'reject') => {
    if (selectedRecords.size === 0) {
      toast({
        title: 'No Selection',
        description: 'Please select at least one record',
        variant: 'destructive',
      });
      return;
    }

    setApprovalDialog({ open: true, action });
  };

  const confirmBulkAction = async () => {
    if (selectedRecords.size === 0) return;

    try {
      const action = approvalDialog.action;
      const response = await fetch('/api/employer/attendance/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_ids: Array.from(selectedRecords),
          action,
          rejection_reason: action === 'reject' ? rejectionReason : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process approval');
      }

      toast({
        title: 'Success',
        description: `${selectedRecords.size} record(s) ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      setSelectedRecords(new Set());
      setApprovalDialog({ open: false, action: null });
      setRejectionReason('');
      await fetchPendingAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process approval',
        variant: 'destructive',
      });
    }
  };

  const handleSingleAction = async (
    id: string,
    action: 'approve' | 'reject'
  ) => {
    try {
      const response = await fetch('/api/employer/attendance/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attendance_ids: [id],
          action,
          rejection_reason: action === 'reject' ? 'Rejected by manager' : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process approval');
      }

      toast({
        title: 'Success',
        description: `Record ${action === 'approve' ? 'approved' : 'rejected'} successfully`,
      });

      await fetchPendingAttendance();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to process approval',
        variant: 'destructive',
      });
    }
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

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string }> = {
      present: { className: 'bg-green-100 text-green-800 border-green-300' },
      late: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
      absent: { className: 'bg-red-100 text-red-800 border-red-300' },
    };

    const config = variants[status] || { className: '' };
    return (
      <Badge variant='outline' className={cn('text-xs', config.className)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const filteredAttendance = attendance.filter(record => {
    if (filter === 'all') return true;
    return record.approval_status === filter;
  });

  if (loading) {
    return (
      <Card>
        <CardContent className='pt-6'>
          <div className='flex items-center justify-center h-64'>
            <div className='text-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
              <p className='text-muted-foreground'>
                Loading attendance records...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Attendance Approval</CardTitle>
              <CardDescription>
                Review and approve employee attendance records
              </CardDescription>
            </div>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  setFilter(filter === 'pending' ? 'all' : 'pending')
                }
              >
                <Filter className='h-4 w-4 mr-2' />
                {filter === 'pending' ? 'Show All' : 'Show Pending'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Bulk Actions */}
          {selectedRecords.size > 0 && (
            <div className='mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <CheckSquare className='h-4 w-4 text-blue-600' />
                <span className='text-sm font-medium text-blue-900'>
                  {selectedRecords.size} record(s) selected
                </span>
              </div>
              <div className='flex gap-2'>
                <Button
                  size='sm'
                  onClick={() => handleBulkAction('approve')}
                  className='bg-green-600 hover:bg-green-700'
                >
                  <CheckCircle2 className='h-4 w-4 mr-2' />
                  Approve Selected
                </Button>
                <Button
                  size='sm'
                  variant='destructive'
                  onClick={() => handleBulkAction('reject')}
                >
                  <XCircle className='h-4 w-4 mr-2' />
                  Reject Selected
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'>
                    <Checkbox
                      checked={
                        selectedRecords.size === attendance.length &&
                        attendance.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Photo</TableHead>
                  <TableHead>Approval</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAttendance.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={11}
                      className='text-center py-8 text-gray-500'
                    >
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAttendance.map(record => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecords.has(record.id)}
                          onCheckedChange={() => toggleSelection(record.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Avatar className='h-8 w-8'>
                            <AvatarImage
                              src={record.employee?.avatar_url || undefined}
                            />
                            <AvatarFallback>
                              {record.employee?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className='font-medium text-sm'>
                              {record.employee?.full_name || 'Unknown'}
                            </div>
                            <div className='text-xs text-gray-500'>
                              {record.employee?.email || ''}
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
                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3 text-gray-400' />
                          {formatTime(record.check_in)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Clock className='h-3 w-3 text-gray-400' />
                          {formatTime(record.check_out)}
                        </div>
                      </TableCell>
                      <TableCell>{formatHours(record.total_hours)}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.latitude && record.longitude ? (
                          <div className='flex items-center gap-1 text-xs'>
                            <MapPin className='h-3 w-3 text-gray-400' />
                            {record.latitude.toFixed(4)},{' '}
                            {record.longitude.toFixed(4)}
                          </div>
                        ) : (
                          '--'
                        )}
                      </TableCell>
                      <TableCell>
                        {record.check_in_photo ? (
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() =>
                              window.open(record.check_in_photo || '', '_blank')
                            }
                          >
                            <Camera className='h-4 w-4' />
                          </Button>
                        ) : (
                          '--'
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant='outline'
                          className={cn(
                            'text-xs',
                            record.approval_status === 'approved' &&
                              'bg-green-100 text-green-800 border-green-300',
                            record.approval_status === 'pending' &&
                              'bg-yellow-100 text-yellow-800 border-yellow-300',
                            record.approval_status === 'rejected' &&
                              'bg-red-100 text-red-800 border-red-300'
                          )}
                        >
                          {record.approval_status || 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-1'>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() =>
                              handleSingleAction(record.id, 'approve')
                            }
                            className='text-green-600 hover:text-green-700 hover:bg-green-50'
                          >
                            <CheckCircle2 className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='ghost'
                            onClick={() =>
                              handleSingleAction(record.id, 'reject')
                            }
                            className='text-red-600 hover:text-red-700 hover:bg-red-50'
                          >
                            <XCircle className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Approval Dialog */}
      <Dialog
        open={approvalDialog.open}
        onOpenChange={open => setApprovalDialog({ open, action: null })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalDialog.action === 'approve'
                ? 'Approve Attendance'
                : 'Reject Attendance'}
            </DialogTitle>
            <DialogDescription>
              {approvalDialog.action === 'approve'
                ? `Are you sure you want to approve ${selectedRecords.size} record(s)?`
                : `Please provide a reason for rejecting ${selectedRecords.size} record(s).`}
            </DialogDescription>
          </DialogHeader>
          {approvalDialog.action === 'reject' && (
            <div className='space-y-2'>
              <Label htmlFor='rejection-reason'>Rejection Reason</Label>
              <Textarea
                id='rejection-reason'
                placeholder='Enter reason for rejection...'
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setApprovalDialog({ open: false, action: null })}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBulkAction}
              className={
                approvalDialog.action === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
            >
              {approvalDialog.action === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
