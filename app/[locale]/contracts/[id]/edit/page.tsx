'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LoadingSpinner } from '@/components/LoadingSpinner';

/**
 * Redirect page for /contracts/[id]/edit route
 * Redirects to /edit-contract/[id] to use the existing edit page component
 */
export default function ContractEditRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const contractId = params?.id as string;
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    // Redirect to the existing edit route
    if (contractId) {
      router.replace(`/${locale}/edit-contract/${contractId}`);
    } else {
      // If no contract ID, redirect to contracts list
      router.replace(`/${locale}/contracts`);
    }
  }, [contractId, locale, router]);

  return <LoadingSpinner />;
}
