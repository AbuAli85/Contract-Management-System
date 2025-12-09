'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsLoadingSkeleton() {
  return (
    <div className='space-y-6'>
      {/* Header Skeleton */}
      <div className='bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-xl border-0 shadow-lg p-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-4'>
            <Skeleton className='h-14 w-14 rounded-xl' />
            <div>
              <Skeleton className='h-8 w-80 mb-2' />
              <Skeleton className='h-4 w-60' />
            </div>
          </div>
          <Skeleton className='h-8 w-24 rounded-lg' />
        </div>
      </div>

      {/* KPI Cards Skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='shadow-lg border-0'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='flex-1'>
                  <Skeleton className='h-4 w-24 mb-2' />
                  <Skeleton className='h-10 w-16 mb-3' />
                  <Skeleton className='h-4 w-32' />
                </div>
                <Skeleton className='h-12 w-12 rounded-lg' />
              </div>
              <Skeleton className='h-2 w-full mt-3' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Metrics Skeleton */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className='shadow-lg border-0'>
            <CardHeader>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-5' />
                <Skeleton className='h-6 w-32' />
              </div>
              <Skeleton className='h-4 w-48' />
            </CardHeader>
            <CardContent className='space-y-4'>
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-4 w-16' />
                  </div>
                  <Skeleton className='h-2 w-full' />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Skeleton */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className='shadow-lg border-0'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-5 w-5' />
                    <Skeleton className='h-6 w-40' />
                  </div>
                  <Skeleton className='h-4 w-60 mt-2' />
                </div>
                <Skeleton className='h-6 w-20' />
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {Array.from({ length: 6 }).map((_, j) => (
                  <div key={j} className='space-y-2'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-2'>
                        <Skeleton className='h-4 w-4' />
                        <Skeleton className='h-4 w-24' />
                      </div>
                      <div className='flex items-center gap-2'>
                        <Skeleton className='h-4 w-8' />
                        <Skeleton className='h-4 w-12' />
                      </div>
                    </div>
                    <Skeleton className='h-2 w-full' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Animated Loading Indicator */}
      <div className='text-center py-8'>
        <div className='inline-flex items-center gap-3 px-6 py-3 bg-blue-50 dark:bg-blue-900/20 rounded-full border border-blue-200 dark:border-blue-800'>
          <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin'></div>
          <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
            Loading comprehensive workforce analytics...
          </span>
        </div>
      </div>
    </div>
  );
}
