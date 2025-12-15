'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  CalendarDays,
  Palmtree,
  Thermometer,
  Heart,
  Baby,
  Briefcase,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string | null;
  status: string;
  reviewed_at: string | null;
  review_notes: string | null;
  reviewed_by_user?: {
    full_name: string | null;
  } | null;
  created_at: string;
}

interface LeaveBalance {
  leave_type: string;
  total_days: number;
  used_days: number;
  pending_days: number;
}

const leaveTypeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  vacation: { label: 'Vacation', icon: Palmtree, color: 'text-green-500' },
  sick: { label: 'Sick Leave', icon: Thermometer, color: 'text-red-500' },
  personal: { label: 'Personal', icon: Heart, color: 'text-pink-500' },
  maternity: { label: 'Maternity', icon: Baby, color: 'text-purple-500' },
  paternity: { label: 'Paternity', icon: Baby, color: 'text-blue-500' },
  bereavement: { label: 'Bereavement', icon: Heart, color: 'text-gray-500' },
  unpaid: { label: 'Unpaid', icon: Briefcase, color: 'text-amber-500' },
  other: { label: 'Other', icon: Calendar, color: 'text-gray-500' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
  approved: { label: 'Approved', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  rejected: { label: 'Rejected', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  cancelled: { label: 'Cancelled', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30' },
};

export function LeaveRequestsCard() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    leave_type: 'vacation',
    start_date: '',
    end_date: '',
    reason: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLeaveData();
  }, []);

  const fetchLeaveData = async () => {
    try {
      const response = await fetch('/api/employee/leave-requests');
      const data = await response.json();

      if (response.ok && data.success) {
        setRequests(data.requests || []);
        setBalances(data.balances || []);
      }
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/employee/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '✅ Leave Request Submitted',
        description: 'Your request is pending approval',
      });

      setDialogOpen(false);
      setFormData({ leave_type: 'vacation', start_date: '', end_date: '', reason: '' });
      fetchLeaveData();
    } catch (error: any) {
      toast({
        title: 'Request Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateDays = () => {
    if (!formData.start_date || !formData.end_date) return 0;
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    if (end < start) return 0;

    let days = 0;
    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay();
      if (day !== 0 && day !== 6) days++;
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const vacationBalance = balances.find(b => b.leave_type === 'vacation');

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-teal-600" />
            Leave Requests
          </CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Request Leave
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Request Leave</DialogTitle>
                <DialogDescription>
                  Submit a leave request for approval
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <Select
                    value={formData.leave_type}
                    onValueChange={(v) => setFormData(prev => ({ ...prev, leave_type: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(leaveTypeConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className="flex items-center gap-2">
                            <config.icon className={cn("h-4 w-4", config.color)} />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                      min={new Date().toISOString().slice(0, 10)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                      min={formData.start_date || new Date().toISOString().slice(0, 10)}
                      required
                    />
                  </div>
                </div>

                {calculateDays() > 0 && (
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      <strong>{calculateDays()}</strong> working day(s)
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Reason (Optional)</Label>
                  <Textarea
                    placeholder="Provide a reason for your leave request..."
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={submitting || calculateDays() === 0}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Submit Request
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Leave Balance */}
        {vacationBalance && (
          <div className="p-4 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-xl border border-teal-200 dark:border-teal-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-teal-600 dark:text-teal-400">Annual Leave Balance</p>
                <p className="text-2xl font-bold text-teal-700 dark:text-teal-300">
                  {vacationBalance.total_days - vacationBalance.used_days - vacationBalance.pending_days} days
                </p>
              </div>
              <div className="text-right text-sm">
                <p className="text-gray-500">Used: {vacationBalance.used_days}</p>
                <p className="text-amber-500">Pending: {vacationBalance.pending_days}</p>
              </div>
            </div>
          </div>
        )}

        {/* Pending Requests Alert */}
        {pendingRequests.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-700 dark:text-amber-400">
                {pendingRequests.length} pending request(s) awaiting approval
              </span>
            </div>
          </div>
        )}

        {/* Request List */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarDays className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No leave requests</p>
            </div>
          ) : (
            requests.slice(0, 5).map(request => {
              const typeConfig = leaveTypeConfig[request.leave_type] || leaveTypeConfig.other;
              const statusCfg = statusConfig[request.status] || statusConfig.pending;
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={request.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={cn("p-2 rounded-lg", statusCfg.bg)}>
                        <TypeIcon className={cn("h-4 w-4", typeConfig.color)} />
                      </div>
                      <div>
                        <p className="font-medium">{typeConfig.label}</p>
                        <p className="text-sm text-gray-500">
                          {format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-400">
                          {request.total_days} day(s)
                        </p>
                      </div>
                    </div>
                    <Badge className={cn(statusCfg.bg, statusCfg.color, "border-0")}>
                      {statusCfg.label}
                    </Badge>
                  </div>
                  {request.review_notes && request.status !== 'pending' && (
                    <p className="mt-2 text-xs text-gray-500 italic pl-11">
                      Note: {request.review_notes}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}

