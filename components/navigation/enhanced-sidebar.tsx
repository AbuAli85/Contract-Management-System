"use client"

import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider'
import { getNavigationItems, getRoleInfo } from '@/lib/enhanced-rbac'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  Home, LogOut, User, Settings, Bell, 
  Calendar, Star, Heart, BarChart3, 
  Clock, MapPin, CreditCard
} from 'lucide-react'

interface EnhancedSidebarProps {
  className?: string
}

export function EnhancedSidebar({ className }: EnhancedSidebarProps) {
  const { userRole, hasPermission } = useEnhancedRBAC()
  const pathname = usePathname()

  if (!userRole) {
    return null
  }

  const navigationItems = getNavigationItems(userRole)
  const roleInfo = getRoleInfo(userRole)

  // Role-specific navigation sections
  const clientNavItems = [
    {
      label: 'Browse Services',
      href: '/services',
      icon: '🏢',
      permission: 'dashboard.view' as const
    },
    {
      label: 'My Bookings',
      href: '/client/bookings',
      icon: '📅',
      permission: 'bookings.view_own' as const
    },
    {
      label: 'Favorites',
      href: '/client/favorites',
      icon: '❤️',
      permission: 'favorites.manage' as const
    },
    {
      label: 'Reviews',
      href: '/client/reviews',
      icon: '⭐',
      permission: 'reviews.create' as const
    }
  ]

  const providerNavItems = [
    {
      label: 'My Services',
      href: '/provider/services',
      icon: '⚙️',
      permission: 'services.edit_own' as const
    },
    {
      label: 'Bookings',
      href: '/provider/bookings',
      icon: '📋',
      permission: 'bookings.view_provider' as const
    },
    {
      label: 'Availability',
      href: '/provider/availability',
      icon: '⏰',
      permission: 'availability.manage' as const
    },
    {
      label: 'Analytics',
      href: '/provider/analytics',
      icon: '📊',
      permission: 'analytics.view_own' as const
    },
    {
      label: 'Reviews',
      href: '/provider/reviews',
      icon: '💬',
      permission: 'reviews.edit_own' as const
    }
  ]

  const adminNavItems = [
    {
      label: 'Users',
      href: '/admin/users',
      icon: '👥',
      permission: 'users.view' as const
    },
    {
      label: 'Companies',
      href: '/admin/companies',
      icon: '🏢',
      permission: 'companies.view' as const
    },
    {
      label: 'System Settings',
      href: '/admin/settings',
      icon: '⚙️',
      permission: 'system.settings' as const
    },
    {
      label: 'Reports',
      href: '/admin/reports',
      icon: '📈',
      permission: 'reports.view_all' as const
    }
  ]

  // Get role-specific items
  const getRoleSpecificItems = () => {
    switch (userRole) {
      case 'client':
      case 'user':
        return clientNavItems
      case 'provider':
        return providerNavItems
      case 'admin':
      case 'super_admin':
        return [...providerNavItems, ...adminNavItems]
      case 'manager':
        return [...clientNavItems, ...providerNavItems.slice(0, 2), ...adminNavItems.slice(0, 2)]
      default:
        return []
    }
  }

  const roleSpecificItems = getRoleSpecificItems()

  return (
    <div className={cn("flex flex-col h-full bg-white border-r border-gray-200", className)}>
      {/* Role Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{roleInfo.icon}</div>
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-medium text-gray-900 truncate">
              {roleInfo.label}
            </h2>
            <Badge className={cn("text-xs", roleInfo.color)}>
              {userRole}
            </Badge>
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
          {roleInfo.description}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {/* Dashboard Link */}
        <Link
          href={`/dashboard/${userRole === 'super_admin' || userRole === 'admin' ? 'admin' : userRole}`}
          className={cn(
            "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
            pathname.includes('/dashboard') && !pathname.includes('/dashboard/') 
              ? "bg-blue-100 text-blue-700" 
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <Home className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>

        {/* Role-specific navigation */}
        {roleSpecificItems.length > 0 && (
          <>
            <Separator className="my-3" />
            <div className="space-y-1">
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {userRole === 'client' || userRole === 'user' ? 'Client Tools' : 
                 userRole === 'provider' ? 'Provider Tools' : 'Management'}
              </h3>
              {roleSpecificItems.map((item) => {
                if (!hasPermission(item.permission)) return null
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      pathname === item.href 
                        ? "bg-blue-100 text-blue-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <span className="text-base">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </>
        )}

        {/* Common navigation items */}
        <Separator className="my-3" />
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Account
          </h3>
          
          <Link
            href="/profile"
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === '/profile' 
                ? "bg-blue-100 text-blue-700" 
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <User className="h-4 w-4" />
            <span>Profile</span>
          </Link>

          {hasPermission('notifications.view_own') && (
            <Link
              href="/notifications"
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                pathname === '/notifications' 
                  ? "bg-blue-100 text-blue-700" 
                  : "text-gray-700 hover:bg-gray-100"
              )}
            >
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </Link>
          )}

          <Link
            href="/settings"
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              pathname === '/settings' 
                ? "bg-blue-100 text-blue-700" 
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => {
            // Handle logout
            window.location.href = '/auth/logout'
          }}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  )
}

// Quick action buttons for different roles
interface QuickActionsProps {
  userRole: string
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const { hasPermission } = useEnhancedRBAC()

  const getQuickActions = () => {
    switch (userRole) {
      case 'client':
      case 'user':
        return [
          {
            label: 'Book Service',
            href: '/services',
            icon: Calendar,
            permission: 'bookings.create' as const,
            color: 'bg-blue-600 hover:bg-blue-700'
          },
          {
            label: 'View Bookings',
            href: '/client/bookings',
            icon: Clock,
            permission: 'bookings.view_own' as const,
            color: 'bg-green-600 hover:bg-green-700'
          }
        ]
      case 'provider':
        return [
          {
            label: 'Add Service',
            href: '/provider/services/new',
            icon: Plus,
            permission: 'services.create' as const,
            color: 'bg-green-600 hover:bg-green-700'
          },
          {
            label: 'Manage Bookings',
            href: '/provider/bookings',
            icon: Calendar,
            permission: 'bookings.view_provider' as const,
            color: 'bg-blue-600 hover:bg-blue-700'
          }
        ]
      default:
        return []
    }
  }

  const quickActions = getQuickActions()

  if (quickActions.length === 0) return null

  return (
    <div className="p-4 space-y-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
        Quick Actions
      </h3>
      {quickActions.map((action) => {
        if (!hasPermission(action.permission)) return null
        
        return (
          <Link key={action.href} href={action.href}>
            <Button className={cn("w-full justify-start", action.color)}>
              <action.icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          </Link>
        )
      })}
    </div>
  )
}