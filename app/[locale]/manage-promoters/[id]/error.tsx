'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertTriangle, RefreshCw, ArrowLeft, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function PromoterDetailError({ error, reset }: ErrorProps) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    console.error('Promoter detail page error:', error);
  }, [error]);

  const isNotFound =
    error.message?.includes('not found') ||
    error.message?.includes('404') ||
    error.message?.includes('does not exist');

  const isPermission =
    error.message?.includes('permission') ||
    error.message?.includes('unauthorized') ||
    error.message?.includes('403');

  return (
    <div className='flex min-h-[60vh] items-center justify-center p-4'>
      <Card className='w-full max-w-lg'>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <div className='rounded-full bg-destructive/10 p-3'>
              <AlertTriangle className='h-6 w-6 text-destructive' />
            </div>
            <div>
              <CardTitle>
                {isNotFound
                  ? 'Promoter Not Found'
                  : isPermission
                    ? 'Access Denied'
                    : 'Something Went Wrong'}
              </CardTitle>
              <CardDescription>
                {isNotFound
                  ? 'The promoter record you are looking for does not exist or has been removed.'
                  : isPermission
                    ? 'You do not have permission to view this promoter profile.'
                    : 'An unexpected error occurred while loading the promoter details.'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          {error.message && (
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription className='text-sm font-mono break-all'>
                {error.message}
              </AlertDescription>
            </Alert>
          )}
          {error.digest && (
            <p className='text-xs text-muted-foreground'>
              Error ID: <code className='font-mono'>{error.digest}</code>
            </p>
          )}
        </CardContent>
        <CardFooter className='flex flex-wrap gap-2'>
          {!isNotFound && !isPermission && (
            <Button onClick={reset} className='gap-2'>
              <RefreshCw className='h-4 w-4' />
              Try Again
            </Button>
          )}
          <Button
            variant='outline'
            onClick={() => router.push(`/${locale}/promoters`)}
            className='gap-2'
          >
            <ArrowLeft className='h-4 w-4' />
            Back to Promoters
          </Button>
          <Button
            variant='ghost'
            onClick={() => router.push(`/${locale}/dashboard`)}
            className='gap-2'
          >
            <Home className='h-4 w-4' />
            Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
