"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { authDebug } from "@/lib/auth-debug"

export default function TestAuthPage() {
  const [email, setEmail] = useState("test@example.com")
  const [password, setPassword] = useState("TestPassword123!")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Log environment on mount
    authDebug.logEnvironment()
    
    // Test Supabase client
    const client = createClient()
    authDebug.logSupabaseClient(client)
  }, [])

  const handleTestLogin = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const client = createClient()
      
      // Log login attempt
      authDebug.logLoginAttempt(email)
      
      // Test connection first
      const connectionTest = await authDebug.testConnection(client)
      if (!connectionTest) {
        setError("Failed to connect to Supabase")
        return
      }

      // Attempt login
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error("Login error:", error)
        setError(error.message)
        authDebug.logLoginResult(false, error)
      } else {
        console.log("Login success:", data)
        setResult(data)
        authDebug.logLoginResult(true)
        authDebug.logAuthState(data.user, data.session, false)
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const handleTestSignUp = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const client = createClient()
      
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        console.error("Sign up error:", error)
        setError(error.message)
      } else {
        console.log("Sign up success:", data)
        setResult(data)
      }
    } catch (err) {
      console.error("Unexpected error:", err)
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>🔐 Authentication Test</CardTitle>
          <CardDescription>
            Test the authentication system and debug issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="TestPassword123!"
            />
          </div>

          <div className="flex gap-2">
            <Button 
              onClick={handleTestLogin} 
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Testing..." : "Test Login"}
            </Button>
            
            <Button 
              onClick={handleTestSignUp} 
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              {loading ? "Testing..." : "Test Sign Up"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertDescription>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 