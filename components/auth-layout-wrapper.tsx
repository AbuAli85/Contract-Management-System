"use client"

import { usePathname } from "next/navigation"
import { useEffect, useMemo } from "react"
import { AppLayoutWithSidebar } from "@/components/app-layout-with-sidebar"
import { SimpleLayout } from "@/components/simple-layout"

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Memoize the auth page detection to prevent unnecessary re-renders
  const isAuthPage = useMemo(() => {
    if (!pathname) return false
    return pathname.includes("/auth/") || 
           pathname.includes("/login") || 
           pathname.includes("/signup") ||
           pathname.includes("/forgot-password") ||
           pathname.includes("/reset-password") ||
           pathname.includes("/logout")
  }, [pathname])

  // Only log when pathname or isAuthPage actually changes
  useEffect(() => {
    console.log("🔧 AuthLayoutWrapper:", { pathname, isAuthPage })
  }, [pathname, isAuthPage])

  if (isAuthPage) {
    // Use simple layout for auth pages
    return <SimpleLayout>{children}</SimpleLayout>
  }

  // Use sidebar layout for other pages
  return <AppLayoutWithSidebar>{children}</AppLayoutWithSidebar>
} 