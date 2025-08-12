'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Edit promoter form error:', error);
  }, [error]);

  return (
    <div className='flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 dark:bg-slate-950'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900'>
            <AlertTriangle className='h-6 w-6 text-red-600 dark:text-red-400' />
          </div>
          <CardTitle className='text-xl'>Error Loading Edit Form</CardTitle>
          <CardDescription>
            Something went wrong while loading the promoter edit form.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='rounded-md bg-red-50 p-3 dark:bg-red-900/20'>
            <p className='text-sm text-red-700 dark:text-red-300'>
              {error.message || 'An unexpected error occurred'}
            </p>
          </div>

          <div className='flex flex-col gap-2 sm:flex-row'>
            <Button onClick={reset} className='flex-1' variant='outline'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Try Again
            </Button>
            <Button onClick={() => window.history.back()} className='flex-1'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
