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
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Manage Promoters Error:', error);
  }, [error]);

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
              onClick={() =>
                (window.location.href = `/${window.location.pathname.startsWith('/ar/') ? 'ar' : 'en'}/promoters`)
              }
            >
              Go to Promoters
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
