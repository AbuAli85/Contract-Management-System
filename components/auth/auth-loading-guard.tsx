'use client';

import { useSupabase } from '@/app/providers';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

interface AuthLoadingGuardProps {
  children: React.ReactNode;
}

/**
 * Auth Loading Guard - Prevents redirects during initial authentication check
 * This component ensures that users aren't redirected to login during page refresh
 * while the authentication state is being initialized.
 */
export function AuthLoadingGuard({ children }: AuthLoadingGuardProps) {
  const { user, loading, initialLoading } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only perform redirect logic after initial loading is complete
    if (!initialLoading && !loading) {
      const isAuthPage = pathname?.includes('/auth/');
      const isPublicPage = pathname === '/' || pathname?.includes('/public');

      // If user is not authenticated and not on auth/public pages, redirect to login
      if (!user && !isAuthPage && !isPublicPage) {
        console.log('🔐 User not authenticated, redirecting to login');
        const segments = pathname?.split('/').filter(Boolean) || [];
        const locale = segments[0] || 'en';
        router.push(`/${locale}/auth/login`);
      }

      // If user is authenticated and on auth page, redirect to dashboard
      if (user && isAuthPage) {
        console.log(
          '🔐 User authenticated on auth page, redirecting to dashboard'
        );
        const segments = pathname?.split('/').filter(Boolean) || [];
        const locale = segments[0] || 'en';
        router.push(`/${locale}/dashboard`);
      }
    }
  }, [user, loading, initialLoading, pathname, router]);

  // Show loading spinner during initial auth check
  if (initialLoading || loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
