"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"

import { usePermissions } from "@/hooks/use-permissions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { Home, BarChart3, FilePlus, UserCheck, User, Bell, Shield, Moon, Sun, Building2, Briefcase, FileCheck, FileX, FileSearch, FileEdit,  } from 'lucide-react'
import { useTheme } from "next-themes"
import type { Action } from "@/lib/permissions"

interface NavItem {
  href: string
  label: string
  labelAr: string
  icon: React.ElementType
  permission?: Action
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  children?: Omit<NavItem, "children">[]
}

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function ProfessionalSidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const permissions = usePermissions()
  const [mounted, setMounted] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["dashboard"]))

  // Extract locale from pathname
  const locale =
    pathname && pathname.startsWith("/en/")
      ? "en"
      : pathname && pathname.startsWith("/ar/")
        ? "ar"
        : "en"

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const navigationItems: NavItem[] = [
    {
      href: `/${locale}/dashboard`,
      label: "Dashboard",
      labelAr: "لوحة التحكم",
      icon: Home,
      permission: "system:analytics",
    },
    {
      href: `/${locale}/dashboard/analytics`,
      label: "Analytics",
      labelAr: "التحليلات",
      icon: BarChart3,
      permission: "system:analytics",
      badge: "New",
      badgeVariant: "secondary",
    },
    {
      href: `/${locale}/contracts`,
      label: "Contracts",
      labelAr: "العقود",
      icon: FileText,
      permission: "contract:read",
    },
    {
      href: `/${locale}/generate-contract`,
      label: "Generate Contract",
      labelAr: "إنشاء عقد",
      icon: FilePlus,
      permission: "contract:create",
      badge: "AI",
      badgeVariant: "default",
    },
    {
      href: `/${locale}/dashboard/approvals`,
      label: "Contract Approvals",
      labelAr: "موافقات العقود",
      icon: FileCheck,
      permission: "contract:approve",
      badge: "New",
      badgeVariant: "default",
    },
    {
      href: `/${locale}/manage-promoters`,
      label: "Promoters",
      labelAr: "الوسطاء",
      icon: Users,
      permission: "promoter:read",
    },
    {
      href: `/${locale}/manage-parties`,
      label: "Parties",
      labelAr: "الأطراف",
      icon: Building2,
      permission: "party:read",
    },
    {
      href: `/${locale}/dashboard/user-management`,
      label: "User Management",
      labelAr: "إدارة المستخدمين",
      icon: UserCog,
      permission: "user:read",
    },
    {
      href: `/${locale}/dashboard/user-approvals`,
      label: "User Approvals",
      labelAr: "موافقات المستخدمين",
      icon: UserCheck,
      permission: "user:create",
      badge: "New",
      badgeVariant: "secondary",
    },
    {
      href: `/${locale}/dashboard/roles`,
      label: "Roles & Permissions",
      labelAr: "الأدوار والصلاحيات",
      icon: Shield,
      permission: "user:read",
    },
    {
      href: `/${locale}/dashboard/audit`,
      label: "Audit Logs",
      labelAr: "سجلات التدقيق",
      icon: Activity,
      permission: "system:audit_logs",
    },
    {
      href: `/${locale}/dashboard/notifications`,
      label: "Notifications",
      labelAr: "الإشعارات",
      icon: Bell,
      permission: "system:notifications",
    },
    {
      href: `/${locale}/dashboard/settings`,
      label: "Settings",
      labelAr: "الإعدادات",
      icon: Settings,
      permission: "system:settings",
    },
  ]

  const isActive = (href: string) => {
    return pathname === href || (pathname && pathname.startsWith(href + "/"))
  }

  const hasPermission = (permission?: Action) => {
    if (!permission) return true
    return permissions.can(permission)
  }

  const filteredItems = navigationItems.filter((item) => hasPermission(item.permission))

  if (!mounted) {
    return (
      <div className="flex h-screen w-64 flex-col border-r bg-background">
        <div className="flex h-14 items-center border-b px-4">
          <div className="h-8 w-8 animate-pulse rounded bg-muted" />
        </div>
        <div className="flex-1 space-y-2 p-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded bg-muted" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "flex h-screen flex-col border-r bg-background transition-all duration-300",
        isCollapsed ? "w-16" : "w-64",
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <FileText className="h-5 w-5 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Contract Manager</span>
              <span className="text-xs text-muted-foreground">Professional</span>
            </div>
          )}
        </div>
        {onToggle && (
          <Button variant="ghost" size="sm" onClick={onToggle} className="ml-auto h-8 w-8 p-0">
            <PanelLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            const Icon = item.icon
            const isItemActive = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                  isItemActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isItemActive ? "text-primary" : "text-muted-foreground",
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{locale === "ar" ? item.labelAr : item.label}</span>
                    {item.badge && (
                      <Badge variant={item.badgeVariant || "secondary"} className="text-xs">
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-8 w-8 p-0"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>
          {!isCollapsed && <div className="flex-1 text-xs text-muted-foreground">Role: Admin</div>}
        </div>
      </div>
    </div>
  )
}
