'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import SimpleContractGenerator from '@/components/SimpleContractGenerator';

export default function GenerateContractPage() {
  const { loading, user } = useAuth();
  const { userRole, hasPermission, isLoading } = useEnhancedRBAC();
  const [authTimeout, setAuthTimeout] = useState(false);
  const isAuthorized = userRole === 'admin' || hasPermission('dashboard.view');

  // Add timeout to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || isLoading) {
        console.warn('Auth loading timeout - forcing completion');
        setAuthTimeout(true);
      }
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, [loading, isLoading]);

  // Still loading (with timeout check)
  if ((loading || isLoading) && !authTimeout) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4'></div>
          <p>Loading authentication...</p>
        </div>
      </div>
    );
  }

  // Auth timed out or no user - redirect to login
  if (authTimeout || !user) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Session Expired</h1>
          <p className='text-muted-foreground mb-4'>
            Please sign in to access this page.
          </p>
          <a 
            href='/en/auth/login' 
            className='inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90'
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <h1 className='text-2xl font-bold mb-4'>Access Denied</h1>
          <p className='text-muted-foreground'>
            You don't have permission to access eXtra contract generation.
          </p>
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
