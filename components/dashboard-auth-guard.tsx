"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/app/providers"

interface DashboardAuthGuardProps {
  children: React.ReactNode
  locale: string
}

export function DashboardAuthGuard({ children, locale }: DashboardAuthGuardProps) {
  const { session, loading } = useSupabase()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Mark when component has hydrated
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only redirect after mounted and session is ready
  useEffect(() => {
    if (mounted && !loading && !session) {
      router.replace(`/${locale}/auth/login`)
    }
  }, [mounted, loading, session, router, locale])

  // Show loading while mounting or if no session
  if (!mounted || loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // If authenticated, render the dashboard content
  return <>{children}</>
} 