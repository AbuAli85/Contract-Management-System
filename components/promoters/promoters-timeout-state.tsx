'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, XCircle, AlertTriangle } from 'lucide-react';

interface PromotersTimeoutStateProps {
  onReload: () => void;
  onRetry: () => void;
}

export function PromotersTimeoutState({ onReload, onRetry }: PromotersTimeoutStateProps) {
  return (
    <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-600'>
            <XCircle className='h-5 w-5' />
            Page Load Timeout
          </CardTitle>
          <CardDescription>
            The page took too long to load. This might be a network issue.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <strong>What to do:</strong>
              <div className='mt-2 space-y-1 text-sm'>
                <div>• Refresh the page</div>
                <div>• Check your internet connection</div>
                <div>• Try again in a few moments</div>
              </div>
            </AlertDescription>
          </Alert>
          <div className='flex gap-2'>
            <Button onClick={() => window.location.reload()} variant='default'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Reload Page
            </Button>
            <Button onClick={onRetry} variant='outline'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Try Loading Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
