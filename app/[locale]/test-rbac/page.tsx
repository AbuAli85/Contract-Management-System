'use client';

import React from 'react';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TestRBACPage() {
  const {
    userRole,
    userPermissions,
    hasPermission,
    isLoading,
    companyId,
    isCompanyMember,
    refreshRoles,
  } = useEnhancedRBAC();

  if (isLoading) {
    return (
      <div className='container mx-auto p-6'>
        <Card>
          <CardContent className='p-6'>
            <div className='flex items-center justify-center'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
              <span className='ml-2'>Loading RBAC context...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold mb-2'>Enhanced RBAC Test Page</h1>
        <p className='text-gray-600'>
          Testing the enhanced RBAC provider integration
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Card>
          <CardHeader>
            <CardTitle>User Role Information</CardTitle>
            <CardDescription>
              Current user's role and company data
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <label className='text-sm font-medium text-gray-500'>
                User Role:
              </label>
              <div className='mt-1'>
                {userRole ? (
                  <Badge variant='default'>{userRole}</Badge>
                ) : (
                  <Badge variant='secondary'>Not authenticated</Badge>
                )}
              </div>
            </div>

            <div>
              <label className='text-sm font-medium text-gray-500'>
                Company ID:
              </label>
              <div className='mt-1'>
                <code className='text-xs bg-gray-100 px-2 py-1 rounded'>
                  {companyId || 'None'}
                </code>
              </div>
            </div>

            <div>
              <label className='text-sm font-medium text-gray-500'>
                Company Member:
              </label>
              <div className='mt-1'>
                <Badge variant={isCompanyMember ? 'default' : 'secondary'}>
                  {isCompanyMember ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>

            <Button onClick={refreshRoles} variant='outline' size='sm'>
              Refresh Roles
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Permissions</CardTitle>
            <CardDescription>
              Available permissions for current role
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userPermissions.length > 0 ? (
              <div className='grid grid-cols-2 gap-2'>
                {userPermissions.slice(0, 12).map(permission => (
                  <Badge key={permission} variant='outline' className='text-xs'>
                    {permission}
                  </Badge>
                ))}
                {userPermissions.length > 12 && (
                  <Badge variant='secondary' className='text-xs'>
                    +{userPermissions.length - 12} more...
                  </Badge>
                )}
              </div>
            ) : (
              <p className='text-gray-500 text-sm'>No permissions available</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Permission Testing</CardTitle>
          <CardDescription>Test specific permission checks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {[
              'dashboard.view',
              'bookings.create',
              'bookings.view_own',
              'services.create',
              'companies.view',
              'users.view',
              'system.settings',
              'analytics.view_own',
              'reports.view_all',
            ].map(permission => (
              <div
                key={permission}
                className='flex items-center justify-between p-3 border rounded'
              >
                <span className='text-sm font-mono'>{permission}</span>
                <Badge
                  variant={
                    hasPermission(permission as any) ? 'default' : 'secondary'
                  }
                >
                  {hasPermission(permission as any) ? '✓' : '✗'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>Raw context data for debugging</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className='text-xs bg-gray-100 p-4 rounded overflow-auto'>
            {JSON.stringify(
              {
                userRole,
                permissionCount: userPermissions.length,
                companyId,
                isCompanyMember,
                isLoading,
                samplePermissions: userPermissions.slice(0, 5),
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
