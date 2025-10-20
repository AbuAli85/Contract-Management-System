'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function PromotersSkeleton() {
  return (
    <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      <Skeleton className='h-48 w-full' />
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-32 w-full' />
        ))}
      </div>
      <Skeleton className='h-32 w-full' />
      <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <Skeleton className='h-[520px] w-full' />
        <Skeleton className='h-[520px] w-full' />
      </div>
    </div>
  );
}
