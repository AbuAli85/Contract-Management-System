'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Loader2, User, Mail, Shield, RefreshCw } from 'lucide-react'

export default function DebugAuthPage() {
  const { user, profile, loading, mounted, signOut } = useAuth()
  const [serverAuth, setServerAuth] = useState<any>(null)
  const [serverLoading, setServerLoading] = useState(false)

  const checkServerAuth = async () => {
    setServerLoading(true)
    try {
      const response = await fetch('/api/auth/check-session')
      const data = await response.json()
      setServerAuth(data)
    } catch (error) {
      console.error('Server auth check failed:', error)
      setServerAuth({ error: 'Failed to check server auth' })
    } finally {
      setServerLoading(false)
    }
  }

  useEffect(() => {
    checkServerAuth()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    window.location.reload()
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Authentication Debug</h1>
          <p className="text-muted-foreground">Debug information for authentication issues</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Client Auth State */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Auth State
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span>Loading:</span>
                <Badge variant={loading ? "destructive" : "default"}>
                  {loading ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <span>Mounted:</span>
                <Badge variant={mounted ? "default" : "destructive"}>
                  {mounted ? "Yes" : "No"}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <span>User:</span>
                <Badge variant={user ? "default" : "secondary"}>
                  {user ? "Authenticated" : "Not Authenticated"}
                </Badge>
              </div>

              {user && (
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span className="font-mono text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="font-mono text-sm">ID: {user.id}</span>
                  </div>
                </div>
              )}

              {profile && (
                <div className="space-y-2 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold">Profile Data:</h4>
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(profile, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Server Auth State */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Server Auth State
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={checkServerAuth}
                  disabled={serverLoading}
                >
                  <RefreshCw className={`h-4 w-4 ${serverLoading ? 'animate-spin' : ''}`} />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {serverLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Checking server auth...</span>
                </div>
              ) : serverAuth ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <Badge variant={serverAuth.success ? "default" : "destructive"}>
                      {serverAuth.success ? "Success" : "Error"}
                    </Badge>
                  </div>
                  
                  {serverAuth.hasSession && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-semibold text-green-800">Session Found</h4>
                      <pre className="text-xs overflow-auto text-green-700">
                        {JSON.stringify(serverAuth.user, null, 2)}
                      </pre>
                    </div>
                  )}

                  {serverAuth.error && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800">Error</h4>
                      <p className="text-sm text-red-700">{serverAuth.error}</p>
                    </div>
                  )}

                  <pre className="text-xs overflow-auto bg-gray-50 p-2 rounded">
                    {JSON.stringify(serverAuth, null, 2)}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground">No server auth data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button onClick={checkServerAuth} disabled={serverLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${serverLoading ? 'animate-spin' : ''}`} />
                Refresh Server Auth
              </Button>
              
              {user && (
                <Button variant="destructive" onClick={handleSignOut}>
                  Sign Out
                </Button>
              )}
              
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload Page
              </Button>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Quick Links:</h4>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/en/auth/login'}>
                  Go to Login
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/en/dashboard'}>
                  Go to Dashboard
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/'}>
                  Go to Root
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 