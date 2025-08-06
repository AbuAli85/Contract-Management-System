"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabase } from "@/app/providers"

interface DashboardAuthGuardProps {
  children: React.ReactNode
  locale?: string
  requiredRole?: string
}

export function DashboardAuthGuard({ children, locale, requiredRole }: DashboardAuthGuardProps) {
  const { session, loading, supabase } = useSupabase()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [userStatus, setUserStatus] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [checkingStatus, setCheckingStatus] = useState(false)
  const [checkingRole, setCheckingRole] = useState(false)

  // Mark when component has hydrated
  useEffect(() => {
    setMounted(true)
  }, [])

  // Check user status when session is available
  useEffect(() => {
    const checkUserStatus = async () => {
      if (!session?.user || checkingStatus || !supabase) return
      
      setCheckingStatus(true)
      
      try {
        
        // Check user status in both users and profiles tables
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("status")
          .eq("id", session.user.id)
          .single()
        
        if (!userError && userData) {
          setUserStatus(userData.status as string)
          
          if (userData.status === "pending") {
            const redirectUrl = locale ? `/${locale}/auth/pending-approval` : `/auth/pending-approval`
            router.replace(redirectUrl)
            return
          }
          
          if (userData.status === "inactive") {
            const redirectUrl = locale 
              ? `/${locale}/auth/login?error=Account deactivated&message=Your account has been deactivated`
              : `/auth/login?error=Account deactivated&message=Your account has been deactivated`
            router.replace(redirectUrl)
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
            setUserStatus(profileData.status as string)
            
            if (profileData.status === "pending") {
              const redirectUrl = locale ? `/${locale}/auth/pending-approval` : `/auth/pending-approval`
              router.replace(redirectUrl)
              return
            }
            
            if (profileData.status === "inactive") {
              const redirectUrl = locale 
                ? `/${locale}/auth/login?error=Account deactivated&message=Your account has been deactivated`
                : `/auth/login?error=Account deactivated&message=Your account has been deactivated`
              router.replace(redirectUrl)
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

    if (mounted && !loading && session && supabase) {
      checkUserStatus()
    }
  }, [mounted, loading, session, router, locale, checkingStatus, supabase])

  // Check user role when required
  useEffect(() => {
    const checkUserRole = async () => {
      if (!session?.user || checkingRole || !requiredRole) return
      
      setCheckingRole(true)
      
      try {
        const response = await fetch('/api/get-user-role')
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.role.value)
          
          // If user doesn't have the required role, redirect to unauthorized
          if (data.role.value !== requiredRole) {
            const redirectUrl = locale 
              ? `/${locale}/auth/unauthorized?required=${requiredRole}&current=${data.role.value}`
              : `/auth/unauthorized?required=${requiredRole}&current=${data.role.value}`
            router.replace(redirectUrl)
            return
          }
        } else {
          console.error('Failed to check user role')
          const redirectUrl = locale ? `/${locale}/auth/login` : `/auth/login`
          router.replace(redirectUrl)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        const redirectUrl = locale ? `/${locale}/auth/login` : `/auth/login`
        router.replace(redirectUrl)
      } finally {
        setCheckingRole(false)
      }
    }

    if (mounted && !loading && session && requiredRole) {
      checkUserRole()
    }
  }, [mounted, loading, session, router, locale, requiredRole, checkingRole])

  // Only redirect after mounted and session is ready
  useEffect(() => {
    if (mounted && !loading && !session) {
      const redirectUrl = locale ? `/${locale}/auth/login` : `/auth/login`
      router.replace(redirectUrl)
    }
  }, [mounted, loading, session, router, locale])

  // Show loading while mounting, checking status, or if no session
  if (!mounted || loading || !session || checkingStatus || checkingRole) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
          <p className="text-muted-foreground">
            {checkingStatus 
              ? "Checking account status..." 
              : checkingRole 
              ? "Verifying permissions..." 
              : "Loading authentication..."}
          </p>
        </div>
      </div>
    )
  }

  // If authenticated, status is active, and role is correct (if required), render the dashboard content
  return <>{children}</>
} 