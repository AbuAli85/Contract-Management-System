'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function AuthLoginRedirect() {
  const router = useRouter();
  useEffect(() => {
    // Detect browser language preference, default to 'en'
    const browserLang = navigator.language?.startsWith('ar') ? 'ar' : 'en';
    router.replace(`/${browserLang}/auth/login`);
  }, [router]);
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='flex flex-col items-center gap-4 text-center'>
        <Loader2 className='h-10 w-10 animate-spin text-primary' />
        <p className='text-gray-600'>Redirecting to login...</p>
      </div>
    </div>
  );
}
