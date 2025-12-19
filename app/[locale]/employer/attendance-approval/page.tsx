'use client';

import { ManagerApprovalWorkflow } from '@/components/attendance/manager-approval-workflow';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckSquare, Users, Clock } from 'lucide-react';

export default function AttendanceApprovalPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CheckSquare className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Attendance Approval</h1>
            <p className="text-muted-foreground">Review and approve employee attendance records</p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Real-time Updates</span>
          </div>
        </div>
      </div>

      <ManagerApprovalWorkflow />
    </div>
  );
}
