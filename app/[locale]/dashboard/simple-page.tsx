'use client';

import { useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-service';

export default function SimpleDashboardPage() {
  const params = useParams();

  if (!params || !params.locale) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  const locale = params.locale as string;
  const { user, loading, mounted } = useAuth();

  if (loading || !mounted) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900'></div>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <p className='text-muted-foreground'>
            Please log in to access the dashboard.
          </p>
          <a
            href={`/${locale}/auth/login`}
            className='text-blue-600 hover:underline'
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className='p-8'>
      <h1 className='mb-4 text-2xl font-bold'>Simple Dashboard</h1>
      <p className='mb-4'>Welcome, {user.email?.split('@')[0] || 'User'}!</p>
      <div className='rounded bg-gray-100 p-4'>
        <h2 className='mb-2 font-semibold'>User Info:</h2>
        <pre className='text-sm'>
          {JSON.stringify({ id: user.id, email: user.email }, null, 2)}
        </pre>
      </div>
      <div className='mt-4 rounded bg-gray-100 p-4'>
        <h2 className='mb-2 font-semibold'>Route Parameters:</h2>
        <pre className='text-sm'>{JSON.stringify(params, null, 2)}</pre>
      </div>
      <div className='mt-4'>
        <a
          href={`/${locale}/dashboard`}
          className='mr-4 text-blue-600 hover:underline'
        >
          Full Dashboard
        </a>
        <a
          href={`/${locale}/auth/login`}
          className='text-blue-600 hover:underline'
        >
          Logout
        </a>
      </div>
    </div>
  );
}
