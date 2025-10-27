'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  TrendingDown,
  LogOut,
  Settings,
  Bell,
  Loader2,
  Info,
  RefreshCw,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Building2,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Shield,
  Zap,
  Eye,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { EnhancedDashboardCharts } from '@/components/dashboard/enhanced-dashboard-charts';
import { DashboardActivityFeed } from '@/components/dashboard/dashboard-activity-feed';
import { calculateGrowthPercentage, determineGrowthTrend } from '@/lib/utils/calculations';

interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  last_name?: string;
}

interface DashboardStats {
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  scope: 'system-wide' | 'user-specific';
  previousMonth?: {
    totalContracts?: number;
    activeContracts?: number;
    pendingContracts?: number;
  };
}

interface PromoterStats {
  totalWorkforce: number;
  activeOnContracts: number;
  availableForWork: number;
  onLeave: number;
  inactive: number;
  utilizationRate: number;
  complianceRate: number;
  previousMonth?: {
    totalWorkforce?: number;
    utilizationRate?: number;
  };
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
  const router = useRouter();
  const { toast } = useToast();

  // Fetch dashboard statistics with React Query for real-time updates
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const [contractsRes, promotersRes] = await Promise.all([
        fetch('/api/metrics/contracts'),
        fetch('/api/promoters/enhanced-metrics')
      ]);
      
      const [contractsData, promotersData] = await Promise.all([
        contractsRes.json(),
        promotersRes.json()
      ]);

