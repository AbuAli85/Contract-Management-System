'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { EnhancedPromotersViewRefactored } from '@/components/promoters/enhanced-promoters-view-refactored';
import { PromotersDebugInfo } from '@/components/promoters-debug-info';
import { ErrorBoundary } from '@/components/error-boundary';
import { useAuth } from '@/lib/auth-service';
import { usePermissions } from '@/hooks/use-permissions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Shield, AlertTriangle, Lock } from 'lucide-react';
import Link from 'next/link';

interface PromotersPageClientProps {
  locale: string;
  isDevelopment: boolean;
}

export function PromotersPageClient({
  locale,
  isDevelopment,
}: PromotersPageClientProps) {
  const router = useRouter();
  const { user, loading: authLoading, mounted } = useAuth();
  const {
    canRead,
    hasPermission,
    loading: permissionsLoading,
  } = usePermissions();
  const [isCheckingPermissions, setIsCheckingPermissions] = useState(true);

  // Check permissions once auth is loaded
  useEffect(() => {
    if (!authLoading && mounted) {
      setIsCheckingPermissions(false);
    }
  }, [authLoading, mounted]);

  // Show loading state while checking authentication
  if (authLoading || !mounted || isCheckingPermissions || permissionsLoading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='flex flex-col items-center justify-center space-y-4 pt-6'>
            <Loader2 className='h-8 w-8 animate-spin text-primary' />
            <p className='text-sm text-muted-foreground'>
              Loading promoters page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user is authenticated
  if (!user) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center p-4'>
        <Card className='w-full max-w-md border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-amber-100 p-2 dark:bg-amber-900'>
                <Lock className='h-5 w-5 text-amber-600 dark:text-amber-400' />
              </div>
              <div>
                <CardTitle className='text-amber-900 dark:text-amber-100'>
                  Authentication Required
                </CardTitle>
                <CardDescription className='text-amber-700 dark:text-amber-300'>
                  Please log in to access the promoters page
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertTitle>Access Restricted</AlertTitle>
              <AlertDescription>
                You need to be logged in to view and manage promoters.
              </AlertDescription>
            </Alert>
            <div className='flex gap-2'>
              <Button
                className='flex-1'
                onClick={() => router.push(`/${locale}/auth/login`)}
              >
                Log In
              </Button>
              <Button
                variant='outline'
                onClick={() => router.push(`/${locale}/dashboard`)}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check permissions - allow if user is authenticated (role-based view handles what they see)
  // We allow access for all authenticated users - the view itself handles role-based rendering
  const canAccessPromoters = !!user; // Any authenticated user can access

  if (!canAccessPromoters) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center p-4'>
        <Card className='w-full max-w-md border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-red-100 p-2 dark:bg-red-900'>
                <Shield className='h-5 w-5 text-red-600 dark:text-red-400' />
              </div>
              <div>
                <CardTitle className='text-red-900 dark:text-red-100'>
                  Access Denied
                </CardTitle>
                <CardDescription className='text-red-700 dark:text-red-300'>
                  You don't have permission to view promoters
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertTitle>Insufficient Permissions</AlertTitle>
              <AlertDescription>
                Your account doesn't have the required permissions to access the
                promoters page. Please contact an administrator if you believe
                this is an error.
              </AlertDescription>
            </Alert>
            <div className='flex gap-2'>
              <Button variant='outline' asChild className='flex-1'>
                <Link href={`/${locale}/dashboard`}>Go to Dashboard</Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href={`/${locale}/profile`}>View Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and has permissions - show the promoters view
  return (
    <ErrorBoundary componentName='Promoters Page'>
      <div className='space-y-6'>
        {isDevelopment && <PromotersDebugInfo />}
        <EnhancedPromotersViewRefactored locale={locale} />
      </div>
    </ErrorBoundary>
  );
}
