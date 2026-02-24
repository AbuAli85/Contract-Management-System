'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function EmployeePage() {
  const params = useParams();
  const locale = params.locale || 'en';

  useEffect(() => {
    // Redirect to employee dashboard
    window.location.href = `/${locale}/employee/dashboard`;
  }, [locale]);

  // Return a loading state while redirecting
  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
    </div>
  );
}
