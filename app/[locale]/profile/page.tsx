'use client';

import { useState, useEffect } from 'react';
import dynamicImport from 'next/dynamic';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { User, Shield, Settings } from 'lucide-react';

// Dynamically import the UserProfile component to prevent SSR issues
const UserProfile = dynamicImport(
  () =>
    import('@/auth/components/user-profile').then(mod => ({
      default: mod.UserProfile,
    })),
  {
    ssr: false,
    loading: () => (
      <div className='p-8 text-center'>
        <div className='animate-pulse'>
          <div className='mx-auto mb-4 h-8 w-1/3 rounded bg-gray-200'></div>
          <div className='mx-auto mb-2 h-4 w-1/2 rounded bg-gray-200'></div>
          <div className='mx-auto h-4 w-2/3 rounded bg-gray-200'></div>
        </div>
      </div>
    ),
  }
);

export default function ProfilePage() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Don't render the profile component during SSR
  if (!isClient) {
    return (
      <div className='space-y-6'>
        {/* Page Header */}
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>Profile</h1>
          <p className='text-muted-foreground'>
            Manage your account settings and preferences
          </p>
        </div>

        {/* Loading State */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              User Profile
            </CardTitle>
            <CardDescription>Loading profile settings...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='animate-pulse'>
              <div className='mb-4 h-8 w-1/3 rounded bg-gray-200'></div>
              <div className='mb-2 h-4 w-1/2 rounded bg-gray-200'></div>
              <div className='h-4 w-2/3 rounded bg-gray-200'></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Profile</h1>
        <p className='text-muted-foreground'>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Content */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            User Profile
          </CardTitle>
          <CardDescription>
            Update your account information and security settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserProfile />
        </CardContent>
      </Card>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic';
