'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Home, ArrowLeft, ShieldOff } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function UnauthorizedPage() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const requiredRole = searchParams?.get('required') || null;
  const currentRole = searchParams?.get('current') || null;

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-slate-50 to-slate-100 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-6'>
        <Card className='border-red-200 shadow-xl'>
          <CardHeader className='text-center pb-2'>
            <div className='mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-4 ring-4 ring-red-50'>
              <ShieldOff className='h-10 w-10 text-red-600' />
            </div>
            <CardTitle className='text-2xl font-bold text-gray-900'>
              Access Denied
            </CardTitle>
            <CardDescription className='text-gray-600'>
              You don&apos;t have permission to access this page
            </CardDescription>
          </CardHeader>

          <CardContent className='space-y-4 pt-2'>
            {(requiredRole || currentRole) && (
              <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
                <p className='text-sm font-semibold text-red-800 mb-3'>
                  Access Requirements
                </p>
                <div className='space-y-2'>
                  {requiredRole && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-red-700'>Required Role</span>
                      <Badge variant='destructive' className='capitalize'>
                        {requiredRole}
                      </Badge>
                    </div>
                  )}
                  {currentRole && (
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-red-700'>Your Role</span>
                      <Badge variant='secondary' className='capitalize'>
                        {currentRole}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className='text-sm text-gray-600 space-y-2'>
              <p>
                {requiredRole ? (
                  <>
                    This page requires{' '}
                    <span className='font-semibold capitalize'>
                      {requiredRole}
                    </span>{' '}
                    privileges.
                    {currentRole && (
                      <>
                        {' '}
                        You currently have{' '}
                        <span className='font-semibold capitalize'>
                          {currentRole}
                        </span>{' '}
                        access.
                      </>
                    )}
                  </>
                ) : (
                  'You do not have the required permissions to view this page.'
                )}
              </p>
              <p className='text-xs text-gray-500'>
                If you believe this is an error, please contact your system
                administrator.
              </p>
            </div>
          </CardContent>

          <CardFooter className='flex flex-col space-y-2 pt-0'>
            <Link href={`/${locale}/dashboard`} className='w-full'>
              <Button className='w-full'>
                <Home className='mr-2 h-4 w-4' />
                Go to Dashboard
              </Button>
            </Link>
            <Button
              variant='outline'
              onClick={() => window.history.back()}
              className='w-full'
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Go Back
            </Button>
          </CardFooter>
        </Card>

        <div className='text-center'>
          <p className='text-xs text-gray-500'>
            Need help?{' '}
            <a
              href='mailto:support@thesmartpro.io'
              className='text-blue-600 hover:underline'
            >
              Contact support
            </a>{' '}
            or your system administrator
          </p>
        </div>
      </div>
    </div>
  );
}

// Add AlertCircle to avoid unused import warning
export { AlertCircle };
