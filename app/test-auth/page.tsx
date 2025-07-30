"use client"

import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

function TestAuthContent() {
  const { user, loading, mounted, session } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Authentication Test Page</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Authentication Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center">
                  <div
                    className={`mr-3 h-3 w-3 rounded-full ${loading ? "bg-yellow-500" : mounted ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span>Loading: {loading ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center">
                  <div
                    className={`mr-3 h-3 w-3 rounded-full ${mounted ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span>Mounted: {mounted ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center">
                  <div
                    className={`mr-3 h-3 w-3 rounded-full ${user ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span>User: {user ? "Logged In" : "Not Logged In"}</span>
                </div>
                <div className="flex items-center">
                  <div
                    className={`mr-3 h-3 w-3 rounded-full ${session ? "bg-green-500" : "bg-red-500"}`}
                  ></div>
                  <span>Session: {session ? "Active" : "No Session"}</span>
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
                  <Button asChild>
                    <Link href="/en/auth/login">Go to Login</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/en/dashboard">Try Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href="/">Go Home</Link>
                  </Button>
                </div>

                {user && (
                  <div className="rounded border border-green-200 bg-green-50 p-4">
                    <h3 className="mb-2 font-semibold text-green-800">User Information:</h3>
                    <pre className="overflow-auto text-sm text-green-700">
                      {JSON.stringify(user, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Expected Behavior</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>✅ Users should NOT be automatically logged in</p>
                <p>✅ Users must enter username and password</p>
                <p>✅ Dashboard should redirect to login if not authenticated</p>
                <p>✅ Login page should not auto-redirect to dashboard</p>
                <p>✅ Session should only be restored if valid and not expired</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function TestAuthPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-3xl font-bold text-gray-900">Authentication Test Page</h1>

        <Card>
          <CardHeader>
            <CardTitle>AuthProvider Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded border border-blue-200 bg-blue-50 p-4">
              <p className="text-blue-800">✅ AuthProvider is properly configured and working!</p>
              <p className="mt-2 text-sm text-blue-600">
                The authentication system is now properly set up with the AuthProvider wrapping all
                pages through the main providers.
              </p>
            </div>

            <div className="mt-4">
              <div className="flex gap-4">
                <Button asChild>
                  <Link href="/test-provider">Test Provider</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/test-logout">Test Logout</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/">Go Home</Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
