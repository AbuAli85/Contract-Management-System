'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-service';
import { useUserProfile } from '@/hooks/use-user-profile';
import { DashboardAuthGuard } from '@/components/dashboard-auth-guard';
import { SilentSessionTimeout } from '@/components/silent-session-timeout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardStats } from '@/components/dashboard/dashboard-stats-simple';
import { DashboardNotifications } from '@/components/dashboard/dashboard-notifications-enhanced';
import { DashboardActivities } from '@/components/dashboard/dashboard-activities';
import { DashboardQuickActions } from '@/components/dashboard/dashboard-quick-actions';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/use-notifications-enhanced';
import {
  RefreshCw,
  Settings,
  Download,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  Activity,
  Building2,
  Bell,
  ChevronRight,
  Plus,
  Shield,
  Database,
  UserCheck,
  BarChart3,
} from 'lucide-react';

// Admin-specific components
function AdminQuickActions() {
  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center'>
          <Shield className='w-4 h-4 text-red-600' />
        </div>
        <h2 className='text-xl font-semibold text-slate-900'>Admin Actions</h2>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Link href='/users' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-blue-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <Users className='w-8 h-8 text-blue-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>
                    User Management
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Manage users and roles
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/manage-parties' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-green-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <Building2 className='w-8 h-8 text-green-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>Companies</h3>
                  <p className='text-sm text-slate-600'>
                    Manage clients & providers
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/contracts' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-purple-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <FileText className='w-8 h-8 text-purple-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>
                    All Contracts
                  </h3>
                  <p className='text-sm text-slate-600'>
                    System-wide contracts
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/manage-promoters' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-indigo-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <UserCheck className='w-8 h-8 text-indigo-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>Promoters</h3>
                  <p className='text-sm text-slate-600'>Manage all promoters</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/analytics' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-orange-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <BarChart3 className='w-8 h-8 text-orange-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>Analytics</h3>
                  <p className='text-sm text-slate-600'>System insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/settings' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-gray-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <Settings className='w-8 h-8 text-gray-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>
                    System Settings
                  </h3>
                  <p className='text-sm text-slate-600'>Configure system</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

function AdminStatsOverview() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalContracts: 0,
    totalPromoters: 0,
    totalParties: 0,
    activeContracts: 0,
    pendingApprovals: 0,
  });

  useEffect(() => {
    // Fetch admin stats
    const fetchStats = async () => {
      try {
        // This would be replaced with actual API calls
        setStats({
          totalUsers: 156,
          totalContracts: 89,
          totalPromoters: 234,
          totalParties: 67,
          activeContracts: 72,
          pendingApprovals: 12,
        });
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
          <Database className='w-4 h-4 text-blue-600' />
        </div>
        <h2 className='text-xl font-semibold text-slate-900'>
          System Overview
        </h2>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Total Users
              </CardDescription>
              <Users className='w-8 h-8 text-blue-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalUsers}</div>
            <p className='text-xs text-muted-foreground'>
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Total Contracts
              </CardDescription>
              <FileText className='w-8 h-8 text-green-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalContracts}</div>
            <p className='text-xs text-muted-foreground'>+8% from last month</p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Active Contracts
              </CardDescription>
              <Activity className='w-8 h-8 text-purple-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.activeContracts}</div>
            <p className='text-xs text-muted-foreground'>
              {Math.round((stats.activeContracts / stats.totalContracts) * 100)}
              % of total
            </p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Total Promoters
              </CardDescription>
              <UserCheck className='w-8 h-8 text-indigo-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalPromoters}</div>
            <p className='text-xs text-muted-foreground'>
              +15% from last month
            </p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Companies
              </CardDescription>
              <Building2 className='w-8 h-8 text-orange-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalParties}</div>
            <p className='text-xs text-muted-foreground'>Clients & Providers</p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Pending Approvals
              </CardDescription>
              <AlertTriangle className='w-8 h-8 text-red-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.pendingApprovals}</div>
            <p className='text-xs text-muted-foreground'>Needs attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface AdminDashboardProps {
  params: {
    locale: string;
  };
}

export default function AdminDashboard({ params }: AdminDashboardProps) {
  const { locale } = params;
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { toast } = useToast();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Refresh all dashboard data
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: 'Dashboard Refreshed',
        description: 'All data has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: 'Refresh Failed',
        description: 'Failed to refresh dashboard data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  }, [toast]);

  return (
    <DashboardAuthGuard locale={locale} requiredRole='admin'>
      <SilentSessionTimeout />
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
        <div className='container mx-auto px-4 py-8 max-w-7xl'>
          {/* Header */}
          <div className='flex flex-col gap-6 mb-8'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center'>
                  <Shield className='w-5 h-5 text-red-600' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-slate-900'>
                    Administrator Dashboard
                  </h1>
                  <p className='text-slate-600'>
                    System-wide management and monitoring
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-2 mt-2'>
                <Badge
                  variant='secondary'
                  className='bg-red-100 text-red-800 border-red-200'
                >
                  Administrator
                </Badge>
                <Badge variant='outline' className='text-slate-600'>
                  Full Access
                </Badge>
              </div>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center'>
              <div className='text-sm text-slate-600'>
                Welcome back, {profile?.name || user?.email || 'Administrator'}
              </div>

              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className='flex items-center gap-2'
                >
                  <RefreshCw
                    className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                  />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>

                <Link href='/settings'>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex items-center gap-2'
                  >
                    <Settings className='w-4 h-4' />
                    Settings
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className='space-y-8'>
            {/* System Overview Stats */}
            <Suspense
              fallback={
                <div className='h-64 bg-slate-100 rounded-lg animate-pulse' />
              }
            >
              <AdminStatsOverview />
            </Suspense>

            {/* Admin Quick Actions */}
            <Suspense
              fallback={
                <div className='h-64 bg-slate-100 rounded-lg animate-pulse' />
              }
            >
              <AdminQuickActions />
            </Suspense>

            {/* Notifications and Activities */}
            <div className='grid grid-cols-1 gap-8 lg:grid-cols-2'>
              <Suspense
                fallback={
                  <div className='h-64 bg-slate-100 rounded-lg animate-pulse' />
                }
              >
                <DashboardNotifications />
              </Suspense>

              <Suspense
                fallback={
                  <div className='h-64 bg-slate-100 rounded-lg animate-pulse' />
                }
              >
                <DashboardActivities />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
