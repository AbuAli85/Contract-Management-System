import { Card, CardContent } from '@/components/ui/card';

export function ServiceCardSkeleton() {
  return (
    <Card className='hover:shadow-md transition-shadow'>
      <CardContent className='p-6'>
        <div className='flex justify-between items-start'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              {/* Service name skeleton */}
              <div className='h-6 bg-gray-200 rounded w-3/4 animate-pulse' />
              {/* Status badge skeleton */}
              <div className='h-6 bg-gray-200 rounded w-20 animate-pulse' />
            </div>
            {/* Provider info skeleton */}
            <div className='h-4 bg-gray-200 rounded w-1/2 mb-2 animate-pulse' />
            {/* Timestamps skeleton */}
            <div className='space-y-1'>
              <div className='h-3 bg-gray-200 rounded w-32 animate-pulse' />
              <div className='h-3 bg-gray-200 rounded w-36 animate-pulse' />
            </div>
          </div>
          {/* Action button skeleton */}
          <div className='h-8 bg-gray-200 rounded w-24 animate-pulse' />
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceCardSkeletonList() {
  return (
    <div className='grid gap-4'>
      {Array.from({ length: 3 }).map((_, index) => (
        <ServiceCardSkeleton key={index} />
      ))}
    </div>
  );
}
