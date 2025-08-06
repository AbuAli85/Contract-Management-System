"use client"

import { LoginForm } from "@/auth/forms/login-form"
import { OAuthButtons } from "@/auth/forms/oauth-buttons"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useSupabase } from "@/app/providers"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { session, loading } = useSupabase()
  const [mounted, setMounted] = useState(false)
  const [oauthError, setOauthError] = useState<string | null>(null)

  // Get current locale for links
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
  const locale = pathname.split("/")[1] || "en"

  // Mark when component has hydrated
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only redirect after mounted and session is ready
  useEffect(() => {
    if (mounted && !loading && session) {
      console.log("🔐 Login Page: User authenticated, redirecting to dashboard")
      window.location.href = "/" + locale + "/dashboard"
    }
  }, [mounted, loading, session, locale])

  // Check for OAuth errors in URL parameters
  useEffect(() => {
    const error = searchParams?.get("error")
    const message = searchParams?.get("message")

    if (error && message) {
      setOauthError(`${error}: ${message}`)
      // Clear the error from URL after displaying it
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete("error")
      newUrl.searchParams.delete("message")
      window.history.replaceState({}, "", newUrl.toString())
    }
  }, [searchParams])

  // Show nothing while mounting or if user is already logged in
  if (!mounted || loading || session) {
    return null
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">
          Sign In
        </h2>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {oauthError && (
          <Alert variant="destructive">
            <AlertDescription>{oauthError}</AlertDescription>
          </Alert>
        )}

        <LoginForm />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>

        <OAuthButtons />

        <div className="text-center text-sm pt-4">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link
            href={"/" + locale + "/auth/signup"}
            className="font-medium text-primary hover:text-primary/80"
          >
            Create a new account
          </Link>
        </div>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic"
