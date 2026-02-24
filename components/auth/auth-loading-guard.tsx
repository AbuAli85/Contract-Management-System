'use client';

import { useSupabase } from '@/app/providers';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

interface AuthLoadingGuardProps {
  children: React.ReactNode;
}

/**
 * Auth Loading Guard - Prevents redirects during initial authentication check.
 *
 * FIX (2026-02-24): Reduced the loading gate so it only blocks rendering while
 * `initialLoading` is true (the one-time startup check). The `loading` flag
 * (which fires on every token refresh) no longer blocks the UI, preventing the
 * infinite spinner that occurred when the Supabase client took longer than
 * expected to initialise in production.
 */
export function AuthLoadingGuard({ children }: AuthLoadingGuardProps) {
  // Only use initialLoading - NOT the recurring `loading` flag
  const { user, initialLoading } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const redirectedRef = useRef(false);

  useEffect(() => {
    // Only perform redirect logic after the one-time initial auth check
    if (initialLoading) return;

    const isAuthPage =
      pathname?.includes('/auth/') || pathname?.includes('/login');
    const isPublicPage = pathname === '/' || pathname?.includes('/public');

    // Unauthenticated user on a protected page → send to login
    if (!user && !isAuthPage && !isPublicPage && !redirectedRef.current) {
      redirectedRef.current = true;
      const segments = pathname?.split('/').filter(Boolean) ?? [];
      const locale = segments[0] ?? 'en';
      router.push(`/${locale}/auth/login`);
    }

    // Authenticated user landed on an auth page → send to dashboard
    if (user && isAuthPage && !redirectedRef.current) {
      redirectedRef.current = true;
      const segments = pathname?.split('/').filter(Boolean) ?? [];
      const locale = segments[0] ?? 'en';
      router.push(`/${locale}/dashboard`);
    }
  }, [user, initialLoading, pathname, router]);

  // Reset redirect guard when pathname changes
  useEffect(() => {
    redirectedRef.current = false;
  }, [pathname]);

  // Only block the UI during the very first auth check
  if (initialLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto' />
          <p className='mt-4 text-gray-600'>Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
