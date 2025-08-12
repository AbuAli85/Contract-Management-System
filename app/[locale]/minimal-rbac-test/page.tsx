'use client';

import React, { useEffect, useState } from 'react';

// Test page that shows whether the providers are working
export default function MinimalRBACTestPage() {
  const [providerTests, setProviderTests] = useState({
    auth: { status: 'loading', error: null },
    rbac: { status: 'loading', error: null },
  });

  useEffect(() => {
    const runTests = async () => {
      // Test Auth Provider
      try {
        const { useAuth } = await import('@/app/providers');
        const auth = useAuth();
        setProviderTests(prev => ({
          ...prev,
          auth: {
            status: 'success',
            error: null,
            data: { hasUser: !!auth.user, hasSupabase: !!auth.supabase },
          },
        }));
      } catch (error: any) {
        setProviderTests(prev => ({
          ...prev,
          auth: { status: 'error', error: error.message },
        }));
      }

      // Test Enhanced RBAC Provider
      try {
        const { useEnhancedRBAC } = await import(
          '@/components/auth/enhanced-rbac-provider'
        );
        const rbac = useEnhancedRBAC();
        setProviderTests(prev => ({
          ...prev,
          rbac: {
            status: 'success',
            error: null,
            data: {
              userRole: rbac.userRole,
              isLoading: rbac.isLoading,
              permissionCount: rbac.userPermissions?.length || 0,
            },
          },
        }));
      } catch (error: any) {
        setProviderTests(prev => ({
          ...prev,
          rbac: { status: 'error', error: error.message },
        }));
      }
    };

    runTests();
  }, []);

  return (
    <div className='container mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>Minimal RBAC Test</h1>

      <div className='space-y-4'>
        <div className='border p-4 rounded'>
          <h2 className='text-lg font-semibold mb-2'>Auth Provider Test</h2>
          <div className='flex items-center gap-2'>
            <span>Status:</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                providerTests.auth.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : providerTests.auth.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {providerTests.auth.status}
            </span>
          </div>
          {providerTests.auth.error && (
            <div className='mt-2 text-red-600 text-sm'>
              Error: {providerTests.auth.error}
            </div>
          )}
          {providerTests.auth.data && (
            <div className='mt-2 text-sm'>
              <div>
                Has User: {providerTests.auth.data.hasUser ? 'Yes' : 'No'}
              </div>
              <div>
                Has Supabase:{' '}
                {providerTests.auth.data.hasSupabase ? 'Yes' : 'No'}
              </div>
            </div>
          )}
        </div>

        <div className='border p-4 rounded'>
          <h2 className='text-lg font-semibold mb-2'>
            Enhanced RBAC Provider Test
          </h2>
          <div className='flex items-center gap-2'>
            <span>Status:</span>
            <span
              className={`px-2 py-1 rounded text-sm ${
                providerTests.rbac.status === 'success'
                  ? 'bg-green-100 text-green-800'
                  : providerTests.rbac.status === 'error'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-yellow-100 text-yellow-800'
              }`}
            >
              {providerTests.rbac.status}
            </span>
          </div>
          {providerTests.rbac.error && (
            <div className='mt-2 text-red-600 text-sm'>
              <div>Error: {providerTests.rbac.error}</div>
              {providerTests.rbac.error.includes('EnhancedRBACProvider') && (
                <div className='mt-2 text-xs'>
                  <p className='font-medium'>This error means:</p>
                  <p>
                    The EnhancedRBACProvider is not properly set up in the
                    provider tree.
                  </p>
                  <p>
                    Check app/providers.tsx to ensure it includes the
                    EnhancedRBACProvider.
                  </p>
                </div>
              )}
            </div>
          )}
          {providerTests.rbac.data && (
            <div className='mt-2 text-sm'>
              <div>User Role: {providerTests.rbac.data.userRole || 'None'}</div>
              <div>
                Is Loading: {providerTests.rbac.data.isLoading ? 'Yes' : 'No'}
              </div>
              <div>
                Permission Count: {providerTests.rbac.data.permissionCount}
              </div>
            </div>
          )}
        </div>

        <div className='border p-4 rounded bg-blue-50'>
          <h2 className='text-lg font-semibold mb-2'>Solution Steps</h2>
          <div className='text-sm space-y-2'>
            <p>If Enhanced RBAC Provider shows an error:</p>
            <ol className='list-decimal list-inside space-y-1'>
              <li>Verify app/providers.tsx includes EnhancedRBACProvider</li>
              <li>Check that imports are correct</li>
              <li>Ensure the provider is wrapped properly</li>
              <li>Clear browser cache and refresh</li>
              <li>Check browser console for additional errors</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
