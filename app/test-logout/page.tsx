'use client'

import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { useState } from 'react'

export default function TestLogoutPage() {
  const { user, signOut, loading, mounted } = useAuth()
  const [logoutStatus, setLogoutStatus] = useState<'idle' | 'logging-out' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const handleLogout = async () => {
    setLogoutStatus('logging-out')
    setErrorMessage('')
    
    try {
      console.log('🔐 Test Logout: Starting logout...')
      await signOut()
      
      console.log('🔐 Test Logout: Success')
      setLogoutStatus('success')
    } catch (error) {
      console.error('🔐 Test Logout: Exception:', error)
      setLogoutStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  const checkCookies = () => {
    if (typeof window !== 'undefined') {
      const cookies = document.cookie.split(';').map(c => c.trim())
      const authCookies = cookies.filter(c => 
        c.includes('auth') || c.includes('supabase') || c.includes('sb-')
      )
      console.log('🔐 Test Logout: Auth cookies found:', authCookies)
      alert(`Found ${authCookies.length} auth cookies. Check console for details.`)
    }
  }

  const clearAllStorage = () => {
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
      console.log('🔐 Test Logout: All storage cleared')
      alert('All localStorage and sessionStorage cleared')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Logout Test Page
        </h1>
        
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${user ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>User: {user ? 'Logged In' : 'Not Logged In'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${loading ? 'bg-yellow-500' : mounted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Loading: {loading ? 'Yes' : 'No'}</span>
                </div>
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-3 ${mounted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span>Mounted: {mounted ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Logout Test</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <Button 
                    onClick={handleLogout}
                    disabled={logoutStatus === 'logging-out' || !user}
                    variant="destructive"
                  >
                    {logoutStatus === 'logging-out' ? 'Logging Out...' : 'Test Logout'}
                  </Button>
                  
                  <Button onClick={checkCookies} variant="outline">
                    Check Cookies
                  </Button>
                  
                  <Button onClick={clearAllStorage} variant="outline">
                    Clear Storage
                  </Button>
                </div>
                
                {logoutStatus === 'success' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-800">✅ Logout successful!</p>
                  </div>
                )}
                
                {logoutStatus === 'error' && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800">❌ Logout failed: {errorMessage}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Button asChild>
                  <Link href="/en/auth/login">Go to Login</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/en/dashboard">Try Dashboard</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/en/logout">Direct Logout Page</Link>
                </Button>
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
        </div>
      </div>
    </div>
  )
} 