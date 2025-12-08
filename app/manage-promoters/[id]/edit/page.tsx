'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function EditPromoterPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  useEffect(() => {
    // Redirect to the localized version
    if (id) {
      router.replace(`/en/manage-promoters/${id}/edit`);
    } else {
      router.replace('/en/manage-promoters');
    }
  }, [router, id]);

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='mx-auto h-8 w-8 animate-spin text-primary mb-4' />
        <p className='text-muted-foreground'>Redirecting to edit promoter...</p>
      </div>
    </div>
  );
}
