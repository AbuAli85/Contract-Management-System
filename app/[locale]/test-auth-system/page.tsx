"use client"

import { useAuth } from "@/lib/auth-service"
import { usePermissions } from "@/hooks/use-permissions"
import { useRBAC } from "@/src/components/auth/rbac-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  User,
  Shield,
  Settings,
} from "lucide-react"
import { useState } from "react"

export default function TestAuthSystemPage() {
  const {
    user,
    profile,
    roles,
    loading,
    mounted,
    session,
    signIn,
    signOut,
    refreshSession,
    forceRefreshRole,
  } = useAuth()

  const { userRoles, hasRole, isLoading: rbacLoading, refreshRoles } = useRBAC()

  const {
    role,
    roles: permissionRoles,
    isLoading: permissionsLoading,
    forceRefresh,
  } = usePermissions()

  // Get auth provider roles for comparison
  const { roles: authRoles } = useAuth()

  const [testResults, setTestResults] = useState<{
    authProvider: boolean
    rbacProvider: boolean
    permissionsHook: boolean
    sessionValid: boolean
    profileLoaded: boolean
    rolesLoaded: boolean
  } | null>(null)

  const [isRunningTests, setIsRunningTests] = useState(false)

  const runAuthTests = async () => {
    setIsRunningTests(true)

    const results = {
      authProvider: false,
      rbacProvider: false,
      permissionsHook: false,
      sessionValid: false,
      profileLoaded: false,
      rolesLoaded: false,
    }

    // Test 1: Auth Provider
    try {
      results.authProvider = !loading && mounted && user !== null
    } catch (error) {
      console.error("Auth Provider test failed:", error)
    }

    // Test 2: RBAC Provider
    try {
      results.rbacProvider = !rbacLoading && userRoles.length > 0
    } catch (error) {
      console.error("RBAC Provider test failed:", error)
    }

    // Test 3: Permissions Hook
    try {
      results.permissionsHook = !permissionsLoading && role !== undefined
    } catch (error) {
      console.error("Permissions Hook test failed:", error)
    }

    // Test 4: Session Valid
    try {
      results.sessionValid = session !== null && session.user !== null
    } catch (error) {
      console.error("Session test failed:", error)
    }

    // Test 5: Profile Loaded
    try {
      results.profileLoaded = profile !== null && profile.id !== undefined
    } catch (error) {
      console.error("Profile test failed:", error)
    }

    // Test 6: Roles Loaded
    try {
      results.rolesLoaded = roles && Array.isArray(roles) && roles.length > 0
    } catch (error) {
      console.error("Roles test failed:", error)
    }

    setTestResults(results)
    setIsRunningTests(false)
  }

  const handleRefreshAll = async () => {
    try {
      await Promise.all([refreshSession(), refreshRoles(), forceRefreshRole(), forceRefresh()])
      console.log("✅ All refresh operations completed")
    } catch (error) {
      console.error("❌ Refresh operations failed:", error)
    }
  }

  const getStatusIcon = (status: boolean) => {
    return status ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-500">
        PASS
      </Badge>
    ) : (
      <Badge variant="destructive">FAIL</Badge>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Authentication System Test</h1>
        <p className="text-muted-foreground">
          Comprehensive test of all authentication system components
        </p>
      </div>

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Test Controls
          </CardTitle>
          <CardDescription>Run tests and refresh authentication state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button
              onClick={runAuthTests}
              disabled={isRunningTests}
              className="flex items-center gap-2"
            >
              {isRunningTests ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Run All Tests
            </Button>

            <Button
              onClick={handleRefreshAll}
              variant="outline"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Test Results
            </CardTitle>
            <CardDescription>Results of authentication system tests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(testResults).map(([test, result]) => (
                <div key={test} className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(result)}
                    <span className="font-medium capitalize">
                      {test.replace(/([A-Z])/g, " $1").trim()}
                    </span>
                  </div>
                  {getStatusBadge(result)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Auth Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Auth Provider Status
          </CardTitle>
          <CardDescription>Current state of the authentication provider</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">Loading:</span>
              <Badge variant={loading ? "destructive" : "default"} className="ml-2">
                {loading ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Mounted:</span>
              <Badge variant={mounted ? "default" : "destructive"} className="ml-2">
                {mounted ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">User:</span>
              <Badge variant={user ? "default" : "destructive"} className="ml-2">
                {user ? "Logged In" : "Not Logged In"}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Session:</span>
              <Badge variant={session ? "default" : "destructive"} className="ml-2">
                {session ? "Valid" : "Invalid"}
              </Badge>
            </div>
          </div>

          {user && (
            <div className="space-y-2">
              <h4 className="font-medium">User Details:</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>ID:</strong> {user.id}
                </div>
                <div>
                  <strong>Email:</strong> {user.email}
                </div>
                <div>
                  <strong>Email Verified:</strong> {user.email_confirmed_at ? "Yes" : "No"}
                </div>
              </div>
            </div>
          )}

          {profile && (
            <div className="space-y-2">
              <h4 className="font-medium">Profile Details:</h4>
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Full Name:</strong> {profile.full_name || "Not set"}
                </div>
                <div>
                  <strong>Role:</strong> {profile.role}
                </div>
                <div>
                  <strong>Created At:</strong>{" "}
                  {profile.created_at ? new Date(profile.created_at).toLocaleString() : "Not set"}
                </div>
                <div>
                  <strong>Avatar URL:</strong> {profile.avatar_url ? "Set" : "Not set"}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* RBAC Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            RBAC Provider Status
          </CardTitle>
          <CardDescription>Role-based access control provider state</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">Loading:</span>
              <Badge variant={rbacLoading ? "destructive" : "default"} className="ml-2">
                {rbacLoading ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">User Roles:</span>
              <Badge variant="outline" className="ml-2">
                {userRoles.length} roles
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Role Checks:</h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="flex items-center gap-2">
                <span className="text-sm">Admin:</span>
                {getStatusIcon(hasRole("admin"))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Manager:</span>
                {getStatusIcon(hasRole("manager"))}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">User:</span>
                {getStatusIcon(hasRole("user"))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Current Roles:</h4>
            <div className="flex gap-2">
              {userRoles.map((role, index) => (
                <Badge key={index} variant="secondary">
                  {role}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Hook Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissions Hook Status
          </CardTitle>
          <CardDescription>Permissions system state and capabilities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium">Loading:</span>
              <Badge variant={permissionsLoading ? "destructive" : "default"} className="ml-2">
                {permissionsLoading ? "Yes" : "No"}
              </Badge>
            </div>
            <div>
              <span className="text-sm font-medium">Primary Role:</span>
              <Badge variant="outline" className="ml-2">
                {role}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Permission Checks:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <span>Contract Create:</span>
                {getStatusIcon(permissionRoles.some((r) => r === "admin" || r === "manager"))}
              </div>
              <div className="flex items-center gap-2">
                <span>User Management:</span>
                {getStatusIcon(permissionRoles.some((r) => r === "admin"))}
              </div>
              <div className="flex items-center gap-2">
                <span>Analytics Access:</span>
                {getStatusIcon(permissionRoles.some((r) => r === "admin" || r === "manager"))}
              </div>
              <div className="flex items-center gap-2">
                <span>System Settings:</span>
                {getStatusIcon(permissionRoles.some((r) => r === "admin"))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {!user && mounted && !loading && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No user is currently authenticated. Please log in to test the full authentication
            system.
          </AlertDescription>
        </Alert>
      )}

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
          <CardDescription>Raw data for debugging purposes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-medium">Session Data:</h4>
              <pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Profile Data:</h4>
              <pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>

            <div>
              <h4 className="mb-2 font-medium">Roles Data:</h4>
              <pre className="overflow-auto rounded bg-gray-100 p-2 text-xs">
                {JSON.stringify(
                  {
                    authRoles: authRoles,
                    rbacRoles: userRoles,
                    permissionRoles: permissionRoles,
                    roleSync: {
                      authProvider: authRoles,
                      rbacProvider: userRoles,
                      permissionsHook: permissionRoles,
                                          allSynced:
                      authRoles && Array.isArray(authRoles) && authRoles.length > 0 &&
                      userRoles && Array.isArray(userRoles) && userRoles.length > 0 &&
                      permissionRoles && Array.isArray(permissionRoles) && permissionRoles.length > 0 &&
                      authRoles[0] === userRoles[0] &&
                      userRoles[0] === permissionRoles[0],
                    },
                  },
                  null,
                  2,
                )}
              </pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic"
