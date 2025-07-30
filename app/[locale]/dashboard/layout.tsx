"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useParams } from "next/navigation"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const hasCheckedAuth = useRef(false)
  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) return
    hasCheckedAuth.current = true

    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/check-session")
        const data = await response.json()

        if (data.success && data.hasSession) {
          setIsAuthenticated(true)
        } else {
          // Redirect to login with proper locale
          const locale = params?.locale || "en"
          router.replace(`/${locale}/auth/login`)
          return
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        // Redirect to login with proper locale
        const locale = params?.locale || "en"
        router.replace(`/${locale}/auth/login`)
        return
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, []) // Remove dependencies to prevent re-renders


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold">Authentication Required</h2>
          <p className="mb-4 text-muted-foreground">You are not authenticated or your session has expired.</p>
          <a
            href="/en/auth/login"
            className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
