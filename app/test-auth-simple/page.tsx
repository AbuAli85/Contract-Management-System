'use client'

import { useState } from 'react'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TestAuthSimplePage() {
  const { user, profile, loading, signIn, signOut } = useAuth()
  const [email, setEmail] = useState('luxsess2001@gmail.com')
  const [password, setPassword] = useState('test123')
  const [testLoading, setTestLoading] = useState(false)

  const handleTestLogin = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing login with:', email)
      const result = await signIn(email, password)
      console.log('🧪 Login result:', result)
      
      if (result.success) {
        console.log('🧪 Login successful!')
      } else {
        console.error('🧪 Login failed:', result.error)
      }
    } catch (error) {
      console.error('🧪 Login error:', error)
    } finally {
      setTestLoading(false)
    }
  }

  const handleTestLogout = async () => {
    setTestLoading(true)
    try {
      console.log('🧪 Testing logout')
      await signOut()
      console.log('🧪 Logout completed')
    } catch (error) {
      console.error('🧪 Logout error:', error)
    } finally {
      setTestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Simple Auth Test</h1>
          <p className="text-muted-foreground">Testing the simplified authentication flow</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span>Loading:</span>
              <Badge variant={loading ? "destructive" : "default"}>
                {loading ? "Yes" : "No"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <span>User:</span>
              <Badge variant={user ? "default" : "secondary"}>
                {user ? "Authenticated" : "Not Authenticated"}
              </Badge>
            </div>

            {user && (
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-800">User Details:</h4>
                <p className="text-sm text-green-700">ID: {user.id}</p>
                <p className="text-sm text-green-700">Email: {user.email}</p>
                {profile && (
                  <p className="text-sm text-green-700">Name: {profile.full_name || 'N/A'}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Login</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email:</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Password:</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleTestLogin} 
                disabled={testLoading || loading}
                className="flex-1"
              >
                {testLoading ? "Testing..." : "Test Login"}
              </Button>
              
              {user && (
                <Button 
                  onClick={handleTestLogout} 
                  disabled={testLoading}
                  variant="outline"
                  className="flex-1"
                >
                  {testLoading ? "Testing..." : "Test Logout"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/debug-auth'}
              >
                Go to Debug Page
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/en/auth/login'}
              >
                Go to Login Page
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => window.location.href = '/en/dashboard'}
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 