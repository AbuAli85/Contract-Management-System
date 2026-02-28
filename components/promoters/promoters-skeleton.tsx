'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function PromotersSkeleton() {
  return (
    <div className='space-y-6' role='status' aria-label='Loading workforce'>
      {/* Header + tabs */}
      <div className='flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-56' />
          <Skeleton className='h-4 w-72' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-9 w-28' />
          <Skeleton className='h-9 w-24' />
          <Skeleton className='h-9 w-24' />
        </div>
      </div>
      <Skeleton className='h-10 w-full max-w-xs' />
      {/* Metrics row */}
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className='h-28 w-full' />
        ))}
      </div>
      {/* Main content */}
      <Skeleton className='h-12 w-full max-w-2xl' />
      <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <Skeleton className='h-[480px] w-full rounded-lg' />
        <Skeleton className='h-[320px] w-full rounded-lg' />
      </div>
    </div>
  );
}
