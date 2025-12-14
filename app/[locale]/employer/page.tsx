'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Redirect page for /employer → /employer/team
 * This prevents 404 errors when Next.js prefetches the parent route
 */
export default function EmployerRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    // Redirect to the team management page
    router.replace(`/${locale}/employer/team`);
  }, [router, locale]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to Team Management...</p>
      </div>
    </div>
  );
}

