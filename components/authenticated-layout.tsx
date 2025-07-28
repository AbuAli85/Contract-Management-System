'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/src/components/auth/auth-provider'
import { RBACProvider } from '@/src/components/auth/rbac-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { PermissionAwareSidebar } from '@/components/permission-aware-sidebar'
import { PermissionAwareHeader } from '@/components/permission-aware-header'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'

// Pages that don't need authentication or sidebar
const PUBLIC_PAGES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/auth/callback',
  '/setup-admin',
  '/test-auth',
  '/debug-auth',
  '/test-db',
  '/test-supabase',
  '/test-env',
  '/test-simple',
  '/test-webhook',
  '/test-webhooks',
  '/trigger-webhook',
  '/test-makecom',
  '/test-promoters',
  '/promoters/profile-test',
  '/logout',
  '/demo',
  '/onboarding',
  '/preview',
  '/instant',
  '/bypass',
  '/dashboard-direct'
]

interface AuthenticatedLayoutProps {
  children: React.ReactNode
  locale: string
}

export function AuthenticatedLayout({ children, locale }: AuthenticatedLayoutProps) {
  const { user, loading } = useAuth()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  if (!mounted) {
    return null
  }

  // Check if current page is public
  const isPublicPage = PUBLIC_PAGES.some(page => pathname?.includes(page))

  // For public pages, render without sidebar and header
  if (isPublicPage) {
    return <>{children}</>
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to access the application.</p>
          <a 
            href="/login" 
            className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <RBACProvider user={user}>
        <div className="flex h-screen bg-background">
          {/* Sidebar */}
          <PermissionAwareSidebar 
            isCollapsed={isSidebarCollapsed} 
            onToggle={toggleSidebar}
          />
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <PermissionAwareHeader 
              onSidebarToggle={toggleSidebar}
              isSidebarCollapsed={isSidebarCollapsed}
            />
            
            {/* Page Content */}
            <main className="flex-1 overflow-auto">
              <div className="container mx-auto p-6">
                {children}
              </div>
            </main>
          </div>
        </div>
      </RBACProvider>
    </ThemeProvider>
  )
} 