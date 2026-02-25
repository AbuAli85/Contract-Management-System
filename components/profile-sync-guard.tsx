'use client';

import { useAuth } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProfileSyncGuardProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export default function ProfileSyncGuard({
  children,
  loadingComponent,
}: ProfileSyncGuardProps) {
  const { isAuthenticated, isProfileSynced, loading } = useAuth();
  const router = useRouter();
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    // This guard is only active for authenticated users.
    // If the user is not authenticated, other guards or page logic will handle it.
    if (!loading && !isAuthenticated()) {
      return;
    }
  }, [isAuthenticated, loading, router]);

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (isAuthenticated() && !isProfileSynced && !timeoutReached) {
      // Add a 5-second timeout to prevent infinite loading
      const timeout = setTimeout(() => {
        setTimeoutReached(true);
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [isAuthenticated, isProfileSynced, timeoutReached]);

  // Show loading only if:
  // 1. Auth is still loading, OR
  // 2. User is authenticated AND profile is not synced AND timeout hasn't been reached
  const shouldShowLoading =
    loading || (isAuthenticated() && !isProfileSynced && !timeoutReached);

  if (shouldShowLoading) {
    return (
      loadingComponent || (
        <div className='flex h-screen w-full items-center justify-center'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
            <p className='text-lg font-semibold'>
              Synchronizing user profile...
            </p>
            <p className='text-sm text-gray-600'>
              Please wait, this will only take a moment.
            </p>
            {!loading && (
              <p className='text-xs text-gray-500 mt-2'>
                If this takes too long, the app will proceed automatically.
              </p>
            )}
          </div>
        </div>
      )
    );
  }

  // Once the profile is synced or timeout is reached, render the children.
  return <>{children}</>;
}
