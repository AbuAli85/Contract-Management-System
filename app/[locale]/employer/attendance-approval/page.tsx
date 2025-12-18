'use client';

import { AttendanceApprovalDashboard } from '@/components/employer/attendance-approval-dashboard';
import { Card } from '@/components/ui/card';

export default function AttendanceApprovalPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card className="p-6">
        <AttendanceApprovalDashboard />
      </Card>
    </div>
  );
}

