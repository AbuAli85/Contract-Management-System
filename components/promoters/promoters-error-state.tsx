'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, XCircle, AlertTriangle } from 'lucide-react';

interface PromotersErrorStateProps {
  error: Error | null;
  onRetry: () => void;
  onGoToDashboard: () => void;
}

export function PromotersErrorState({ error, onRetry, onGoToDashboard }: PromotersErrorStateProps) {
  return (
    <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-600'>
            <XCircle className='h-5 w-5' />
            Unable to Load Promoters
          </CardTitle>
          <CardDescription>
            {error?.message || 'An error occurred while loading promoters data.'}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert variant='destructive'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <strong>Error Details:</strong>
              <div className='mt-2 space-y-1 text-sm'>
                <div>• Check your internet connection</div>
                <div>• Ensure you're logged in with valid credentials</div>
                <div>• Verify you have permission to view promoters</div>
                <div>• Contact support if the problem persists</div>
              </div>
            </AlertDescription>
          </Alert>
          <div className='flex gap-2'>
            <Button onClick={onRetry} variant='default'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Try Again
            </Button>
            <Button onClick={onGoToDashboard} variant='outline'>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
