"use client"

import React from "react"
import { usePermissions } from "@/hooks/use-permissions"
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
  Folder,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderSearch,
  FolderEdit,
} from "lucide-react"
import { MobileSidebar } from "./permission-aware-sidebar"

interface HeaderProps {
  onSidebarToggle?: () => void
  isSidebarCollapsed?: boolean
}

export function PermissionAwareHeader({ onSidebarToggle, isSidebarCollapsed }: HeaderProps) {
  const permissions = usePermissions()

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
      href: "/generate-contract",
      permission: "contract:create"
    },
    {
      label: "Add Promoter",
      icon: UserPlus,
      href: "/manage-promoters",
      permission: "promoter:create"
    },
    {
      label: "Add Party",
      icon: Building2,
      href: "/manage-parties",
      permission: "party:create"
    },
    {
      label: "Analytics",
      icon: BarChart3,
      href: "/dashboard/analytics",
      permission: "system:analytics"
    }
  ].filter(action => permissions.can(action.permission as any))

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile Sidebar Toggle */}
        <div className="md:hidden">
          <MobileSidebar />
        </div>

        {/* Desktop Sidebar Toggle */}
        <div className="hidden md:flex">
          <Button
            variant="ghost"
            size="sm"
            onClick={onSidebarToggle}
            className="mr-2"
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
        </div>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search contracts, promoters, parties..."
              className="w-full pl-8 pr-4 py-2 text-sm bg-muted border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="hidden lg:flex items-center gap-2 mr-4">
          {quickActions.slice(0, 3).map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              asChild
              className="h-8"
            >
              <a href={action.href}>
                <action.icon className="h-3 w-3 mr-1" />
                {action.label}
              </a>
            </Button>
          ))}
          
          {quickActions.length > 3 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8">
                  <Plus className="h-3 w-3 mr-1" />
                  More
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {quickActions.slice(3).map((action, index) => (
                  <DropdownMenuItem key={index} asChild>
                    <a href={action.href} className="flex items-center">
                      <action.icon className="h-3 w-3 mr-2" />
                      {action.label}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Notifications */}
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
                  <p className="text-sm font-medium leading-none">John Doe</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    john.doe@example.com
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
                <a href="/dashboard/profile" className="flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </a>
              </DropdownMenuItem>
              
              <PermissionGuard action="system:settings">
                <DropdownMenuItem asChild>
                  <a href="/dashboard/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </a>
                </DropdownMenuItem>
              </PermissionGuard>
              
              <PermissionGuard action="system:analytics">
                <DropdownMenuItem asChild>
                  <a href="/dashboard/analytics" className="flex items-center">
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
              
              <DropdownMenuItem asChild>
                <a href="/logout" className="flex items-center text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Log out
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}

// Permission Guard component (re-export from use-permissions)
import { PermissionGuard } from "@/hooks/use-permissions" 