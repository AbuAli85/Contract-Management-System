'use client';

import { RealTimeProviderDashboard } from '@/components/dashboards/real-time-provider-dashboard';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

export default function ProviderComprehensivePage() {
  const { user, loading, hasPermission } = useEnhancedRBAC();

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <div className='flex items-center space-x-3'>
          <Loader2 className='h-6 w-6 animate-spin text-blue-600' />
          <span className='text-gray-600'>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Card className='w-96'>
          <CardContent className='p-8 text-center'>
            <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Authentication Required
            </h2>
            <p className='text-gray-600'>
              Please log in to access the provider dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if user has provider role
  if (user.role !== 'provider' && !hasPermission('dashboard.view_all')) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center'>
        <Card className='w-96'>
          <CardContent className='p-8 text-center'>
            <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
            <h2 className='text-xl font-semibold text-gray-900 mb-2'>
              Access Denied
            </h2>
            <p className='text-gray-600'>
              You need to have a provider account to access this dashboard.
            </p>
            <p className='text-sm text-gray-500 mt-2'>
              Current role: {user.role}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <RealTimeProviderDashboard providerId={user.id} />
    </div>
  );
}
