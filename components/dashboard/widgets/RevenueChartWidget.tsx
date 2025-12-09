'use client';

import { BaseWidget } from '../BaseWidget';
import { TrendingUp } from 'lucide-react';
import type { WidgetProps } from '@/lib/types/dashboard';

export function RevenueChartWidget(props: WidgetProps) {
  return (
    <BaseWidget
      {...props}
      title='Revenue Chart'
      description='Revenue trends'
      icon={<TrendingUp className='h-4 w-4' />}
    >
      <div className='flex items-center justify-center h-full text-muted-foreground'>
        <p className='text-sm'>Coming soon...</p>
      </div>
    </BaseWidget>
  );
}
