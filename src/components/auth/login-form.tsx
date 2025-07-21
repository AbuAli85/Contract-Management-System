"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()
  const redirectTo = '/en/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("🔐 Login Debug - Starting login process...")
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("🔐 Login Debug - Login error:", error)
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        console.log("🔐 Login Debug - Login successful, user:", data.user.email)
        console.log("🔐 Login Debug - Session data:", data.session ? "present" : "missing")
        if (data.session) {
          console.log("🔐 Login Debug - Session access token:", data.session.access_token ? "present" : "missing")
          console.log("🔐 Login Debug - Session refresh token:", data.session.refresh_token ? "present" : "missing")
          
          // Let Supabase handle session storage - don't manually interfere
          console.log("🔐 Login Debug - Using Supabase's built-in session management")
        }
        setSuccess("Login successful! Redirecting...")
        
        // Ensure session is properly established and persisted
        try {
          // Wait a moment for the session to be properly set
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // Get the current session
          const { data: { session } } = await supabase.auth.getSession()
          console.log("🔐 Login Debug - Session after login:", session ? "established" : "not found")
          
          if (session) {
            console.log("🔐 Login Debug - Session user:", session.user.email)
            console.log("🔐 Login Debug - Session access token:", session.access_token ? "present" : "missing")
            console.log("🔐 Login Debug - Session refresh token:", session.refresh_token ? "present" : "missing")
            
            // Verify session is stored in localStorage
            const storedSession = localStorage.getItem('sb-auth-token')
            console.log("🔐 Login Debug - Stored session:", storedSession ? "present" : "missing")
            
            // Verify session is stored in cookies
            const cookies = document.cookie
            const hasAuthCookie = cookies.includes('sb-auth-token')
            console.log("🔐 Login Debug - Auth cookie present:", hasAuthCookie)
            
            // Debug all cookies
            const allCookies = document.cookie.split(';').map(c => c.trim())
            const supabaseCookies = allCookies.filter(c => c.startsWith('sb-'))
            console.log("🔐 Login Debug - All cookies:", allCookies)
            console.log("🔐 Login Debug - Supabase cookies:", supabaseCookies)
            
            // Session is established, redirect
            setTimeout(() => {
              router.push(redirectTo)
            }, 1000)
          } else {
            console.log("🔐 Login Debug - No session, waiting...")
            // Wait a bit more for session to be established
            setTimeout(async () => {
              const { data: { session: retrySession } } = await supabase.auth.getSession()
              console.log("🔐 Login Debug - Retry session:", retrySession ? "found" : "still missing")
              if (retrySession) {
                console.log("🔐 Login Debug - Retry session user:", retrySession.user.email)
                router.push(redirectTo)
              } else {
                setError("Session not established. Please try again.")
                setLoading(false)
              }
            }, 2000)
          }
        } catch (sessionError) {
          console.error("🔐 Login Debug - Session establishment error:", sessionError)
          setError("Session establishment failed. Please try again.")
          setLoading(false)
        }
      }
    } catch (err) {
      console.error("🔐 Login Debug - Unexpected error:", err)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Sign In</CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
