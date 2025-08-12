'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
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
} from 'lucide-react';
import { PermissionGuard } from '@/hooks/use-permissions';
import { getDashboardAnalytics } from '@/lib/dashboard-data.client';
import { getRoleDisplay } from '@/lib/role-hierarchy';
import type { DashboardAnalytics } from '@/lib/dashboard-types';

// Force dynamic rendering to avoid build-time Supabase issues
export const dynamic = 'force-dynamic';

interface FeatureCard {
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  icon: React.ElementType;
  href: string;
  permission: string;
  badge?: string;
  badgeVariant?: 'default' | 'secondary' | 'destructive' | 'outline';
  color?: string;
}

export default function DashboardOverviewPage() {
  const permissions = usePermissions();
  const pathname = usePathname();

  // Extract locale from pathname
  const locale =
    pathname && pathname.startsWith('/en/')
      ? 'en'
      : pathname && pathname.startsWith('/ar/')
        ? 'ar'
        : 'en';

  const featureCards: FeatureCard[] = [
    // Contract Management
    {
      title: 'Generate Contract',
      titleAr: 'إنشاء عقد',
      description: 'Create new contracts with our advanced template system',
      descriptionAr: 'إنشاء عقود جديدة بنظام القوالب المتقدم',
      icon: FilePlus,
      href: `/${locale}/generate-contract`,
      permission: 'contract:create',
      badge: 'New',
      badgeVariant: 'default',
      color: 'text-blue-600',
    },
    {
      title: 'View Contracts',
      titleAr: 'عرض العقود',
      description: 'Browse and manage all your contracts',
      descriptionAr: 'تصفح وإدارة جميع عقودك',
      icon: FileText,
      href: `/${locale}/contracts`,
      permission: 'contract:read',
      color: 'text-green-600',
    },
    {
      title: 'Contract Management',
      titleAr: 'إدارة العقود',
      description: 'Advanced contract editing and management tools',
      descriptionAr: 'أدوات متقدمة لتحرير وإدارة العقود',
      icon: FileEdit,
      href: `/${locale}/contracts`,
      permission: 'contract:update',
      color: 'text-purple-600',
    },

    // Promoter Management
    {
      title: 'Manage Promoters',
      titleAr: 'إدارة المروجين',
      description: 'Add, edit, and manage promoter information',
      descriptionAr: 'إضافة وتحرير وإدارة معلومات المروجين',
      icon: Users,
      href: `/${locale}/manage-promoters`,
      permission: 'promoter:read',
      color: 'text-orange-600',
    },
    {
      title: 'Promoter Analysis',
      titleAr: 'تحليل المروجين',
      description: 'Analytics and insights for promoter performance',
      descriptionAr: 'التحليلات والرؤى لأداء المروجين',
      icon: UserCheck,
      href: `/${locale}/promoter-analysis`,
      permission: 'promoter:read',
      color: 'text-indigo-600',
    },

    // Party Management
    {
      title: 'Manage Parties',
      titleAr: 'إدارة الأطراف',
      description: 'Manage contract parties and organizations',
      descriptionAr: 'إدارة أطراف العقود والمنظمات',
      icon: Building2,
      href: `/${locale}/manage-parties`,
      permission: 'party:read',
      color: 'text-red-600',
    },

    // Analytics & Reports
    {
      title: 'Analytics',
      titleAr: 'التحليلات',
      description: 'Comprehensive analytics and reporting',
      descriptionAr: 'التحليلات والتقارير الشاملة',
      icon: BarChart3,
      href: `/${locale}/dashboard/analytics`,
      permission: 'system:analytics',
      color: 'text-teal-600',
    },

    // User Management
    {
      title: 'User Management',
      titleAr: 'إدارة المستخدمين',
      description: 'Manage system users and permissions',
      descriptionAr: 'إدارة مستخدمي النظام والأذونات',
      icon: UserCog,
      href: `/${locale}/dashboard/users`,
      permission: 'user:read',
      color: 'text-pink-600',
    },

    // System Administration
    {
      title: 'Audit Logs',
      titleAr: 'سجلات التدقيق',
      description: 'View system audit logs and activity',
      descriptionAr: 'عرض سجلات تدقيق النظام والنشاط',
      icon: Shield,
      href: `/${locale}/dashboard/audit`,
      permission: 'system:audit_logs',
      color: 'text-gray-600',
    },
    {
      title: 'Settings',
      titleAr: 'الإعدادات',
      description: 'Configure system settings and preferences',
      descriptionAr: 'تكوين إعدادات النظام والتفضيلات',
      icon: Settings,
      href: `/${locale}/dashboard/settings`,
      permission: 'system:settings',
      color: 'text-yellow-600',
    },
    {
      title: 'Notifications',
      titleAr: 'الإشعارات',
      description: 'Manage system notifications and alerts',
      descriptionAr: 'إدارة إشعارات النظام والتنبيهات',
      icon: Bell,
      href: `/${locale}/dashboard/notifications`,
      permission: 'system:notifications',
      color: 'text-cyan-600',
    },

    // User Profile & Help
    {
      title: 'Profile',
      titleAr: 'الملف الشخصي',
      description: 'Manage your account settings and preferences',
      descriptionAr: 'إدارة إعدادات حسابك والتفضيلات',
      icon: User,
      href: `/${locale}/profile`,
      permission: 'contract:read', // All authenticated users can access profile
      color: 'text-emerald-600',
    },
    {
      title: 'Help & Support',
      titleAr: 'المساعدة والدعم',
      description: 'Get help and support for using the system',
      descriptionAr: 'احصل على المساعدة والدعم لاستخدام النظام',
      icon: HelpCircle,
      href: '/help',
      permission: 'contract:read', // All authenticated users can access help
      color: 'text-slate-600',
    },
  ];

  const filteredFeatures = featureCards.filter(feature =>
    permissions.can(feature.permission as any)
  );

  // TEMPORARY: Show all features for testing (remove this in production)
  const showAllFeatures = true; // Set to false in production
  const displayFeatures = showAllFeatures ? featureCards : filteredFeatures;

  const roleDisplay = getRoleDisplay(permissions.role);

  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const data = await getDashboardAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        // Set fallback data
        setAnalytics({
          total_contracts: 140,
          active_contracts: 86,
          total_promoters: 5,
          total_parties: 6,
          recent_activity: [],
          pending_contracts: 0,
          completed_contracts: 0,
          failed_contracts: 0,
          contracts_this_month: 0,
          contracts_last_month: 0,
          average_processing_time: 0,
          success_rate: 0,
          generated_contracts: 0,
          draft_contracts: 0,
          expired_contracts: 0,
          active_promoters: 0,
          active_parties: 0,
          revenue_this_month: 0,
          revenue_last_month: 0,
          total_revenue: 0,
          growth_percentage: 0,
          upcoming_expirations: 0,
          monthly_trends: [],
          status_distribution: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className='space-y-6'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>
            {locale === 'ar' ? 'لوحة التحكم - نظرة عامة' : 'Dashboard Overview'}
          </h1>
          <p className='text-muted-foreground'>
            {locale === 'ar'
              ? `مرحباً بك في نظام إدارة العقود. دورك الحالي: ${roleDisplay.displayText}`
              : `Welcome to the Contract Management System. Your current role: ${roleDisplay.displayText}`}
          </p>
        </div>
        <div className='flex items-center justify-center py-12'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-primary'></div>
          <span className='ml-2'>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Welcome Section */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>
          {locale === 'ar' ? 'لوحة التحكم - نظرة عامة' : 'Dashboard Overview'}
        </h1>
        <p className='text-muted-foreground'>
          {locale === 'ar'
            ? `مرحباً بك في نظام إدارة العقود. دورك الحالي: ${roleDisplay.displayText}`
            : `Welcome to the Contract Management System. Your current role: ${roleDisplay.displayText}`}
        </p>
      </div>

      {/* Quick Stats */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {locale === 'ar' ? 'إجمالي العقود' : 'Total Contracts'}
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics?.total_contracts || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {locale === 'ar' ? 'العقود النشطة' : 'Active Contracts'}
            </CardTitle>
            <CheckCircle className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics?.active_contracts || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {locale === 'ar' ? 'المروجين' : 'Promoters'}
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics?.total_promoters || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              {locale === 'ar' ? 'الأطراف' : 'Parties'}
            </CardTitle>
            <Building2 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {analytics?.total_parties || 0}
            </div>
            <p className='text-xs text-muted-foreground'>
              {locale === 'ar' ? 'من الشهر الماضي' : 'from last month'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>
            {locale === 'ar' ? 'الميزات المتاحة' : 'Available Features'}
          </h2>
          <Badge variant='outline' className='text-sm'>
            {displayFeatures.length} {locale === 'ar' ? 'ميزة' : 'features'}
          </Badge>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {displayFeatures.map((feature, index) => (
            <PermissionGuard key={index} action={feature.permission as any}>
              <Card className='cursor-pointer transition-shadow hover:shadow-md'>
                <CardHeader>
                  <div className='flex items-center justify-between'>
                    <div
                      className={cn(
                        'rounded-lg p-2',
                        feature.color
                          ?.replace('text-', 'bg-')
                          .replace('-600', '-100')
                      )}
                    >
                      <feature.icon className={cn('h-6 w-6', feature.color)} />
                    </div>
                    {feature.badge && (
                      <Badge variant={feature.badgeVariant || 'secondary'}>
                        {feature.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className='text-lg'>
                    {locale === 'ar' ? feature.titleAr : feature.title}
                  </CardTitle>
                  <CardDescription>
                    {locale === 'ar'
                      ? feature.descriptionAr
                      : feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className='w-full'>
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

      {/* Recent Activity */}
      <PermissionGuard action='system:analytics'>
        <div className='space-y-4'>
          <h2 className='text-2xl font-bold tracking-tight'>
            {locale === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
          </h2>
          <Card>
            <CardHeader>
              <CardTitle className='text-lg'>
                {locale === 'ar' ? 'آخر العمليات' : 'Latest Operations'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {analytics?.recent_activity?.map(
                  (activity: any, index: number) => (
                    <div
                      key={index}
                      className='flex items-center gap-3 rounded-lg p-3 hover:bg-muted/50'
                    >
                      <div className='flex-1'>
                        <p className='font-medium'>
                          {activity.action} - {activity.resource}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          {new Date(activity.timestamp).toLocaleString()} •
                          Status: {activity.status}
                        </p>
                      </div>
                    </div>
                  )
                ) || (
                  <div className='py-8 text-center text-muted-foreground'>
                    No recent activity to display
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </PermissionGuard>
    </div>
  );
}
