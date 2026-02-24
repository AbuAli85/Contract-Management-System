import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function EditPromoterLoading() {
  return (
    <div className='space-y-6 p-4 md:p-6'>
      {/* Header skeleton */}
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <Skeleton className='h-7 w-48' />
          <Skeleton className='h-4 w-64' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-9 w-20' />
          <Skeleton className='h-9 w-28' />
        </div>
      </div>

      {/* Form card skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className='h-6 w-40' />
          <Skeleton className='h-4 w-72' />
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Avatar upload area */}
          <div className='flex items-center gap-4'>
            <Skeleton className='h-20 w-20 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-9 w-32' />
              <Skeleton className='h-4 w-48' />
            </div>
          </div>

          {/* Form fields grid */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-10 w-full' />
              </div>
            ))}
          </div>

          {/* Divider */}
          <Skeleton className='h-px w-full' />

          {/* Second section */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className='space-y-2'>
                <Skeleton className='h-4 w-28' />
                <Skeleton className='h-10 w-full' />
              </div>
            ))}
          </div>

          {/* Submit buttons */}
          <div className='flex justify-end gap-2 pt-4'>
            <Skeleton className='h-10 w-24' />
            <Skeleton className='h-10 w-32' />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
