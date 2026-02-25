'use client';

import { useAuth } from '@/lib/auth-service';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogInIcon, LogOutIcon, UserCircle } from 'lucide-react';

export default function AuthStatus() {
  const { user, signOut, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/login');
    } catch (error) {
    }
  };

  // Show loading state until component is mounted to prevent hydration mismatch
  if (loading) {
    return <div className='h-10 w-24 animate-pulse rounded-md bg-muted/50' />;
  }

  return (
    <div className='flex items-center gap-4 border-b p-4'>
      {user ? (
        <>
          <div className='flex items-center gap-2'>
            <UserCircle className='h-5 w-5 text-muted-foreground' />
            <span className='text-sm font-medium'>{user.email}</span>
          </div>
          <Button variant='outline' size='sm' onClick={handleLogout}>
            <LogOutIcon className='mr-2 h-4 w-4' />
            Logout
          </Button>
        </>
      ) : (
        <Link href='/login' passHref legacyBehavior>
          <Button variant='default' size='sm'>
            <LogInIcon className='mr-2 h-4 w-4' />
            Login / Sign Up
          </Button>
        </Link>
      )}
    </div>
  );
}
