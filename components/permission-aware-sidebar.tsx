"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  Home,
  BarChart3,
  FileText,
  FilePlus,
  Users,
  UserPlus,
  UserCheck,
  Bell,
  Shield,
  Settings,
  LogOut,
  Moon,
  Sun,
  PanelLeft,
  Package2,
  Building2,
  UserCog,
  ClipboardList,
  FileSpreadsheet,
  Database,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  Search,
  Filter,
  Calendar,
  Clock,
  Star,
  Mail,
  MessageSquare,
  TrendingUp,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Menu,
  X,
  Briefcase,
  Handshake,
  FileCheck,
  FileX,
  FileSearch,
  FileEdit,
  FileArchive,
  FileBarChart,
  FileSettings,
  FileShield,
  FileUser,
  FileClock,
  FileAlert,
  FileSuccess,
  FileWarning,
  FileInfo,
  FileMinus,
  FilePlus2,
  FileType,
  FileDigit,
  FileKey,
  FileLock,
  FileUnlock,
  FileHeart,
  FileCode,
  FileJson,
  FileCsv,
  FilePdf,
  FileWord,
  FileExcel,
  FilePowerpoint,
  FileImage,
  FileVideo,
  FileAudio,
  FileZip,
  FileFolder,
  FileFolderOpen,
  FileFolderPlus,
  FileFolderMinus,
  FileFolderX,
  FileFolderCheck,
  FileFolderSearch,
  FileFolderEdit,
  FileFolderSettings,
  FileFolderShield,
  FileFolderUser,
  FileFolderClock,
  FileFolderAlert,
  FileFolderSuccess,
  FileFolderWarning,
  FileFolderInfo,
  FileFolderHeart,
  FileFolderCode,
  FileFolderJson,
  FileFolderCsv,
  FileFolderPdf,
  FileFolderWord,
  FileFolderExcel,
  FileFolderPowerpoint,
  FileFolderImage,
  FileFolderVideo,
  FileFolderAudio,
  FileFolderZip,
} from "lucide-react"
import { useTheme } from "next-themes"

interface NavItem {
  href: string
  label: string
  labelAr: string
  icon: React.ElementType
  permission?: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  children?: Omit<NavItem, 'children'>[]
}

interface SidebarProps {
  isCollapsed?: boolean
  onToggle?: () => void
}

