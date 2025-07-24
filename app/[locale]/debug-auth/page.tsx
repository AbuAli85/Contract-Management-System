'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  User,
  Shield,
  Home
} from 'lucide-react'

export default function DebugAuthPage() {
  const { user, role, loading } = useAuth()
  const [dbStatus, setDbStatus] = useState<any>(null)
  const [profilesStatus, setProfilesStatus] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  const testDatabase = async () => {
    setTesting(true)
    try {
      const supabase = createClient()
      
      // Test basic connection
      const { data, error } = await supabase
        .from('contracts')
        .select('count')
        .limit(1)
      
      setDbStatus({ success: !error, data, error })
      
      // Test profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
      
      setProfilesStatus({ success: !profilesError, data: profilesData, error: profilesError })
      
    } catch (error) {
      setDbStatus({ success: false, error })
    } finally {
      setTesting(false)
    }
  }

  useEffect(() => {
    testDatabase()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">🔧 Authentication Debug</h1>
          <p className="text-gray-600">Debug authentication and database connection issues</p>
          <Button asChild variant="outline">
            <a href="/en/">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </a>
          </Button>
        </div>

        {/* Authentication Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Authentication Status
            </CardTitle>
            <CardDescription>
              Current authentication state and user information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className="font-medium">Loading State</span>
                </div>
                <p className="text-sm text-gray-600">
                  {loading ? 'Loading...' : 'Complete'}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {user ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">User Status</span>
                </div>
                <p className="text-sm text-gray-600">
                  {user ? 'Authenticated' : 'Not authenticated'}
                </p>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {role ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  )}
                  <span className="font-medium">User Role</span>
                </div>
                <p className="text-sm text-gray-600">
                  {role || 'Not loaded'}
                </p>
              </div>
            </div>
            
            {user && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">User Details:</h3>
                <pre className="text-sm text-gray-600 overflow-auto">
                  {JSON.stringify({
                    id: user.id,
                    email: user.email,
                    role: role,
                    created_at: user.created_at
                  }, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Connection
            </CardTitle>
            <CardDescription>
              Test database connectivity and table access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Button 
                onClick={testDatabase} 
                disabled={testing}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${testing ? 'animate-spin' : ''}`} />
                Test Database
              </Button>
              <Badge variant={dbStatus?.success ? 'default' : 'destructive'}>
                {dbStatus?.success ? 'Connected' : 'Error'}
              </Badge>
            </div>
            
            {dbStatus && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Database Test Result:</h3>
                <pre className="text-sm text-gray-600 overflow-auto">
                  {JSON.stringify(dbStatus, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profiles Table Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profiles Table
            </CardTitle>
            <CardDescription>
              Check if the profiles table exists and is accessible
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant={profilesStatus?.success ? 'default' : 'destructive'}>
                {profilesStatus?.success ? 'Available' : 'Missing/Error'}
              </Badge>
            </div>
            
            {profilesStatus && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Profiles Table Test Result:</h3>
                <pre className="text-sm text-gray-600 overflow-auto">
                  {JSON.stringify(profilesStatus, null, 2)}
                </pre>
              </div>
            )}
            
            {profilesStatus?.error && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h3 className="font-medium text-yellow-800 mb-2">⚠️ Profiles Table Issue</h3>
                <p className="text-sm text-yellow-700 mb-3">
                  The profiles table is missing or not accessible. This is likely causing the authentication loading issue.
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-yellow-700">
                    <strong>Solution:</strong> Run the SQL script to create the profiles table:
                  </p>
                  <code className="block text-xs bg-yellow-100 p-2 rounded">
                    scripts/010_create_profiles_table.sql
                  </code>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Test different parts of the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Button asChild variant="outline">
                <a href="/en/instant">
                  🚀 Instant Beautiful UI
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/en/dashboard">
                  📊 Dashboard (with auth)
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/en/bypass">
                  ⚡ Bypass Mode
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href="/api/test-profiles-table">
                  🔍 Test Profiles API
                </a>
              </Button>
              <Button 
                variant="default" 
                className="bg-green-600 hover:bg-green-700"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/create-profiles-table', { method: 'POST' });
                    const result = await response.json();
                    if (result.success) {
                      alert('Profiles table created successfully! Please refresh the page.');
                      window.location.reload();
                    } else {
                      alert('Error creating profiles table: ' + result.error);
                    }
                  } catch (error) {
                    alert('Error: ' + error);
                  }
                }}
              >
                🛠️ Create Profiles Table
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 