'use client';

import { useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * Redirect page for /contracts/[id]/edit route
 * Redirects to /edit-contract/[id] to use the existing edit page component
 */
export default function ContractEditRedirectPage() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const contractId = params?.id as string;

  // Extract locale from pathname
  const locale =
    pathname && pathname.startsWith('/en/')
      ? 'en'
      : pathname && pathname.startsWith('/ar/')
        ? 'ar'
        : 'en';

  useEffect(() => {
    // Redirect to the existing edit route
    if (contractId) {
      // Use replace with prefetch disabled to prevent Next.js from trying to prefetch the route
      router.replace(`/${locale}/edit-contract/${contractId}`);
    } else {
      // If no contract ID, redirect to contracts list
      router.replace(`/${locale}/contracts`);
    }
  }, [contractId, locale, router]);

  return <LoadingSpinner />;
}
