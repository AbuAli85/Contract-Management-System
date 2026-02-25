'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function LoginRedirectPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    router.replace(`/${locale}/auth/login`);
  }, [router, locale]);

  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
        <p className='text-sm text-muted-foreground'>Redirecting to login...</p>
      </div>
    </div>
  );
}
