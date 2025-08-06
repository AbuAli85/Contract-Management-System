"use client"

import React from "react"
import Link from "next/link"
import { 
  FileText, 
  Users, 
  Target, 
  BarChart3, 
  Settings, 
  Bell, 
  Home,
  User,
  Building2,
  FileBarChart,
  UserPlus,
  TrendingUp,
  Briefcase,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SimpleSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function SimpleSidebar({ isOpen, onClose }: SimpleSidebarProps) {
  const navigationItems = [
    {
      label: "Dashboard",
      href: "/en/dashboard",
      icon: Home,
      description: "Overview and metrics"
    },
    {
      label: "Generate Contract",
      href: "/en/generate-contract", 
      icon: FileText,
      description: "Create new contracts"
    },
    {
      label: "Contracts",
      href: "/en/contracts",
      icon: FileText,
      description: "Manage all contracts"
    },
    {
      label: "Promoters",
      href: "/en/manage-promoters",
      icon: Users,
      description: "Manage promoters",
      badge: "160"
    },
    {
      label: "Companies", 
      href: "/en/manage-parties",
      icon: Building2,
      description: "Manage companies",
      badge: "16"
    },
    {
      label: "Analytics",
      href: "/en/dashboard/analytics",
      icon: BarChart3,
      description: "Performance metrics"
    },
    {
      label: "Reports",
      href: "/en/dashboard/reports", 
      icon: FileBarChart,
      description: "Generate reports"
    },
    {
      label: "User Management",
      href: "/en/dashboard/users",
      icon: UserPlus,
      description: "Manage users"
    },
    {
      label: "Notifications",
      href: "/en/notifications",
      icon: Bell,
      description: "View notifications"
    },
    {
      label: "Profile",
      href: "/en/profile",
      icon: User,
      description: "User profile"
    },
    {
      label: "Settings",
      href: "/en/settings",
      icon: Settings,
      description: "System settings"
    }
  ]

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-card border-r border-border shadow-lg z-50
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Briefcase className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">Contract System</h2>
              <p className="text-xs text-muted-foreground">Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <nav className="p-2 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm 
                           hover:bg-accent hover:text-accent-foreground 
                           transition-colors duration-200"
                  onClick={onClose}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{item.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {item.description}
                    </div>
                  </div>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            <span>System Online</span>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </>
  )
}
