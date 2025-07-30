"use client"

import { LoginForm } from "@/auth/forms/login-form"
import { OAuthButtons } from "@/auth/forms/oauth-buttons"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function LoginPage() {
  const { user, loading, mounted } = useAuth()
  const searchParams = useSearchParams()
  const [oauthError, setOauthError] = useState<string | null>(null)
  const hasRedirected = useRef(false)

  // Get current locale for links
  const pathname = typeof window !== "undefined" ? window.location.pathname : ""
  const locale = pathname.split("/")[1] || "en"

  // Handle redirect when user is authenticated
  useEffect(() => {
    if (user && !loading && mounted && !hasRedirected.current) {
      const currentPath = typeof window !== "undefined" ? window.location.pathname : ""
      if (!currentPath.includes("/dashboard")) {
        hasRedirected.current = true
        // Add a short delay to ensure session is set
        setTimeout(() => {
          window.location.href = `/${locale}/dashboard`
        }, 700)
      }
    }
  }, [user, loading, mounted, locale])

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

  // Show loading while checking authentication
  if (loading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show redirect message only if user is authenticated and not already on dashboard
  if (user && !loading && mounted && !window.location.pathname.includes("/dashboard")) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
          <p className="mt-2 text-sm text-gray-500">Please wait...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Contract Management System
          </h1>
          <p className="text-gray-600">
            Sign in to your account to continue
          </p>
        </div>

        {/* Main Card */}
        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-center text-xl">
              Sign in to your account
            </CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {oauthError && (
              <Alert variant="destructive">
                <AlertDescription>{oauthError}</AlertDescription>
              </Alert>
            )}

            <LoginForm />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <OAuthButtons />

            <div className="text-center text-sm pt-4">
              <span className="text-muted-foreground">Don't have an account? </span>
              <Link
                href={`/${locale}/auth/signup`}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Create a new account
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic"
