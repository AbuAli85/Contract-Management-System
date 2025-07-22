"use client"

import React from "react"
import { usePathname } from "next/navigation"
import { usePermissions } from "@/hooks/use-permissions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  UserCog,
  User,
  Bell,
  Shield,
  Settings,
  Package2,
  Building2,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Star,
  Mail,
  MessageSquare,
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
} from "lucide-react"
import { PermissionGuard } from "@/hooks/use-permissions"

// Force dynamic rendering to avoid build-time Supabase issues
export const dynamic = 'force-dynamic'

interface FeatureCard {
  title: string
  titleAr: string
  description: string
  descriptionAr: string
  icon: React.ElementType
  href: string
  permission: string
  badge?: string
  badgeVariant?: "default" | "secondary" | "destructive" | "outline"
  color?: string
}

export default function DashboardPage() {
  const permissions = usePermissions()
  const pathname = usePathname()
  
  // Extract locale from pathname
  const locale = pathname && pathname.startsWith('/en/') ? 'en' : pathname && pathname.startsWith('/ar/') ? 'ar' : 'en'

  const featureCards: FeatureCard[] = [
    // Contract Management
    {
      title: "Generate Contract",
      titleAr: "إنشاء عقد",
      description: "Create new contracts with our advanced template system",
      descriptionAr: "إنشاء عقود جديدة بنظام القوالب المتقدم",
      icon: FilePlus,
      href: `/${locale}/generate-contract`,
      permission: "contract:create",
      badge: "New",
      badgeVariant: "default",
      color: "text-blue-600"
    },
    {
      title: "View Contracts",
      titleAr: "عرض العقود",
      description: "Browse and manage all your contracts",
      descriptionAr: "تصفح وإدارة جميع عقودك",
      icon: FileText,
      href: `/${locale}/contracts`,
      permission: "contract:read",
      color: "text-green-600"
    },
    {
      title: "Contract Management",
      titleAr: "إدارة العقود",
      description: "Advanced contract editing and management tools",
      descriptionAr: "أدوات متقدمة لتحرير وإدارة العقود",
      icon: FileEdit,
      href: `/${locale}/dashboard/contracts`,
      permission: "contract:update",
      color: "text-purple-600"
    },
    
    // Promoter Management
    {
      title: "Manage Promoters",
      titleAr: "إدارة المروجين",
      description: "Add, edit, and manage promoter information",
      descriptionAr: "إضافة وتحرير وإدارة معلومات المروجين",
      icon: Users,
      href: `/${locale}/manage-promoters`,
      permission: "promoter:read",
      color: "text-orange-600"
    },
    {
      title: "Promoter Analysis",
      titleAr: "تحليل المروجين",
      description: "Analytics and insights for promoter performance",
      descriptionAr: "التحليلات والرؤى لأداء المروجين",
      icon: UserCheck,
      href: `/${locale}/promoter-analysis`,
      permission: "promoter:read",
      color: "text-indigo-600"
    },
    
    // Party Management
    {
      title: "Manage Parties",
      titleAr: "إدارة الأطراف",
      description: "Manage contract parties and organizations",
      descriptionAr: "إدارة أطراف العقود والمنظمات",
      icon: Building2,
      href: `/${locale}/manage-parties`,
      permission: "party:read",
      color: "text-red-600"
    },
    
    // Analytics & Reports
    {
      title: "Analytics",
      titleAr: "التحليلات",
      description: "Comprehensive analytics and reporting",
      descriptionAr: "التحليلات والتقارير الشاملة",
      icon: BarChart3,
      href: `/${locale}/dashboard/analytics`,
      permission: "system:analytics",
      color: "text-teal-600"
    },
    
    // User Management
    {
      title: "User Management",
      titleAr: "إدارة المستخدمين",
      description: "Manage system users and permissions",
      descriptionAr: "إدارة مستخدمي النظام والأذونات",
      icon: UserCog,
      href: `/${locale}/dashboard/users`,
      permission: "user:read",
      color: "text-pink-600"
    },
    
    // System Administration
    {
      title: "Audit Logs",
      titleAr: "سجلات التدقيق",
      description: "View system audit logs and activity",
      descriptionAr: "عرض سجلات تدقيق النظام والنشاط",
      icon: Shield,
      href: `/${locale}/dashboard/audit`,
      permission: "system:audit_logs",
      color: "text-gray-600"
    },
    {
      title: "Settings",
      titleAr: "الإعدادات",
      description: "Configure system settings and preferences",
      descriptionAr: "تكوين إعدادات النظام والتفضيلات",
      icon: Settings,
      href: `/${locale}/dashboard/settings`,
      permission: "system:settings",
      color: "text-yellow-600"
    },
    {
      title: "Notifications",
      titleAr: "الإشعارات",
      description: "Manage system notifications and alerts",
      descriptionAr: "إدارة إشعارات النظام والتنبيهات",
      icon: Bell,
      href: `/${locale}/dashboard/notifications`,
      permission: "system:notifications",
      color: "text-cyan-600"
    },
    
    // User Profile & Help
    {
      title: "Profile",
      titleAr: "الملف الشخصي",
      description: "Manage your account settings and preferences",
      descriptionAr: "إدارة إعدادات حسابك والتفضيلات",
      icon: User,
      href: `/${locale}/profile`,
      permission: "contract:read", // All authenticated users can access profile
      color: "text-emerald-600"
    },
    {
      title: "Help & Support",
      titleAr: "المساعدة والدعم",
      description: "Get help and support for using the system",
      descriptionAr: "احصل على المساعدة والدعم لاستخدام النظام",
      icon: HelpCircle,
      href: "/help",
      permission: "contract:read", // All authenticated users can access help
      color: "text-slate-600"
    }
  ]

  const filteredFeatures = featureCards.filter(feature => 
    permissions.can(feature.permission as any)
  )

  // TEMPORARY: Show all features for testing (remove this in production)
  const showAllFeatures = true // Set to false in production
  const displayFeatures = showAllFeatures ? featureCards : filteredFeatures

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return { en: 'Administrator', ar: 'مدير النظام' }
      case 'manager':
        return { en: 'Manager', ar: 'مدير' }
      case 'user':
        return { en: 'User', ar: 'مستخدم' }
      default:
        return { en: 'User', ar: 'مستخدم' }
    }
  }

  const roleDisplay = getRoleDisplayName(permissions.role)

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {locale === 'ar' ? 'مرحباً بك في نظام إدارة العقود' : 'Welcome to Contract Management System'}
        </h1>
        <p className="text-muted-foreground">
          {locale === 'ar' 
            ? `مرحباً بك، ${roleDisplay.ar}. اختر من الميزات المتاحة أدناه للبدء.`
            : `Welcome, ${roleDisplay.en}. Choose from the available features below to get started.`
          }
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline">
            {locale === 'ar' ? roleDisplay.ar : roleDisplay.en}
          </Badge>
          <Badge variant="secondary">
            {permissions.roles.length} {locale === 'ar' ? 'أدوار' : 'roles'}
          </Badge>
        </div>
      </div>

        <Separator />

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'العقود النشطة' : 'Active Contracts'}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +2 {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
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
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                +12 {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
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
              <div className="text-2xl font-bold">89</div>
              <p className="text-xs text-muted-foreground">
                +5 {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {locale === 'ar' ? 'المستخدمين' : 'Users'}
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                +1 {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">
              {locale === 'ar' ? 'الميزات المتاحة' : 'Available Features'}
            </h2>
            <Badge variant="outline">
              {displayFeatures.length} {locale === 'ar' ? 'ميزة' : 'features'}
            </Badge>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayFeatures.map((feature, index) => (
              <PermissionGuard key={index} action={feature.permission as any}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className={cn("p-2 rounded-lg", feature.color?.replace('text-', 'bg-').replace('-600', '-100'))}>
                        <feature.icon className={cn("h-6 w-6", feature.color)} />
                      </div>
                      {feature.badge && (
                        <Badge variant={feature.badgeVariant || "secondary"}>
                          {feature.badge}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg">
                      {locale === 'ar' ? feature.titleAr : feature.title}
                    </CardTitle>
                    <CardDescription>
                      {locale === 'ar' ? feature.descriptionAr : feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full">
                      <a href={feature.href}>
                        {locale === 'ar' ? 'فتح' : 'Open'}
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </PermissionGuard>
            ))}
          </div>
        </div>

        {/* Admin Setup Link (Temporary) */}
        <div className="space-y-4">
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
            <CardHeader>
              <CardTitle className="text-lg text-orange-800 dark:text-orange-200">
                🚀 Quick Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-orange-700 dark:text-orange-300 mb-4">
                Need admin access to see all features? Click below to setup admin privileges.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.href = '/setup-admin'}
                className="border-orange-300 text-orange-700 hover:bg-orange-100"
              >
                Setup Admin Access
              </Button>
            </CardContent>
          </Card>
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
                  {[
                    { action: 'Contract Generated', user: 'John Doe', time: '2 minutes ago', icon: FilePlus, color: 'text-green-600' },
                    { action: 'Promoter Added', user: 'Jane Smith', time: '5 minutes ago', icon: UserPlus, color: 'text-blue-600' },
                    { action: 'Party Updated', user: 'Mike Johnson', time: '10 minutes ago', icon: Building2, color: 'text-orange-600' },
                    { action: 'Contract Approved', user: 'Sarah Wilson', time: '15 minutes ago', icon: CheckCircle, color: 'text-purple-600' },
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50">
                      <div className={cn("p-2 rounded-full bg-muted", activity.color)}>
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{activity.action}</p>
                        <p className="text-sm text-muted-foreground">
                          by {activity.user} • {activity.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </PermissionGuard>
      </div>
  )
} 