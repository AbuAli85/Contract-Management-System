'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {

  }, [error]);

  return (
    <div className='container mx-auto p-6'>
      <Card className='border-red-200'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2 text-red-600'>
            <AlertCircle className='h-5 w-5' />
            Error Loading Report
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <p className='text-muted-foreground'>
            An error occurred while loading the promoter documents report.
          </p>
          <Button onClick={reset} variant='outline'>
            Try Again
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
