"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import { useAuth } from "@/src/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  User,
  Settings,
  LogOut,
  Bell,
  Search,
  Plus,
  FilePlus,
  Users,
  Building2,
  BarChart3,
  Shield,
  Package2,
  Menu,
  ChevronDown,
  Crown,
  UserCheck,
  UserCog,
  UserPlus,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  Mail,
  MessageSquare,
  TrendingUp,
  ArrowUpDown,
  Filter,
  Calendar,
  Download,
  Upload,
  RefreshCw,
  HelpCircle,
  Info,
  Zap,
  Target,
  Award,
  Trophy,
  Medal,
  Gem,
  Diamond,
  Sparkles,
  Rocket,
  Plane,
  Car,
  Bike,
  Heart,
  Smile,
  Frown,
  Meh,
  ThumbsUp,
  ThumbsDown,
  Hand,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Key,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Battery,
  BatteryFull,
  BatteryCharging,
  Power,
  PowerOff,
  Volume2,
  Volume1,
  VolumeX,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Image,
  ImageOff,
  File,
  FileEdit,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderSearch,
  FolderEdit,
  Sun,
  Moon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

interface HeaderProps {
  onSidebarToggle?: () => void
  isSidebarCollapsed?: boolean
}

export function PermissionAwareHeader({ onSidebarToggle, isSidebarCollapsed }: HeaderProps) {
  const permissions = usePermissions()
  const { user, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()
  
  // Extract locale from pathname
  const locale = pathname && pathname.startsWith('/en/') ? 'en' : pathname && pathname.startsWith('/ar/') ? 'ar' : 'en'

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-3 w-3 text-yellow-500" />
      case 'manager':
        return <UserCheck className="h-3 w-3 text-blue-500" />
      case 'user':
        return <User className="h-3 w-3 text-green-500" />
      default:
        return <User className="h-3 w-3 text-gray-500" />
    }
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return "default" as const
      case 'manager':
        return "secondary" as const
      case 'user':
        return "outline" as const
      default:
        return "outline" as const
    }
  }

  const quickActions = [
    {
      label: "New Contract",
      icon: FilePlus,
      href: `/${locale}/generate-contract`,
      permission: "contract:create"
    },
    {
      label: "Add Promoter",
      icon: UserPlus,
      href: `/${locale}/manage-promoters`,
      permission: "promoter:create"
    },
    {
      label: "Add Party",
      icon: Building2,
      href: `/${locale}/manage-parties`,
      permission: "party:create"
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: `/${locale}/dashboard/analytics`,
      permission: "system:analytics"
    }
  ].filter(action => permissions.can(action.permission as any))

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 shadow-sm">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden">
        <Button variant="ghost" size="sm" onClick={onSidebarToggle}>
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Desktop Sidebar Toggle */}
      <div className="hidden md:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={onSidebarToggle}
          className={cn(
            "transition-all",
            isSidebarCollapsed ? "rotate-180" : ""
          )}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search contracts, promoters, parties..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="hidden md:flex items-center gap-2">
        {quickActions.slice(0, 2).map((action) => (
          <PermissionGuard key={action.label} action={action.permission as any}>
            <Button variant="ghost" size="sm" asChild>
              <a href={action.href} className="flex items-center gap-2">
                <action.icon className="h-4 w-4" />
                <span className="hidden lg:inline">{action.label}</span>
              </a>
            </Button>
          </PermissionGuard>
        ))}
      </div>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      >
        <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        <span className="sr-only">Toggle theme</span>
      </Button>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        <PermissionGuard action="system:notifications">
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-4 w-4 rounded-full p-0 text-xs"
            >
              3
            </Badge>
          </Button>
        </PermissionGuard>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="/placeholder-user.jpg" alt="User" />
                <AvatarFallback>
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.email || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getRoleIcon(permissions.role)}
                  <Badge variant={getRoleBadgeVariant(permissions.role)} className="text-xs">
                    {permissions.role.charAt(0).toUpperCase() + permissions.role.slice(1)}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <a href={`/${locale}/dashboard/profile`} className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Profile
              </a>
            </DropdownMenuItem>
            
            <PermissionGuard action="system:settings">
              <DropdownMenuItem asChild>
                <a href={`/${locale}/dashboard/settings`} className="flex items-center">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </a>
              </DropdownMenuItem>
            </PermissionGuard>
            
            <PermissionGuard action="system:analytics">
              <DropdownMenuItem asChild>
                <a href={`/${locale}/dashboard/analytics`} className="flex items-center">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </a>
              </DropdownMenuItem>
            </PermissionGuard>
            
            <PermissionGuard action="system:audit_logs">
              <DropdownMenuItem asChild>
                <a href="/dashboard/audit" className="flex items-center">
                  <Shield className="h-4 w-4 mr-2" />
                  Audit Logs
                </a>
              </DropdownMenuItem>
            </PermissionGuard>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem asChild>
              <a href="/help" className="flex items-center">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help & Support
              </a>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="h-4 w-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

// Permission Guard component (re-export from use-permissions)
import { PermissionGuard } from "@/hooks/use-permissions" 