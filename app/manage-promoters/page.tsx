'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function ManagePromotersPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the localized version
    router.replace('/en/manage-promoters');
  }, [router]);

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='mx-auto h-8 w-8 animate-spin text-primary mb-4' />
        <p className='text-muted-foreground'>
          Redirecting to promoters management...
        </p>
      </div>
    </div>
  );
}
