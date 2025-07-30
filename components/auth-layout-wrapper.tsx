"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"
import { AppLayoutWithSidebar } from "@/components/app-layout-with-sidebar"
import { SimpleLayout } from "@/components/simple-layout"

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Only determine which layout to use - no redirects, no auth checks
  const isAuthPage = useMemo(() => {
    if (!pathname) return false
    return pathname.startsWith("/en/auth") || 
           pathname.startsWith("/ar/auth") ||
           pathname.includes("/login") || 
           pathname.includes("/signup") ||
           pathname.includes("/forgot-password") ||
           pathname.includes("/reset-password") ||
           pathname.includes("/logout")
  }, [pathname])

  // Simply return the appropriate layout - no redirects here
  if (isAuthPage) {
    return <SimpleLayout>{children}</SimpleLayout>
  }

  return <AppLayoutWithSidebar>{children}</AppLayoutWithSidebar>
} 