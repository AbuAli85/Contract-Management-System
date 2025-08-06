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
  const { user } = useAuth()
  const { unreadCount: notificationCount, highPriorityCount } = useNotifications()
  const { profile: userProfile, fetchUserProfile } = useUserProfile()
  const { isAdmin, isUser, roleInfo } = useRolePermissions()
  const params = useSafeParams()
  const pathname = useSafePathname()
  const locale = useLocaleFromParams()

  // Debug logging for params issue
  useEffect(() => {
    console.log('🔍 AppLayoutWithSidebar - useSafeParams result:', params)
    console.log('🔍 AppLayoutWithSidebar - pathname:', pathname)  
    console.log('🔍 AppLayoutWithSidebar - locale:', locale)
    console.log('🔍 AppLayoutWithSidebar - isLandingPage:', isLandingPage)
    console.log('🔍 AppLayoutWithSidebar - user:', !!user)
    console.log('🔍 AppLayoutWithSidebar - sidebarOpen:', sidebarOpen)
  }, [params, pathname, locale, isLandingPage, user, sidebarOpen])

  // Silent session timeout - automatically logs out after 5 minutes of inactivity
  useSessionTimeout({
    timeoutMinutes: 5,
    enableLogging: false, // Set to true for debugging
    silent: true // Silent mode - no warnings, just automatic logout
  })

  // Check if we're on the landing page (root route) or auth pages
  const isLandingPage = pathname === ("/" + locale) || pathname === ("/" + locale + "/") || 
                       pathname?.includes('/auth/') || 
                       pathname?.includes('/login') || 
                       pathname?.includes('/signup') ||
                       pathname?.includes('/forgot-password') ||
                       pathname?.includes('/reset-password')

  // Get current page title
  const getPageTitle = () => {
    if (pathname?.includes('/dashboard')) return 'Dashboard'
    if (pathname?.includes('/generate-contract')) return 'Generate Contract'
    if (pathname?.includes('/contracts')) return 'Contracts'
    if (pathname?.includes('/manage-parties')) return 'Manage Parties'
    if (pathname?.includes('/manage-promoters')) return 'Manage Promoters'
    if (pathname?.includes('/promoter-analysis')) return 'Promoter Analysis'
    if (pathname?.includes('/users')) return 'User Management'
    if (pathname?.includes('/settings')) return 'Settings'
    if (pathname?.includes('/notifications')) return 'Notifications'
    if (pathname?.includes('/audit')) return 'Audit Logs'
    return 'Dashboard'
  }

  // Function to refresh role data
  const handleRefreshRole = async () => {
    try {
      await fetchUserProfile()
      window.location.reload() // Force a full page refresh to clear all cached data
    } catch (error) {
      console.error('Failed to refresh role data:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button - show for dashboard and other authenticated pages */}
      {(!isLandingPage || pathname?.includes('/dashboard')) && (
        <div className="fixed left-4 top-4 z-50 md:hidden">
          <MobileMenuButton isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
      )}

      {/* Layout container */}
      <div className="flex min-h-screen">
        {/* Sidebar - show for dashboard and other authenticated pages */}
        {(!isLandingPage || pathname?.includes('/dashboard')) && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Top header - show for dashboard and other authenticated pages */}
          {(!isLandingPage || pathname?.includes('/dashboard')) && (
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
                              {userProfile?.full_name || userProfile?.display_name || user.email?.split('@')[0] || 'User'}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Debug role info - only show in development */}
                    {process.env.NODE_ENV === 'development' && (
                      <DebugRoleInfo roleInfo={roleInfo} />
                    )}

                    {/* Admin role fixer - only show for admins in development */}
                    {process.env.NODE_ENV === 'development' && isAdmin && (
                      <AdminRoleFixer onRefresh={handleRefreshRole} />
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
