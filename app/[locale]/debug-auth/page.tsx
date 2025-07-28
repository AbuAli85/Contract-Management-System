'use client'

import { useState } from 'react'
import { useAuth } from '@/app/providers'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DebugAuthPage() {
  const { user, session, loading, mounted } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loadingDebug, setLoadingDebug] = useState(false)

  const checkCookies = async () => {
    setLoadingDebug(true)
    try {
      const response = await fetch('/api/debug-cookies')
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error('Debug error:', error)
      setDebugInfo({ error: 'Failed to fetch debug info' })
    } finally {
      setLoadingDebug(false)
    }
  }

  const checkSession = async () => {
    setLoadingDebug(true)
    try {
      const response = await fetch('/api/auth/check-session')
      const data = await response.json()
      setDebugInfo(data)
    } catch (error) {
      console.error('Session check error:', error)
      setDebugInfo({ error: 'Failed to check session' })
    } finally {
      setLoadingDebug(false)
    }
  }

  const forceLogout = async () => {
    setLoadingDebug(true)
    try {
      const response = await fetch('/api/force-logout')
      const data = await response.json()
      setDebugInfo(data)
      // Reload page to see changes
      setTimeout(() => window.location.reload(), 1000)
    } catch (error) {
      console.error('Force logout error:', error)
      setDebugInfo({ error: 'Failed to force logout' })
    } finally {
      setLoadingDebug(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Authentication Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Auth State</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
            <p><strong>Mounted:</strong> {mounted ? 'Yes' : 'No'}</p>
            <p><strong>User:</strong> {user ? user.email : 'None'}</p>
            <p><strong>Session:</strong> {session ? 'Active' : 'None'}</p>
            <p><strong>User ID:</strong> {user?.id || 'None'}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button 
              onClick={checkCookies} 
              disabled={loadingDebug}
              className="w-full"
            >
              Check Cookies
            </Button>
            <Button 
              onClick={checkSession} 
              disabled={loadingDebug}
              className="w-full"
            >
              Check Session
            </Button>
            <Button 
              onClick={forceLogout} 
              disabled={loadingDebug}
              variant="destructive"
              className="w-full"
            >
              Force Logout
            </Button>
          </CardContent>
        </Card>
      </div>

      {debugInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic' 