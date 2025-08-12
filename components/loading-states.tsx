'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Loader2, FileText, Users, Building2, BarChart3 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({
  size = 'md',
  text,
  className = '',
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div
      className={`flex flex-col items-center justify-center p-8 ${className}`}
    >
      <Loader2
        className={`${sizeClasses[size]} mb-4 animate-spin text-primary`}
      />
      {text && <p className='text-sm text-muted-foreground'>{text}</p>}
    </div>
  );
}

export function PageLoading() {
  return (
    <div className='min-h-screen bg-background'>
      <div className='container mx-auto p-6'>
        <div className='space-y-6'>
          {/* Header skeleton */}
          <div className='space-y-2'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-4 w-96' />
          </div>

          {/* Content skeleton */}
          <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className='p-6'>
                  <div className='space-y-3'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-8 w-16' />
                    <Skeleton className='h-3 w-32' />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableLoading({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className='space-y-4'>
      {/* Header skeleton */}
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-10 w-32' />
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className='p-0'>
          <div className='overflow-hidden'>
            {/* Table header */}
            <div className='border-b bg-muted/50'>
              <div className='grid grid-cols-4 gap-4 p-4'>
                {Array.from({ length: columns }).map((_, i) => (
                  <Skeleton key={i} className='h-4 w-20' />
                ))}
              </div>
            </div>

            {/* Table rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={rowIndex} className='border-b last:border-b-0'>
                <div className='grid grid-cols-4 gap-4 p-4'>
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <Skeleton key={colIndex} className='h-4 w-full' />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function DashboardLoading() {
  return (
    <div className='space-y-6'>
      {/* Welcome section skeleton */}
      <div className='space-y-2'>
        <Skeleton className='h-8 w-64' />
        <Skeleton className='h-4 w-96' />
      </div>

      {/* Stats cards skeleton */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[
          { icon: FileText, label: 'Total Contracts' },
          { icon: Users, label: 'Promoters' },
          { icon: Building2, label: 'Parties' },
          { icon: BarChart3, label: 'Analytics' },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-24' />
                  <Skeleton className='h-8 w-16' />
                  <Skeleton className='h-3 w-32' />
                </div>
                <Skeleton className='h-8 w-8 rounded' />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feature cards skeleton */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-5 w-16' />
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className='p-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <Skeleton className='h-10 w-10 rounded-lg' />
                  </div>
                  <div className='space-y-2'>
                    <Skeleton className='h-5 w-32' />
                    <Skeleton className='h-4 w-full' />
                  </div>
                  <Skeleton className='h-10 w-full' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function FormLoading() {
  return (
    <div className='space-y-6'>
      {/* Form header */}
      <div className='space-y-2'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-4 w-64' />
      </div>

      {/* Form fields */}
      <div className='space-y-4'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <Skeleton className='h-4 w-24' />
            <Skeleton className='h-10 w-full' />
          </div>
        ))}
      </div>

      {/* Form actions */}
      <div className='flex gap-4'>
        <Skeleton className='h-10 w-24' />
        <Skeleton className='h-10 w-32' />
      </div>
    </div>
  );
}

export function CardLoading({ count = 3 }: { count?: number }) {
  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className='p-6'>
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Skeleton className='h-10 w-10 rounded-lg' />
              </div>
              <div className='space-y-2'>
                <Skeleton className='h-5 w-32' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
              </div>
              <Skeleton className='h-10 w-full' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function SidebarLoading() {
  return (
    <div className='space-y-4 p-4'>
      {/* Logo */}
      <div className='mb-6 flex items-center gap-2'>
        <Skeleton className='h-8 w-8' />
        <Skeleton className='h-6 w-32' />
      </div>

      {/* Navigation items */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className='flex items-center gap-3'>
          <Skeleton className='h-4 w-4' />
          <Skeleton className='h-4 w-24' />
        </div>
      ))}
    </div>
  );
}
