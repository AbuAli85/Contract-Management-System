'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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
  LogOut,
  Settings,
  Bell,
  Loader2,
  Info,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

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
}

interface PromoterStats {
  totalWorkforce: number;
  activeOnContracts: number;
  availableForWork: number;
  onLeave: number;
  inactive: number;
  utilizationRate: number;
  complianceRate: number;
}

function DashboardContent() {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [promoterStats, setPromoterStats] = useState<PromoterStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const router = useRouter();

  // Fetch dashboard statistics from centralized metrics API
  const fetchDashboardStats = useCallback(async (forceRefresh = false) => {
    try {
      setStatsLoading(true);
      
      const refreshParam = forceRefresh ? '?refresh=true' : '';
      
      // Fetch contract metrics
      const contractsResponse = await fetch(`/api/metrics/contracts${refreshParam}`);
      if (contractsResponse.ok) {
        const data = await contractsResponse.json();
        if (data.success && data.metrics) {
          setStats({
            totalContracts: data.metrics.total,
            activeContracts: data.metrics.active,
            pendingContracts: data.metrics.pending,
            scope: data.scope,
          });
        }
      }

      // Fetch enhanced promoter metrics
      const promotersResponse = await fetch(`/api/promoters/enhanced-metrics${refreshParam}`);
      if (promotersResponse.ok) {
        const data = await promotersResponse.json();
        if (data.success && data.metrics) {
          setPromoterStats({
            totalWorkforce: data.metrics.totalWorkforce,
            activeOnContracts: data.metrics.activeOnContracts,
            availableForWork: data.metrics.availableForWork,
            onLeave: data.metrics.onLeave,
            inactive: data.metrics.inactive,
            utilizationRate: data.metrics.utilizationRate,
            complianceRate: data.metrics.complianceRate,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    // LIMITED CLEANUP - Only clear demo/development data, preserve Supabase sessions
    const limitedCleanup = () => {
      try {
        // Clear only demo session data
        localStorage.removeItem('demo-user-session');
        localStorage.removeItem('user-role');
        localStorage.removeItem('auth-mode');

        // Clear other auth-related data but NOT Supabase session data
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user-session');
        localStorage.removeItem('admin-session');

        // Don't clear sessionStorage as it may contain Supabase session data

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

      // Fetch dashboard stats
      fetchDashboardStats();
      setLoading(false);
    } else if (!authLoading && !authUser) {
      // Not authenticated, will be handled by AuthenticatedLayout
      setLoading(false);
    }
  }, [router, fetchDashboardStats, authUser, authLoading]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/en/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <h1 className='text-xl font-semibold text-gray-900'>
                Contract Management System
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <Button variant='ghost' size='sm'>
                <Bell className='h-5 w-5' />
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
          <h2 className='text-2xl font-bold text-gray-900'>
            Welcome back, {user.full_name || user.email}!
          </h2>
          <p className='text-gray-600'>
            Here's what's happening with your contracts today.
          </p>
          <div className='mt-2'>
            <Badge variant='secondary' className='text-sm'>
              Role: {user.role}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='mb-4 flex justify-between items-center'>
          <div>
            <Badge variant='outline' className='text-xs'>
              {stats?.scope === 'system-wide' ? '🌐 System-wide view' : '👤 Your contracts only'}
            </Badge>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchDashboardStats(true)}
            disabled={statsLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <TooltipProvider>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <div className='flex items-center gap-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Contracts
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='h-3 w-3 text-muted-foreground cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='max-w-xs'>
                        {stats?.scope === 'system-wide' 
                          ? 'All contracts in the system across all users'
                          : 'Only contracts you created or have access to'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <FileText className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className='flex items-center space-x-2'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className='text-2xl font-bold'>
                      {stats?.totalContracts ?? 0}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      {stats?.scope === 'system-wide' ? 'All system contracts' : 'Your contracts'}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TooltipProvider>

          <TooltipProvider>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <div className='flex items-center gap-2'>
                  <CardTitle className='text-sm font-medium'>
                    Active Contracts
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='h-3 w-3 text-muted-foreground cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='max-w-xs'>
                        Contracts with status 'active' - currently in force and not expired
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <TrendingUp className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className='flex items-center space-x-2'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className='text-2xl font-bold'>
                      {stats?.activeContracts ?? 0}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      Currently in force
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TooltipProvider>

          <TooltipProvider>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <div className='flex items-center gap-2'>
                  <CardTitle className='text-sm font-medium'>
                    Active Promoters
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='h-3 w-3 text-muted-foreground cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='max-w-xs'>
                        Promoters currently working on active contract assignments
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className='flex items-center space-x-2'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className='text-2xl font-bold'>
                      {promoterStats?.activeOnContracts ?? 0}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      On assignments
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TooltipProvider>

          <TooltipProvider>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <div className='flex items-center gap-2'>
                  <CardTitle className='text-sm font-medium'>
                    Available
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='h-3 w-3 text-muted-foreground cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='max-w-xs'>
                        Promoters registered and ready to be assigned to contracts but not currently working
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className='flex items-center space-x-2'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className='text-2xl font-bold'>
                      {promoterStats?.availableForWork ?? 0}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      Ready for work
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TooltipProvider>

          <TooltipProvider>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <div className='flex items-center gap-2'>
                  <CardTitle className='text-sm font-medium'>
                    Total Workforce
                  </CardTitle>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className='h-3 w-3 text-muted-foreground cursor-help' />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='max-w-xs'>
                        Total number of promoters registered in the system (all registered staff)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Users className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                {statsLoading ? (
                  <div className='flex items-center space-x-2'>
                    <Loader2 className='h-5 w-5 animate-spin text-muted-foreground' />
                    <span className='text-sm text-muted-foreground'>Loading...</span>
                  </div>
                ) : (
                  <>
                    <div className='text-2xl font-bold'>
                      {promoterStats?.totalWorkforce ?? 0}
                    </div>
                    <p className='text-xs text-muted-foreground'>
                      All registered
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </TooltipProvider>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <FileText className='h-5 w-5 mr-2' />
                Create Contract
              </CardTitle>
              <CardDescription>
                Start a new contract from scratch or use a template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full' asChild>
                <Link href='/en/contracts/new'>Create New</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Users className='h-5 w-5 mr-2' />
                Manage Promoters
              </CardTitle>
              <CardDescription>
                View and manage promoter profiles and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full' asChild>
                <Link href='/en/promoters'>View Promoters</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <TrendingUp className='h-5 w-5 mr-2' />
                View Analytics
              </CardTitle>
              <CardDescription>
                Check performance metrics and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full' asChild>
                <Link href='/en/analytics'>View Reports</Link>
              </Button>
            </CardContent>
          </Card>
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
