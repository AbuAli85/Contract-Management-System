'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Timer,
  TrendingUp,
  CalendarDays,
  AlertCircle,
  Coffee
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AttendanceViewProps {
  employerEmployeeId: string;
}

const SummaryCard = ({ 
  title, 
  value, 
  icon: Icon, 
  iconBg, 
  iconColor,
  valueColor = 'text-gray-900 dark:text-white'
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  valueColor?: string;
}) => (
  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl">
    <div className={cn("p-3 rounded-lg", iconBg)}>
      <Icon className={cn("h-5 w-5", iconColor)} />
    </div>
    <div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className={cn("text-2xl font-bold", valueColor)}>{value}</p>
    </div>
  </div>
);

export function AttendanceView({ employerEmployeeId }: AttendanceViewProps) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(
    new Date().toISOString().slice(0, 7) // YYYY-MM format
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendance();
  }, [employerEmployeeId, month]);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/employer/team/${employerEmployeeId}/attendance?month=${month}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch attendance');
      }

      setAttendance(data.attendance || []);
      setSummary(data.summary || {});
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'present':
        return {
          icon: CheckCircle2,
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          text: 'text-emerald-700 dark:text-emerald-400',
          iconColor: 'text-emerald-600',
          label: 'Present'
        };
      case 'absent':
        return {
          icon: XCircle,
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-400',
          iconColor: 'text-red-600',
          label: 'Absent'
        };
      case 'late':
        return {
          icon: AlertCircle,
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-700 dark:text-amber-400',
          iconColor: 'text-amber-600',
          label: 'Late'
        };
      case 'half_day':
        return {
          icon: Coffee,
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          text: 'text-blue-700 dark:text-blue-400',
          iconColor: 'text-blue-600',
          label: 'Half Day'
        };
      default:
        return {
          icon: Calendar,
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-400',
          iconColor: 'text-gray-600',
          label: status
        };
    }
  };

  const formatMonthYear = (monthStr: string) => {
    const [year, mon] = monthStr.split('-');
    return new Date(parseInt(year), parseInt(mon) - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg">Attendance Summary</CardTitle>
              <CardDescription>Overview of attendance for {formatMonthYear(month)}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryCard
              title="Total Days"
              value={summary.total_days || 0}
              icon={CalendarDays}
              iconBg="bg-blue-100 dark:bg-blue-900/30"
              iconColor="text-blue-600 dark:text-blue-400"
            />
            <SummaryCard
              title="Present"
              value={summary.present || 0}
              icon={CheckCircle2}
              iconBg="bg-emerald-100 dark:bg-emerald-900/30"
              iconColor="text-emerald-600 dark:text-emerald-400"
              valueColor="text-emerald-600 dark:text-emerald-400"
            />
            <SummaryCard
              title="Absent"
              value={summary.absent || 0}
              icon={XCircle}
              iconBg="bg-red-100 dark:bg-red-900/30"
              iconColor="text-red-600 dark:text-red-400"
              valueColor="text-red-600 dark:text-red-400"
            />
            <SummaryCard
              title="Total Hours"
              value={(summary.total_hours?.toFixed(1) || 0)}
              icon={Timer}
              iconBg="bg-purple-100 dark:bg-purple-900/30"
              iconColor="text-purple-600 dark:text-purple-400"
            />
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <CardTitle className="text-lg">Attendance Records</CardTitle>
            </div>
            <Input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="w-auto bg-gray-50 dark:bg-gray-900"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : attendance.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Calendar className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No attendance records
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                There are no attendance records for {formatMonthYear(month)}. Records will appear here once attendance is tracked.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attendance.map(record => {
                const statusConfig = getStatusConfig(record.status);
                const StatusIcon = statusConfig.icon;
                
                return (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("p-2 rounded-lg", statusConfig.bg)}>
                        <StatusIcon className={cn("h-5 w-5", statusConfig.iconColor)} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {new Date(record.attendance_date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        {record.check_in && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            <span className="text-emerald-600">In:</span>{' '}
                            {new Date(record.check_in).toLocaleTimeString('en-US', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                            {record.check_out && (
                              <>
                                {' '}<span className="text-gray-400">•</span>{' '}
                                <span className="text-red-500">Out:</span>{' '}
                                {new Date(record.check_out).toLocaleTimeString('en-US', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {record.total_hours && (
                        <div className="text-right">
                          <p className="text-sm text-gray-500 dark:text-gray-400">Hours</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {record.total_hours.toFixed(1)}h
                          </p>
                        </div>
                      )}
                      <Badge 
                        variant="outline"
                        className={cn("font-medium border-0", statusConfig.bg, statusConfig.text)}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
