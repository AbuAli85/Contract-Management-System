'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestAuthPage() {
  const { user, role, loading } = useAuth()
  const [authStatus, setAuthStatus] = useState<string>('Checking...')
  const [supabaseStatus, setSupabaseStatus] = useState<string>('Checking...')

  useEffect(() => {
    // Test Supabase connection
    const testSupabase = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.from('profiles').select('count').limit(1)
        
        if (error) {
          setSupabaseStatus(`Error: ${error.message}`)
        } else {
          setSupabaseStatus('Connected successfully')
        }
      } catch (err) {
        setSupabaseStatus(`Exception: ${err instanceof Error ? err.message : 'Unknown error'}`)
      }
    }

    testSupabase()
  }, [])

  useEffect(() => {
    if (loading) {
      setAuthStatus('Loading...')
    } else if (user) {
      setAuthStatus(`Authenticated as ${user.email} (Role: ${role || 'none'})`)
    } else {
      setAuthStatus('Not authenticated')
    }
  }, [user, role, loading])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">🔧 Authentication Debug Page</h1>
          <p className="text-gray-600">This page helps debug authentication issues</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Auth Status */}
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
              <CardDescription>Current auth state and user info</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={loading ? "secondary" : user ? "default" : "destructive"}>
                  {authStatus}
                </Badge>
              </div>
              
              {user && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Email:</span>
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">User ID:</span>
                    <span className="text-sm font-mono">{user.id}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Role:</span>
                    <Badge variant="outline">{role || 'none'}</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supabase Status */}
          <Card>
            <CardHeader>
              <CardTitle>Supabase Connection</CardTitle>
              <CardDescription>Database connection status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <Badge variant={supabaseStatus.includes('Error') ? "destructive" : "default"}>
                  {supabaseStatus}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Test authentication flows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button asChild>
                <a href="/en/login">Go to Login</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/en/demo">View Demo (No Auth)</a>
              </Button>
            </div>
            
            {user && (
              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Authenticated User Actions:</h3>
                <div className="grid grid-cols-2 gap-4">
                  <Button asChild variant="outline">
                    <a href="/en/dashboard">Go to Dashboard</a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href="/en/crm">Go to CRM</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Info */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Information</CardTitle>
            <CardDescription>System configuration details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>NEXT_PUBLIC_SUPABASE_URL:</span>
                <span className="font-mono">
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
                <span className="font-mono">
                  {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Node Environment:</span>
                <span className="font-mono">{process.env.NODE_ENV}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 