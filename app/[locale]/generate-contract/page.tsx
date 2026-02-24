'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import SimpleContractGenerator from '@/components/SimpleContractGenerator';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldOff, LogIn } from 'lucide-react';
export default function GenerateContractPage() {
  const { loading, user } = useAuth();
  const { userRole, hasPermission, isLoading } = useEnhancedRBAC();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [authTimeout, setAuthTimeout] = useState(false);
  const isAuthorized =
    userRole === 'admin' ||
    userRole === 'super_admin' ||
    userRole === 'manager' ||
    userRole === 'employer' ||
    hasPermission('dashboard.view') ||
    hasPermission('contracts:create');

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || isLoading) {
        setAuthTimeout(true);
      }
    }, 5000); // 5 second timeout

    return () => clearTimeout(timer);
  }, [loading, isLoading]);

  // Still loading (with timeout check)
  if ((loading || isLoading) && !authTimeout) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='text-center space-y-3'>
          <Loader2 className='h-8 w-8 animate-spin text-primary mx-auto' />
          <p className='text-muted-foreground text-sm'>
            Loading contract generator...
          </p>
        </div>
      </div>
    );
  }
  // Session expired or unauthenticated
  if (authTimeout || !user) {
    return (
      <div className='flex items-center justify-center min-h-[60vh] p-4'>
        <div className='text-center space-y-4 max-w-sm'>
          <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-amber-100'>
            <LogIn className='h-8 w-8 text-amber-600' />
          </div>
          <h1 className='text-2xl font-bold'>Session Expired</h1>
          <p className='text-muted-foreground'>
            Please sign in to access the contract generator.
          </p>
          <Button asChild className='w-full'>
            <Link href={`/${locale}/auth/login`}>Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }
  // Insufficient permissions
  if (!isAuthorized) {
    return (
      <div className='flex items-center justify-center min-h-[60vh] p-4'>
        <div className='text-center space-y-4 max-w-sm'>
          <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100'>
            <ShieldOff className='h-8 w-8 text-red-600' />
          </div>
          <h1 className='text-2xl font-bold'>Access Denied</h1>
          <p className='text-muted-foreground'>
            You don&apos;t have permission to create contracts. Please contact
            your administrator.
          </p>
          <Button variant='outline' asChild>
            <Link href={`/${locale}/dashboard`}>Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6'>
      <SimpleContractGenerator pageTitle='eXtra Contracts' />
    </div>
  );
}
