'use client';

import { useAuth } from '@/app/providers';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import SimpleContractGenerator from '@/components/SimpleContractGenerator';

export default function SimpleContractPage() {
  const { loading } = useAuth();
  const { userRole, hasPermission, isLoading } = useEnhancedRBAC();
  const isAuthorized = userRole === 'admin' || hasPermission('dashboard.view');

  if (loading || isLoading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary mx-auto mb-4'></div>
          <p>Loading authentication...</p>
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
            You don't have permission to access contract generation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6'>
      <SimpleContractGenerator />
    </div>
  );
}
