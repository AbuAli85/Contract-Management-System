import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/**
 * Enhanced Loading State Component
 * Provides professional skeleton screens while data loads
 */

export function ContractsLoadingState() {
  return (
    <div className='space-y-6'>
      {/* Stats Section */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <Skeleton className='h-4 w-[100px]' />
              <Skeleton className='h-4 w-4 rounded-full' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-8 w-[60px] mb-2' />
              <Skeleton className='h-3 w-[140px]' />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-6 w-[150px]' />
            <Skeleton className='h-9 w-[120px]' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='flex flex-col md:flex-row gap-4 mb-6'>
            <Skeleton className='h-10 flex-1' />
            <Skeleton className='h-10 w-[200px]' />
            <Skeleton className='h-10 w-[120px]' />
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <Skeleton className='h-6 w-[180px]' />
            <Skeleton className='h-4 w-[100px]' />
          </div>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[1, 2, 3, 4, 5].map(i => (
              <div
                key={i}
                className='flex items-center space-x-4 p-4 border rounded-lg'
              >
                <Skeleton className='h-4 w-4' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-[250px]' />
                  <Skeleton className='h-3 w-[180px]' />
                </div>
                <Skeleton className='h-6 w-[80px]' />
                <Skeleton className='h-8 w-[100px]' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PermissionsLoadingState() {
  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center space-y-4'>
        <div className='relative'>
          <Skeleton className='h-12 w-12 rounded-full mx-auto animate-shimmer' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-5 w-[200px] mx-auto' />
          <Skeleton className='h-4 w-[160px] mx-auto' />
        </div>
      </div>
    </div>
  );
}

export function ContractCardLoadingState() {
  return (
    <Card>
      <CardHeader>
        <div className='flex items-start justify-between'>
          <div className='space-y-2 flex-1'>
            <Skeleton className='h-5 w-[180px]' />
            <Skeleton className='h-4 w-[140px]' />
          </div>
          <Skeleton className='h-6 w-[70px]' />
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-[160px]' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-[120px]' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-4 w-4' />
            <Skeleton className='h-4 w-[100px]' />
          </div>
          <div className='flex gap-2 mt-4'>
            <Skeleton className='h-9 flex-1' />
            <Skeleton className='h-9 flex-1' />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function TableRowLoadingState() {
  return (
    <div className='flex items-center space-x-4 p-4 border-b'>
      <Skeleton className='h-4 w-4' />
      <Skeleton className='h-4 w-[100px]' />
      <Skeleton className='h-4 w-[150px]' />
      <Skeleton className='h-4 w-[120px]' />
      <Skeleton className='h-6 w-[80px]' />
      <Skeleton className='h-8 w-[100px]' />
    </div>
  );
}
