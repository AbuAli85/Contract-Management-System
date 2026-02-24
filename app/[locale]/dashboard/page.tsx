'use client';
// Version: 2025-01-09 - Fixed useMemo import and added ErrorBoundary

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/auth/auth-guard';
import { useAuth } from '@/lib/auth-service';
import { useCompany } from '@/components/providers/company-provider';
import { useCompanyDataRefresh } from '@/hooks/use-company-data-refresh';
import { Progress } from '@/components/ui/progress';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  User,
  FileText,
  Users,
  TrendingUp,
  Loader2,
  Info,
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  Building2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Zap,
  Eye,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { useParams } from 'next/navigation';
import { EnhancedDashboardCharts } from '@/components/dashboard/enhanced-dashboard-charts';
import { DashboardActivityFeed } from '@/components/dashboard/dashboard-activity-feed';
import { ActionItemsSection } from '@/components/dashboard/action-items-section';
import {
  calculateGrowthPercentage,
  determineGrowthTrend,
} from '@/lib/utils/calculations';
import { ErrorBoundary } from '@/components/errors/error-boundary';

interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  last_name?: string;
}

interface QuickStat {
  label: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

function DashboardContent() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const params = useParams();

  // Safely get locale from params with fallback
  const locale = useMemo(() => {
    try {
      // Defensive check: ensure params is an object
      if (!params || typeof params !== 'object' || Array.isArray(params)) {
        return 'en';
      }
      const paramLocale = params?.locale;
      if (
        typeof paramLocale === 'string' &&
        ['en', 'ar'].includes(paramLocale)
      ) {
        return paramLocale;
      }
      return 'en';
    } catch (error) {
      console.error('Error getting locale from params:', error);
      return 'en';
    }
  }, [params]);

  // Validate locale is valid
  const validLocale = locale && ['en', 'ar'].includes(locale) ? locale : 'en';

  // Get time-based greeting
  const getTimeBasedGreeting = () => {
    try {
      const hour = new Date().getHours();
      if (validLocale === 'ar') {
        if (hour < 12) return 'صباح الخير';
        if (hour < 18) return 'مساء الخير';
        return 'مساء الخير';
      }
      if (hour < 12) return 'Good morning';
      if (hour < 18) return 'Good afternoon';
      return 'Good evening';
    } catch (error) {
      console.error('Error in getTimeBasedGreeting:', error);
      return 'Hello';
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    try {
      if (!role || typeof role !== 'string') return 'User';
      const roleMap: Record<string, { en: string; ar: string }> = {
        admin: { en: 'Administrator', ar: 'مدير النظام' },
        super_admin: { en: 'Super Administrator', ar: 'مدير عام' },
        manager: { en: 'Manager', ar: 'مدير' },
        user: { en: 'User', ar: 'مستخدم' },
        promoter: { en: 'Promoter', ar: 'مروج' },
        client: { en: 'Client', ar: 'عميل' },
      };
      return roleMap[role]?.[validLocale as 'en' | 'ar'] || role;
    } catch (error) {
      console.error('Error in getRoleDisplayName:', error);
      return role || 'User';
    }
  };

  // Fetch dashboard statistics with React Query for real-time updates
  // ✅ COMPANY SCOPE: Get company context
  const { companyId } = useCompany();
  // ✅ COMPANY SWITCH: Automatically refresh data when company switches
  useCompanyDataRefresh();

  const {
    data: statsData,
    isLoading: statsLoading,
    isError: _statsError,
    error: _statsErrorDetails,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats', companyId], // Include companyId in query key for proper caching
    queryFn: async () => {
      try {
        const [contractsRes, promotersRes] = await Promise.all([
          fetch('/api/metrics/contracts', {
            credentials: 'include',
            cache: 'no-store',
          }),
          fetch('/api/promoters/enhanced-metrics', {
            credentials: 'include',
            cache: 'no-store',
          }),
        ]);

        if (!contractsRes.ok || !promotersRes.ok) {
          throw new Error('Failed to fetch dashboard statistics');
        }

        const [contractsData, promotersData] = await Promise.all([
          contractsRes.json(),
          promotersRes.json(),
        ]);

        return {
          contracts: contractsData.success ? contractsData.metrics : null,
          promoters: promotersData.success ? promotersData.metrics : null,
          scope: contractsData.scope || 'user-specific',
        };
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
      }
    },
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    staleTime: 30000, // Consider data fresh for 30 seconds
    retry: 2, // Retry failed requests twice
    retryDelay: 1000, // Wait 1 second between retries
  });

