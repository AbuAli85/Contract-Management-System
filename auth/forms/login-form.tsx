"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
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

  const { signIn } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

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
    return `/${locale}/dashboard`
  }, [locale])

  // Only log once when component mounts
  React.useEffect(() => {
    console.log("🔐 Login Debug - Initial redirect URL:", redirectTo)
  }, [redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      console.log("🔐 Login Debug - Starting login process...")
      console.log("🔐 Login Debug - Email:", email)

      // Use client-side authentication
      const { success: loginSuccess, error: clientError } = await signIn(email, password)

      if (!loginSuccess) {
        console.error("🔐 Login Debug - Client login failed:", clientError)
        const errorMessage =
          clientError || "Login failed. Please check your credentials and try again."
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

      // After successful login, redirect immediately
      console.log("🔐 Login Debug - Login successful, redirecting to dashboard")
      console.log("🔐 Login Debug - Redirect URL:", redirectTo)

      // Use router.replace for client-side navigation without adding to history
      router.replace(redirectTo)
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
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
            aria-describedby={error ? "login-error" : undefined}
            autoComplete="current-password"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={loading}
        aria-describedby={error ? "login-error" : undefined}
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

      {error && (
        <div id="login-error" className="sr-only" aria-live="polite">
          {error}
        </div>
      )}
    </form>
  )
}
