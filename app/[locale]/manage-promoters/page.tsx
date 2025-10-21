'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

interface PromoterManagementProps {
  params: {
    locale: string;
  };
}

export default function PromoterManagement({
  params,
}: PromoterManagementProps) {
  const router = useRouter();

  useEffect(() => {
    // Redirect to Intelligence Hub (the new main promoters page)
    router.replace(`/${params.locale}/promoters`);
  }, [params.locale, router]);

  return (
    <div className='min-h-screen bg-background px-4 py-8 flex items-center justify-center'>
      <div className='text-center'>
        <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-primary' />
        <p className='text-muted-foreground'>Redirecting to Promoters Intelligence Hub...</p>
      </div>
    </div>
  );
}
