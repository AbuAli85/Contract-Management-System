"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export function SimpleWorkingLogin() {
  const [email, setEmail] = useState("provider@test.com")
  const [password, setPassword] = useState("TestPass123!")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")
    setError("")

    try {
      console.log("🔐 Simple Login - Attempting login with:", email)
      
      // Step 1: Try Supabase auth login
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      })

      if (authError) {
        console.error("🔐 Simple Login - Auth error:", authError)
        setError(`Login failed: ${authError.message}`)
        return
      }

      if (!authData.user) {
        setError("Login failed: No user data returned")
        return
      }

      console.log("🔐 Simple Login - Auth successful:", authData.user.id)
      setMessage("Login successful! Redirecting...")

      // Step 2: Get user profile to determine redirect
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("role, status, full_name")
        .eq("id", authData.user.id)
        .single()

      let redirectPath = "/en/dashboard"
      
      if (!profileError && userProfile) {
        console.log("🔐 Simple Login - User role:", userProfile.role)
        
        // Route based on role
        switch (userProfile.role) {
          case "provider":
            redirectPath = "/en/dashboard/provider-comprehensive"
            break
          case "client":
            redirectPath = "/en/dashboard/client-comprehensive"
            break
          case "admin":
          case "super_admin":
            redirectPath = "/en/dashboard"
            break
          default:
            redirectPath = "/en/dashboard"
        }
      }

      console.log("🔐 Simple Login - Redirecting to:", redirectPath)
      
      // Use window.location for immediate redirect
      setTimeout(() => {
        window.location.href = redirectPath
      }, 1000)

    } catch (error) {
      console.error("🔐 Simple Login - Exception:", error)
      setError(`Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = async (testEmail: string, testPassword: string) => {
    setEmail(testEmail)
    setPassword(testPassword)
    
    // Auto-submit after a brief delay
    setTimeout(() => {
      const form = document.getElementById('simple-login-form') as HTMLFormElement
      if (form) {
        form.requestSubmit()
      }
    }, 100)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Simple Login Test</CardTitle>
          <p className="text-sm text-gray-600">Direct Supabase authentication</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <form id="simple-login-form" onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
                required
              />
            </div>
            
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {message && (
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{message}</AlertDescription>
              </Alert>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
          </form>

          {/* Quick Test Buttons */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">Quick test accounts:</p>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => quickLogin("provider@test.com", "TestPass123!")}
                disabled={loading}
              >
                Test Provider Account
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => quickLogin("user@test.com", "TestPass123!")}
                disabled={loading}
              >
                Test User Account
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => quickLogin("admin@test.com", "TestPass123!")}
                disabled={loading}
              >
                Test Admin Account
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className="border-t pt-4 space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.push("/en/test-auth")}
            >
              🧪 Open Diagnostic Page
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => router.push("/en/auth/register")}
            >
              📝 Create New Account
            </Button>
          </div>

          {/* Debug Info */}
          <div className="text-xs text-gray-500 border-t pt-2">
            <p>Server: localhost:3001</p>
            <p>Supabase: {process.env.NEXT_PUBLIC_SUPABASE_URL ? "Connected" : "Not configured"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}