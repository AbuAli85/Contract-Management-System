'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * Catch-all route for /edit-contract without an ID
 * Redirects to contracts list to prevent 404 errors from Next.js prefetching
 */
export default function EditContractRedirectPage() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from pathname
  const locale =
    pathname && pathname.startsWith('/en/')
      ? 'en'
      : pathname && pathname.startsWith('/ar/')
        ? 'ar'
        : 'en';

  useEffect(() => {
    // Redirect to contracts list if no contract ID is provided
    router.replace(`/${locale}/contracts`);
  }, [locale, router]);

  return <LoadingSpinner />;
}
