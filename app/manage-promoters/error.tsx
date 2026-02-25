'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';


export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error captured - integrate with error reporting service if needed
    // Example: Sentry.captureException(error);
  }, [error]);

  const getLocale = (): string => {
    if (typeof window === 'undefined') return 'en';
    const match = window.location.pathname.match(/^\/([a-z]{2})\//);
    return match ? match[1] : 'en';
  };

  return (
    <div className='flex min-h-[calc(100vh-64px)] items-center justify-center p-4'>
      <Card className='w-full max-w-md text-center'>
        <CardHeader>
          <CardTitle className='text-3xl font-bold text-red-600'>
            Something went wrong
          </CardTitle>
          <CardDescription>
            We encountered an error while loading the promoters management page.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>Error: {error.message}</p>
          <div className='flex gap-2 justify-center'>
            <Button onClick={() => reset()}>Try Again</Button>
            <Button
              variant='outline'
              onClick={() => {
                window.location.href = `/${getLocale()}/promoters`;
              }}
            >
              Go to Promoters
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
