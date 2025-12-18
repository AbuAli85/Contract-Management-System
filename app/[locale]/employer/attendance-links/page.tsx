'use client';

import { AttendanceLinkManager } from '@/components/employer/attendance-link-manager';
import { Card } from '@/components/ui/card';

export default function AttendanceLinksPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card className="p-6">
        <AttendanceLinkManager />
      </Card>
    </div>
  );
}

