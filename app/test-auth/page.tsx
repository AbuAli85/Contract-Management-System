"use client"

import { useState } from "react"
import { useAuth } from "@/src/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function TestAuthPage() {
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("TestPassword123")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const { signIn, user, loading: authLoading } = useAuth()

  const handleTestSignIn = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      await signIn(email, password)
      setSuccess("Sign in successful!")
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTestUser = async () => {
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/create-test-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(`Test user created! Email: ${data.credentials.email}, Password: ${data.credentials.password}`)
        setEmail(data.credentials.email)
        setPassword(data.credentials.password)
      } else {
        setError(data.error || "Failed to create test user")
      }
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle>Authentication Test</CardTitle>
            <CardDescription>Test the authentication system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authLoading && (
              <Alert>
                <AlertDescription>Loading authentication...</AlertDescription>
              </Alert>
            )}

            {user && (
              <Alert>
                <AlertDescription>
                  ✅ Authenticated as: {user.email}
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleCreateTestUser}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                {loading ? "Creating..." : "Create Test User"}
              </Button>

              <Button
                onClick={handleTestSignIn}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Signing in..." : "Test Sign In"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 