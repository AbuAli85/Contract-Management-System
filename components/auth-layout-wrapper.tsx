"use client"

import { usePathname } from "@/navigation"
import { useMemo } from "react"
import { AppLayoutWithSidebar } from "@/components/app-layout-with-sidebar"
import { SimpleLayout } from "@/components/simple-layout"

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Only determine which layout to use - no redirects, no auth checks
  const isAuthPage = useMemo(() => {
    if (!pathname) return false
    
    // Check for specific auth paths
    const authPaths = [
      '/login',
      '/signup', 
      '/forgot-password',
      '/reset-password',
      '/logout'
    ]
    
    // Check if pathname contains any auth path
    const hasAuthPath = authPaths.some(path => pathname.includes(path))
    
    // Check for locale-specific auth paths
    const hasLocaleAuthPath = pathname.match(/^\/(en|ar)\/auth\/(login|signup|forgot-password|reset-password|logout)/)
    
    return hasAuthPath || !!hasLocaleAuthPath
  }, [pathname])

  // Simply return the appropriate layout - no redirects here
  if (isAuthPage) {
    return <SimpleLayout>{children}</SimpleLayout>
  }

  return <AppLayoutWithSidebar>{children}</AppLayoutWithSidebar>
} 