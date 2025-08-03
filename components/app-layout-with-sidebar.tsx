"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth-service"
import { useNotifications } from "@/hooks/use-notifications"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { useRolePermissions } from "@/components/user-role-display"
import { useParams, usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { MobileMenuButton } from "./mobile-menu-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
  const { totalCount: notificationCount, highPriorityCount } = useNotifications()
  const { profile: userProfile } = useUserProfile()
  const { isAdmin, isUser, roleInfo } = useRolePermissions()
  const params = useParams()
  const pathname = usePathname()
  const locale = (params?.locale as string) || "en"

  // Silent session timeout - automatically logs out after 5 minutes of inactivity
  useSessionTimeout({
    timeoutMinutes: 5,
    enableLogging: false, // Set to true for debugging
    silent: true // Silent mode - no warnings, just automatic logout
  })

  // Check if we're on the landing page (root route)
  const isLandingPage = pathname === ("/" + locale) || pathname === ("/" + locale + "/")

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

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button - only show if not landing page */}
      {!isLandingPage && (
        <div className="fixed left-4 top-4 z-50 md:hidden">
          <MobileMenuButton isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
      )}

      {/* Layout container */}
      <div className="flex min-h-screen">
        {/* Sidebar - only show if not landing page */}
        {!isLandingPage && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Top header - only show if not landing page */}
          {!isLandingPage && (
            <header className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {/* Welcome message with user name */}
                      {user && (
                        <div className="flex items-center gap-2">
                          <h1 className="text-lg font-semibold text-card-foreground">
                            Welcome back, {userProfile?.display_name || user.email?.split('@')[0] || 'User'}!
                          </h1>
                        </div>
                      )}
                      {!user && (
                        <h1 className="text-lg font-semibold text-card-foreground">
                          {getPageTitle()}
                        </h1>
                      )}
                      {/* Single Role Display */}
                      <Badge variant="outline" className="text-xs">
                        {roleInfo?.displayText || userProfile?.role_display || 'User'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative hidden md:block">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search..."
                        className="w-64 rounded-md border border-border bg-background px-3 py-2 pl-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    {/* Notifications */}
                    <Button variant="outline" size="sm" className="relative">
                      <Bell className="h-4 w-4" />
                      {notificationCount > 0 && (
                        <Badge className={`absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs ${
                          highPriorityCount > 0 ? 'bg-red-500' : 'bg-orange-500'
                        }`}>
                          {notificationCount}
                        </Badge>
                      )}
                    </Button>

                    {/* User Menu */}
                    <div className="flex items-center gap-2">
                      {user && (
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                            {isAdmin ? <Crown className="h-4 w-4" /> : <User className="h-4 w-4" />}
                          </div>
                          <div className="hidden md:block">
                            <p className="text-sm font-medium text-card-foreground">
                              {userProfile?.display_name || user.email?.split('@')[0] || 'User'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {roleInfo?.displayText || userProfile?.role_display || 'User'}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/${locale}/logout`}>
                          <LogOut className="h-4 w-4" />
                          <span className="hidden md:inline ml-2">Logout</span>
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </header>
          )}

          {/* Page content */}
          <main className={"flex-1 " + (!isLandingPage ? "p-6" : "")}>
            <div className="children-container">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
