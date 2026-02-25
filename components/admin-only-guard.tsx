'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/app/providers';

interface AdminGuardProps {
  children: React.ReactNode;
  locale?: string;
}

export function AdminOnlyGuard({ children, locale }: AdminGuardProps) {
  const { user, loading, refreshSession } = useAuth();
  const router = useRouter();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (loading) return;

      if (!user) {
        try {
          await refreshSession();
          // Wait a bit for the session to refresh
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check again after refresh
          if (!user) {
            router.push(`/${locale || 'en'}/auth/login`);
            return;
          }
        } catch (error) {
          router.push(`/${locale || 'en'}/auth/login`);
          return;
        }
      }

      try {
        setChecking(true);
        setError(null);

        // Check user role via API
        const response = await fetch('/api/get-user-role');
        const data = await response.json();

        if (response.ok && data.success) {
          setUserRole(data.role.value);
          if (data.role.value !== 'admin') {
            setError(`Access denied: Role '${data.role.value}' is not admin`);
          }
        } else {
          setError(
            `Failed to verify admin permissions: ${data.error || 'Unknown error'}`
          );
        }
      } catch (err) {
        setError('Error checking admin status');
      } finally {
        setChecking(false);
      }
    };

    checkAdminRole();
  }, [user, loading, router, locale]);

  const handleRetry = () => {
    setChecking(true);
    setError(null);
    window.location.reload();
  };

  if (loading || checking) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <RefreshCw className='h-8 w-8 animate-spin text-blue-500 mx-auto mb-4' />
              <p className='text-gray-600'>Verifying admin permissions...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (error || userRole !== 'admin') {
    return (
      <div className='min-h-screen flex items-center justify-center p-6'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <div className='mx-auto mb-4 bg-red-100 p-3 rounded-full w-fit'>
              <Shield className='h-8 w-8 text-red-600' />
            </div>
            <CardTitle className='text-2xl text-red-700'>
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert className='border-red-200 bg-red-50'>
              <AlertTriangle className='h-4 w-4 text-red-500' />
              <AlertDescription className='text-red-700'>
                <strong>Admin Access Required</strong>
                <br />
                You need administrator privileges to access user approvals.
                <br />
                <br />
                <strong>Current Status:</strong>
                <br />• Email: {user.email}
                <br />• Role: {userRole || 'Unknown'}
                <br />• Required: Admin
              </AlertDescription>
            </Alert>

            <div className='flex gap-3'>
              <Button
                onClick={handleRetry}
                variant='outline'
                className='flex-1'
              >
                <RefreshCw className='h-4 w-4 mr-2' />
                Retry
              </Button>
              <Button
                onClick={() => router.push(`/${locale || 'en'}/dashboard`)}
                className='flex-1'
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
