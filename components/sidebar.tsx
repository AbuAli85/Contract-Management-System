"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams, usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-service"
import { usePendingUsersCount } from "@/hooks/use-pending-users"
import { useNotifications } from "@/hooks/use-notifications"
import { useUserProfile } from "@/hooks/use-user-profile"
import { useRolePermissions } from "@/components/user-role-display"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RecentPromoters } from "@/components/recent-promoters"
import { 
  FileText, 
  Users, 
  Target, 
  BarChart3, 
  Settings, 
  Bell, 
  FileSearch,
  User,
  LogOut,
  ChevronRight,
  Crown,
  Briefcase,
  Plus
} from "lucide-react"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const params = useParams()
  const pathname = usePathname()
  const locale = (params?.locale as string) || "en"
  const { user, loading, mounted } = useAuth()
  const { count: pendingUsersCount } = usePendingUsersCount()
  const { totalCount: notificationCount, highPriorityCount } = useNotifications()
  const { profile: userProfile } = useUserProfile()
  const { roleInfo } = useRolePermissions()

  // Show a user-friendly message if no user is available after auth completes
  if (!user && mounted && !loading) {
    return (
      <div className="fixed left-0 top-0 z-50 h-full w-64 bg-card shadow-lg flex flex-col items-center justify-center">
        <div className="text-center">
          <User className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
          <p className="mb-2 text-lg font-semibold text-card-foreground">Not signed in</p>
          <p className="mb-4 text-sm text-muted-foreground">Please log in to access the sidebar features.</p>
          <Button asChild variant="default" className="w-full">
            <Link href={`/${locale}/login`}>Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  const navigationItems = [
    {
      title: "Dashboard",
      href: `/${locale}/dashboard`,
      icon: BarChart3,
      description: "Overview and analytics",
      badge: null
    },
    {
      title: "Generate Contract",
      href: `/${locale}/generate-contract`,
      icon: FileText,
      description: "Create new contracts",
      badge: "New"
    },
    {
      title: "Contracts",
      href: `/${locale}/contracts`,
      icon: FileSearch,
      description: "View all contracts",
      badge: null
    },
    {
      title: "Manage Parties",
      href: `/${locale}/manage-parties`,
      icon: Users,
      description: "Manage contract parties",
      badge: null
    },
    {
      title: "Manage Promoters",
      href: `/${locale}/manage-promoters`,
      icon: Target,
      description: "Comprehensive promoter management",
      badge: null
    },
    {
      title: "Promoter Profiles",
      href: `/${locale}/promoter-details`,
      icon: User,
      description: "View and manage promoter profiles",
      badge: null
    },
    {
      title: "Promoter Analysis",
      href: `/${locale}/promoter-analysis`,
      icon: BarChart3,
      description: "Analytics and performance reports",
      badge: null
    },
    {
      title: "User Management",
      href: `/${locale}/dashboard/users`,
      icon: User,
      description: "Manage system users",
      badge: null
    },
    {
      title: "User Approvals",
      href: `/${locale}/dashboard/users/approvals`,
      icon: Users,
      description: "Approve pending users",
      badge: (pendingUsersCount && pendingUsersCount > 0) ? pendingUsersCount.toString() : null
    },
    {
      title: "Settings",
      href: `/${locale}/dashboard/settings`,
      icon: Settings,
      description: "System settings",
      badge: null
    },
    {
      title: "Notifications",
      href: `/${locale}/dashboard/notifications`,
      icon: Bell,
      description: "View notifications",
      badge: (notificationCount && notificationCount > 0) ? notificationCount.toString() : null
    },
    {
      title: "Audit Logs",
      href: `/${locale}/dashboard/audit`,
      icon: FileSearch,
      description: "System audit logs",
      badge: null
    },
  ]

  const isActiveRoute = (href: string) => {
    return pathname === href || (pathname && pathname.startsWith(href + '/'))
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-64 transform bg-card shadow-lg transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:shadow-none ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-border p-4">
            <Link href={`/${locale}`} className="flex items-center space-x-2">
              <div className="rounded-lg bg-primary p-2">
                <FileText className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <span className="text-xl font-bold text-card-foreground">ContractGen</span>
                <p className="text-xs text-muted-foreground">v1.0.0</p>
              </div>
            </Link>
          </div>

          {/* User Profile Section */}
          {user && (
            <div className="border-b border-border p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">
                    {userProfile?.full_name || userProfile?.display_name || user.email?.split('@')[0] || 'User'}
                  </p>
                  <div className="flex items-center gap-1">
                    <Crown className="h-3 w-3 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">
                      {roleInfo.displayText}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Main Navigation
              </h3>

              {(navigationItems || []).map((item) => {
                const IconComponent = item.icon
                const isActive = isActiveRoute(item.href)
                
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    className={`group flex items-center space-x-3 rounded-lg px-3 py-2 text-sm transition-all duration-200 ${
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    }`}
                    onClick={() => {
                      console.log("🧭 Sidebar: Navigating to", item.href)
                      // Close sidebar on mobile after navigation
                      if (window.innerWidth < 768) {
                        onClose()
                      }
                    }}
                  >
                    <IconComponent className={`h-4 w-4 ${isActive ? "text-primary-foreground" : "text-muted-foreground"}`} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.title}</span>
                        {item.badge && (
                          <Badge 
                            variant={isActive ? "secondary" : "outline"} 
                            className="text-xs"
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      <div className={`text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                        {item.description}
                      </div>
                    </div>
                    <ChevronRight className={`h-3 w-3 transition-transform ${isActive ? "rotate-90" : ""}`} />
                  </Link>
                )
              })}
            </div>

            {/* Recent Promoters Section */}
            <div className="mt-6">
              <RecentPromoters limit={3} />
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>System Status</span>
                <Badge variant="outline" className="text-xs">
                  Online
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                asChild
              >
                <Link href={`/${locale}/logout`}>
                  <LogOut className="mr-2 h-3 w-3" />
                  Logout
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
