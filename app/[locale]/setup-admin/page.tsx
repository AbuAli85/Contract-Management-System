"use client"

import { useState } from "react"
import { useAuth } from "@/src/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Shield, CheckCircle, AlertTriangle } from "lucide-react"
import { AuthRoleStatus } from "@/components/auth-role-status"
import { LoginStatus } from "@/components/login-status"

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
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Admin</h1>
        <p className="text-gray-600">Admin role management and testing tools</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Login Status */}
        <div>
          <LoginStatus />
        </div>

        {/* Role Status */}
        <div>
          <AuthRoleStatus />
        </div>

        {/* Admin Tools */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Role Tools</CardTitle>
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
                      const results = data.results
                      const summary = data.summary
                      const immediate = data.immediate
                      
                      alert(`Admin Role FORCED!\n\nRole: ${immediate.role} (from ${immediate.source})\n\nTables Updated: ${summary.tablesUpdated}\nTables Failed: ${summary.tablesFailed}\n\nUsers Table: ${results.users.success ? '✅ FORCED' : '❌ FAILED'}\nProfiles Table: ${results.profiles.success ? '✅ FORCED' : '❌ FAILED'}\nApp_Users Table: ${results.app_users.success ? '✅ FORCED' : '❌ FAILED'}\n\n${immediate.instructions}`)
                      
                      // Force page refresh after 2 seconds
                      setTimeout(() => {
                        window.location.reload()
                      }, 2000)
                    } else {
                      alert(`Force admin role failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Force admin role error:', error)
                    alert('Force admin role failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-red-300 text-red-700 hover:bg-red-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Forcing admin role...
                  </>
                ) : (
                  "⚡ FORCE ADMIN ROLE"
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
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/force-role-refresh', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Force role refresh response:', data)
                    
                    if (data.success) {
                      alert(`Force role refresh completed!\n\nRole: ${data.role.value} (from ${data.role.source})\n\nPlease refresh the page to see changes.`)
                      // Force a page refresh to update the UI
                      window.location.reload()
                    } else {
                      alert(`Force refresh failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Force refresh error:', error)
                    alert('Force refresh failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Force refreshing role...
                  </>
                ) : (
                  "⚡ FORCE ROLE REFRESH"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/force-ui-refresh', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Force UI refresh response:', data)
                    
                    if (data.success) {
                      alert(`Force UI refresh completed!\n\nRole: ${data.role.value} (from ${data.role.source})\n\nUI refresh required: ${data.uiRefresh.reason}\n\n${data.uiRefresh.instructions}`)
                      // Force a hard page refresh to clear all cached state
                      setTimeout(() => {
                        window.location.reload()
                      }, 1000) // Give user 1 second to see the message
                    } else {
                      alert(`Force UI refresh failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Force UI refresh error:', error)
                    alert('Force UI refresh failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Force refreshing UI...
                  </>
                ) : (
                  "🔄 FORCE UI REFRESH"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/immediate-role-refresh', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Immediate role refresh response:', data)
                    
                    if (data.success) {
                      alert(`Immediate role refresh completed!\n\nRole: ${data.role.value} (from ${data.role.source})\n\nClient update: ${data.clientUpdate.instructions}\n\nPlease check if the UI has updated.`)
                      // Don't reload the page, let the user see if the UI updated
                    } else {
                      alert(`Immediate role refresh failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Immediate role refresh error:', error)
                    alert('Immediate role refresh failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-teal-300 text-teal-700 hover:bg-teal-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Immediate refreshing role...
                  </>
                ) : (
                  "⚡ IMMEDIATE ROLE REFRESH"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    // Test the header refresh mechanism directly
                    const response = await fetch('/api/immediate-role-refresh', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Test role refresh response:', data)
                    
                    if (data.success) {
                      alert(`Test role refresh completed!\n\nRole: ${data.role.value} (from ${data.role.source})\n\nNow try clicking "Refresh Role" in the header dropdown to see if it updates the UI immediately.`)
                    } else {
                      alert(`Test role refresh failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Test role refresh error:', error)
                    alert('Test role refresh failed - check console')
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
                    Testing role refresh...
                  </>
                ) : (
                  "🧪 TEST ROLE REFRESH"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/clear-role-cache', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Clear role cache response:', data)
                    
                    if (data.success) {
                      alert(`Role cache cleared!\n\nRole: ${data.role.value} (from ${data.role.source})\n\n${data.cacheClear.instructions}\n\nPlease refresh the page to see the updated role.`)
                      // Clear localStorage cache
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem(`user_role_${data.user.id}`)
                        console.log('🗑️ Cleared localStorage cache')
                      }
                      // Force page refresh after 2 seconds
                      setTimeout(() => {
                        window.location.reload()
                      }, 2000)
                    } else {
                      alert(`Clear role cache failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Clear role cache error:', error)
                    alert('Clear role cache failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-red-300 text-red-700 hover:bg-red-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Clearing role cache...
                  </>
                ) : (
                  "🗑️ CLEAR ROLE CACHE"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/get-user-role', {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Get user role response:', data)
                    
                    if (data.success) {
                      alert(`Current role from API: ${data.role.value} (from ${data.role.source})\n\nThis role will be cached and the page will reload to apply it.\n\nPlease wait for the page to refresh...`)
                      
                      // Cache the role in localStorage
                      if (typeof window !== 'undefined') {
                        localStorage.setItem(`user_role_${data.user.id}`, data.role.value)
                        console.log('📦 Role cached in localStorage:', data.role.value)
                      }
                      
                      // Force page refresh after 2 seconds
                      setTimeout(() => {
                        window.location.reload()
                      }, 2000)
                    } else {
                      alert(`Get user role failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Get user role error:', error)
                    alert('Get user role failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-green-300 text-green-700 hover:bg-green-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading role from API...
                  </>
                ) : (
                  "📥 LOAD ROLE FROM API"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/test-role-system', {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Test role system response:', data)
                    
                    if (data.success) {
                      const testResults = data.tests
                      const summary = data.summary
                      
                      alert(`Role System Test Results:\n\nFinal Role: ${summary.finalRole} (from ${summary.roleSource})\n\nTests Passed: ${summary.testsPassed}\nTests Failed: ${summary.testsFailed}\n\nUsers Table: ${testResults.users.found ? '✅ PASS' : '❌ FAIL'}\nProfiles Table: ${testResults.profiles.found ? '✅ PASS' : '❌ FAIL'}\nApp_Users Table: ${testResults.app_users.found ? '✅ PASS' : '❌ FAIL'}\n\nCheck console for detailed results.`)
                    } else {
                      alert(`Test role system failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Test role system error:', error)
                    alert('Test role system failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-purple-300 text-purple-700 hover:bg-purple-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing role system...
                  </>
                ) : (
                  "🔍 TEST ROLE SYSTEM"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/ensure-admin-role', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Ensure admin role response:', data)
                    
                    if (data.success) {
                      const results = data.results
                      const summary = data.summary
                      
                      alert(`Admin Role Permanently Ensured!\n\nFinal Role: ${summary.finalRole} (from ${summary.roleSource})\n\nTables Updated: ${summary.tablesUpdated}\nTables Failed: ${summary.tablesFailed}\n\nUsers Table: ${results.users.success ? '✅ SUCCESS' : '❌ FAILED'}\nProfiles Table: ${results.profiles.success ? '✅ SUCCESS' : '❌ FAILED'}\nApp_Users Table: ${results.app_users.success ? '✅ SUCCESS' : '❌ FAILED'}\n\nThe admin role is now permanently set in the database and will persist across all page refreshes.`)
                      
                      // Force page refresh after 3 seconds to apply the permanent role
                      setTimeout(() => {
                        window.location.reload()
                      }, 3000)
                    } else {
                      alert(`Ensure admin role failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Ensure admin role error:', error)
                    alert('Ensure admin role failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ensuring permanent admin role...
                  </>
                ) : (
                  "🔒 ENSURE PERMANENT ADMIN ROLE"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/refresh-auth-role', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Refresh auth role response:', data)
                    
                    if (data.success) {
                      alert(`Auth Role Refreshed!\n\nRole: ${data.role.value} (from ${data.role.source})\n\n${data.authRefresh.instructions}\n\nPlease refresh the page to see the updated role.`)
                      
                      // Force page refresh after 2 seconds
                      setTimeout(() => {
                        window.location.reload()
                      }, 2000)
                    } else {
                      alert(`Refresh auth role failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Refresh auth role error:', error)
                    alert('Refresh auth role failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-indigo-300 text-indigo-700 hover:bg-indigo-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Refreshing auth role...
                  </>
                ) : (
                  "🔄 REFRESH AUTH ROLE"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/diagnose-role-issue', {
                      method: 'GET',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Role diagnostic response:', data)
                    
                    if (data.success) {
                      const diagnostic = data.diagnostic
                      const summary = data.summary
                      
                      let diagnosticMessage = `ROLE DIAGNOSTIC RESULTS:\n\n`
                      diagnosticMessage += `User: ${diagnostic.userEmail}\n`
                      diagnosticMessage += `User ID: ${diagnostic.userId}\n\n`
                      
                      diagnosticMessage += `DATABASE CHECKS:\n`
                      diagnosticMessage += `Users Table: ${diagnostic.databaseChecks.users.exists ? '✅ EXISTS' : '❌ NOT FOUND'}\n`
                      if (diagnostic.databaseChecks.users.exists) {
                        diagnosticMessage += `  - Has Role: ${diagnostic.databaseChecks.users.hasRole ? '✅ YES' : '❌ NO'}\n`
                        diagnosticMessage += `  - Role: ${diagnostic.databaseChecks.users.role || 'NULL'}\n`
                      }
                      if (diagnostic.databaseChecks.users.error) {
                        diagnosticMessage += `  - Error: ${diagnostic.databaseChecks.users.error}\n`
                      }
                      
                      diagnosticMessage += `Profiles Table: ${diagnostic.databaseChecks.profiles.exists ? '✅ EXISTS' : '❌ NOT FOUND'}\n`
                      if (diagnostic.databaseChecks.profiles.exists) {
                        diagnosticMessage += `  - Has Role: ${diagnostic.databaseChecks.profiles.hasRole ? '✅ YES' : '❌ NO'}\n`
                        diagnosticMessage += `  - Role: ${diagnostic.databaseChecks.profiles.role || 'NULL'}\n`
                      }
                      if (diagnostic.databaseChecks.profiles.error) {
                        diagnosticMessage += `  - Error: ${diagnostic.databaseChecks.profiles.error}\n`
                      }
                      
                      diagnosticMessage += `App_Users Table: ${diagnostic.databaseChecks.app_users.exists ? '✅ EXISTS' : '❌ NOT FOUND'}\n`
                      if (diagnostic.databaseChecks.app_users.exists) {
                        diagnosticMessage += `  - Has Role: ${diagnostic.databaseChecks.app_users.hasRole ? '✅ YES' : '❌ NO'}\n`
                        diagnosticMessage += `  - Role: ${diagnostic.databaseChecks.app_users.role || 'NULL'}\n`
                      }
                      if (diagnostic.databaseChecks.app_users.error) {
                        diagnosticMessage += `  - Error: ${diagnostic.databaseChecks.app_users.error}\n`
                      }
                      
                      diagnosticMessage += `\nSUMMARY:\n`
                      diagnosticMessage += `Has Any Role: ${summary.hasRole ? '✅ YES' : '❌ NO'}\n`
                      diagnosticMessage += `Has Admin Role: ${summary.hasAdminRole ? '✅ YES' : '❌ NO'}\n`
                      diagnosticMessage += `User Exists: ${summary.userExists ? '✅ YES' : '❌ NO'}\n`
                      
                      diagnosticMessage += `\nRECOMMENDATIONS:\n`
                      summary.recommendations.forEach((rec: string, index: number) => {
                        diagnosticMessage += `${index + 1}. ${rec}\n`
                      })
                      
                      alert(diagnosticMessage)
                    } else {
                      alert(`Role diagnostic failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Role diagnostic error:', error)
                    alert('Role diagnostic failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-red-300 text-red-700 hover:bg-red-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Diagnosing role issue...
                  </>
                ) : (
                  "🔍 DIAGNOSE ROLE ISSUE"
                )}
              </Button>
              
              <Button
                variant="outline"
                onClick={async () => {
                  setLoading(true)
                  try {
                    const response = await fetch('/api/create-user-record', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                    })
                    
                    const data = await response.json()
                    console.log('Create user record response:', data)
                    
                    if (data.success) {
                      const results = data.results
                      const summary = data.summary
                      
                      alert(`User Records Created!\n\nTables Created: ${summary.tablesCreated}\nTables Failed: ${summary.tablesFailed}\n\nUsers Table: ${results.users.created ? '✅ CREATED' : '❌ FAILED'}\nProfiles Table: ${results.profiles.created ? '✅ CREATED' : '❌ FAILED'}\nApp_Users Table: ${results.app_users.created ? '✅ CREATED' : '❌ FAILED'}\n\nUser records with admin role have been created in the database.`)
                      
                      // Force page refresh after 3 seconds
                      setTimeout(() => {
                        window.location.reload()
                      }, 3000)
                    } else {
                      alert(`Create user record failed: ${data.error}`)
                    }
                  } catch (error) {
                    console.error('Create user record error:', error)
                    alert('Create user record failed - check console')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating user records...
                  </>
                ) : (
                  "👤 CREATE USER RECORDS"
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