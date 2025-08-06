"use client"

import { useEffect } from 'react'
import { useSupabase } from '@/app/providers'
import { useRouter, usePathname } from 'next/navigation'

export function AuthRedirect() {
  const { session, loading } = useSupabase()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Only redirect if we have a session and we're on an auth page
    if (!loading && session && pathname) {
      const isAuthPage = pathname.includes('/auth/')
      
      if (isAuthPage) {
        console.log("🔐 AuthRedirect: User is authenticated on auth page, redirecting...")
        
        // Get locale from pathname
        const segments = pathname.split('/')
        const locale = segments[1] || 'en'
        
        // Force redirect using window.location for reliability
        const dashboardUrl = `/${locale}/dashboard`
        console.log("🔐 AuthRedirect: Redirecting to:", dashboardUrl)
        
        // Use replace to avoid adding to browser history
        window.location.replace(dashboardUrl)
      }
    }
  }, [session, loading, pathname, router])

  return null // This component doesn't render anything
}
