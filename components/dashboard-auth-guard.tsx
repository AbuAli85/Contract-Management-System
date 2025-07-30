"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@supabase/auth-helpers-react"

interface DashboardAuthGuardProps {
  children: React.ReactNode
  locale: string
}

export function DashboardAuthGuard({ children, locale }: DashboardAuthGuardProps) {
  const session = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  // Mark when component has hydrated
  useEffect(() => {
    setMounted(true)
  }, [])

  // Only redirect after mounted and session is ready
  useEffect(() => {
    if (mounted && !session) {
      router.replace(`/${locale}/auth/login`)
    }
  }, [mounted, session, router, locale])

  // Show loading while mounting or if no session
  if (!mounted || !session) {
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