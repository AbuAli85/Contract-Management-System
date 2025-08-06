"use client"

import { useAuth } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProfileSyncGuardProps {
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
}

export default function ProfileSyncGuard({ children, loadingComponent }: ProfileSyncGuardProps) {
  const { isAuthenticated, isProfileSynced, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // This guard is only active for authenticated users.
    // If the user is not authenticated, other guards or page logic will handle it.
    if (!loading && !isAuthenticated()) {
      return;
    }
  }, [isAuthenticated, loading, router]);

  // While the auth state is loading or the profile is syncing, show a loading indicator.
  if (loading || (isAuthenticated() && !isProfileSynced)) {
    return loadingComponent || (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg font-semibold">Synchronizing user profile...</p>
          <p className="text-sm text-gray-600">Please wait, this will only take a moment.</p>
        </div>
      </div>
    );
  }

  // Once the profile is synced, render the children.
  return <>{children}</>;
}
