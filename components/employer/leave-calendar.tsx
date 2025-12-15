'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  Users,
  Palmtree,
  Thermometer,
  Heart,
  Baby,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isWithinInterval,
  addMonths,
  subMonths,
} from 'date-fns';

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  total_days: number;
  status: string;
  employer_employee?: {
    job_title: string | null;
    department: string | null;
    employee?: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

const leaveTypeConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  vacation: { icon: Palmtree, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  sick: { icon: Thermometer, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  personal: { icon: Heart, color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  maternity: { icon: Baby, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  paternity: { icon: Baby, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  unpaid: { icon: Briefcase, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  other: { icon: Calendar, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
};

export function LeaveCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    fetchLeaveRequests();
  }, []);

  const fetchLeaveRequests = async () => {
    try {
      const response = await fetch('/api/employer/leave-requests?status=approved');
      const data = await response.json();

      if (response.ok && data.success) {
        setLeaveRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const getLeavesForDay = (day: Date) => {
    return leaveRequests.filter(leave => {
      const startDate = new Date(leave.start_date);
      const endDate = new Date(leave.end_date);
      return isWithinInterval(day, { start: startDate, end: endDate });
    });
  };

  const selectedDayLeaves = selectedDate ? getLeavesForDay(selectedDate) : [];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar */}
      <Card className="border-0 shadow-lg lg:col-span-2">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Team Leave Calendar
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[140px] text-center">
                {format(currentMonth, 'MMMM yyyy')}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Week Days Header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(day => (
              <div
                key={day}
                className="text-center text-sm font-medium text-gray-500 py-2"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              const dayLeaves = getLeavesForDay(day);
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasLeaves = dayLeaves.length > 0;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative aspect-square p-1 rounded-lg transition-all text-sm",
                    !isCurrentMonth && "opacity-40",
                    isToday && "ring-2 ring-blue-500",
                    isSelected && "bg-blue-100 dark:bg-blue-900/30",
                    hasLeaves && !isSelected && "bg-amber-50 dark:bg-amber-900/20",
                    "hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <span className={cn(
                    "absolute top-1 left-1/2 -translate-x-1/2",
                    isToday && "font-bold text-blue-600"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {hasLeaves && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                      {dayLeaves.slice(0, 3).map((leave, i) => {
                        const config = leaveTypeConfig[leave.leave_type] ?? leaveTypeConfig.other;
                        return (
                          <span
                            key={i}
                            className={cn(
                              "w-2 h-2 rounded-full",
                              config?.bgColor,
                              config?.color
                            )}
                          />
                        );
                      })}
                      {dayLeaves.length > 3 && (
                        <span className="text-xs text-gray-500">+{dayLeaves.length - 3}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3 text-xs">
            {Object.entries(leaveTypeConfig).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center gap-1">
                  <span className={cn("w-3 h-3 rounded-full", config.bgColor)} />
                  <Icon className={cn("h-3 w-3", config.color)} />
                  <span className="capitalize">{key}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">
            {selectedDate ? format(selectedDate, 'EEEE, MMMM d') : 'Select a Day'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>Click on a day to see who's on leave</p>
            </div>
          ) : selectedDayLeaves.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-30" />
              <p>No one is on leave this day</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                {selectedDayLeaves.length} employee(s) on leave
              </p>
              {selectedDayLeaves.map(leave => {
                const config = leaveTypeConfig[leave.leave_type] ?? leaveTypeConfig.other;
                const Icon = config?.icon ?? Calendar;
                const employee = leave.employer_employee?.employee;

                return (
                  <div
                    key={leave.id}
                    className={cn(
                      "p-3 rounded-lg border",
                      config?.bgColor
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={employee?.avatar_url || undefined} />
                        <AvatarFallback>{getInitials(employee?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {employee?.full_name || 'Unknown'}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Icon className={cn("h-3 w-3", config?.color)} />
                          <span className="capitalize">{leave.leave_type}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      {format(new Date(leave.start_date), 'MMM d')} - {format(new Date(leave.end_date), 'MMM d')}
                      <span className="ml-2">({leave.total_days} days)</span>
                    </p>
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

