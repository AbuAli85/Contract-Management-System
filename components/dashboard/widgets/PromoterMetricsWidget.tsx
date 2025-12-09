'use client';

import { BaseWidget } from '../BaseWidget';
import { Users } from 'lucide-react';
import type { WidgetProps } from '@/lib/types/dashboard';

export function PromoterMetricsWidget(props: WidgetProps) {
  return (
    <BaseWidget
      {...props}
      title='Promoter Metrics'
      description='Promoter statistics'
      icon={<Users className='h-4 w-4' />}
    >
      <div className='flex items-center justify-center h-full text-muted-foreground'>
        <p className='text-sm'>Coming soon...</p>
      </div>
    </BaseWidget>
  );
}
