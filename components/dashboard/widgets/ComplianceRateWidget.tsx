'use client';

import { BaseWidget } from '../BaseWidget';
import { Shield } from 'lucide-react';
import type { WidgetProps } from '@/lib/types/dashboard';

export function ComplianceRateWidget(props: WidgetProps) {
  return (
    <BaseWidget
      {...props}
      title="Compliance Rate"
      description="Contract compliance tracking"
      icon={<Shield className="h-4 w-4" />}
    >
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Coming soon...</p>
      </div>
    </BaseWidget>
  );
}

