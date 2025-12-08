'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Redirect to the users roles page
    const locale = pathname?.split('/')[1] || 'en';
    router.replace(`/${locale}/admin/users`);
  }, [router, pathname]);

  return (
    <div className='flex items-center justify-center min-h-screen'>
      <div className='text-center'>
        <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
        <p className='text-gray-600'>Redirecting to user management...</p>
      </div>
    </div>
  );
}
