'use client'

import { usePathname } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/authenticated-layout'
import { UserProfile } from '@/auth/components/user-profile'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import {
  FileText,
  FilePlus,
  Users,
  Building2,
  CheckCircle,
  Clock,
  TrendingUp,
  BarChart3,
  UserCheck,
  Activity,
  Plus,
  ArrowRight,
  Briefcase,
  Star,
  Calendar,
  Bell,
  Settings,
  HelpCircle,
} from "lucide-react"
import { PermissionGuard } from "@/hooks/use-permissions"
import { getDashboardAnalytics } from "@/lib/dashboard-data.client"
import type { DashboardAnalytics } from "@/lib/dashboard-types"
import { useEffect, useState } from "react"
import { PendingApprovalsNotification } from "@/components/dashboard/pending-approvals-notification"

// Force dynamic rendering to avoid build-time Supabase issues
export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  const pathname = usePathname()
  const locale = pathname && pathname.startsWith('/en/') ? 'en' : pathname && pathname.startsWith('/ar/') ? 'ar' : 'en'
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)
  
  useEffect(() => {
    getDashboardAnalytics().then(setAnalytics)
  }, [])

  const quickActions = [
    {
      title: "Generate Contract",
      titleAr: "إنشاء عقد",
      description: "Create a new contract",
      descriptionAr: "إنشاء عقد جديد",
      icon: FilePlus,
      href: `/${locale}/generate-contract`,
      permission: "contract:create",
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "View Contracts",
      titleAr: "عرض العقود",
      description: "Browse all contracts",
      descriptionAr: "تصفح جميع العقود",
      icon: FileText,
      href: `/${locale}/contracts`,
      permission: "contract:read",
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Manage Promoters",
      titleAr: "إدارة المروجين",
      description: "Add or edit promoters",
      descriptionAr: "إضافة أو تعديل المروجين",
      icon: Users,
      href: `/${locale}/manage-promoters`,
      permission: "promoter:read",
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    },
    {
      title: "Manage Parties",
      titleAr: "إدارة الأطراف",
      description: "Manage contract parties",
      descriptionAr: "إدارة أطراف العقود",
      icon: Building2,
      href: `/${locale}/manage-parties`,
      permission: "party:read",
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    }
  ]

  const recentActivities = [
    {
      id: 1,
      action: "Contract Created",
      resource: "Service Agreement #2024-001",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      status: "completed",
      icon: FilePlus
    },
    {
      id: 2,
      action: "Promoter Added",
      resource: "John Smith",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      status: "completed",
      icon: UserCheck
    },
    {
      id: 3,
      action: "Contract Approved",
      resource: "Partnership Agreement #2024-002",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      status: "completed",
      icon: CheckCircle
    },
    {
      id: 4,
      action: "Party Updated",
      resource: "ABC Corporation",
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
      status: "completed",
      icon: Building2
    }
  ]

  if (!analytics) {
    return (
      <AuthenticatedLayout locale={locale}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading dashboard data...</p>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }
  
  return (
    <AuthenticatedLayout locale={locale}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground">
            {locale === 'ar' 
              ? 'مرحباً بك في نظام إدارة العقود'
              : 'Welcome to the Contract Management System'
            }
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'إجمالي العقود' : 'Total Contracts'}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_contracts}</div>
              <p className="text-xs text-muted-foreground">
                {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'العقود النشطة' : 'Active Contracts'}
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.active_contracts}</div>
              <p className="text-xs text-muted-foreground">
                {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'المروجين' : 'Promoters'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_promoters}</div>
              <p className="text-xs text-muted-foreground">
                {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'الأطراف' : 'Parties'}
              </CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_parties}</div>
              <p className="text-xs text-muted-foreground">
                {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Approvals Notification */}
        <PendingApprovalsNotification />

        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              {locale === 'ar' ? 'الإجراءات السريعة' : 'Quick Actions'}
            </h2>
            <Badge variant="outline" className="text-sm">
              {quickActions.length} {locale === 'ar' ? 'إجراء' : 'actions'}
            </Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action, index) => (
              <PermissionGuard key={index} action={action.permission as any}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2 rounded-lg", action.bgColor)}>
                        <action.icon className={cn("h-6 w-6", action.color)} />
                      </div>
                    </div>
                    <CardTitle className="text-lg">
                      {locale === 'ar' ? action.titleAr : action.title}
                    </CardTitle>
                    <CardDescription>
                      {locale === 'ar' ? action.descriptionAr : action.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <a href={action.href}>
                        {locale === 'ar' ? 'فتح' : 'Open'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </PermissionGuard>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <PermissionGuard action="system:analytics">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold tracking-tight">
              {locale === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {locale === 'ar' ? 'آخر العمليات' : 'Latest Operations'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                      <div className={cn("p-2 rounded-lg", "bg-blue-50")}>
                        <activity.icon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action} - {activity.resource}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.timestamp.toLocaleString()} • Status: {activity.status}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </PermissionGuard>

        {/* User Profile Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold tracking-tight">
            {locale === 'ar' ? 'الملف الشخصي' : 'User Profile'}
          </h2>
          <Card>
            <CardContent className="p-6">
              <UserProfile />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 