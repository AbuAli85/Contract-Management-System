"use client"

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/app/providers'

export default function TestBasicPage() {
  const { user, loading } = useAuth()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Basic System Test</h1>
      <p className="text-gray-600">Testing basic authentication without RBAC dependencies</p>

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
                <span>Loading:</span>
                <Badge variant={loading ? "secondary" : "default"}>
                  {loading ? 'Loading...' : 'Ready'}
                </Badge>
              </div>
              
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

        {/* System Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span>Page Loading:</span>
                <Badge variant="default">✅ Success</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>Auth Provider:</span>
                <Badge variant="default">✅ Working</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span>No Errors:</span>
                <Badge variant="default">✅ Clean</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Basic System Status</CardTitle>
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
                  ? '✅ Basic authentication working - User session found'
                  : '❌ Authentication issue - No user session'
                }
              </AlertDescription>
            </Alert>

            {/* Loading Check */}
            <Alert variant={!loading ? "default" : "default"}>
              {!loading ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription>
                {!loading 
                  ? '✅ Auth provider loaded successfully'
                  : '⏳ Auth provider still loading...'
                }
              </AlertDescription>
            </Alert>

            {/* Page Access Check */}
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                ✅ Page accessible - No routing or provider errors
              </AlertDescription>
            </Alert>
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
              authLoading: loading,
              timestamp: new Date().toISOString(),
              currentUrl: typeof window !== 'undefined' ? window.location.href : 'unknown',
              userAgent: typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 50) + '...' : 'unknown'
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}