      return {
        contracts: contractsData.success ? contractsData.metrics : null,
        promoters: promotersData.success ? promotersData.metrics : null,
        scope: contractsData.scope || 'user-specific',
      };
    },
    refetchInterval: 60000, // Auto-refresh every 60 seconds
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  const stats = statsData?.contracts;
  const promoterStats = statsData?.promoters;

  useEffect(() => {
    // LIMITED CLEANUP - Only clear demo/development data, preserve Supabase sessions
    const limitedCleanup = () => {
      try {
        // Clear only demo session data
        localStorage.removeItem('demo-user-session');
        localStorage.removeItem('user-role');
        localStorage.removeItem('auth-mode');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user-session');
        localStorage.removeItem('admin-session');

        console.log('🧹 Limited cleanup of demo auth data completed');
      } catch (error) {
        console.warn('Could not perform limited cleanup:', error);
      }
    };

    // Perform limited cleanup first
    limitedCleanup();

    // Check for admin session without clearing Supabase data
    const checkForAdminSession = () => {
      try {
        const hasAdminSession =
          localStorage.getItem('demo-user-session') ||
          sessionStorage.getItem('admin-session');

        if (hasAdminSession) {
          console.warn('🚫 Admin session detected - forcing redirect to login');
          router.push('/en/auth/login');
          return;
        }
      } catch (error) {
        console.warn('Could not check for admin session:', error);
      }
    };

    checkForAdminSession();

    // Use auth context instead of API call
    if (!authLoading && authUser) {
      // Block admin@contractmanagement.com if needed
      if (authUser.email === 'admin@contractmanagement.com') {
        console.warn('🚫 Blocked admin@contractmanagement.com access');
        router.push('/en/auth/login');
        return;
      }

      // Set user from auth context
      setUser({
        id: authUser.id,
        email: authUser.email || '',
        role: authUser.user_metadata?.role || 'user',
        ...(authUser.user_metadata?.full_name && { full_name: authUser.user_metadata.full_name }),
      });

      setLoading(false);
    } else if (!authLoading && !authUser) {
      // Not authenticated, will be handled by AuthenticatedLayout
      setLoading(false);
    }
  }, [router, authUser, authLoading]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/en/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleRefresh = useCallback(() => {
    refetchStats();
    toast({
      title: '✅ Dashboard Refreshed',
      description: 'All metrics have been updated',
    });
  }, [refetchStats, toast]);

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

  const quickStats: QuickStat[] = [
    {
      label: 'Total Contracts',
      value: stats?.total || 0,
      change: totalContractsChange,
      trend: determineGrowthTrend(totalContractsChange),
      icon: <FileText className="h-5 w-5" />,
      color: 'blue',
    },
    {
      label: 'Active Contracts',
      value: stats?.active || 0,
      change: activeContractsChange,
      trend: determineGrowthTrend(activeContractsChange),
      icon: <Activity className="h-5 w-5" />,
      color: 'green',
    },
    {
      label: 'Workforce',
      value: promoterStats?.totalWorkforce || 0,
      change: workforceChange,
      trend: determineGrowthTrend(workforceChange),
      icon: <Users className="h-5 w-5" />,
      color: 'purple',
    },
    {
      label: 'Utilization',
      value: `${promoterStats?.utilizationRate || 0}%`,
      change: utilizationChange,
      trend: determineGrowthTrend(utilizationChange),
      icon: <TrendingUp className="h-5 w-5" />,
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
          <p className='mt-4 text-gray-600 font-medium'>Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'>
      {/* Modern Header */}
      <header className='bg-white/80 backdrop-blur-sm shadow-sm border-b border-slate-200/50 sticky top-0 z-50'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center gap-3'>
              <div className='p-2 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg'>
                <Building2 className='h-6 w-6 text-white' />
              </div>
              <div>
                <h1 className='text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent'>
                  Contract Management System
                </h1>
                <p className='text-xs text-slate-500'>Professional Dashboard</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant='outline' className='gap-1.5'>
                <div className='w-2 h-2 bg-green-500 rounded-full animate-pulse' />
                <span className='text-xs'>Live</span>
              </Badge>
              <Button variant='ghost' size='sm' className='relative'>
                <Bell className='h-5 w-5' />
                <span className='absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full' />
              </Button>
              <Button variant='ghost' size='sm'>
                <Settings className='h-5 w-5' />
              </Button>
              <Button variant='ghost' size='sm' onClick={handleLogout}>
                <LogOut className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Welcome Section */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            <div>
              <h2 className='text-3xl font-bold text-gray-900 flex items-center gap-3'>
                Welcome back, {user.full_name || user.email}!
                <span className='text-2xl'>👋</span>
              </h2>
              <p className='text-gray-600 mt-1'>
                Here's what's happening with your business today • {format(new Date(), 'EEEE, MMMM d, yyyy')}
              </p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={handleRefresh}
              disabled={statsLoading}
              className='gap-2'
            >
              <RefreshCw className={cn('h-4 w-4', statsLoading && 'animate-spin')} />
              Refresh
            </Button>
          </div>
          <div className='mt-3 flex items-center gap-2'>
            <Badge variant='secondary' className='text-sm gap-1.5'>
              <User className='h-3 w-3' />
              Role: {user.role}
            </Badge>
            <Badge variant='outline' className='text-xs'>
              {statsData?.scope === 'system-wide' ? '🌐 System-wide view' : '👤 Your data'}
            </Badge>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          {quickStats.map((stat, index) => (
            <Card
              key={index}
              className='relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1'
            >
              <div className={cn(
                'absolute top-0 left-0 w-1 h-full',
                stat.color === 'blue' && 'bg-blue-500',
                stat.color === 'green' && 'bg-green-500',
                stat.color === 'purple' && 'bg-purple-500',
                stat.color === 'orange' && 'bg-orange-500'
              )} />
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2 pl-6'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  {stat.label}
                </CardTitle>
                <div className={cn(
                  'p-2 rounded-lg',
                  stat.color === 'blue' && 'bg-blue-100 text-blue-600',
                  stat.color === 'green' && 'bg-green-100 text-green-600',
                  stat.color === 'purple' && 'bg-purple-100 text-purple-600',
                  stat.color === 'orange' && 'bg-orange-100 text-orange-600'
                )}>
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
                    <div className='text-3xl font-bold text-gray-900'>{stat.value}</div>
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
                          <span className={cn(
                            'text-xs font-medium',
                            stat.trend === 'up' && 'text-green-600',
                            stat.trend === 'down' && 'text-red-600',
                            stat.trend === 'neutral' && 'text-gray-600'
                          )}>
                            {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}% from last month
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

        {/* Assignment Status Clarity Card */}
        <Card className='border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-base'>
              <Info className='h-5 w-5 text-blue-600' />
              Understanding Assignment Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className='p-4 bg-white rounded-lg border-2 border-blue-200 cursor-help'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-semibold text-blue-900'>Available for Work</span>
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
                  <TooltipContent side="bottom" className='max-w-xs'>
                    <p className='font-semibold mb-1'>Available for Work</p>
                    <p className='text-sm'>Promoters specifically marked as "available" status - ready and actively seeking new assignments right now.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className='p-4 bg-white rounded-lg border-2 border-purple-200 cursor-help'>
                      <div className='flex items-center justify-between mb-2'>
                        <span className='text-sm font-semibold text-purple-900'>Awaiting Assignment</span>
                        <Users className='h-4 w-4 text-purple-600' />
                      </div>
                      <div className='text-3xl font-bold text-purple-600'>
                        {((promoterStats?.activeOnContracts || 0) === 0 && promoterStats?.totalWorkforce) 
                          ? (promoterStats.totalWorkforce - (promoterStats.onLeave || 0) - (promoterStats.inactive || 0) - (promoterStats.terminated || 0))
                          : (promoterStats?.totalWorkforce || 0) - (promoterStats?.activeOnContracts || 0) - (promoterStats?.onLeave || 0) - (promoterStats?.inactive || 0) - (promoterStats?.terminated || 0)}
                      </div>
                      <p className='text-xs text-gray-600 mt-2'>
                        All promoters without active contracts
                      </p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className='max-w-xs'>
                    <p className='font-semibold mb-1'>Awaiting Assignment</p>
                    <p className='text-sm'>Total promoters not currently on contracts - includes those with "active" status (employed) + "available" status. Excludes on leave, inactive, and terminated.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className='mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300'>
              <p className='text-xs text-blue-900'>
                <strong>Key Difference:</strong> "Available for Work" ({promoterStats?.availableForWork || 0}) shows promoters actively seeking work, 
                while "Awaiting Assignment" shows all employable promoters not currently assigned to contracts, including those with "active" employment status.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Main Dashboard Grid */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
          {/* Workforce Overview */}
          <Card className='col-span-1 lg:col-span-2 border-0 shadow-lg'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <BarChart3 className='h-5 w-5 text-blue-600' />
                Workforce Overview
              </CardTitle>
              <CardDescription>
                Total workforce: {promoterStats?.totalWorkforce || 0} promoters
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
                    <div className='text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide'>Active Workforce</div>
                    <div className='grid grid-cols-2 gap-4'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className='p-4 bg-green-50 rounded-lg border border-green-200 cursor-help'>
                              <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-green-800'>Active on Contracts</span>
                                <CheckCircle className='h-4 w-4 text-green-600' />
                              </div>
                              <div className='text-2xl font-bold text-green-900 mt-2'>
                                {promoterStats?.activeOnContracts || 0}
                              </div>
                              <Progress value={(promoterStats?.activeOnContracts || 0) / (promoterStats?.totalWorkforce || 1) * 100} className='mt-2 h-2' />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Promoters currently working on active contracts</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className='p-4 bg-blue-50 rounded-lg border border-blue-200 cursor-help'>
                              <div className='flex items-center justify-between'>
                                <span className='text-sm font-medium text-blue-800'>Available for Work</span>
                                <Users className='h-4 w-4 text-blue-600' />
                              </div>
                              <div className='text-2xl font-bold text-blue-900 mt-2'>
                                {promoterStats?.availableForWork || 0}
                              </div>
                              <Progress value={(promoterStats?.availableForWork || 0) / (promoterStats?.totalWorkforce || 1) * 100} className='mt-2 h-2 [&>div]:bg-blue-500' />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Promoters ready and available for new assignments</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>

                  {/* Other Status */}
                  <div className='pt-4 border-t'>
                    <div className='text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide'>Other Status</div>
                    <div className='grid grid-cols-4 gap-3'>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className='text-center cursor-help'>
                              <div className='text-xs text-gray-600 mb-1'>On Leave</div>
                              <div className='text-lg font-semibold'>{promoterStats?.onLeave || 0}</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Promoters temporarily on leave</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className='text-center cursor-help'>
                              <div className='text-xs text-gray-600 mb-1'>Inactive</div>
                              <div className='text-lg font-semibold'>{promoterStats?.inactive || 0}</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Promoters marked as inactive</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className='text-center cursor-help'>
                              <div className='text-xs text-gray-600 mb-1'>Terminated</div>
                              <div className='text-lg font-semibold'>{promoterStats?.terminated || 0}</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Former promoters who left the company</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className='text-center cursor-help bg-blue-50 rounded-lg p-2'>
                              <div className='text-xs text-blue-600 mb-1 font-medium'>Compliance</div>
                              <div className='text-lg font-semibold text-blue-900'>{promoterStats?.complianceRate || 0}%</div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Percentage of promoters with all documents valid</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Charts and Analytics */}
        {!statsLoading && stats && promoterStats && (
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
                active: promoterStats.activeOnContracts + promoterStats.availableForWork,
                critical: Math.floor((promoterStats.totalWorkforce * (100 - promoterStats.complianceRate)) / 200),
                expiring: Math.floor((promoterStats.totalWorkforce * (100 - promoterStats.complianceRate)) / 100),
                compliant: Math.floor(promoterStats.totalWorkforce * promoterStats.complianceRate / 100),
                complianceRate: promoterStats.complianceRate,
              }}
            />
          </div>
        )}

        {/* Activity Feed and Quick Actions */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8'>
          {/* Activity Feed - Takes 2 columns */}
          <div className='lg:col-span-2'>
            <DashboardActivityFeed maxItems={8} autoRefresh={true} refreshInterval={60000} />
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
                <Button className='w-full justify-start gap-2' variant='outline' asChild>
                  <Link href='/en/contracts/new'>
                    <FileText className='h-4 w-4' />
                    Create Contract
                  </Link>
                </Button>
                <Button className='w-full justify-start gap-2' variant='outline' asChild>
                  <Link href='/en/manage-promoters/new'>
                    <Users className='h-4 w-4' />
                    Add Promoter
                  </Link>
                </Button>
                <Button className='w-full justify-start gap-2' variant='outline' asChild>
                  <Link href='/en/promoters'>
                    <Eye className='h-4 w-4' />
                    View Promoters
                  </Link>
                </Button>
                <Button className='w-full justify-start gap-2' variant='outline' asChild>
                  <Link href='/en/analytics'>
                    <BarChart3 className='h-4 w-4' />
                    Analytics
                  </Link>
                </Button>
                <Button className='w-full justify-start gap-2' variant='outline' asChild>
                  <Link href='/en/contracts'>
                    <FileText className='h-4 w-4' />
                    All Contracts
                  </Link>
                </Button>
                <Button className='w-full justify-start gap-2' variant='outline' asChild>
                  <Link href='/en/manage-parties'>
                    <Building2 className='h-4 w-4' />
                    Manage Parties
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* System Status Card */}
            <Card className='border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-base'>
                  <CheckCircle className='h-5 w-5 text-green-600' />
                  System Status
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-2'>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>Database</span>
                  <Badge className='bg-green-500'>Healthy</Badge>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>API Services</span>
                  <Badge className='bg-green-500'>Online</Badge>
                </div>
                <div className='flex items-center justify-between text-sm'>
                  <span className='text-gray-700'>Last Backup</span>
                  <span className='text-xs text-gray-600'>2 hours ago</span>
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
      <DashboardContent />
    </AuthGuard>
  );
}