export function PermissionAwareSidebar({ isCollapsed = false, onToggle }: SidebarProps) {
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()
  const permissions = usePermissions()
  const [mounted, setMounted] = useState(false)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())

  // Extract locale from pathname
  const locale = pathname && pathname.startsWith('/en/') ? 'en' : pathname && pathname.startsWith('/ar/') ? 'ar' : 'en'

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

  // Define all navigation sections with permissions
  const navigationSections = [
    {
      title: "Dashboard",
      titleAr: "لوحة التحكم",
      items: [
        {
          href: `/${locale}/dashboard`,
          label: "Overview",
          labelAr: "نظرة عامة",
          icon: Home,
          permission: "system:analytics"
        },
        {
          href: `/${locale}/dashboard/analytics`,
          label: "Analytics",
          labelAr: "التحليلات",
          icon: BarChart3,
          permission: "system:analytics"
        },
        {
          href: `/${locale}/dashboard/notifications`,
          label: "Notifications",
          labelAr: "الإشعارات",
          icon: Bell,
          permission: "system:notifications"
        }
      ]
    },
    {
      title: "Contract Management",
      titleAr: "إدارة العقود",
      items: [
        {
          href: `/${locale}/generate-contract`,
          label: "Generate Contract",
          labelAr: "إنشاء عقد",
          icon: FilePlus,
          permission: "contract:generate"
        },
        {
          href: `/${locale}/contracts`,
          label: "View Contracts",
          labelAr: "عرض العقود",
          icon: FileText,
          permission: "contract:read"
        },
        {
          href: `/${locale}/dashboard/generate-contract`,
          label: "Contract Templates",
          labelAr: "قوالب العقود",
          icon: FileCheck,
          permission: "contract:create"
        },
        {
          href: `/${locale}/dashboard/contracts`,
          label: "Contract Management",
          labelAr: "إدارة العقود",
          icon: FileEdit,
          permission: "contract:update"
        }
      ]
    },
    {
      title: "Promoter Management",
      titleAr: "إدارة المروجين",
      items: [
        {
          href: `/${locale}/manage-promoters`,
          label: "Manage Promoters",
          labelAr: "إدارة المروجين",
          icon: Users,
          permission: "promoter:read"
        },
        {
          href: `/${locale}/promoter-analysis`,
          label: "Promoter Analysis",
          labelAr: "تحليل المروجين",
          icon: UserCheck,
          permission: "promoter:read"
        }
      ]
    },
    {
      title: "Party Management",
      titleAr: "إدارة الأطراف",
      items: [
        {
          href: `/${locale}/manage-parties`,
          label: "Manage Parties",
          labelAr: "إدارة الأطراف",
          icon: Building2,
          permission: "party:read"
        }
      ]
    },
    {
      title: "User Management",
      titleAr: "إدارة المستخدمين",
      items: [
        {
          href: `/${locale}/dashboard/users`,
          label: "Users",
          labelAr: "المستخدمون",
          icon: Users,
          permission: "user:read"
        },
        {
          href: `/${locale}/dashboard/user-management`,
          label: "User Management",
          labelAr: "إدارة المستخدمين",
          icon: UserCog,
          permission: "user:create"
        }
      ]
    },
    {
      title: "System Administration",
      titleAr: "إدارة النظام",
      items: [
        {
          href: `/${locale}/dashboard/audit`,
          label: "Audit Logs",
          labelAr: "سجلات التدقيق",
          icon: Shield,
          permission: "system:audit_logs"
        },
        {
          href: `/${locale}/dashboard/settings`,
          label: "Settings",
          labelAr: "الإعدادات",
          icon: Settings,
          permission: "system:settings"
        },
        {
          href: `/${locale}/dashboard/admin-tools`,
          label: "Admin Tools",
          labelAr: "أدوات الإدارة",
          icon: Package2,
          permission: "system:settings"
        }
      ]
    }
  ]

  const NavLink = ({ item, isMobile = false }: { item: NavItem; isMobile?: boolean }) => {
    const hasPermission = !item.permission || permissions.can(item.permission as any)
    
    if (!hasPermission) return null

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary hover:bg-accent",
          pathname === item.href ? "bg-accent text-primary" : "text-muted-foreground",
          isMobile ? "text-lg" : "text-sm",
        )}
      >
        <item.icon className="h-4 w-4" />
        <span className={cn(isCollapsed && !isMobile ? "sr-only" : "")}>
          {locale === 'ar' ? item.labelAr : item.label}
        </span>
        {item.badge && (
          <Badge variant={item.badgeVariant || "secondary"} className="ml-auto">
            {item.badge}
          </Badge>
        )}
      </Link>
    )
  }

  const NavLinkIconOnly = ({ item }: { item: NavItem }) => {
    const hasPermission = !item.permission || permissions.can(item.permission as any)
    
    if (!hasPermission) return null

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={item.href}
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-lg transition-colors hover:text-foreground hover:bg-accent md:h-8 md:w-8",
                pathname === item.href ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="sr-only">{locale === 'ar' ? item.labelAr : item.label}</span>
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">
            {locale === 'ar' ? item.labelAr : item.label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const renderSection = (section: any, index: number) => {
    const hasAnyPermission = section.items.some((item: NavItem) => 
      !item.permission || permissions.can(item.permission as any)
    )

    if (!hasAnyPermission) return null

    const isExpanded = expandedSections.has(section.title)
    const sectionId = `section-${index}`

    return (
      <div key={sectionId} className="space-y-1">
        {!isCollapsed && (
          <div className="flex items-center justify-between px-3 py-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {locale === 'ar' ? section.titleAr : section.title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection(section.title)}
              className="h-4 w-4 p-0"
            >
              {isExpanded ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
            </Button>
          </div>
        )}
        
        <div className={cn(
          "space-y-1",
          !isCollapsed && !isExpanded && "hidden"
        )}>
          {section.items.map((item: NavItem, itemIndex: number) => (
            <div key={`${sectionId}-item-${itemIndex}`}>
              {isCollapsed ? (
                <NavLinkIconOnly item={item} />
              ) : (
                <NavLink item={item} />
              )}
            </div>
          ))}
        </div>
        
        {!isCollapsed && index < navigationSections.length - 1 && (
          <Separator className="my-2" />
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      "flex h-full flex-col border-r bg-background",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex h-14 items-center border-b px-3">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <Package2 className="h-6 w-6" />
            <span className="font-semibold">Contract Manager</span>
          </div>
        )}
        {isCollapsed && (
          <Package2 className="h-6 w-6 mx-auto" />
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-2">
        <div className="space-y-2 px-3">
          {navigationSections.map((section, index) => renderSection(section, index))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          {mounted && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className={cn(
                "h-8 w-8 p-0",
                isCollapsed ? "mx-auto" : ""
              )}
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          )}
          
          {!isCollapsed && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Role: {permissions.role}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Mobile sidebar component
export function MobileSidebar() {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0">
        <PermissionAwareSidebar isCollapsed={false} />
      </SheetContent>
    </Sheet>
  )
} 