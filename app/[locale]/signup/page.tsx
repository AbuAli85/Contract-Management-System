'use client';

import { useEffect } from 'react';

export default function SignupRedirectPage() {
  useEffect(() => {
    // Redirect to the new registration system
    window.location.href = `/${typeof window !== 'undefined' && navigator.language?.startsWith('ar') ? 'ar' : 'en'}/register-new`;
  }, []);

  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50'>
      <div className='text-center'>
        <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
        <p className='text-gray-600'>
          Redirecting to new registration system...
        </p>
      </div>
    </div>
  );
}
