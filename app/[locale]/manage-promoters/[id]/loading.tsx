import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function PromoterDetailLoading() {
  return (
    <div className='space-y-6 p-4 md:p-6'>
      {/* Back button + action buttons skeleton */}
      <div className='flex items-center justify-between'>
        <Skeleton className='h-9 w-32' />
        <div className='flex gap-2'>
          <Skeleton className='h-9 w-24' />
          <Skeleton className='h-9 w-24' />
          <Skeleton className='h-9 w-20' />
        </div>
      </div>

      {/* Profile header card skeleton */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col items-center gap-4 sm:flex-row sm:items-start'>
            <Skeleton className='h-24 w-24 rounded-full flex-shrink-0' />
            <div className='flex-1 space-y-3 text-center sm:text-left'>
              <Skeleton className='h-7 w-48 mx-auto sm:mx-0' />
              <Skeleton className='h-5 w-36 mx-auto sm:mx-0' />
              <div className='flex flex-wrap gap-2 justify-center sm:justify-start'>
                <Skeleton className='h-6 w-20 rounded-full' />
                <Skeleton className='h-6 w-24 rounded-full' />
                <Skeleton className='h-6 w-16 rounded-full' />
              </div>
              <div className='flex flex-wrap gap-4 justify-center sm:justify-start'>
                <Skeleton className='h-4 w-40' />
                <Skeleton className='h-4 w-32' />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics cards row skeleton */}
      <div className='grid grid-cols-2 gap-4 md:grid-cols-4'>
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardContent className='pt-4'>
              <Skeleton className='h-4 w-24 mb-2' />
              <Skeleton className='h-8 w-16' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs skeleton */}
      <div className='space-y-4'>
        <div className='flex gap-2 border-b pb-2'>
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className='h-8 w-24 rounded-md' />
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-40' />
            <Skeleton className='h-4 w-64' />
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className='space-y-1'>
                  <Skeleton className='h-3 w-20' />
                  <Skeleton className='h-5 w-36' />
                </div>
              ))}
            </div>
            <Separator />
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className='space-y-1'>
                  <Skeleton className='h-3 w-24' />
                  <Skeleton className='h-5 w-40' />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
