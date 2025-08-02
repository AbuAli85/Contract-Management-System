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
  const [userStatus, setUserStatus] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)

  // Mark when component has hydrated
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check user status when session is available
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!session?.user || checkingStatus) return
      
      setCheckingStatus(true)
      
      try {
        const supabase = useSupabase().supabase
        
        // Check user status in both users and profiles tables
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("status")
          .eq("id", session.user.id)
          .single()
        
        if (!userError && userData) {
          setUserStatus(userData.status)
          
          if (userData.status === "pending") {
            router.replace(`/${locale}/auth/pending-approval`)
            return
          }
          
          if (userData.status === "inactive") {
            router.replace(`/${locale}/auth/login?error=Account deactivated&message=Your account has been deactivated`)
            return
          }
        } else {
          // Try profiles table as fallback
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("status")
            .eq("id", session.user.id)
            .single()
          
          if (!profileError && profileData) {
            setUserStatus(profileData.status)
            
            if (profileData.status === "pending") {
              router.replace(`/${locale}/auth/pending-approval`)
              return
            }
            
            if (profileData.status === "inactive") {
              router.replace(`/${locale}/auth/login?error=Account deactivated&message=Your account has been deactivated`)
              return
            }
          }
        }
      } catch (error) {
        console.error("Error checking user status:", error)
      } finally {
        setCheckingStatus(false)
      }
    }

    if (mounted && !loading && session) {
      checkUserStatus()
    }
  }, [mounted, loading, session, router, locale, checkingStatus])

  // Only redirect after mounted and session is ready
  useEffect(() => {
    if (mounted && !loading && !session) {
      router.replace(`/${locale}/auth/login`)
    }
  }, [mounted, loading, session, router, locale])

  // Show loading while mounting, checking status, or if no session
  if (!mounted || loading || !session || checkingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">
            {checkingStatus ? "Checking account status..." : "Loading authentication..."}
          </p>
        </div>
      </div>
    )
  }

  // If authenticated and status is active, render the dashboard content
  return <>{children}</>
} 