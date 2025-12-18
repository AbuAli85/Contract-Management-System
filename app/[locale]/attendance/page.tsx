'use client';

import { SmartAttendanceCard } from '@/components/employee/smart-attendance-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock } from 'lucide-react';

export default function AttendancePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Clock className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">My Attendance</h1>
          <p className="text-muted-foreground">View and manage your attendance records</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Attendance Tracking</CardTitle>
          <CardDescription>
            Check in/out, view your attendance history, and track your working hours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SmartAttendanceCard />
        </CardContent>
      </Card>
    </div>
  );
}

