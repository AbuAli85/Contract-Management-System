'use client';

import { ProfessionalAttendanceDashboard } from '@/components/attendance/professional-attendance-dashboard';
import { AttendanceErrorBoundary } from '@/components/attendance/attendance-error-boundary';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, TrendingUp, BarChart3 } from 'lucide-react';

export default function AttendancePage() {
  return (
    <AttendanceErrorBoundary>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
              <Clock className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Professional Attendance System</h1>
              <p className="text-muted-foreground">Track your time, manage breaks, and view detailed analytics</p>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Total Hours This Month</div>
              <div className="text-2xl font-bold">--</div>
            </div>
          </div>
        </div>

        <ProfessionalAttendanceDashboard />
      </div>
    </AttendanceErrorBoundary>
  );
}

