'use client'

import { useAuth } from '@/src/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useState } from 'react'

export default function TestCompleteAuthPage() {
  const { user, loading, mounted, session, signOut } = useAuth()
  const [testResults, setTestResults] = useState<string[]>([])

  const runAuthTests = async () => {
    const results: string[] = []
    
    // Test 1: Check if user is authenticated
    if (user) {
      results.push('✅ User is authenticated')
    } else {
      results.push('❌ User is not authenticated')
    }
    
    // Test 2: Check if session exists
    if (session) {
      results.push('✅ Session exists')
    } else {
      results.push('❌ No session found')
    }
    
    // Test 3: Check if auth is mounted
    if (mounted) {
      results.push('✅ Auth is mounted')
    } else {
      results.push('❌ Auth not mounted')
    }
    
    // Test 4: Check if not loading
    if (!loading) {
      results.push('✅ Auth not loading')
    } else {
      results.push('❌ Auth still loading')
    }
    
    // Test 5: Check cookies
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';').map(c => c.trim())
      const authCookies = cookies.filter(c => 
        c.includes('auth') || c.includes('supabase') || c.includes('sb-')
      )
      if (authCookies.length > 0) {
        results.push(`✅ Found ${authCookies.length} auth cookies`)
      } else {
        results.push('❌ No auth cookies found')
      }
    }
    
    setTestResults(results)
  }

  const handleLogout = async () => {
    try {
      const result = await signOut()
      if (result.success) {
        setTestResults(['✅ Logout successful'])
      } else {
        setTestResults([`❌ Logout failed: ${result.error}`])
      }
    } catch (error) {
      setTestResults([`❌ Logout error: ${error}`])
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Complete Authentication Test
        </h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
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
                  <Button onClick={runAuthTests}>
                    Run Auth Tests
                  </Button>
                  {user && (
                    <Button onClick={handleLogout} variant="destructive">
                      Test Logout
                    </Button>
                  )}
                  <Button asChild variant="outline">
                    <Link href="/en/auth/login">Go to Login</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/en/dashboard">Go to Dashboard</Link>
                  </Button>
                </div>
                
                {testResults.length > 0 && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <h3 className="font-semibold text-blue-800 mb-2">Test Results:</h3>
                    <div className="space-y-1">
                      {testResults.map((result, index) => (
                        <div key={index} className="text-sm text-blue-700">
                          {result}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {user && (
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                  {JSON.stringify(user, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Expected Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>1. ✅ User visits login page</p>
                <p>2. ✅ User enters credentials</p>
                <p>3. ✅ Server authenticates user</p>
                <p>4. ✅ Session created and cookies set</p>
                <p>5. ✅ User redirected to dashboard</p>
                <p>6. ✅ Dashboard shows authenticated content</p>
                <p>7. ✅ Logout clears session and cookies</p>
                <p>8. ✅ User redirected back to login</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 