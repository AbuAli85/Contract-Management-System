"use client"

import { LoginForm } from "@/auth/forms/login-form"
import { OAuthButtons } from "@/auth/forms/oauth-buttons"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useEffect, useState, useRef } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{" "}
            <Link
              href={`/${locale}/auth/signup`}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              create a new account
            </Link>
          </p>
        </div>

        {oauthError && (
          <Alert variant="destructive">
            <AlertDescription>{oauthError}</AlertDescription>
          </Alert>
        )}

        <LoginForm />

        <OAuthButtons />
      </div>
    </div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic"
