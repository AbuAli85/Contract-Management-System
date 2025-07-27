'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function TestDashboardPage() {
  const { user, loading: authLoading, profile, mounted } = useAuth()
  const [testResults, setTestResults] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const runTests = async () => {
      const results: any = {}
      
      try {
        // Test 1: Environment variables
        const envResponse = await fetch('/api/debug/env')
        results.env = {
          status: envResponse.status,
          ok: envResponse.ok,
          data: await envResponse.json()
        }
      } catch (error) {
        results.env = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
      
      try {
        // Test 2: Auth status
        const authResponse = await fetch('/api/auth/status')
        results.auth = {
          status: authResponse.status,
          ok: authResponse.ok,
          data: await authResponse.json()
        }
      } catch (error) {
        results.auth = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
      
      try {
        // Test 3: Supabase connection
        const supabaseResponse = await fetch('/api/debug/supabase')
        results.supabase = {
          status: supabaseResponse.status,
          ok: supabaseResponse.ok,
          data: await supabaseResponse.json()
        }
      } catch (error) {
        results.supabase = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
      
      setTestResults(results)
      setLoading(false)
    }

    runTests()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Running tests...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Test Page</h1>
        <Button onClick={() => window.location.reload()}>Refresh Tests</Button>
      </div>

      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔐 Client-Side Auth Status
            <Badge variant={authLoading ? "secondary" : "default"}>
              {authLoading ? "Loading" : "Ready"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Mounted:</strong> {mounted ? "✅ Yes" : "❌ No"}</p>
            <p><strong>Loading:</strong> {authLoading ? "⏳ Yes" : "✅ No"}</p>
            <p><strong>User:</strong> {user ? `✅ ${user.email}` : "❌ None"}</p>
            <p><strong>Profile:</strong> {profile ? "✅ Loaded" : "❌ None"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>🌍 Environment Variables Test</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.env ? (
            <div className="space-y-2">
              <p><strong>Status:</strong> {testResults.env.status} {testResults.env.ok ? "✅" : "❌"}</p>
              {testResults.env.data?.env && (
                <>
                  <p><strong>Supabase URL:</strong> {testResults.env.data.env.hasSupabaseUrl ? "✅ Set" : "❌ Missing"}</p>
                  <p><strong>Supabase Anon Key:</strong> {testResults.env.data.env.hasSupabaseAnonKey ? "✅ Set" : "❌ Missing"}</p>
                  <p><strong>Service Role Key:</strong> {testResults.env.data.env.hasServiceRoleKey ? "✅ Set" : "❌ Missing"}</p>
                </>
              )}
              {testResults.env.error && (
                <p className="text-red-500"><strong>Error:</strong> {testResults.env.error}</p>
              )}
            </div>
          ) : (
            <p className="text-red-500">No environment test results</p>
          )}
        </CardContent>
      </Card>

      {/* Auth API */}
      <Card>
        <CardHeader>
          <CardTitle>🔑 Auth API Test</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.auth ? (
            <div className="space-y-2">
              <p><strong>Status:</strong> {testResults.auth.status} {testResults.auth.ok ? "✅" : "❌"}</p>
              {testResults.auth.data?.auth && (
                <>
                  <p><strong>Has Session:</strong> {testResults.auth.data.auth.hasSession ? "✅ Yes" : "❌ No"}</p>
                  <p><strong>Has User:</strong> {testResults.auth.data.auth.hasUser ? "✅ Yes" : "❌ No"}</p>
                  <p><strong>User Email:</strong> {testResults.auth.data.auth.userEmail || "None"}</p>
                </>
              )}
              {testResults.auth.error && (
                <p className="text-red-500"><strong>Error:</strong> {testResults.auth.error}</p>
              )}
            </div>
          ) : (
            <p className="text-red-500">No auth test results</p>
          )}
        </CardContent>
      </Card>

      {/* Supabase Connection */}
      <Card>
        <CardHeader>
          <CardTitle>🗄️ Supabase Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          {testResults.supabase ? (
            <div className="space-y-2">
              <p><strong>Status:</strong> {testResults.supabase.status} {testResults.supabase.ok ? "✅" : "❌"}</p>
              {testResults.supabase.data?.supabase && (
                <>
                  <p><strong>Can Connect:</strong> {testResults.supabase.data.supabase.canConnect ? "✅ Yes" : "❌ No"}</p>
                  <p><strong>Has Data:</strong> {testResults.supabase.data.supabase.hasData ? "✅ Yes" : "❌ No"}</p>
                </>
              )}
              {testResults.supabase.error && (
                <p className="text-red-500"><strong>Error:</strong> {testResults.supabase.error}</p>
              )}
            </div>
          ) : (
            <p className="text-red-500">No Supabase test results</p>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={() => window.location.href = '/en/dashboard'}>
                Try Dashboard
              </Button>
              <Button onClick={() => window.location.href = '/en/auth/login'}>
                Go to Login
              </Button>
              <Button onClick={() => window.location.href = '/en/dashboard/debug'}>
                Debug Dashboard
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.clear()
                  sessionStorage.clear()
                  window.location.reload()
                }}
              >
                Clear Storage
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  localStorage.removeItem('sb-auth-token')
                  window.location.reload()
                }}
              >
                Clear Auth Token
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diagnosis */}
      <Card>
        <CardHeader>
          <CardTitle>🔍 Diagnosis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {!testResults.env?.ok && (
              <p className="text-red-500">❌ Environment variables are not configured properly</p>
            )}
            {!testResults.auth?.ok && (
              <p className="text-red-500">❌ Authentication API is not working</p>
            )}
            {!testResults.supabase?.ok && (
              <p className="text-red-500">❌ Supabase connection is failing</p>
            )}
            {authLoading && (
              <p className="text-yellow-500">⚠️ Authentication is still loading</p>
            )}
            {!user && !authLoading && (
              <p className="text-blue-500">ℹ️ You are not authenticated - this is normal if you haven't logged in</p>
            )}
            {testResults.env?.ok && testResults.auth?.ok && testResults.supabase?.ok && user && (
              <p className="text-green-500">✅ All systems are working correctly!</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic' 