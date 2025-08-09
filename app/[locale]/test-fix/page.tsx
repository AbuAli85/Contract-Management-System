"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider'
import { useAuth } from '@/app/providers'

export default function TestFixPage() {
  const { user } = useAuth()
  const { userRole, isLoading, userPermissions, companyId, isCompanyMember } = useEnhancedRBAC()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">System Test Page</h1>
      <p className="text-gray-600">Testing the fixes for RBAC and routing issues</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {user ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Authentication Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>User Authenticated:</span>
                <Badge variant={user ? "default" : "secondary"}>
                  {user ? 'Yes' : 'No'}
                </Badge>
              </div>
              
              {user && (
                <>
                  <div className="flex items-center justify-between">
                    <span>User ID:</span>
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {user.id.slice(0, 8)}...
                    </code>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span>Email:</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* RBAC Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isLoading ? (
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
              ) : userRole ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              Enhanced RBAC Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>RBAC Loading:</span>
                <Badge variant={isLoading ? "secondary" : "default"}>
                  {isLoading ? 'Loading...' : 'Ready'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>User Role:</span>
                <Badge variant={userRole ? "default" : "secondary"}>
                  {userRole || 'None'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Permissions Count:</span>
                <Badge variant="outline">
                  {userPermissions.length}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Company ID:</span>
                <span className="text-xs">
                  {companyId ? `${companyId.slice(0, 8)}...` : 'None'}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Company Member:</span>
                <Badge variant={isCompanyMember ? "default" : "secondary"}>
                  {isCompanyMember ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>System Status Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Auth Check */}
            <Alert variant={user ? "default" : "destructive"}>
              {user ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {user 
                  ? '✅ Authentication working - User is logged in'
                  : '❌ Authentication issue - No user session found'
                }
              </AlertDescription>
            </Alert>

            {/* RBAC Check */}
            <Alert variant={!isLoading && userRole ? "default" : isLoading ? "default" : "destructive"}>
              {!isLoading && userRole ? (
                <CheckCircle className="h-4 w-4" />
              ) : isLoading ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                {!isLoading && userRole 
                  ? `✅ Enhanced RBAC working - Role: ${userRole} with ${userPermissions.length} permissions`
                  : isLoading 
                  ? '⏳ Enhanced RBAC loading - Please wait...'
                  : '❌ Enhanced RBAC issue - No role data loaded'
                }
              </AlertDescription>
            </Alert>

            {/* Navigation Check */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Navigation working - You can access this page without errors
              </AlertDescription>
            </Alert>

            {/* Permissions Sample */}
            {userPermissions.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">Sample Permissions (first 5):</h4>
                <div className="flex flex-wrap gap-1">
                  {userPermissions.slice(0, 5).map((permission) => (
                    <Badge key={permission} variant="outline" className="text-xs">
                      {permission}
                    </Badge>
                  ))}
                  {userPermissions.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{userPermissions.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify({
              hasUser: !!user,
              userId: user?.id || null,
              userEmail: user?.email || null,
              rbacLoading: isLoading,
              userRole,
              permissionCount: userPermissions.length,
              companyId,
              isCompanyMember,
              timestamp: new Date().toISOString(),
              currentUrl: typeof window !== 'undefined' ? window.location.href : 'unknown'
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}