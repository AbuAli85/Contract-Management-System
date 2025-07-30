"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { RefreshCw, AlertTriangle, CheckCircle, XCircle, Info } from "lucide-react"

export default function DebugAuthPage() {
  const { user, loading, mounted, session, profile, roles } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshDebugInfo = async () => {
    setIsRefreshing(true)
    try {
      const [sessionResponse, checkSessionResponse, connectionResponse, configResponse] =
        await Promise.all([
          fetch("/api/debug/session").catch(() => ({ json: () => ({ error: "Failed to fetch" }) })),
          fetch("/api/auth/check-session").catch(() => ({
            json: () => ({ error: "Failed to fetch" }),
          })),
          fetch("/api/test-connection").catch(() => ({
            json: () => ({ error: "Failed to fetch" }),
          })),
          fetch("/api/test-config").catch(() => ({ json: () => ({ error: "Failed to fetch" }) })),
        ])

      const sessionData = await sessionResponse.json()
      const checkSessionData = await checkSessionResponse.json()
      const connectionData = await connectionResponse.json()
      const configData = await configResponse.json()

      const newDebugInfo = {
        timestamp: new Date().toISOString(),
        clientState: {
          user: user ? { id: user.id, email: user.email } : null,
          loading,
          mounted,
          session: !!session,
          profile: profile ? { id: profile.id, role: profile.role } : null,
          roles,
        },
        serverState: {
          session: sessionData,
          checkSession: checkSessionData,
          connection: connectionData,
          config: configData,
        },
        browserState: {
          cookies: typeof document !== "undefined" ? document.cookie : "N/A",
          localStorage:
            typeof window !== "undefined"
              ? Object.keys(localStorage).filter((key) => key.includes("auth"))
              : [],
          sessionStorage:
            typeof window !== "undefined"
              ? Object.keys(sessionStorage).filter((key) => key.includes("auth"))
              : [],
        },
      }

      setDebugInfo(newDebugInfo)
      console.log("🔧 Debug info refreshed:", newDebugInfo)
    } catch (error) {
      console.error("🔧 Debug refresh failed:", error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    refreshDebugInfo()
  }, [user, loading, mounted, session])

  const getStatusIcon = (condition: boolean) => {
    return condition ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getStatusBadge = (condition: boolean, text: string) => {
    return (
      <Badge variant={condition ? "default" : "destructive"}>
        {getStatusIcon(condition)} {text}
      </Badge>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Authentication Debug</h1>
          <p className="text-gray-600">Diagnose authentication issues and system state</p>
        </div>
        <Button onClick={refreshDebugInfo} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Client State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Client State
          </CardTitle>
          <CardDescription>Current authentication state in the browser</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">User</p>
              <p className="text-sm text-gray-600">{user ? user.email : "Not authenticated"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Loading</p>
              <p className="text-sm text-gray-600">{loading ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Mounted</p>
              <p className="text-sm text-gray-600">{mounted ? "Yes" : "No"}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Session</p>
              <p className="text-sm text-gray-600">{session ? "Active" : "None"}</p>
            </div>
          </div>

          {profile && (
            <div>
              <p className="text-sm font-medium">Profile</p>
              <div className="space-y-1 text-sm text-gray-600">
                <p>Role: {profile.role}</p>
                <p>Full Name: {profile.full_name || "Not set"}</p>
              </div>
            </div>
          )}

          {roles.length > 0 && (
            <div>
              <p className="text-sm font-medium">Roles</p>
              <div className="flex gap-2">
                {roles.map((role, index) => (
                  <Badge key={index} variant="secondary">
                    {role}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Server State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Server State
          </CardTitle>
          <CardDescription>Authentication state on the server side</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {debugInfo.serverState && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Session API</p>
                  {getStatusBadge(
                    debugInfo.serverState.session?.success,
                    debugInfo.serverState.session?.success ? "Working" : "Failed",
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Check Session API</p>
                  {getStatusBadge(
                    debugInfo.serverState.checkSession?.success,
                    debugInfo.serverState.checkSession?.success ? "Working" : "Failed",
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Connection Test</p>
                  {getStatusBadge(
                    debugInfo.serverState.connection?.success,
                    debugInfo.serverState.connection?.success ? "Connected" : "Failed",
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium">Config Test</p>
                  {getStatusBadge(
                    debugInfo.serverState.config?.success,
                    debugInfo.serverState.config?.success ? "Valid" : "Invalid",
                  )}
                </div>
              </div>

              {debugInfo.serverState.session?.debug && (
                <div>
                  <p className="text-sm font-medium">Session Details</p>
                  <pre className="mt-2 overflow-x-auto rounded bg-gray-100 p-2 text-xs">
                    {JSON.stringify(debugInfo.serverState.session.debug, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Browser State */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Browser State
          </CardTitle>
          <CardDescription>Local storage and cookies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {debugInfo.browserState && (
            <>
              <div>
                <p className="text-sm font-medium">Auth Cookies</p>
                <p className="mt-1 text-xs text-gray-600">
                  {debugInfo.browserState.cookies || "No cookies found"}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">localStorage Auth Keys</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {debugInfo.browserState.localStorage.length > 0 ? (
                    debugInfo.browserState.localStorage.map((key: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {key}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">No auth keys found</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">sessionStorage Auth Keys</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {debugInfo.browserState.sessionStorage.length > 0 ? (
                    debugInfo.browserState.sessionStorage.map((key: string, index: number) => (
                      <Badge key={index} variant="outline">
                        {key}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-gray-500">No auth keys found</span>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Common Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Common Issues & Solutions
          </CardTitle>
          <CardDescription>Known authentication problems and their fixes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Issue:</strong> Auth cookies present but session not established
                <br />
                <strong>Solution:</strong> Check Supabase configuration and environment variables
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Issue:</strong> Session exists but user profile not found
                <br />
                <strong>Solution:</strong> Ensure database tables are created and RLS policies are
                applied
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Issue:</strong> Middleware redirects not working
                <br />
                <strong>Solution:</strong> Check middleware configuration and locale handling
              </AlertDescription>
            </Alert>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Issue:</strong> Environment variables missing
                <br />
                <strong>Solution:</strong> Ensure .env file is properly configured with Supabase
                credentials
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Actions</CardTitle>
          <CardDescription>Actions to help diagnose and fix issues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await fetch("/api/force-logout")
                  window.location.reload()
                } catch (error) {
                  console.error("Force logout failed:", error)
                }
              }}
            >
              Force Logout
            </Button>

            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const response = await fetch("/api/clear-cookies")
                  const data = await response.json()
                  console.log("Clear cookies result:", data)
                  window.location.reload()
                } catch (error) {
                  console.error("Clear cookies failed:", error)
                }
              }}
            >
              Clear Cookies
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.clear()
                  sessionStorage.clear()
                  window.location.reload()
                }
              }}
            >
              Clear Storage
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                console.log("🔧 Current debug info:", debugInfo)
              }}
            >
              Log Debug Info
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic"
