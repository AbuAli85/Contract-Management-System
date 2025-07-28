'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  
  const { signIn } = useAuth()
  const router = useRouter()
  
  // Get the current locale from the URL or default to 'en'
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const locale = pathname.split('/')[1] || 'en'
  
  // Get redirect URL from query parameters or default to dashboard
  const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search)
      const redirectParam = urlParams.get('redirect')
      if (redirectParam) {
        return redirectParam
      }
    }
    return `/${locale}/dashboard`
  }
  
  const redirectTo = getRedirectUrl()
  console.log("🔐 Login Debug - Initial redirect URL:", redirectTo)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("🔐 Login Debug - Starting login process...")
      console.log("🔐 Login Debug - Email:", email)
      
      // Use client-side authentication first
      const { success, error: clientError } = await signIn(email, password)

      if (!success) {
        console.error("🔐 Login Debug - Client login failed:", clientError)
        setError(clientError || 'Login failed')
        return
      }

      console.log("🔐 Login Debug - Client login successful")

      // Also call server-side login to ensure cookies are set properly
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password }),
          credentials: 'include'
        })

        const data = await response.json()
        console.log("🔐 Login Debug - Server login response:", data)

        if (!response.ok || !data.success) {
          console.warn("🔐 Login Debug - Server login failed, but client login succeeded")
          // Don't fail the login if server-side fails, since client-side worked
        }
      } catch (serverError) {
        console.warn("🔐 Login Debug - Server login error, but client login succeeded:", serverError)
        // Don't fail the login if server-side fails, since client-side worked
      }

      // Debug: Check if cookies are set (note: httpOnly cookies won't be visible to client-side JS)
      if (typeof window !== 'undefined') {
        const cookies = document.cookie.split(';').map(c => c.trim())
        const authCookies = cookies.filter(c => 
          c.includes('auth') || c.includes('supabase') || c.includes('sb-')
        )
        console.log("🔐 Login Debug - Client-side auth cookies after login:", authCookies)
        console.log("🔐 Login Debug - Note: HTTP-only cookies are not visible to client-side JS")
      }

      // After successful login, redirect immediately
      console.log("🔐 Login Debug - Login successful, redirecting to dashboard")
      console.log("🔐 Login Debug - Redirect URL:", redirectTo)
      
      // Add a small delay to ensure state is updated
      setTimeout(() => {
        // Try router.push first, fallback to window.location.href
        try {
          console.log("🔐 Login Debug - Attempting router.push to:", redirectTo)
          router.push(redirectTo)
        } catch (error) {
          console.log("🔐 Login Debug - Router push failed, using window.location.href")
          window.location.href = redirectTo
        }
      }, 100)
      
    } catch (error) {
      console.error("🔐 Login Debug - Unexpected error:", error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
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
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
      
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  )
} 