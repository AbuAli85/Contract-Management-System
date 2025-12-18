'use client';

import { AutomatedAttendanceSchedules } from '@/components/employer/automated-attendance-schedules';
import { Card } from '@/components/ui/card';

export default function AttendanceSchedulesPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card className="p-6">
        <AutomatedAttendanceSchedules />
      </Card>
    </div>
  );
}

