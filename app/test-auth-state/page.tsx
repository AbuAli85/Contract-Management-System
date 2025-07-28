'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function TestAuthStatePage() {
  const { user, loading, mounted, session, profile, roles } = useAuth()
  const [refreshCount, setRefreshCount] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshCount(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Auth State Test</h1>
      
      <div className="text-sm text-gray-600 mb-4">
        Auto-refreshing every second (count: {refreshCount})
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Authentication State</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Loading:</p>
                <p className="text-sm text-gray-600">{loading ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Mounted:</p>
                <p className="text-sm text-gray-600">{mounted ? 'Yes' : 'No'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">User:</p>
                <p className="text-sm text-gray-600">{user ? user.email : 'None'}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Session:</p>
                <p className="text-sm text-gray-600">{session ? 'Active' : 'None'}</p>
              </div>
            </div>
            
            {profile && (
              <div>
                <p className="text-sm font-medium">Profile:</p>
                <pre className="text-sm text-gray-600 bg-gray-100 p-2 rounded">
                  {JSON.stringify(profile, null, 2)}
                </pre>
              </div>
            )}
            
            {roles.length > 0 && (
              <div>
                <p className="text-sm font-medium">Roles:</p>
                <p className="text-sm text-gray-600">{roles.join(', ')}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Loading Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Loading Condition:</strong> {loading ? 'true' : 'false'} || {!mounted ? 'true' : 'false'} = {loading || !mounted ? 'true' : 'false'}
            </p>
            <p className="text-sm">
              <strong>Should Show Loading:</strong> {(loading || !mounted) ? 'Yes' : 'No'}
            </p>
            <p className="text-sm">
              <strong>User Authenticated:</strong> {user ? 'Yes' : 'No'}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button 
          onClick={() => window.location.reload()}
          variant="outline"
        >
          Reload Page
        </Button>
      </div>
    </div>
  )
} 