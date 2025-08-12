'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-service';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
  requireAuth?: boolean;
}

export default function AuthGuard({
  children,
  redirectTo = '/dashboard',
  requireAuth = false,
}: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // 1) Mark when the component has hydrated
  useEffect(() => {
    setMounted(true);
  }, []);

  // 2) Once hydrated AND no longer loading, handle redirects
  useEffect(() => {
    if (!mounted || loading) return;

    if (requireAuth && !user) {
      // Require auth but no user - redirect to login
      router.replace('/auth/login');
    } else if (!requireAuth && user) {
      // Don't require auth but user is logged in - redirect to dashboard
      router.replace(redirectTo);
    }
  }, [mounted, loading, user, router, requireAuth, redirectTo]);

  // 3) Before hydration or while loading, show loading state
  if (!mounted || loading) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Loading...</p>
        </div>
      </div>
    );
  }

  // 4) Once hydrated & done loading, render children if conditions are met
  if (requireAuth && !user) {
    // Require auth but no user - show nothing (will redirect)
    return null;
  } else if (!requireAuth && user) {
    // Don't require auth but user is logged in - show nothing (will redirect)
    return null;
  }

  // 5) Otherwise render children
  return <>{children}</>;
}
