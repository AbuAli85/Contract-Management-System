"use client"

import { useState } from "react"
import { useAuth } from "@/src/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, CheckCircle, AlertTriangle } from "lucide-react"

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const setupAdmin = async () => {
    if (!user?.email) {
      setError("No user email found")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('Setting up admin for user:', user.email)
      
      const response = await fetch('/api/setup-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      })

      console.log('Setup admin response status:', response.status)
      
      const data = await response.json()
      console.log('Setup admin response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup admin')
      }

      setSuccess(true)
    } catch (err: any) {
      console.error('Setup admin error:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const setupAdminBypass = async () => {
    if (!user?.email) {
      setError("No user email found")
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log('BYPASS: Setting up admin for user:', user.email)
      
      const response = await fetch('/api/setup-admin-bypass', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: user.email }),
      })

      console.log('Bypass setup admin response status:', response.status)
      
      const data = await response.json()
      console.log('Bypass setup admin response data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup admin')
      }

      setSuccess(true)
    } catch (err: any) {
      console.error('Bypass setup admin error:', err)
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="w-full max-w-md">
          <Card className="shadow-xl border-0">
            <CardHeader className="space-y-1">
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-center">Admin Setup Complete!</CardTitle>
              <CardDescription className="text-center">
                Your account has been upgraded to admin privileges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  You now have access to all dashboard features including analytics, reports, user management, and system administration.
                </AlertDescription>
              </Alert>
              
              <Button
                className="w-full"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <Shield className="h-12 w-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl text-center">Setup Admin Access</CardTitle>
            <CardDescription className="text-center">
              Upgrade your account to admin privileges for full system access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Current User:</strong> {user?.email}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This will give you access to:
              </p>
              <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
                <li>Analytics & Reports</li>
                <li>User Management</li>
                <li>System Administration</li>
                <li>Audit Logs</li>
                <li>All dashboard features</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button
                onClick={setupAdmin}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up admin...
                  </>
                ) : (
                  "Setup Admin Access"
                )}
              </Button>
              
              <Button
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/setup-admin-simple', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ email: user?.email || '' }),
                    })
                    
                    const data = await response.json()
                    console.log('Simple setup admin response:', data)
                    
                    if (data.success) {
                      alert('Admin setup completed successfully!')
                      window.location.reload()
                    } else {
                      alert(`Setup failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Simple setup admin error:', error)
                    alert('Setup failed - check console for details')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                variant="outline"
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up admin...
                  </>
                ) : (
                  "Setup Admin (SIMPLE)"
                )}
              </Button>
              
              <Button
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/setup-admin-service', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ email: user?.email || '' }),
                    })
                    
                    const data = await response.json()
                    console.log('Service role setup admin response:', data)
                    
                    if (data.success) {
                      alert('Admin setup completed successfully (Service Role)!')
                      window.location.reload()
                    } else {
                      alert(`Setup failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Service role setup admin error:', error)
                    alert('Setup failed - check console for details')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                variant="outline"
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up admin...
                  </>
                ) : (
                  "Setup Admin (SERVICE ROLE)"
                )}
              </Button>
              
              <Button
                onClick={setupAdminBypass}
                disabled={loading}
                variant="outline"
                className="w-full border-green-300 text-green-700 hover:bg-green-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Setting up admin...
                  </>
                ) : (
                  "Setup Admin (BYPASS)"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test-db')
                    const data = await response.json()
                    console.log('Database test result:', data)
                    alert('Check console for database test results')
                  } catch (error) {
                    console.error('Database test error:', error)
                    alert('Database test failed - check console')
                  }
                }}
                className="w-full"
              >
                Test Database Connection
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug-tables')
                    const data = await response.json()
                    console.log('Debug tables result:', data)
                    alert('Check console for table debug results')
                  } catch (error) {
                    console.error('Debug tables error:', error)
                    alert('Debug tables failed - check console')
                  }
                }}
                className="w-full"
              >
                Debug Tables
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test-simple')
                    const data = await response.json()
                    console.log('Simple test result:', data)
                    alert('Check console for simple test results')
                  } catch (error) {
                    console.error('Simple test error:', error)
                    alert('Simple test failed - check console')
                  }
                }}
                className="w-full"
              >
                Simple Test
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/test-supabase')
                    const data = await response.json()
                    console.log('Supabase test result:', data)
                    alert('Check console for Supabase test results')
                  } catch (error) {
                    console.error('Supabase test error:', error)
                    alert('Supabase test failed - check console')
                  }
                }}
                className="w-full"
              >
                Test Supabase Connection
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/debug-setup-admin')
                    const data = await response.json()
                    console.log('=== COMPREHENSIVE DEBUG RESULTS ===')
                    console.log('Debug result:', data)
                    console.log('Summary:', data.summary)
                    console.log('Environment:', data.debugInfo?.environment)
                    console.log('Supabase:', data.debugInfo?.supabase)
                    console.log('Database:', data.debugInfo?.database)
                    console.log('Errors:', data.debugInfo?.errors)
                    console.log('=== END DEBUG RESULTS ===')
                    alert('Comprehensive debug completed - check console for detailed results')
                  } catch (error) {
                    console.error('Debug error:', error)
                    alert('Debug failed - check console')
                  }
                }}
                className="w-full border-red-300 text-red-700 hover:bg-red-100"
              >
                🔍 Comprehensive Debug
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    const response = await fetch('/api/check-user-role')
                    const data = await response.json()
                    console.log('=== USER ROLE CHECK RESULTS ===')
                    console.log('Role check result:', data)
                    console.log('Current role:', data.roleInfo?.finalRole)
                    console.log('Sources:', data.roleInfo?.sources)
                    console.log('Summary:', data.summary)
                    console.log('=== END ROLE CHECK RESULTS ===')
                    alert(`Current role: ${data.roleInfo?.finalRole || 'Unknown'}\nCheck console for details`)
                  } catch (error) {
                    console.error('Role check error:', error)
                    alert('Role check failed - check console')
                  }
                }}
                className="w-full border-yellow-300 text-yellow-700 hover:bg-yellow-100"
              >
                👤 Check Current Role
              </Button>
              
              <Button
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/force-admin-role', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Force admin role response:', data)
                    
                    if (data.success) {
                      alert('Admin role forced successfully! Please refresh the page.')
                      window.location.reload()
                    } else {
                      alert(`Force admin failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Force admin error:', error)
                    alert('Force admin failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-green-300 text-green-700 hover:bg-green-100 bg-green-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Forcing admin role...
                  </>
                ) : (
                  "🔧 FORCE ADMIN ROLE"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/refresh-user-role', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Refresh role response:', data)
                    
                    if (data.success) {
                      alert(`Role refreshed: ${data.role.value} (from ${data.role.source})\n\nPlease refresh the page to see changes.`)
                      // Force a page refresh to update the UI
                      window.location.reload()
                    } else {
                      alert(`Refresh failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Refresh error:', error)
                    alert('Refresh failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing role...
                  </>
                ) : (
                  "🔄 REFRESH ROLE"
                )}
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500 dark:text-gray-400">
              ⚠️ This is for testing purposes only. Remove this page in production.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 