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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  User,
  Palmtree,
  Thermometer,
  Heart,
  Baby,
  Briefcase,
  Calendar,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: string;
  created_at: string;
  employer_employee?: {
    job_title: string | null;
    department: string | null;
    employee?: {
      full_name: string | null;
      email: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

const leaveTypeConfig: Record<
  string,
  { label: string; icon: React.ElementType; color: string }
> = {
  vacation: { label: 'Vacation', icon: Palmtree, color: 'text-green-500' },
  sick: { label: 'Sick Leave', icon: Thermometer, color: 'text-red-500' },
  personal: { label: 'Personal', icon: Heart, color: 'text-pink-500' },
  maternity: { label: 'Maternity', icon: Baby, color: 'text-purple-500' },
  paternity: { label: 'Paternity', icon: Baby, color: 'text-blue-500' },
  bereavement: { label: 'Bereavement', icon: Heart, color: 'text-gray-500' },
  unpaid: { label: 'Unpaid', icon: Briefcase, color: 'text-amber-500' },
  other: { label: 'Other', icon: Calendar, color: 'text-gray-500' },
};

export function LeaveRequestsManagement() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<
    'all' | 'pending' | 'approved' | 'rejected'
  >('all');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(
    null
  );
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch('/api/employer/leave-requests');
      const data = await response.json();

      if (response.ok && data.success) {
        setRequests(data.requests || []);
        setStats(data.stats || { pending: 0, approved: 0, rejected: 0 });
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedRequest) return;
    setProcessing(true);

    try {
      const response = await fetch(
        `/api/employer/leave-requests/${selectedRequest.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: actionType,
            review_notes: reviewNotes || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title:
          actionType === 'approve'
            ? '✅ Request Approved'
            : '❌ Request Rejected',
        description: `Leave request has been ${actionType}d`,
      });

      setActionDialogOpen(false);
      setSelectedRequest(null);
      setReviewNotes('');
      fetchLeaveRequests();
    } catch (error: any) {
      toast({
        title: 'Action Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const openActionDialog = (
    request: LeaveRequest,
    action: 'approve' | 'reject'
  ) => {
    setSelectedRequest(request);
    setActionType(action);
    setActionDialogOpen(true);
  };

  const filteredRequests =
    filter === 'all' ? requests : requests.filter(r => r.status === filter);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Stats */}
      <div className='grid grid-cols-3 gap-4'>
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg',
            filter === 'pending' && 'ring-2 ring-amber-400'
          )}
          onClick={() => setFilter(filter === 'pending' ? 'all' : 'pending')}
        >
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Pending</p>
                <p className='text-3xl font-bold text-amber-600'>
                  {stats.pending}
                </p>
              </div>
              <Clock className='h-8 w-8 text-amber-500 opacity-50' />
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg',
            filter === 'approved' && 'ring-2 ring-green-400'
          )}
          onClick={() => setFilter(filter === 'approved' ? 'all' : 'approved')}
        >
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Approved</p>
                <p className='text-3xl font-bold text-green-600'>
                  {stats.approved}
                </p>
              </div>
              <CheckCircle2 className='h-8 w-8 text-green-500 opacity-50' />
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            'cursor-pointer transition-all hover:shadow-lg',
            filter === 'rejected' && 'ring-2 ring-red-400'
          )}
          onClick={() => setFilter(filter === 'rejected' ? 'all' : 'rejected')}
        >
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <p className='text-sm text-gray-500'>Rejected</p>
                <p className='text-3xl font-bold text-red-600'>
                  {stats.rejected}
                </p>
              </div>
              <XCircle className='h-8 w-8 text-red-500 opacity-50' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Request List */}
      <Card className='border-0 shadow-lg'>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                <CalendarDays className='h-5 w-5' />
                Leave Requests
              </CardTitle>
              <CardDescription>
                {filter === 'all' ? 'All requests' : `Filtered: ${filter}`}
              </CardDescription>
            </div>
            {filter !== 'all' && (
              <Button
                variant='outline'
                size='sm'
                onClick={() => setFilter('all')}
              >
                <Filter className='h-4 w-4 mr-1' />
                Clear Filter
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {filteredRequests.length === 0 ? (
              <div className='text-center py-8 text-gray-500'>
                <CalendarDays className='h-12 w-12 mx-auto mb-2 opacity-30' />
                <p>
                  No leave requests{' '}
                  {filter !== 'all' ? `with status "${filter}"` : ''}
                </p>
              </div>
            ) : (
              filteredRequests.map(request => {
                const typeConfig =
                  leaveTypeConfig[request.leave_type] || leaveTypeConfig.other;
                const TypeIcon = typeConfig.icon;
                const employee = request.employer_employee?.employee;

                return (
                  <div
                    key={request.id}
                    className='p-4 border rounded-xl hover:shadow-md transition-all'
                  >
                    <div className='flex items-start gap-4'>
                      <Avatar className='h-12 w-12'>
                        <AvatarImage src={employee?.avatar_url || undefined} />
                        <AvatarFallback>
                          {getInitials(employee?.full_name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className='flex-1 min-w-0'>
                        <div className='flex items-start justify-between gap-4'>
                          <div>
                            <h4 className='font-medium'>
                              {employee?.full_name || 'Unknown'}
                            </h4>
                            <p className='text-sm text-gray-500'>
                              {request.employer_employee?.job_title ||
                                'No title'}
                              {request.employer_employee?.department &&
                                ` • ${request.employer_employee.department}`}
                            </p>
                          </div>
                          <Badge
                            className={cn(
                              request.status === 'pending' &&
                                'bg-amber-100 text-amber-700',
                              request.status === 'approved' &&
                                'bg-green-100 text-green-700',
                              request.status === 'rejected' &&
                                'bg-red-100 text-red-700',
                              'border-0'
                            )}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </Badge>
                        </div>

                        <div className='mt-3 flex flex-wrap items-center gap-4 text-sm'>
                          <div className='flex items-center gap-1'>
                            <TypeIcon
                              className={cn('h-4 w-4', typeConfig.color)}
                            />
                            <span>{typeConfig.label}</span>
                          </div>
                          <div className='flex items-center gap-1 text-gray-500'>
                            <Calendar className='h-4 w-4' />
                            {format(
                              new Date(request.start_date),
                              'MMM d'
                            )} -{' '}
                            {format(new Date(request.end_date), 'MMM d, yyyy')}
                          </div>
                          <Badge variant='outline'>
                            {request.total_days} day(s)
                          </Badge>
                        </div>

                        {request.reason && (
                          <p className='mt-2 text-sm text-gray-600 italic'>
                            "{request.reason}"
                          </p>
                        )}

                        {request.status === 'pending' && (
                          <div className='mt-4 flex gap-2'>
                            <Button
                              size='sm'
                              className='bg-green-600 hover:bg-green-700'
                              onClick={() =>
                                openActionDialog(request, 'approve')
                              }
                            >
                              <CheckCircle2 className='h-4 w-4 mr-1' />
                              Approve
                            </Button>
                            <Button
                              size='sm'
                              variant='destructive'
                              onClick={() =>
                                openActionDialog(request, 'reject')
                              }
                            >
                              <XCircle className='h-4 w-4 mr-1' />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve'
                ? 'Approve Leave Request'
                : 'Reject Leave Request'}
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve'
                ? "This will approve the leave request and deduct from the employee's leave balance."
                : 'This will reject the leave request.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className='p-4 bg-gray-50 dark:bg-gray-900 rounded-lg'>
              <p className='font-medium'>
                {selectedRequest.employer_employee?.employee?.full_name}
              </p>
              <p className='text-sm text-gray-500'>
                {leaveTypeConfig[selectedRequest.leave_type]?.label || 'Leave'}{' '}
                • {selectedRequest.total_days} day(s)
              </p>
              <p className='text-sm text-gray-500'>
                {format(new Date(selectedRequest.start_date), 'MMM d')} -{' '}
                {format(new Date(selectedRequest.end_date), 'MMM d, yyyy')}
              </p>
            </div>
          )}

          <div className='space-y-2'>
            <label className='text-sm font-medium'>Notes (Optional)</label>
            <Textarea
              placeholder={
                actionType === 'reject'
                  ? 'Reason for rejection...'
                  : 'Any notes...'
              }
              value={reviewNotes}
              onChange={e => setReviewNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setActionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={
                actionType === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : ''
              }
              variant={actionType === 'reject' ? 'destructive' : 'default'}
            >
              {processing && <Loader2 className='h-4 w-4 animate-spin mr-2' />}
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
