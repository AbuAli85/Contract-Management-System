"use client"

import { ReactNode, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Inter } from "next/font/google"
import { ToastProvider } from "@/components/toast-notifications"
import { ErrorBoundary } from "@/components/error-boundary"
import { ProfessionalSidebar } from "@/components/professional-sidebar"
import { ProfessionalHeader } from "@/components/professional-header"

import { Loader2 } from "lucide-react"
import { PerformanceMonitor } from "@/components/performance-monitor"
import { FormProvider } from "@/hooks/use-form-context"
import { useAuth } from "@/lib/auth-service"

const inter = Inter({ subsets: ["latin"] })

interface ClientLayoutProps {
  children: ReactNode
  locale: string
}

function AuthenticatedAppLayout({ children, locale }: { children: ReactNode; locale: string }) {
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [forceShow, setForceShow] = useState(false)

  // Use a more robust approach to avoid hydration mismatches
  const [authState, setAuthState] = useState({
    user: null,
    loading: true,
    mounted: false,
  })

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Always call useAuth hook, but handle client-side logic in useEffect
  const auth = useAuth()

  // Update auth state when auth context changes, but only on client side
  useEffect(() => {
    if (isClient && auth) {
      setAuthState({
        user: auth.user,
        loading: auth.loading,
        mounted: auth.mounted,
      })
    }
  }, [isClient, auth?.user, auth?.loading, auth?.mounted])

  // Force show content after 5 seconds to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("🔧 ClientLayout: Force showing content after timeout")
      setForceShow(true)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  // Don't show sidebar on auth pages
  const isAuthPage =
    pathname?.includes("/auth/") ||
    pathname?.includes("/login") ||
    pathname?.includes("/signup") ||
    pathname?.includes("/forgot-password") ||
    pathname?.includes("/reset-password") ||
    pathname?.includes("/bypass")

  // Don't show sidebar on public pages
  const isPublicPage =
    pathname === "/" ||
    pathname === "/en" ||
    pathname === "/ar" ||
    pathname?.includes("/demo") ||
    pathname?.includes("/onboarding")

  const shouldShowSidebar = !isAuthPage && !isPublicPage && !!authState.user
  const isLoading = (authState.loading || !authState.mounted) && !forceShow

  console.log("🔧 ClientLayout: Auth state:", {
    user: !!authState.user,
    loading: authState.loading,
    mounted: authState.mounted,
    forceShow,
    isLoading,
    pathname,
    isClient,
  })

  // Show loading state only on client side
  if (isClient && isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Always render children for auth/public pages or when not showing sidebar
  if (!shouldShowSidebar) {
    return <>{children}</>
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ProfessionalSidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <ProfessionalHeader onMenuToggle={toggleSidebar} showSearch={true} showActions={true} />

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <PerformanceMonitor>
              <FormProvider>
                <ToastProvider>{children}</ToastProvider>
              </FormProvider>
            </PerformanceMonitor>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export function ClientLayout({ children, locale }: ClientLayoutProps) {
  return (
    <html lang={locale} className={inter.className} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <AuthenticatedAppLayout locale={locale}>{children}</AuthenticatedAppLayout>
      </body>
    </html>
  )
}
