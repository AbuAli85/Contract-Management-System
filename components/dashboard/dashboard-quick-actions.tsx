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
  TrendingUp,
  ArrowUpRight
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
          bg: 'bg-gradient-to-br from-blue-50 to-blue-100 group-hover:from-blue-100 group-hover:to-blue-200',
          icon: 'text-blue-600 group-hover:text-blue-700',
          border: 'border-blue-200 group-hover:border-blue-300',
          shadow: 'shadow-blue-500/20 group-hover:shadow-blue-500/30'
        }
      case 'green':
        return {
          bg: 'bg-gradient-to-br from-green-50 to-green-100 group-hover:from-green-100 group-hover:to-green-200',
          icon: 'text-green-600 group-hover:text-green-700',
          border: 'border-green-200 group-hover:border-green-300',
          shadow: 'shadow-green-500/20 group-hover:shadow-green-500/30'
        }
      case 'purple':
        return {
          bg: 'bg-gradient-to-br from-purple-50 to-purple-100 group-hover:from-purple-100 group-hover:to-purple-200',
          icon: 'text-purple-600 group-hover:text-purple-700',
          border: 'border-purple-200 group-hover:border-purple-300',
          shadow: 'shadow-purple-500/20 group-hover:shadow-purple-500/30'
        }
      case 'indigo':
        return {
          bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100 group-hover:from-indigo-100 group-hover:to-indigo-200',
          icon: 'text-indigo-600 group-hover:text-indigo-700',
          border: 'border-indigo-200 group-hover:border-indigo-300',
          shadow: 'shadow-indigo-500/20 group-hover:shadow-indigo-500/30'
        }
      case 'orange':
        return {
          bg: 'bg-gradient-to-br from-orange-50 to-orange-100 group-hover:from-orange-100 group-hover:to-orange-200',
          icon: 'text-orange-600 group-hover:text-orange-700',
          border: 'border-orange-200 group-hover:border-orange-300',
          shadow: 'shadow-orange-500/20 group-hover:shadow-orange-500/30'
        }
      case 'teal':
        return {
          bg: 'bg-gradient-to-br from-teal-50 to-teal-100 group-hover:from-teal-100 group-hover:to-teal-200',
          icon: 'text-teal-600 group-hover:text-teal-700',
          border: 'border-teal-200 group-hover:border-teal-300',
          shadow: 'shadow-teal-500/20 group-hover:shadow-teal-500/30'
        }
      case 'pink':
        return {
          bg: 'bg-gradient-to-br from-pink-50 to-pink-100 group-hover:from-pink-100 group-hover:to-pink-200',
          icon: 'text-pink-600 group-hover:text-pink-700',
          border: 'border-pink-200 group-hover:border-pink-300',
          shadow: 'shadow-pink-500/20 group-hover:shadow-pink-500/30'
        }
      case 'cyan':
        return {
          bg: 'bg-gradient-to-br from-cyan-50 to-cyan-100 group-hover:from-cyan-100 group-hover:to-cyan-200',
          icon: 'text-cyan-600 group-hover:text-cyan-700',
          border: 'border-cyan-200 group-hover:border-cyan-300',
          shadow: 'shadow-cyan-500/20 group-hover:shadow-cyan-500/30'
        }
      default:
        return {
          bg: 'bg-gradient-to-br from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-200',
          icon: 'text-gray-600 group-hover:text-gray-700',
          border: 'border-gray-200 group-hover:border-gray-300',
          shadow: 'shadow-gray-500/20 group-hover:shadow-gray-500/30'
        }
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action, index) => {
          const colors = getColorClasses(action.color)
          const Icon = action.icon
          
          return (
            <Link
              key={index}
              href={action.href}
              className={cn(
                "group relative rounded-2xl border p-6 transition-all duration-300 hover:scale-105 hover:-translate-y-1",
                colors.bg,
                colors.border,
                `hover:shadow-xl ${colors.shadow}`
              )}
            >
              {action.badge && (
                <div className="absolute -top-2 -right-2">
                  <span className="inline-flex items-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg ring-2 ring-white">
                    ✨ {action.badge}
                  </span>
                </div>
              )}
              
              <div className="flex items-start gap-4">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300 group-hover:scale-110",
                  colors.icon.includes('blue') && "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25",
                  colors.icon.includes('green') && "bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg shadow-green-500/25",
                  colors.icon.includes('purple') && "bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/25",
                  colors.icon.includes('indigo') && "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25",
                  colors.icon.includes('orange') && "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25",
                  colors.icon.includes('teal') && "bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/25",
                  colors.icon.includes('pink') && "bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-lg shadow-pink-500/25",
                  colors.icon.includes('cyan') && "bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-lg shadow-cyan-500/25",
                  colors.icon.includes('gray') && "bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/25"
                )}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-900 group-hover:text-slate-800 transition-colors mb-1">
                    {action.title}
                  </h3>
                  <p className="text-sm text-slate-600 group-hover:text-slate-700 transition-colors">
                    {action.description}
                  </p>
                </div>
                
                <ArrowUpRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-all duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
