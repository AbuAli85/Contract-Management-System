"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

export default function QuickLoginPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  
  const router = useRouter()
  const supabase = createClient()

  const quickLogin = async (email: string, password: string, role: string) => {
    setLoading(true)
    setMessage("")
    setError("")

    try {
      console.log("🔐 Quick Login - Attempting:", email)
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        setError(`Login failed: ${authError.message}`)
        return
      }

      if (!authData.user) {
        setError("No user data returned")
        return
      }

      setMessage(`Success! Logged in as ${role}. Redirecting...`)
      
      // Determine redirect based on role
      let redirectPath = "/en/dashboard"
      
      switch (role) {
        case "provider":
          redirectPath = "/en/dashboard/provider-comprehensive"
          break
        case "client":
          redirectPath = "/en/dashboard/client-comprehensive"
          break
        case "admin":
          redirectPath = "/en/dashboard"
          break
        default:
          redirectPath = "/en/dashboard"
      }

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = redirectPath
      }, 1500)

    } catch (error) {
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">⚡ Quick Login</CardTitle>
          <p className="text-sm text-gray-600">One-click login with test accounts</p>
        </CardHeader>
        
        <CardContent className="space-y-4">
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

          <div className="space-y-3">
            <Button
              className="w-full"
              onClick={() => quickLogin("provider@test.com", "password", "provider")}
              disabled={loading}
            >
              🏢 Login as Provider
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => quickLogin("user@test.com", "password", "user")}
              disabled={loading}
            >
              👤 Login as User
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => quickLogin("admin@test.com", "password", "admin")}
              disabled={loading}
            >
              ⚙️ Login as Admin
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => quickLogin("test@test.com", "TestPass123!", "provider")}
              disabled={loading}
            >
              🧪 Login as Test Account
            </Button>
          </div>

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
              onClick={() => router.push("/en/simple-login")}
            >
              📝 Manual Login Form
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center border-t pt-2">
            <p>Server: localhost:3001</p>
            <p>All passwords: "password" or "TestPass123!"</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}