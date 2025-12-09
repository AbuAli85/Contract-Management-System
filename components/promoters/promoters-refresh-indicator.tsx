'use client';

import { RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface RefreshIndicatorProps {
  isFetching: boolean;
  showFloating?: boolean;
}

/**
 * Subtle refresh indicator shown during background data updates
 * Can be displayed as fixed floating badge or inline
 */
export function RefreshIndicator({
  isFetching,
  showFloating = true,
}: RefreshIndicatorProps) {
  if (!isFetching) return null;

  return (
    <>
      {showFloating ? (
        <div
          className={cn(
            'fixed bottom-4 right-4 z-50 transition-all duration-200',
            isFetching
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2 pointer-events-none'
          )}
        >
          <Badge className='bg-blue-500 text-white shadow-lg hover:shadow-xl transition-shadow px-3 py-2'>
            <RefreshCw className='mr-2 h-3 w-3 animate-spin' />
            Syncing data...
          </Badge>
        </div>
      ) : (
        <Badge variant='outline' className='border-blue-200 text-blue-600'>
          <RefreshCw className='mr-1.5 h-3 w-3 animate-spin' />
          Updating
        </Badge>
      )}
    </>
  );
}