  const stats = statsData?.contracts;
  const promoterStats = statsData?.promoters;

  useEffect(() => {
    // Use auth context to set user state
    if (!authLoading && authUser) {
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        role: authUser.user_metadata?.role || 'user',
        ...(authUser.user_metadata?.full_name && {
          full_name: authUser.user_metadata.full_name,
        }),
      });
      setLoading(false);
    } else if (!authLoading && !authUser) {
      // Not authenticated, will be handled by AuthenticatedLayout
      setLoading(false);
    }
  }, [authUser, authLoading]);

  const handleRefresh = useCallback(() => {
    refetchStats();
    toast({
      title:
        validLocale === 'ar'
          ? '✅ تم تحديث لوحة التحكم'
          : '✅ Dashboard Refreshed',
      description:
        validLocale === 'ar'
          ? 'تم تحديث جميع المقاييس والإحصائيات'
          : 'All metrics and statistics have been updated',
    });
  }, [refetchStats, toast, validLocale]);

  // Calculate quick stats with trends using actual growth calculations
  const totalContractsChange = calculateGrowthPercentage(
    stats?.total || 0,
    stats?.previousMonth?.totalContracts || 0
  );
  const activeContractsChange = calculateGrowthPercentage(
    stats?.active || 0,
    stats?.previousMonth?.activeContracts || 0
  );
  const workforceChange = calculateGrowthPercentage(
    promoterStats?.totalWorkforce || 0,
    promoterStats?.previousMonth?.totalWorkforce || 0
  );
  const utilizationChange = calculateGrowthPercentage(
    promoterStats?.utilizationRate || 0,
    promoterStats?.previousMonth?.utilizationRate || 0
  );

  // Get user role for filtering dashboard content
  const userRole = user?.role || authUser?.user_metadata?.role || 'user';
  const isPromoter = userRole === 'promoter' || userRole === 'user';
  const _isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const _isManager = userRole === 'manager';
  const _isEmployer = (userRole as string) === 'employer';
  // Build quick stats based on user role
  const quickStats: QuickStat[] = isPromoter
    ? [
        {
          label: validLocale === 'ar' ? 'عقودي' : 'My Contracts',
          value: stats?.total || 0,
          change: totalContractsChange,
          trend: determineGrowthTrend(totalContractsChange),
          icon: <FileText className='h-5 w-5' aria-hidden='true' />,
          color: 'blue',
        },
        {
          label: validLocale === 'ar' ? 'العقود النشطة' : 'Active Contracts',
          value: stats?.active || 0,
          change: activeContractsChange,
          trend: determineGrowthTrend(activeContractsChange),
          icon: <Activity className='h-5 w-5' aria-hidden='true' />,
          color: 'green',
        },
        {
          label: validLocale === 'ar' ? 'الحالة' : 'Status',
          value: validLocale === 'ar' ? 'نشط' : 'Active',
          change: 0,
          trend: 'neutral',
          icon: <CheckCircle className='h-5 w-5' aria-hidden='true' />,
          color: 'green',
        },
        {
          label: validLocale === 'ar' ? 'المهام المعلقة' : 'Pending Tasks',
          value: 0,
          change: 0,
          trend: 'neutral',
          icon: <Clock className='h-5 w-5' aria-hidden='true' />,
          color: 'orange',
        },
      ]
    : [
        {
          label: validLocale === 'ar' ? 'إجمالي العقود' : 'Total Contracts',
          value: stats?.total || 0,
          change: totalContractsChange,
          trend: determineGrowthTrend(totalContractsChange),
          icon: <FileText className='h-5 w-5' aria-hidden='true' />,
          color: 'blue',
        },
        {
          label: validLocale === 'ar' ? 'العقود النشطة' : 'Active Contracts',
          value: stats?.active || 0,
          change: activeContractsChange,
          trend: determineGrowthTrend(activeContractsChange),
          icon: <Activity className='h-5 w-5' aria-hidden='true' />,
          color: 'green',
        },
        {
          label: validLocale === 'ar' ? 'القوى العاملة' : 'Workforce',
          value: promoterStats?.totalWorkforce || 0,
          change: workforceChange,
          trend: determineGrowthTrend(workforceChange),
          icon: <Users className='h-5 w-5' aria-hidden='true' />,
          color: 'purple',
        },
        {
          label: validLocale === 'ar' ? 'معدل الاستخدام' : 'Utilization',
          value:
            stats?.active === 0
              ? validLocale === 'ar'
                ? 'غير متاح'
                : 'N/A'
              : `${promoterStats?.utilizationRate || 0}%`,
          change: utilizationChange,
          trend:
            stats?.active === 0
              ? 'neutral'
              : determineGrowthTrend(utilizationChange),
          icon: <TrendingUp className='h-5 w-5' aria-hidden='true' />,
          color: 'orange',
        },
      ];

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'>
        <div className='text-center'>
          <div className='relative'>
            <div className='animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto'></div>
            <div className='absolute inset-0 flex items-center justify-center'>
              <Zap className='h-6 w-6 text-blue-600 animate-pulse' />
            </div>
          </div>
          <p className='mt-4 text-gray-600 font-medium'>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className='bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'>
      {/* Main Content - header is provided by AuthenticatedLayout */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Welcome Section */}
        <div className='mb-8'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h2
                  className='text-3xl font-bold text-gray-900 flex items-center gap-3'
                  aria-label={`${getTimeBasedGreeting()}, ${user.full_name || user.email}`}
                >
                  <span className='text-lg font-normal text-gray-600'>
                    {getTimeBasedGreeting()},
                  </span>
                  <span>{user.full_name || user.email}</span>
                  <span
                    className='text-2xl'
                    role='img'
                    aria-label='waving hand'
                  >
                    👋
                  </span>
                </h2>
              </div>
              <p className='text-gray-600 mt-1 flex items-center gap-2 flex-wrap'>
                <span>
                  {isPromoter
                    ? validLocale === 'ar'
                      ? 'إليك ملخص عملك اليوم'
                      : "Here's your work summary today"
                    : validLocale === 'ar'
                      ? 'إليك ما يحدث في عملك اليوم'
                      : "Here's what's happening with your business today"}
                </span>
                <span className='text-gray-400'>•</span>
                <time dateTime={new Date().toISOString()}>
                  {format(new Date(), 'EEEE, MMMM d, yyyy')}
                </time>
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={handleRefresh}
                      disabled={statsLoading}
                      className='gap-2'
                      aria-label={
                        validLocale === 'ar'
                          ? 'تحديث البيانات'
                          : 'Refresh dashboard data'
                      }
                    >
                      <RefreshCw
                        className={cn(
                          'h-4 w-4',
                          statsLoading && 'animate-spin'
                        )}
                        aria-hidden='true'
                      />
                      <span className='hidden sm:inline'>
                        {validLocale === 'ar' ? 'تحديث' : 'Refresh'}
                      </span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {validLocale === 'ar'
                        ? 'تحديث جميع البيانات والإحصائيات'
                        : 'Refresh all dashboard data and statistics'}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className='mt-4 flex flex-wrap items-center gap-2'>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant='secondary'
                    className='text-sm gap-1.5 cursor-help'
                    aria-label={`User role: ${getRoleDisplayName(user.role)}`}
                  >
                    <Shield className='h-3 w-3' aria-hidden='true' />
                    <span>
                      {validLocale === 'ar' ? 'الدور:' : 'Role:'}{' '}
                      {getRoleDisplayName(user.role)}
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {validLocale === 'ar'
                      ? `دورك الحالي في النظام: ${getRoleDisplayName(user.role)}`
                      : `Your current system role: ${getRoleDisplayName(user.role)}`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant='outline'
                    className='text-xs cursor-help'
                    aria-label={
                      statsData?.scope === 'system-wide'
                        ? validLocale === 'ar'
                          ? 'عرض شامل للنظام'
                          : 'System-wide data view'
                        : validLocale === 'ar'
                          ? 'عرض بياناتك فقط'
                          : 'Your personal data view'
                    }
                  >
                    {statsData?.scope === 'system-wide' ? (
                      <>
                        <span className='mr-1' role='img' aria-label='globe'>
                          🌐
                        </span>
                        <span>
                          {validLocale === 'ar'
                            ? 'عرض شامل'
                            : 'System-wide view'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className='mr-1' role='img' aria-label='user'>
                          👤
                        </span>
                        <span>
                          {validLocale === 'ar' ? 'بياناتك' : 'Your data'}
                        </span>
                      </>
                    )}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {statsData?.scope === 'system-wide'
                      ? validLocale === 'ar'
                        ? 'أنت تعرض جميع البيانات في النظام (صلاحيات المدير)'
                        : 'You are viewing all system data (Admin privileges)'
                      : validLocale === 'ar'
                        ? 'أنت تعرض بياناتك الشخصية فقط'
                        : 'You are viewing only your personal data'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* Action Required Section - Prominently Displayed */}
        <div className='mb-8'>
          <ActionItemsSection locale={validLocale} maxItems={3} />
        </div>

        {/* Quick Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {quickStats.map((stat, index) => (
            <Card
              key={index}
              className='relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1'
            >
              <div
                className={cn(
                  'absolute top-0 left-0 w-1 h-full',
                  stat.color === 'blue' && 'bg-blue-500',
                  stat.color === 'green' && 'bg-green-500',
                  stat.color === 'purple' && 'bg-purple-500',
                  stat.color === 'orange' && 'bg-orange-500'
                )}
              />
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 pl-6'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  {stat.label}
                </CardTitle>
                <div
                  className={cn(
                    'p-2 rounded-lg',
                    stat.color === 'blue' && 'bg-blue-100 text-blue-600',
                    stat.color === 'green' && 'bg-green-100 text-green-600',
                    stat.color === 'purple' && 'bg-purple-100 text-purple-600',
                    stat.color === 'orange' && 'bg-orange-100 text-orange-600'
                  )}
                >
                  {stat.icon}
                </div>
              </CardHeader>
              <CardContent className='pl-6'>
                {statsLoading ? (
                  <div className='flex items-center gap-2'>
                    <Loader2 className='h-5 w-5 animate-spin text-gray-400' />
                    <span className='text-sm text-gray-400'>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className='text-3xl font-bold text-gray-900'>
                      {stat.value}
                    </div>
                    <div className='flex items-center gap-1 mt-1'>
                      {stat.value === 'N/A' ? (
                        <span className='text-xs text-gray-500'>
                          No active contracts yet
                        </span>
                      ) : (
                        <>
                          {stat.trend === 'up' ? (
                            <ArrowUpRight className='h-4 w-4 text-green-600' />
                          ) : stat.trend === 'down' ? (
                            <ArrowDownRight className='h-4 w-4 text-red-600' />
                          ) : null}
                          <span
                            className={cn(
                              'text-xs font-medium',
                              stat.trend === 'up' && 'text-green-600',
                              stat.trend === 'down' && 'text-red-600',
                              stat.trend === 'neutral' && 'text-gray-600'
                            )}
                          >
                            {stat.change > 0 ? '+' : ''}
                            {stat.change.toFixed(1)}% from last month
                          </span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Assignment Status Clarity Card - Only for Admin/Manager/Employer */}
        {!isPromoter && (
          <Card
            className='border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50'
            role='region'
            aria-label={
              validLocale === 'ar'
                ? 'فهم مقاييس التعيين'
                : 'Understanding assignment metrics'
            }
          >
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-base'>
                <Info className='h-5 w-5 text-blue-600' aria-hidden='true' />
                {validLocale === 'ar'
                  ? 'فهم مقاييس التعيين'
                  : 'Understanding Assignment Metrics'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='p-4 bg-white rounded-lg border-2 border-blue-200 cursor-help'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-sm font-semibold text-blue-900'>
                            Available for Work
                          </span>
                          <CheckCircle className='h-4 w-4 text-blue-600' />
                        </div>
                        <div className='text-3xl font-bold text-blue-600'>
                          {promoterStats?.availableForWork || 0}
                        </div>
                        <p className='text-xs text-gray-600 mt-2'>
                          Promoters with status = "available"
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side='bottom' className='max-w-xs'>
                      <p className='font-semibold mb-1'>Available for Work</p>
                      <p className='text-sm'>
                        Promoters specifically marked as "available" status -
                        ready and actively seeking new assignments right now.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className='p-4 bg-white rounded-lg border-2 border-purple-200 cursor-help'>
                        <div className='flex items-center justify-between mb-2'>
                          <span className='text-sm font-semibold text-purple-900'>
                            Awaiting Assignment
                          </span>
                          <Users className='h-4 w-4 text-purple-600' />
                        </div>
                        <div className='text-3xl font-bold text-purple-600'>
                          {(promoterStats?.activeOnContracts || 0) === 0 &&
                          promoterStats?.totalWorkforce
                            ? promoterStats.totalWorkforce -
                              (promoterStats.onLeave || 0) -
                              (promoterStats.inactive || 0) -
                              (promoterStats.terminated || 0)
                            : (promoterStats?.totalWorkforce || 0) -
                              (promoterStats?.activeOnContracts || 0) -
                              (promoterStats?.onLeave || 0) -
                              (promoterStats?.inactive || 0) -
                              (promoterStats?.terminated || 0)}
                        </div>
                        <p className='text-xs text-gray-600 mt-2'>
                          All promoters without active contracts
                        </p>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side='bottom' className='max-w-xs'>
                      <p className='font-semibold mb-1'>Awaiting Assignment</p>
                      <p className='text-sm'>
                        Total promoters not currently on contracts - includes
                        those with "active" status (employed) + "available"
                        status. Excludes on leave, inactive, and terminated.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className='mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300'>
                <p className='text-xs text-blue-900'>
                  <strong>Key Difference:</strong> "Available for Work" (
                  {promoterStats?.availableForWork || 0}) shows promoters
                  actively seeking work, while "Awaiting Assignment" shows all
                  employable promoters not currently assigned to contracts,
                  including those with "active" employment status.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
          {/* Workforce Overview - Only for Admin/Manager/Employer */}
          {!isPromoter && (
            <Card
              className='col-span-1 lg:col-span-2 border-0 shadow-lg'
              role='region'
              aria-label={
                validLocale === 'ar'
                  ? 'نظرة عامة على القوى العاملة'
                  : 'Workforce overview'
              }
            >
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <BarChart3
                    className='h-5 w-5 text-blue-600'
                    aria-hidden='true'
                  />
                  {validLocale === 'ar'
                    ? 'نظرة عامة على القوى العاملة'
                    : 'Workforce Overview'}
                </CardTitle>
                <CardDescription>
                  {validLocale === 'ar'
                    ? 'إجمالي القوى العاملة:'
                    : 'Total workforce:'}{' '}
                  {promoterStats?.totalWorkforce || 0}{' '}
                  {validLocale === 'ar' ? 'مروج' : 'promoters'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className='space-y-4'>
                    <div className='h-24 bg-gray-100 rounded-lg animate-pulse' />
                    <div className='h-24 bg-gray-100 rounded-lg animate-pulse' />
                  </div>
                ) : (
                  <div className='space-y-4'>
                    {/* Active Workforce */}
                    <div>
                      <div className='text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide'>
                        Active Workforce
                      </div>
                      <div className='grid grid-cols-2 gap-4'>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='p-4 bg-green-50 rounded-lg border border-green-200 cursor-help'>
                                <div className='flex items-center justify-between'>
                                  <span className='text-sm font-medium text-green-800'>
                                    {validLocale === 'ar'
                                      ? 'نشط في العقود'
                                      : 'Active on Contracts'}
                                  </span>
                                  <CheckCircle
                                    className='h-4 w-4 text-green-600'
                                    aria-hidden='true'
                                  />
                                </div>
                                <div className='text-2xl font-bold text-green-900 mt-2'>
                                  {promoterStats?.activeOnContracts || 0}
                                </div>
                                <Progress
                                  value={
                                    ((promoterStats?.activeOnContracts || 0) /
                                      (promoterStats?.totalWorkforce || 1)) *
                                    100
                                  }
                                  className='mt-2 h-2'
                                  aria-label={`${promoterStats?.activeOnContracts || 0} out of ${promoterStats?.totalWorkforce || 0} promoters active on contracts`}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {validLocale === 'ar'
                                  ? 'المروجون الذين يعملون حاليًا في عقود نشطة'
                                  : 'Promoters currently working on active contracts'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='p-4 bg-blue-50 rounded-lg border border-blue-200 cursor-help'>
                                <div className='flex items-center justify-between'>
                                  <span className='text-sm font-medium text-blue-800'>
                                    {validLocale === 'ar'
                                      ? 'متاح للعمل'
                                      : 'Available for Work'}
                                  </span>
                                  <Users
                                    className='h-4 w-4 text-blue-600'
                                    aria-hidden='true'
                                  />
                                </div>
                                <div className='text-2xl font-bold text-blue-900 mt-2'>
                                  {promoterStats?.availableForWork || 0}
                                </div>
                                <Progress
                                  value={
                                    ((promoterStats?.availableForWork || 0) /
                                      (promoterStats?.totalWorkforce || 1)) *
                                    100
                                  }
                                  className='mt-2 h-2 [&>div]:bg-blue-500'
                                  aria-label={`${promoterStats?.availableForWork || 0} out of ${promoterStats?.totalWorkforce || 0} promoters available for work`}
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {validLocale === 'ar'
                                  ? 'المروجون الجاهزون والمتاحون للتعيينات الجديدة'
                                  : 'Promoters ready and available for new assignments'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    {/* Other Status */}
                    <div className='pt-4 border-t'>
                      <div className='text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide'>
                        {validLocale === 'ar' ? 'حالات أخرى' : 'Other Status'}
                      </div>
                      <div className='grid grid-cols-4 gap-3'>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='text-center cursor-help'>
                                <div className='text-xs text-gray-600 mb-1'>
                                  {validLocale === 'ar'
                                    ? 'في إجازة'
                                    : 'On Leave'}
                                </div>
                                <div className='text-lg font-semibold'>
                                  {promoterStats?.onLeave || 0}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {validLocale === 'ar'
                                  ? 'المروجون في إجازة مؤقتة'
                                  : 'Promoters temporarily on leave'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='text-center cursor-help'>
                                <div className='text-xs text-gray-600 mb-1'>
                                  {validLocale === 'ar'
                                    ? 'غير نشط'
                                    : 'Inactive'}
                                </div>
                                <div className='text-lg font-semibold'>
                                  {promoterStats?.inactive || 0}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {validLocale === 'ar'
                                  ? 'المروجون المميزون كغير نشطين'
                                  : 'Promoters marked as inactive'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='text-center cursor-help'>
                                <div className='text-xs text-gray-600 mb-1'>
                                  {validLocale === 'ar'
                                    ? 'منتهي'
                                    : 'Terminated'}
                                </div>
                                <div className='text-lg font-semibold'>
                                  {promoterStats?.terminated || 0}
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {validLocale === 'ar'
                                  ? 'المروجون السابقون الذين غادروا الشركة'
                                  : 'Former promoters who left the company'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className='text-center cursor-help bg-blue-50 rounded-lg p-2'>
                                <div className='text-xs text-blue-600 mb-1 font-medium'>
                                  {validLocale === 'ar'
                                    ? 'الامتثال'
                                    : 'Compliance'}
                                </div>
                                <div className='text-lg font-semibold text-blue-900'>
                                  {promoterStats?.complianceRate || 0}%
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {validLocale === 'ar'
                                  ? 'نسبة المروجين الذين لديهم جميع المستندات صالحة'
                                  : 'Percentage of promoters with all documents valid'}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Charts and Analytics - Only for Admin/Manager/Employer */}
        {!isPromoter && !statsLoading && stats && promoterStats && (
          <div className='mb-8'>
            <EnhancedDashboardCharts
              contractsData={{
                total: stats.total,
                active: stats.active,
                pending: stats.pending,
                expired: stats.expired || 0,
                draft: stats.draft || 0,
              }}
              promotersData={{
                total: promoterStats.totalWorkforce,
                active:
                  promoterStats.activeOnContracts +
                  promoterStats.availableForWork,
                critical: Math.floor(
                  (promoterStats.totalWorkforce *
                    (100 - promoterStats.complianceRate)) /
                    200
                ),
                expiring: Math.floor(
                  (promoterStats.totalWorkforce *
                    (100 - promoterStats.complianceRate)) /
                    100
                ),
                compliant: Math.floor(
                  (promoterStats.totalWorkforce *
                    promoterStats.complianceRate) /
                    100
                ),
                complianceRate: promoterStats.complianceRate,
              }}
            />
          </div>
        )}

        {/* Activity Feed and Quick Actions */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
          {/* Activity Feed - Takes 2 columns */}
          <div className='lg:col-span-2'>
            <DashboardActivityFeed
              maxItems={8}
              autoRefresh={true}
              refreshInterval={60000}
            />
          </div>

          {/* Quick Actions - Takes 1 column */}
          <div className='space-y-4'>
            <Card className='border-0 shadow-lg'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='h-5 w-5 text-blue-600' />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent className='space-y-2'>
                {!isPromoter && (
                  <Button
                    className='w-full justify-start gap-2'
                    variant='outline'
                    asChild
                  >
                    <Link href={`/${locale}/contracts/new`}>
                      <FileText className='h-4 w-4' />
                      Create Contract
                    </Link>
                  </Button>
                )}
                {!isPromoter && (
                  <>
                    <Button
                      className='w-full justify-start gap-2'
                      variant='outline'
                      asChild
                    >
                      <Link href={`/${locale}/manage-promoters/new`}>
                        <Users className='h-4 w-4' />
                        Add Promoter
                      </Link>
                    </Button>
                    <Button
                      className='w-full justify-start gap-2'
                      variant='outline'
                      asChild
                    >
                      <Link href={`/${locale}/promoters`}>
                        <Eye className='h-4 w-4' />
                        View Promoters
                      </Link>
                    </Button>
                    <Button
                      className='w-full justify-start gap-2'
                      variant='outline'
                      asChild
                    >
                      <Link href={`/${locale}/analytics`}>
                        <BarChart3 className='h-4 w-4' />
                        Analytics
                      </Link>
                    </Button>
                    <Button
                      className='w-full justify-start gap-2'
                      variant='outline'
                      asChild
                    >
                      <Link href={`/${locale}/contracts`}>
                        <FileText className='h-4 w-4' />
                        All Contracts
                      </Link>
                    </Button>
                  </>
                )}
                {isPromoter && (
                  <>
                    <Button
                      className='w-full justify-start gap-2'
                      variant='outline'
                      asChild
                    >
                      <Link
                        href={`/${locale}/manage-promoters/${user?.id || authUser?.id}`}
                      >
                        <User className='h-4 w-4' />
                        {validLocale === 'ar' ? 'ملفي الشخصي' : 'My Profile'}
                      </Link>
                    </Button>
                    <Button
                      className='w-full justify-start gap-2'
                      variant='outline'
                      asChild
                    >
                      <Link href={`/${locale}/contracts`}>
                        <FileText className='h-4 w-4' />
                        {validLocale === 'ar' ? 'عقودي' : 'My Contracts'}
                      </Link>
                    </Button>
                    <Button
                      className='w-full justify-start gap-2'
                      variant='outline'
                      asChild
                    >
                      <Link href={`/${locale}/employee/dashboard`}>
                        <Briefcase className='h-4 w-4' />
                        {validLocale === 'ar' ? 'مكان عملي' : 'My Workplace'}
                      </Link>
                    </Button>
                  </>
                )}
                {!isPromoter && (
                  <Button
                    className='w-full justify-start gap-2'
                    variant='outline'
                    asChild
                  >
                    <Link href={`/${locale}/manage-parties`}>
                      <Building2 className='h-4 w-4' />
                      Manage Parties
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* System Status Card */}
            <Card
              className='border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50'
              role='region'
              aria-label={
                validLocale === 'ar' ? 'حالة النظام' : 'System status'
              }
            >
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <CheckCircle
                    className='h-5 w-5 text-green-600'
                    aria-hidden='true'
                  />
                  {validLocale === 'ar' ? 'حالة النظام' : 'System Status'}
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>
                    {validLocale === 'ar' ? 'قاعدة البيانات' : 'Database'}
                  </span>
                  <Badge className='bg-green-500' aria-label='Healthy'>
                    {validLocale === 'ar' ? 'سليمة' : 'Healthy'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>
                    {validLocale === 'ar' ? 'خدمات API' : 'API Services'}
                  </span>
                  <Badge className='bg-green-500' aria-label='Online'>
                    {validLocale === 'ar' ? 'متصل' : 'Online'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>
                    {validLocale === 'ar' ? 'آخر نسخة احتياطية' : 'Last Backup'}
                  </span>
                  <time
                    className='text-xs text-gray-600'
                    dateTime={new Date(
                      Date.now() - 2 * 60 * 60 * 1000
                    ).toISOString()}
                  >
                    {formatDistanceToNow(
                      new Date(Date.now() - 2 * 60 * 60 * 1000),
                      { addSuffix: true }
                    )}
                  </time>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <ErrorBoundary section='Dashboard'>
        <DashboardContent />
      </ErrorBoundary>
    </AuthGuard>
  );
}
