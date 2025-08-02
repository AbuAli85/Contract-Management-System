"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Plus,
  Users,
  FileText,
  Eye,
  BarChart3,
  Settings,
  Download,
  Upload,
  Search,
  Calendar,
  Building2,
  UserPlus,
  FilePlus,
  TrendingUp
} from "lucide-react"
import Link from "next/link"

interface QuickAction {
  title: string
  description: string
  icon: React.ComponentType<any>
  href: string
  color: string
  badge?: string
}

interface DashboardQuickActionsProps {
  locale: string
}

export function DashboardQuickActions({ locale }: DashboardQuickActionsProps) {
  const quickActions: QuickAction[] = [
    {
      title: "Generate Contract",
      description: "Create a new contract document",
      icon: FilePlus,
      href: `/${locale}/generate-contract`,
      color: "blue",
      badge: "Popular"
    },
    {
      title: "Add Promoter",
      description: "Register a new promoter",
      icon: UserPlus,
      href: `/${locale}/manage-promoters/new`,
      color: "green"
    },
    {
      title: "Manage Promoters",
      description: "View and manage all promoters",
      icon: Users,
      href: `/${locale}/manage-promoters`,
      color: "purple"
    },
    {
      title: "View Contracts",
      description: "Browse all contract documents",
      icon: Eye,
      href: `/${locale}/contracts`,
      color: "indigo"
    },
    {
      title: "Analytics Dashboard",
      description: "View detailed reports and analytics",
      icon: TrendingUp,
      href: `/${locale}/analytics`,
      color: "orange"
    },
    {
      title: "Manage Companies",
      description: "Add and manage company information",
      icon: Building2,
      href: `/${locale}/manage-parties`,
      color: "teal"
    },
    {
      title: "Import Data",
      description: "Import promoters from Excel files",
      icon: Upload,
      href: `/${locale}/import`,
      color: "pink"
    },
    {
      title: "Export Reports",
      description: "Download system reports and data",
      icon: Download,
      href: `/${locale}/export`,
      color: "cyan"
    },
    {
      title: "System Settings",
      description: "Configure system preferences",
      icon: Settings,
      href: `/${locale}/settings`,
      color: "gray"
    }
  ]

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-100 group-hover:bg-blue-200',
          icon: 'text-blue-600',
          hover: 'group-hover:text-blue-600'
        }
      case 'green':
        return {
          bg: 'bg-green-100 group-hover:bg-green-200',
          icon: 'text-green-600',
          hover: 'group-hover:text-green-600'
        }
      case 'purple':
        return {
          bg: 'bg-purple-100 group-hover:bg-purple-200',
          icon: 'text-purple-600',
          hover: 'group-hover:text-purple-600'
        }
      case 'indigo':
        return {
          bg: 'bg-indigo-100 group-hover:bg-indigo-200',
          icon: 'text-indigo-600',
          hover: 'group-hover:text-indigo-600'
        }
      case 'orange':
        return {
          bg: 'bg-orange-100 group-hover:bg-orange-200',
          icon: 'text-orange-600',
          hover: 'group-hover:text-orange-600'
        }
      case 'teal':
        return {
          bg: 'bg-teal-100 group-hover:bg-teal-200',
          icon: 'text-teal-600',
          hover: 'group-hover:text-teal-600'
        }
      case 'pink':
        return {
          bg: 'bg-pink-100 group-hover:bg-pink-200',
          icon: 'text-pink-600',
          hover: 'group-hover:text-pink-600'
        }
      case 'cyan':
        return {
          bg: 'bg-cyan-100 group-hover:bg-cyan-200',
          icon: 'text-cyan-600',
          hover: 'group-hover:text-cyan-600'
        }
      default:
        return {
          bg: 'bg-gray-100 group-hover:bg-gray-200',
          icon: 'text-gray-600',
          hover: 'group-hover:text-gray-600'
        }
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          Quick Actions
        </CardTitle>
        <CardDescription>
          Access the most common features and workflows
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => {
            const colors = getColorClasses(action.color)
            const Icon = action.icon
            
            return (
              <Link
                key={index}
                href={action.href}
                className="group relative rounded-lg border border-border p-6 hover:bg-accent transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
              >
                {action.badge && (
                  <div className="absolute top-2 right-2">
                    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      {action.badge}
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "rounded-lg p-3 transition-colors",
                    colors.bg
                  )}>
                    <Icon className={cn("h-6 w-6", colors.icon)} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={cn(
                      "font-semibold transition-colors",
                      colors.hover
                    )}>
                      {action.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {action.description}
                    </p>
                  </div>
                </div>

                {/* Hover effect indicator */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              </Link>
            )
          })}
        </div>

        {/* Additional action buttons */}
        <div className="flex gap-2 mt-6 pt-6 border-t">
          <Button variant="outline" size="sm" className="flex-1">
            <Search className="mr-2 h-4 w-4" />
            Advanced Search
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Task
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
