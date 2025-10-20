'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthLoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct locale-based login page
    console.log('🔄 Redirecting from /auth/login to /en/auth/login');
    router.replace('/en/auth/login');
  }, [router]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
        <p className='mt-4 text-gray-600'>Redirecting to login...</p>
      </div>
    </div>
  );
}
