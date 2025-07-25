"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search,
  Bell,
  Settings,
  User,
  LogOut,
  Menu,
  Plus,
  Filter,
  Download,
  Upload,
  HelpCircle,
  Sun,
  Moon,
  ChevronDown,
  Globe,
  Shield,
  Activity,
  FileText,
  Users,
  Building2,
  BarChart3,
  Settings as SettingsIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { useAuth } from "@/src/components/auth/auth-provider"
import { usePermissions } from "@/hooks/use-permissions"

interface HeaderProps {
  onMenuToggle?: () => void
  showSearch?: boolean
  showActions?: boolean
  title?: string
  subtitle?: string
}

export function ProfessionalHeader({ 
  onMenuToggle, 
  showSearch = true, 
  showActions = true,
  title,
  subtitle
}: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const permissions = usePermissions()
  const [searchQuery, setSearchQuery] = useState("")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement search functionality
    console.log("Searching for:", searchQuery)
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const quickActions = [
    {
      label: "New Contract",
      icon: FileText,
      href: "/contracts/new",
      permission: "contract:create" as const
    },
    {
      label: "Add Promoter",
      icon: Users,
      href: "/promoters/new",
      permission: "promoter:create" as const
    },
    {
      label: "Add Party",
      icon: Building2,
      href: "/parties/new",
      permission: "party:create" as const
    },
    {
      label: "Generate Report",
      icon: BarChart3,
      href: "/dashboard/analytics",
      permission: "system:analytics" as const
    }
  ].filter(action => permissions.can(action.permission))

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onMenuToggle}
          className="mr-2 h-8 w-8 p-0 lg:hidden"
        >
          <Menu className="h-4 w-4" />
        </Button>

        {/* Title Section */}
        {(title || subtitle) && (
          <div className="mr-4 hidden md:flex flex-col">
            {title && <h1 className="text-lg font-semibold">{title}</h1>}
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        )}

        {/* Search Bar */}
        {showSearch && (
          <div className="flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search contracts, promoters, parties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </form>
          </div>
        )}

        {/* Quick Actions */}
        {showActions && (
          <div className="flex items-center gap-2 mr-4">
            {quickActions.slice(0, 2).map((action) => {
              const Icon = action.icon
              return (
                <Button key={action.label} variant="outline" size="sm" asChild>
                  <a href={action.href}>
                    <Icon className="h-4 w-4 mr-2" />
                    {action.label}
                  </a>
                </Button>
              )
            })}
            
            {quickActions.length > 2 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    More
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {quickActions.slice(2).map((action) => {
                    const Icon = action.icon
                    return (
                      <DropdownMenuItem key={action.label} asChild>
                        <a href={action.href} className="flex items-center">
                          <Icon className="h-4 w-4 mr-2" />
                          {action.label}
                        </a>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}

        {/* Right Side Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="h-8 w-8 p-0"
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 relative">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs">
                  3
                </Badge>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <div className="max-h-64 overflow-y-auto">
                <DropdownMenuItem>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">New contract approved</p>
                      <p className="text-xs text-muted-foreground">Contract #12345 has been approved</p>
                      <p className="text-xs text-muted-foreground">2 minutes ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">User registration</p>
                      <p className="text-xs text-muted-foreground">New user waiting for approval</p>
                      <p className="text-xs text-muted-foreground">5 minutes ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">System update</p>
                      <p className="text-xs text-muted-foreground">System maintenance scheduled</p>
                      <p className="text-xs text-muted-foreground">1 hour ago</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="justify-center">
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.user_metadata?.full_name || user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/dashboard/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  Help & Support
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
} 