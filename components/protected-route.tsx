"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-service"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

function ProtectedRoute({ 
  children, 
  fallback 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // 1) Mark when the component has hydrated
  useEffect(() => {
    setMounted(true)
  }, [])

  // 2) Once hydrated AND no longer loading, redirect if no user
  useEffect(() => {
    if (!mounted || loading) return

    if (!user) {
      router.replace("/auth/login")
    }
  }, [mounted, loading, user, router])

  // 3) Before hydration or while loading, show loading state
  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // 4) Once hydrated & done loading, check if user exists
  if (!user) {
    // No user - show fallback or nothing (will redirect)
    return fallback ? <>{fallback}</> : null
  }

  // 5) User exists, render children
  return <>{children}</>
}

export { ProtectedRoute }
export default ProtectedRoute
