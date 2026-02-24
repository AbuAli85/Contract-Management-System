'use client';

import { EmployeeGroupManager } from '@/components/employer/employee-group-manager';
import { Card } from '@/components/ui/card';

export default function AttendanceGroupsPage() {
  return (
    <div className='container mx-auto py-6 space-y-6'>
      <Card className='p-6'>
        <EmployeeGroupManager />
      </Card>
    </div>
  );
}
