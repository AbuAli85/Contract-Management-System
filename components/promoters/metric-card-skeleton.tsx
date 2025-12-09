'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Loading skeleton for metric cards
 * Displays while metrics are being calculated
 */
export function MetricCardSkeleton() {
  return (
    <Card className='shadow-sm overflow-hidden'>
      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
        <div className='space-y-2 flex-1'>
          {/* Title skeleton */}
          <Skeleton className='h-4 w-28' />
          {/* Value skeleton */}
          <Skeleton className='h-10 w-20' />
        </div>
        {/* Icon skeleton */}
        <Skeleton className='h-12 w-12 rounded-lg' />
      </CardHeader>
      <CardContent className='space-y-2'>
        {/* Helper text skeleton */}
        <Skeleton className='h-4 w-36' />
        {/* Optional trend skeleton */}
        <Skeleton className='h-6 w-24 rounded-lg' />
      </CardContent>
    </Card>
  );
}

/**
 * Loading skeleton for all 4 metric cards
 */
export function MetricsCardsSkeleton() {
  return (
    <div
      className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'
      role='status'
      aria-label='Loading metrics'
    >
      {[1, 2, 3, 4].map(index => (
        <MetricCardSkeleton key={index} />
      ))}
    </div>
  );
}
