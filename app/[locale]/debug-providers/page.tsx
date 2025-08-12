'use client';

import React from 'react';
import { useAuth } from '@/app/providers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export default function DebugProvidersPage() {
  // Test 1: Basic auth context
  let authTest = { status: 'loading', data: null, error: null };
  try {
    const auth = useAuth();
    authTest = {
      status: 'success',
      data: {
        hasUser: !!auth.user,
        hasSession: !!auth.session,
        hasSupabase: !!auth.supabase,
        loading: auth.loading,
        userId: auth.user?.id || null,
      },
      error: null,
    };
  } catch (error: any) {
    authTest = {
      status: 'error',
      data: null,
      error: error.message,
    };
  }

  // Test 2: Enhanced RBAC context (we'll test this cautiously)
  let rbacTest = { status: 'loading', data: null, error: null };
  try {
    // We'll import this dynamically to catch the error
    const {
      useEnhancedRBAC,
    } = require('@/components/auth/enhanced-rbac-provider');
    const rbac = useEnhancedRBAC();
    rbacTest = {
      status: 'success',
      data: {
        userRole: rbac.userRole,
        permissionCount: rbac.userPermissions?.length || 0,
        isLoading: rbac.isLoading,
        companyId: rbac.companyId,
        isCompanyMember: rbac.isCompanyMember,
      },
      error: null,
    };
  } catch (error: any) {
    rbacTest = {
      status: 'error',
      data: null,
      error: error.message,
    };
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold mb-2'>Provider Debug Page</h1>
        <p className='text-gray-600'>
          Testing provider setup and context availability
        </p>
      </div>

      {/* Auth Context Test */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {authTest.status === 'success' ? (
              <CheckCircle className='h-5 w-5 text-green-500' />
            ) : authTest.status === 'error' ? (
              <AlertCircle className='h-5 w-5 text-red-500' />
            ) : (
              <Info className='h-5 w-5 text-blue-500' />
            )}
            Auth Context Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span>Status:</span>
              <Badge
                variant={
                  authTest.status === 'success'
                    ? 'default'
                    : authTest.status === 'error'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {authTest.status}
              </Badge>
            </div>

            {authTest.status === 'success' && authTest.data && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span>Has User:</span>
                  <Badge
                    variant={authTest.data.hasUser ? 'default' : 'secondary'}
                  >
                    {authTest.data.hasUser ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Has Session:</span>
                  <Badge
                    variant={authTest.data.hasSession ? 'default' : 'secondary'}
                  >
                    {authTest.data.hasSession ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Has Supabase:</span>
                  <Badge
                    variant={
                      authTest.data.hasSupabase ? 'default' : 'secondary'
                    }
                  >
                    {authTest.data.hasSupabase ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {authTest.data.userId && (
                  <div className='mt-2'>
                    <span className='text-sm font-medium'>User ID:</span>
                    <code className='ml-2 text-xs bg-gray-100 px-2 py-1 rounded'>
                      {authTest.data.userId}
                    </code>
                  </div>
                )}
              </div>
            )}

            {authTest.status === 'error' && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{authTest.error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced RBAC Context Test */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            {rbacTest.status === 'success' ? (
              <CheckCircle className='h-5 w-5 text-green-500' />
            ) : rbacTest.status === 'error' ? (
              <AlertCircle className='h-5 w-5 text-red-500' />
            ) : (
              <Info className='h-5 w-5 text-blue-500' />
            )}
            Enhanced RBAC Context Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span>Status:</span>
              <Badge
                variant={
                  rbacTest.status === 'success'
                    ? 'default'
                    : rbacTest.status === 'error'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {rbacTest.status}
              </Badge>
            </div>

            {rbacTest.status === 'success' && rbacTest.data && (
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span>User Role:</span>
                  <Badge
                    variant={rbacTest.data.userRole ? 'default' : 'secondary'}
                  >
                    {rbacTest.data.userRole || 'None'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Permission Count:</span>
                  <Badge variant='outline'>
                    {rbacTest.data.permissionCount}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Is Loading:</span>
                  <Badge
                    variant={rbacTest.data.isLoading ? 'secondary' : 'default'}
                  >
                    {rbacTest.data.isLoading ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span>Company Member:</span>
                  <Badge
                    variant={
                      rbacTest.data.isCompanyMember ? 'default' : 'secondary'
                    }
                  >
                    {rbacTest.data.isCompanyMember ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            )}

            {rbacTest.status === 'error' && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>
                  <div className='space-y-2'>
                    <p>{rbacTest.error}</p>
                    {rbacTest.error.includes('EnhancedRBACProvider') && (
                      <div className='text-sm'>
                        <p className='font-medium'>Possible causes:</p>
                        <ul className='list-disc list-inside space-y-1 text-xs'>
                          <li>
                            EnhancedRBACProvider not added to the provider tree
                          </li>
                          <li>Component is rendered outside the provider</li>
                          <li>Provider import path is incorrect</li>
                          <li>
                            Provider is not properly wrapped in the layout
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Provider Tree Information */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Tree Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <Alert>
              <Info className='h-4 w-4' />
              <AlertDescription>
                <div className='space-y-2'>
                  <p className='font-medium'>Expected Provider Tree:</p>
                  <div className='text-sm font-mono bg-gray-100 p-3 rounded'>
                    QueryClientProvider
                    <br />
                    └── ThemeProvider
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;└── AuthProvider
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──
                    RBACProvider
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──
                    EnhancedRBACProvider
                    <br />
                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└──
                    App Components
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            <Alert>
              <Info className='h-4 w-4' />
              <AlertDescription>
                <div className='space-y-2'>
                  <p className='font-medium'>
                    Next Steps if Enhanced RBAC Fails:
                  </p>
                  <ol className='list-decimal list-inside space-y-1 text-sm'>
                    <li>
                      Check if app/providers.tsx includes EnhancedRBACProvider
                    </li>
                    <li>Verify import paths are correct</li>
                    <li>Ensure the provider is properly wrapped</li>
                    <li>Check browser console for additional errors</li>
                    <li>Try refreshing the page</li>
                  </ol>
                </div>
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Raw Context Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Debug Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className='text-xs bg-gray-100 p-4 rounded overflow-auto max-h-64'>
            {JSON.stringify(
              {
                authTest,
                rbacTest,
                timestamp: new Date().toISOString(),
                nodeEnv: process.env.NODE_ENV,
                nextPublicSupabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL
                  ? 'Set'
                  : 'Not Set',
              },
              null,
              2
            )}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
