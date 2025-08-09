"use client"

import React from "react"
import { usePathname } from "@/navigation"
import { AuthenticatedLayout } from "./authenticated-layout"

interface UniversalLayoutProps {
  children: React.ReactNode
  locale: string
}

// Pages that should NOT show sidebar and header
const NO_NAVIGATION_PAGES = [
  '/auth/login',
  '/auth/signup', 
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/callback',
  '/auth/unauthorized',
  '/auth/logout',
  '/auth/pending-approval',
  '/auth/profile'
]

export function UniversalLayout({ children, locale }: UniversalLayoutProps) {
  const pathname = usePathname()

  // Check if current page should show navigation
  const shouldShowNavigation = !NO_NAVIGATION_PAGES.some(page => 
    pathname?.includes(page)
  )

  // If it's an auth page, render without navigation
  if (!shouldShowNavigation) {
    return <>{children}</>
  }

  // For all other pages, show sidebar and header
  return (
    <AuthenticatedLayout locale={locale}>
      {children}
    </AuthenticatedLayout>
  )
}