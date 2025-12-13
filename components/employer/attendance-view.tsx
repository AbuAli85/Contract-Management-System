'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AttendanceViewProps {
  employerEmployeeId: string;
}

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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Days</p>
              <p className="text-2xl font-bold">{summary.total_days || 0}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Present</p>
              <p className="text-2xl font-bold text-green-600">
                {summary.present || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Absent</p>
              <p className="text-2xl font-bold text-red-600">
                {summary.absent || 0}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Hours</p>
              <p className="text-2xl font-bold">{summary.total_hours?.toFixed(1) || 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Attendance Records</CardTitle>
            <input
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              className="px-3 py-1 border rounded"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Loading...</p>
          ) : attendance.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No attendance records</p>
          ) : (
            <div className="space-y-2">
              {attendance.map(record => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded"
                >
                  <div className="flex items-center gap-4">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="font-medium">
                        {new Date(record.attendance_date).toLocaleDateString()}
                      </p>
                      {record.check_in && (
                        <p className="text-sm text-gray-500">
                          {new Date(record.check_in).toLocaleTimeString()} -{' '}
                          {record.check_out
                            ? new Date(record.check_out).toLocaleTimeString()
                            : 'Not checked out'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        record.status === 'present'
                          ? 'default'
                          : record.status === 'absent'
                            ? 'destructive'
                            : 'secondary'
                      }
                    >
                      {record.status}
                    </Badge>
                    {record.total_hours && (
                      <span className="text-sm text-gray-500">
                        {record.total_hours.toFixed(1)}h
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

