"use client"

import React, { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-service"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const { signIn, user, loading: authLoading, mounted } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  // Add refs to prevent unnecessary re-renders
  const isSubmittingRef = useRef(false)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Silent session timeout - only active when user is authenticated
  useSessionTimeout({
    timeoutMinutes: 5,
    enableLogging: false, // Set to true for debugging
    silent: true // Silent mode - no warnings, just automatic logout
  })

  // Get the current locale from the URL or default to 'en'
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
  const locale = pathname.split("/")[1] || "en"

  // Get redirect URL from query parameters or default to dashboard
  const redirectTo = React.useMemo(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const redirectParam = urlParams.get("redirect")
      if (redirectParam) {
        return redirectParam
      }
    }
    return "/" + locale + "/dashboard"
  }, [locale])

  // Only log once when component mounts
  React.useEffect(() => {
    console.log("🔐 Login Debug - Initial redirect URL:", redirectTo)
  }, [redirectTo])

  // Handle redirect when user is authenticated
  React.useEffect(() => {
    if (user && !authLoading && mounted && !isSubmittingRef.current) {
      console.log("🔐 Login Form: User authenticated, allowing page-level redirect to handle navigation")
      // Let the page-level redirect handle the navigation
      // Don't add our own redirect here to avoid conflicts
    }
  }, [user, authLoading, mounted])

  // Check for OAuth errors in URL parameters
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search)
      const error = urlParams.get("error")
      const message = urlParams.get("message")

      if (error && message) {
        setError(error + ": " + message)
        // Clear the error from URL after displaying it
        const newUrl = new URL(window.location.href)
        newUrl.searchParams.delete("error")
        newUrl.searchParams.delete("message")
        window.history.replaceState({}, "", newUrl.toString())
      }
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prevent multiple submissions
    if (isSubmittingRef.current || loading) {
      return
    }
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    isSubmittingRef.current = true

    try {
      console.log("🔐 Login Debug - Starting login process...")
      console.log("🔐 Login Debug - Email:", email)

      // Use client-side authentication with enhanced error handling
      console.log("🔐 Login Debug - Calling signIn function...")
      const { success: loginSuccess, error: clientError, status } = await signIn(email, password)

      if (!loginSuccess) {
        console.error("🔐 Login Debug - Client login failed:", clientError)
        
        // Handle pending approval status
        if (status === "pending") {
          console.log("🔐 Login Debug - User is pending approval, redirecting to pending page")
          setError("Your account is pending approval. Redirecting to approval status page...")
          
          // Show toast notification
          toast({
            title: "Account Pending Approval",
            description: "Your account is under review. You'll be notified once approved.",
            variant: "default",
          })
          
          // Redirect to pending approval page
          setTimeout(() => {
            router.replace("/" + locale + "/auth/pending-approval")
          }, 2000)
          return
        }
        
        // Handle inactive status
        if (status === "inactive") {
          setError("Your account has been deactivated. Please contact an administrator.")
          
          toast({
            title: "Account Deactivated",
            description: "Your account has been deactivated. Please contact support.",
            variant: "destructive",
          })
          return
        }
        
        // Enhanced error message handling
        let errorMessage = "Login failed. Please check your credentials and try again."
        
        if (clientError) {
          if (clientError.includes("Invalid login credentials")) {
            errorMessage = "Invalid email or password. Please try again."
          } else if (clientError.includes("Email not confirmed")) {
            errorMessage = "Please check your email and confirm your account before signing in."
          } else if (clientError.includes("Too many requests")) {
            errorMessage = "Too many login attempts. Please wait a few minutes before trying again."
          } else if (clientError.includes("User not found")) {
            errorMessage = "No account found with this email address."
          } else {
            errorMessage = clientError
          }
        }
        
        setError(errorMessage)

        // Show toast notification
        toast({
          title: "Login Failed",
          description: errorMessage,
          variant: "destructive",
        })
        return
      }

      console.log("🔐 Login Debug - Client login successful")
      setSuccess("Login successful! Redirecting...")

      // Show success toast
      toast({
        title: "Welcome back!",
        description: "Login successful. Redirecting to dashboard...",
      })

      // Add a backup redirect in case the page-level redirect fails
      setTimeout(() => {
        if (typeof window !== "undefined") {
          console.log("🔐 Login Form: Backup redirect triggered")
          window.location.replace("/" + locale + "/dashboard")
        }
      }, 2000) // 2 second delay for backup redirect

      console.log("🔐 Login Debug - Login successful, redirect will be handled by page component")
    } catch (error) {
      console.error("🔐 Login Debug - Unexpected error:", error)
      const errorMessage = "An unexpected error occurred. Please try again."
      setError(errorMessage)

      toast({
        title: "Unexpected Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      isSubmittingRef.current = false
    }
  }, [email, password, signIn, router, redirectTo, toast, loading])

  // Show loading while checking authentication
  if (authLoading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Show redirect message if user is authenticated
  if (user && !authLoading && mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              aria-describedby={error ? "login-error" : undefined}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Password
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
  )
}
