'use client';

import { useEffect } from 'react';
import { useSupabase } from '@/app/providers';
import { useRouter, usePathname } from '@/navigation';

export function AuthRedirect() {
  const { session, loading } = useSupabase();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only redirect if we have a session and we're on an auth page
    if (!loading && session && pathname) {
      const isAuthPage = pathname.includes('/auth/');

      if (isAuthPage) {
        // Get locale from pathname
        const segments = pathname.split('/');
        const locale = segments[1] || 'en';

        // Use next-intl aware router for proper locale handling

        // Use router.replace to avoid adding to browser history
        router.replace('/dashboard');
      }
    }
  }, [session, loading, pathname, router]);

  return null; // This component doesn't render anything
}
