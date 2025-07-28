'use client'

import { useAuth } from '@/src/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function TestAuthPage() {
  const { user, loading, mounted, session } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Authentication Test Page
        </h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${loading ? 'bg-yellow-500' : mounted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Loading: {loading ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${mounted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Mounted: {mounted ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>User: {user ? 'Logged In' : 'Not Logged In'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${session ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Session: {session ? 'Active' : 'No Session'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Test Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button asChild>
                    <Link href="/en/auth/login">Go to Login</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/en/dashboard">Try Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Go Home</Link>
                  </Button>
                </div>
                
                {user && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <h3 className="font-semibold text-green-800 mb-2">User Information:</h3>
                    <pre className="text-sm text-green-700 overflow-auto">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expected Behavior</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>✅ Users should NOT be automatically logged in</p>
                <p>✅ Users must enter username and password</p>
                <p>✅ Dashboard should redirect to login if not authenticated</p>
                <p>✅ Login page should not auto-redirect to dashboard</p>
                <p>✅ Session should only be restored if valid and not expired</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 