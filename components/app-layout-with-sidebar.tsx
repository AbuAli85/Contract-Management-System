"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-service"
import { useNotifications } from "@/hooks/use-notifications-enhanced"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { useRolePermissions } from "@/components/user-role-display"
import { useSafeParams, useLocaleFromParams } from "@/hooks/use-safe-params"
import { useSafePathname } from "@/hooks/use-safe-params"
import { Sidebar } from "./sidebar"
import { MobileMenuButton } from "./mobile-menu-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DebugRoleInfo } from "@/components/debug-role-info"
import { AdminRoleFixer } from "@/components/admin-role-fixer"
import { DebugAuthState } from "@/components/debug-auth-state"
import { 
  Bell, 
  Settings, 
  User, 
  LogOut, 
  Search,
  Menu,
  Crown,
  Shield
} from "lucide-react"

interface AppLayoutWithSidebarProps {
  children: React.ReactNode
}

export function AppLayoutWithSidebar({ children }: AppLayoutWithSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const { user } = useAuth()
  const { unreadCount: notificationCount, highPriorityCount } = useNotifications()
  const { profile: userProfile, fetchUserProfile } = useUserProfile()
  const { isAdmin, isUser, roleInfo } = useRolePermissions()
  
  // Safe parameter handling with error boundary
  let params, pathname, locale
  try {
    params = useSafeParams()
    pathname = useSafePathname()
    locale = useLocaleFromParams()
  } catch (error) {
    console.warn('Safe params error:', error)
    params = {}
    pathname = '/'
    locale = 'en'
  }

  // Check if we're on pages that should NOT show sidebar/navbar
  const shouldHideSidebar = (pathname?.includes('/auth/') || 
                           pathname?.includes('/login') || 
                           pathname?.includes('/signup') ||
                           pathname?.includes('/forgot-password') ||
                           pathname?.includes('/reset-password')) &&
                           !pathname?.includes('/dashboard')

  // Show sidebar and header for all pages except auth pages
  const showSidebarAndHeader = !shouldHideSidebar

  // Component mount detection
  useEffect(() => {
    setMounted(true)
  }, [])

  // Debug logging for params issue
  useEffect(() => {
    if (mounted) {
      console.log('🔍 AppLayoutWithSidebar - useSafeParams result:', params)
      console.log('🔍 AppLayoutWithSidebar - pathname:', pathname)  
      console.log('🔍 AppLayoutWithSidebar - locale:', locale)
      console.log('🔍 AppLayoutWithSidebar - shouldHideSidebar:', shouldHideSidebar)
      console.log('🔍 AppLayoutWithSidebar - showSidebarAndHeader:', showSidebarAndHeader)
      console.log('🔍 AppLayoutWithSidebar - user:', !!user)
      console.log('🔍 AppLayoutWithSidebar - sidebarOpen:', sidebarOpen)
    }
  }, [mounted, params, pathname, locale, isLandingPage, user, sidebarOpen])

  // Silent session timeout - automatically logs out after 5 minutes of inactivity
  useSessionTimeout({
    timeoutMinutes: 5,
    enableLogging: false, // Set to true for debugging
    silent: true // Silent mode - no warnings, just automatic logout
  })

  // Get current page title
  const getPageTitle = () => {
    if (pathname?.includes('/dashboard/advanced')) return 'Advanced Dashboard'
    if (pathname?.includes('/dashboard/analytics')) return 'Analytics'
    if (pathname?.includes('/dashboard/approvals')) return 'Approvals'
    if (pathname?.includes('/dashboard/audit')) return 'Audit Logs'
    if (pathname?.includes('/dashboard/contracts')) return 'Contract Management'
    if (pathname?.includes('/dashboard/generate-contract')) return 'Generate Contract'
    if (pathname?.includes('/dashboard/makecom-templates')) return 'Make.com Templates'
    if (pathname?.includes('/dashboard/notifications')) return 'Notifications'
    if (pathname?.includes('/dashboard/overview')) return 'Overview'
    if (pathname?.includes('/dashboard/profile')) return 'Profile'
    if (pathname?.includes('/dashboard/reports')) return 'Reports'
    if (pathname?.includes('/dashboard/roles')) return 'Role Management'
    if (pathname?.includes('/dashboard/settings')) return 'Settings'
    if (pathname?.includes('/dashboard/user-approvals')) return 'User Approvals'
    if (pathname?.includes('/dashboard/user-management')) return 'User Management'
    if (pathname?.includes('/dashboard/users')) return 'User Management'
    if (pathname?.includes('/dashboard')) return 'Dashboard'
    if (pathname?.includes('/generate-contract')) return 'Generate Contract'
    if (pathname?.includes('/contracts/analytics')) return 'Contract Analytics'
    if (pathname?.includes('/contracts/approved')) return 'Approved Contracts'
    if (pathname?.includes('/contracts/pending')) return 'Pending Contracts'
    if (pathname?.includes('/contracts/rejected')) return 'Rejected Contracts'
    if (pathname?.includes('/contracts')) return 'Contracts'
    if (pathname?.includes('/manage-parties')) return 'Manage Parties'
    if (pathname?.includes('/manage-promoters')) return 'Manage Promoters'
    if (pathname?.includes('/promoter-analysis')) return 'Promoter Analysis'
    if (pathname?.includes('/promoter-details')) return 'Promoter Details'
    if (pathname?.includes('/promoters/performance')) return 'Promoter Performance'
    if (pathname?.includes('/crm')) return 'CRM'
    if (pathname?.includes('/notifications')) return 'Notifications'
    if (pathname?.includes('/onboarding')) return 'Onboarding'
    if (pathname?.includes('/profile/settings')) return 'Profile Settings'
    if (pathname?.includes('/profile/security')) return 'Security Settings'
    if (pathname?.includes('/profile')) return 'Profile'
    if (pathname?.includes('/users/activity')) return 'User Activity'
    if (pathname?.includes('/users/roles')) return 'User Roles'
    if (pathname?.includes('/users')) return 'User Management'
    if (pathname?.includes('/audit')) return 'Audit Logs'
    if (pathname?.includes('/settings')) return 'Settings'
    return 'Dashboard'
  }

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button - show for dashboard and other authenticated pages */}
      {showSidebarAndHeader && (
        <div className="fixed left-4 top-4 z-50 md:hidden">
          <MobileMenuButton isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
      )}

      {/* Layout container */}
      <div className="flex min-h-screen">
        {/* Sidebar - show for dashboard and other authenticated pages */}
        {showSidebarAndHeader && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Top header - show for dashboard and other authenticated pages */}
          {showSidebarAndHeader && (
            <header className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {/* Welcome message with user name */}
                      {user && (
                        <div className="hidden sm:block">
                          <p className="text-sm text-muted-foreground">
                            Welcome back, <span className="font-medium text-foreground">
                              {userProfile?.full_name && userProfile.full_name !== 'Emergency User' 
                                ? userProfile.full_name 
                                : userProfile?.display_name && userProfile.display_name !== 'Emergency User'
                                ? userProfile.display_name
                                : user.email?.split('@')[0] || 'User'}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Debug role info - only show in development */}
                    {process.env.NODE_ENV === 'development' && (
                      <DebugRoleInfo />
                    )}

                    {/* Admin role fixer - only show for admins in development */}
                    {process.env.NODE_ENV === 'development' && isAdmin && (
                      <AdminRoleFixer />
                    )}

                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-4 w-4" />
                      {notificationCount > 0 && (
                        <Badge 
                          variant="destructive" 
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                        >
                          {notificationCount}
                        </Badge>
                      )}
                    </Button>

                    {/* User menu */}
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon">
                        <User className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </header>
          )}

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
      
      {/* Debug component - remove in production */}
      {process.env.NODE_ENV === 'development' && <DebugAuthState />}
    </div>
  )
}
