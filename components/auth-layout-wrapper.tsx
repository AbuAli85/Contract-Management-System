"use client"

import { usePathname } from "next/navigation"
import { AppLayoutWithSidebar } from "@/components/app-layout-with-sidebar"
import { SimpleLayout } from "@/components/simple-layout"

export function AuthLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  
  // Check if we're on an auth page
  const isAuthPage = pathname.includes("/auth/") || 
                    pathname.includes("/login") || 
                    pathname.includes("/signup") ||
                    pathname.includes("/forgot-password") ||
                    pathname.includes("/reset-password")

  if (isAuthPage) {
    // Use simple layout for auth pages
    return <SimpleLayout>{children}</SimpleLayout>
  }

  // Use sidebar layout for other pages
  return <AppLayoutWithSidebar>{children}</AppLayoutWithSidebar>
} 