'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Clock,
  LogIn,
  LogOut,
  MapPin,
  Timer,
  Calendar,
  CheckCircle2,
  XCircle,
  Coffee,
  Loader2,
  AlertCircle,
  History,
  TrendingUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface TodayAttendance {
  id: string;
  attendance_date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  total_hours: number | null;
  location: string | null;
  break_start_time?: string | null;
  break_duration_minutes?: number | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  totalHours: string;
}

export function AttendanceCard() {
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [breakLoading, setBreakLoading] = useState(false);
  const [location, setLocation] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendance();
    // Refresh every minute to update the timer
    const interval = setInterval(fetchAttendance, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await fetch('/api/employee/attendance');
      const data = await response.json();

      if (!response.ok) {
        if (response.status !== 404) {
          throw new Error(data.error);
        }
        return;
      }

      // Find today's record
      const today = new Date().toISOString().slice(0, 10);
      const todayRecord = data.attendance?.find(
        (a: TodayAttendance) => a.attendance_date === today
      );
      
      setTodayAttendance(todayRecord || null);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_in',
          location: location || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '✅ Checked In',
        description: data.message,
      });

      setTodayAttendance(data.attendance);
    } catch (error: any) {
      toast({
        title: 'Check-in Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const response = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check_out',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: '✅ Checked Out',
        description: data.message,
      });

      setTodayAttendance(data.attendance);
    } catch (error: any) {
      toast({
        title: 'Check-out Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getWorkDuration = () => {
    if (!todayAttendance?.check_in) return null;
    
    const checkIn = new Date(todayAttendance.check_in);
    const now = todayAttendance.check_out 
      ? new Date(todayAttendance.check_out) 
      : new Date();
    
    const diffMs = now.getTime() - checkIn.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return { hours, minutes, total: (diffMs / (1000 * 60 * 60)).toFixed(1) };
  };

  const handleBreakAction = async (action: 'start' | 'end') => {
    try {
      setBreakLoading(true);
      const response = await fetch('/api/employee/attendance/break', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to manage break');
      }

      toast({
        title: action === 'start' ? '✅ Break Started' : '✅ Break Ended',
        description: data.message,
      });

      fetchAttendance();
    } catch (error: any) {
      toast({
        title: 'Break Action Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setBreakLoading(false);
    }
  };

  const getBreakDuration = () => {
    if (!todayAttendance?.break_start_time) return null;
    const breakStart = new Date(todayAttendance.break_start_time);
    const now = new Date();
    const diffMs = now.getTime() - breakStart.getTime();
    const minutes = Math.floor(diffMs / (1000 * 60));
    return minutes;
  };

  const getTotalBreakMinutes = () => {
    const activeBreak = getBreakDuration() || 0;
    const recordedBreaks = todayAttendance?.break_duration_minutes || 0;
    return activeBreak + recordedBreaks;
  };

  const workDuration = getWorkDuration();

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
    <Card className="border-0 shadow-lg overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Today's Attendance
            </CardTitle>
            <p className="text-blue-100 mt-1">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          {todayAttendance?.status && (
            <Badge
              className={cn(
                'text-sm px-3 py-1',
                todayAttendance.status === 'present' && 'bg-green-500',
                todayAttendance.status === 'late' && 'bg-amber-500',
                todayAttendance.status === 'absent' && 'bg-red-500'
              )}
            >
              {todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1)}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Current Status */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <LogIn className="h-4 w-4" />
              <span className="text-sm">Check In</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {todayAttendance?.check_in
                ? format(new Date(todayAttendance.check_in), 'hh:mm a')
                : '--:--'}
            </p>
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <div className="flex items-center gap-2 text-gray-500 mb-2">
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Check Out</span>
            </div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {todayAttendance?.check_out
                ? format(new Date(todayAttendance.check_out), 'hh:mm a')
                : '--:--'}
            </p>
          </div>
        </div>

        {/* Work Duration */}
        {workDuration && (
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {todayAttendance?.check_out ? 'Total Work Time' : 'Working Since'}
                </span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {workDuration.hours}h {workDuration.minutes}m
                </p>
                {!todayAttendance?.check_out && (
                  <p className="text-xs text-emerald-600">
                    Started {formatDistanceToNow(new Date(todayAttendance!.check_in!))} ago
                  </p>
                )}
              </div>
            </div>
            {/* Break Information */}
            {todayAttendance && (todayAttendance.break_start_time || (todayAttendance.break_duration_minutes && todayAttendance.break_duration_minutes > 0)) && (
              <div className="mt-3 pt-3 border-t border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Coffee className="h-3 w-3" />
                    {todayAttendance.break_start_time ? 'On Break' : 'Total Breaks'}
                  </span>
                  <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                    {getTotalBreakMinutes()}m
                  </span>
                </div>
                {todayAttendance.break_start_time && (
                  <p className="text-xs text-emerald-600 mt-1">
                    Break started {formatDistanceToNow(new Date(todayAttendance.break_start_time))} ago
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Break Management */}
        {todayAttendance?.check_in && !todayAttendance?.check_out && (
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
            {todayAttendance.break_start_time ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Coffee className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                      On Break
                    </span>
                  </div>
                  <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                    {getBreakDuration()}m
                  </span>
                </div>
                <Button
                  onClick={() => handleBreakAction('end')}
                  disabled={breakLoading}
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
                >
                  {breakLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Coffee className="h-4 w-4 mr-2" />
                  )}
                  End Break
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => handleBreakAction('start')}
                disabled={breakLoading}
                variant="outline"
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-900/30"
              >
                {breakLoading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Coffee className="h-4 w-4 mr-2" />
                )}
                Start Break
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {!todayAttendance?.check_in ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm text-gray-600">
                Location (Optional)
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="location"
                  placeholder="e.g., Office, Remote, Client Site..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button
              onClick={handleCheckIn}
              disabled={actionLoading}
              className="w-full h-14 text-lg bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg"
            >
              {actionLoading ? (
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
              ) : (
                <LogIn className="h-5 w-5 mr-2" />
              )}
              Check In
            </Button>
          </div>
        ) : !todayAttendance?.check_out ? (
          <Button
            onClick={handleCheckOut}
            disabled={actionLoading}
            className="w-full h-14 text-lg bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
          >
            {actionLoading ? (
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
            ) : (
              <LogOut className="h-5 w-5 mr-2" />
            )}
            Check Out
          </Button>
        ) : (
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-center">
            <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">
              Workday Complete!
            </p>
            <p className="text-sm text-gray-500">
              You worked {todayAttendance.total_hours?.toFixed(1)} hours today
            </p>
          </div>
        )}

        {/* Approval Status */}
        {todayAttendance?.approval_status && (
          <div className={cn(
            "p-3 rounded-lg border",
            todayAttendance.approval_status === 'approved' && "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
            todayAttendance.approval_status === 'pending' && "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
            todayAttendance.approval_status === 'rejected' && "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
          )}>
            <div className="flex items-center gap-2">
              {todayAttendance.approval_status === 'approved' && (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              )}
              {todayAttendance.approval_status === 'pending' && (
                <AlertCircle className="h-4 w-4 text-amber-600" />
              )}
              {todayAttendance.approval_status === 'rejected' && (
                <XCircle className="h-4 w-4 text-red-600" />
              )}
              <span className={cn(
                "text-sm font-medium",
                todayAttendance.approval_status === 'approved' && "text-emerald-700 dark:text-emerald-400",
                todayAttendance.approval_status === 'pending' && "text-amber-700 dark:text-amber-400",
                todayAttendance.approval_status === 'rejected' && "text-red-700 dark:text-red-400"
              )}>
                Status: {todayAttendance.approval_status.charAt(0).toUpperCase() + todayAttendance.approval_status.slice(1)}
              </span>
            </div>
            {todayAttendance.approval_status === 'rejected' && todayAttendance.rejection_reason && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                Reason: {todayAttendance.rejection_reason}
              </p>
            )}
          </div>
        )}

        {/* Quick Stats */}
        {summary && summary.totalDays > 0 && (
          <div className="pt-4 border-t space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</h4>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Navigate to full attendance history
                    window.location.href = '/employee/dashboard?tab=attendance';
                  }}
                  className="text-xs h-auto p-1 gap-1"
                >
                  <History className="h-3 w-3" />
                  History
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-lg font-bold text-gray-900 dark:text-white">
                  {summary.presentDays}
                </p>
                <p className="text-xs text-gray-500">Present</p>
              </div>
              <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-lg font-bold text-amber-600">{summary.lateDays}</p>
                <p className="text-xs text-gray-500">Late</p>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-lg font-bold text-red-600">{summary.absentDays}</p>
                <p className="text-xs text-gray-500">Absent</p>
              </div>
              <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-lg font-bold text-blue-600">{summary.totalHours}</p>
                <p className="text-xs text-gray-500">Hours</p>
              </div>
            </div>
            {/* Attendance Rate & Insights */}
            {summary.totalDays > 0 && (
              <div className="space-y-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Attendance Rate
                    </span>
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      {((summary.presentDays / summary.totalDays) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
                {/* Average Hours */}
                {summary.averageHours && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Avg. Hours/Day</span>
                      <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {summary.averageHours}h
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

