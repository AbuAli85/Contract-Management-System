'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export default function TestUserSignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const testSignup = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🧪 Testing user signup...')
      
      const response = await fetch('/api/test-user-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName
        }),
      })

      const data = await response.json()
      console.log('📊 Test result:', data)
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Test failed')
      }
    } catch (err) {
      console.error('❌ Test error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const checkUsers = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🔍 Checking users...')
      
      const response = await fetch('/api/test-users-status')
      const data = await response.json()
      console.log('📊 Users status:', data)
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Failed to check users')
      }
    } catch (err) {
      console.error('❌ Check error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const testTrigger = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      console.log('🔧 Testing database trigger...')
      
      const response = await fetch('/api/test-trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: `test-${Date.now()}@example.com`,
          fullName: 'Trigger Test User'
        }),
      })

      const data = await response.json()
      console.log('📊 Trigger test result:', data)
      
      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Trigger test failed')
      }
    } catch (err) {
      console.error('❌ Trigger test error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Test User Signup</h1>
        <p className="text-gray-600 mt-2">
          Test the user signup process and database triggers
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Test Signup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password123"
              />
            </div>
            
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Test User"
              />
            </div>
            
            <Button
              onClick={testSignup}
              disabled={loading || !email || !password || !fullName}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Signup'
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Check Users</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={checkUsers}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Checking...
                </>
              ) : (
                'Check All Users'
              )}
            </Button>
            
            <Button
              onClick={testTrigger}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test Database Trigger'
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 