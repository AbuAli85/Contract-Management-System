import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export default function ManagePromotersLoading() {
  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Header skeleton */}
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-64' />
          <Skeleton className='h-4 w-48' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-32' />
        </div>
      </div>

      {/* Stats cards skeleton */}
      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className='pb-2'>
              <Skeleton className='h-4 w-24' />
            </CardHeader>
            <CardContent>
              <Skeleton className='mb-1 h-8 w-16' />
              <Skeleton className='h-3 w-32' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter bar skeleton */}
      <div className='flex gap-3'>
        <Skeleton className='h-10 flex-1' />
        <Skeleton className='h-10 w-32' />
        <Skeleton className='h-10 w-32' />
      </div>

      {/* Table skeleton */}
      <Card>
        <CardContent className='p-0'>
          <div className='divide-y'>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className='flex items-center gap-4 px-6 py-4'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <div className='flex-1 space-y-1'>
                  <Skeleton className='h-4 w-40' />
                  <Skeleton className='h-3 w-28' />
                </div>
                <Skeleton className='h-6 w-20 rounded-full' />
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-8 w-8 rounded' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
