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
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  Settings,
  Calendar,
  TrendingUp,
  FileText,
  Activity,
  Bell,
  Plus,
  User,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  MessageSquare,
  BookOpen,
} from 'lucide-react';

// User-specific quick actions
function UserQuickActions() {
  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center'>
          <User className='w-4 h-4 text-gray-600' />
        </div>
        <h2 className='text-xl font-semibold text-slate-900'>Quick Actions</h2>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Link href='/profile' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-blue-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <User className='w-8 h-8 text-blue-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>My Profile</h3>
                  <p className='text-sm text-slate-600'>View & edit profile</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/contracts' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-green-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <FileText className='w-8 h-8 text-green-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>My Contracts</h3>
                  <p className='text-sm text-slate-600'>View contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/notifications' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-purple-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <Bell className='w-8 h-8 text-purple-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>
                    Notifications
                  </h3>
                  <p className='text-sm text-slate-600'>Messages & alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/settings' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-orange-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <Settings className='w-8 h-8 text-orange-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>Settings</h3>
                  <p className='text-sm text-slate-600'>Account preferences</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/help' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-indigo-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <BookOpen className='w-8 h-8 text-indigo-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>
                    Help & Support
                  </h3>
                  <p className='text-sm text-slate-600'>Get assistance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className='bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <MessageSquare className='w-8 h-8 text-blue-600' />
              <div>
                <h3 className='font-semibold text-slate-900'>
                  Contact Support
                </h3>
                <p className='text-sm text-slate-600'>Get help from our team</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// User stats overview
function UserStatsOverview() {
  const [stats, setStats] = useState({
    totalContracts: 0,
    activeContracts: 0,
    completedContracts: 0,
    pendingActions: 0,
    lastLogin: '',
    accountAge: 0,
  });

  useEffect(() => {
    // Fetch user-specific stats
    const fetchStats = async () => {
      try {
        // This would be replaced with actual API calls
        setStats({
          totalContracts: 3,
          activeContracts: 1,
          completedContracts: 2,
          pendingActions: 1,
          lastLogin: '2 hours ago',
          accountAge: 6,
        });
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
          <Activity className='w-4 h-4 text-blue-600' />
        </div>
        <h2 className='text-xl font-semibold text-slate-900'>Your Overview</h2>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Total Contracts
              </CardDescription>
              <FileText className='w-8 h-8 text-blue-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalContracts}</div>
            <p className='text-xs text-muted-foreground'>All time</p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Active Contracts
              </CardDescription>
              <Activity className='w-8 h-8 text-green-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.activeContracts}</div>
            <p className='text-xs text-muted-foreground'>Currently running</p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Completed
              </CardDescription>
              <CheckCircle className='w-8 h-8 text-purple-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.completedContracts}</div>
            <p className='text-xs text-muted-foreground'>
              Successfully finished
            </p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Pending Actions
              </CardDescription>
              <AlertCircle className='w-8 h-8 text-orange-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.pendingActions}</div>
            <p className='text-xs text-muted-foreground'>
              Needs your attention
            </p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Last Login
              </CardDescription>
              <Clock className='w-8 h-8 text-indigo-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-lg font-bold'>{stats.lastLogin}</div>
            <p className='text-xs text-muted-foreground'>Recent activity</p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Account Age
              </CardDescription>
              <Calendar className='w-8 h-8 text-gray-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.accountAge} months</div>
            <p className='text-xs text-muted-foreground'>Member since</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Recent contracts component
interface UserContract {
  id: number;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  client: string;
}

function RecentContracts() {
  const [contracts, setContracts] = useState<UserContract[]>([]);

  useEffect(() => {
    // Fetch recent contracts
    const fetchContracts = async () => {
      try {
        // This would be replaced with actual API calls
        setContracts([
          {
            id: 1,
            title: 'Marketing Campaign Assistant',
            status: 'Active',
            startDate: '2025-01-15',
            endDate: '2025-06-15',
            client: 'ABC Marketing Ltd',
          },
          {
            id: 2,
            title: 'Event Coordinator',
            status: 'Completed',
            startDate: '2024-09-01',
            endDate: '2024-12-31',
            client: 'Event Masters Co',
          },
        ]);
      } catch (error) {
        console.error('Error fetching contracts:', error);
      }
    };

    fetchContracts();
  }, []);

  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
            <FileText className='w-4 h-4 text-green-600' />
          </div>
          <h2 className='text-xl font-semibold text-slate-900'>
            Recent Contracts
          </h2>
        </div>

        <Link href='/contracts'>
          <Button variant='outline' size='sm'>
            View All
          </Button>
        </Link>
      </div>

      <div className='space-y-4'>
        {contracts.length === 0 ? (
          <div className='text-center py-8'>
            <FileText className='w-12 h-12 text-gray-300 mx-auto mb-4' />
            <p className='text-gray-600'>No contracts found</p>
            <p className='text-sm text-gray-500'>
              Your contracts will appear here
            </p>
          </div>
        ) : (
          contracts.map(contract => (
            <Card key={contract.id} className='border-slate-200/60'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-slate-900'>
                      {contract.title}
                    </h3>
                    <p className='text-sm text-slate-600'>{contract.client}</p>
                    <p className='text-xs text-slate-500 mt-1'>
                      {contract.startDate} - {contract.endDate}
                    </p>
                  </div>

                  <div className='flex items-center gap-3'>
                    <Badge
                      variant={
                        contract.status === 'Active' ? 'default' : 'secondary'
                      }
                      className={
                        contract.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : ''
                      }
                    >
                      {contract.status}
                    </Badge>

                    <Link href={`/contracts/${contract.id}`}>
                      <Button variant='ghost' size='sm'>
                        <Eye className='w-4 h-4' />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function UserDashboard({
  params,
}: {
  params: { locale: string };
}) {
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
    <DashboardAuthGuard locale={locale}>
      <SilentSessionTimeout />
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
        <div className='container mx-auto px-4 py-8 max-w-7xl'>
          {/* Header */}
          <div className='flex flex-col gap-6 mb-8'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center'>
                  <User className='w-5 h-5 text-gray-600' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-slate-900'>
                    My Dashboard
                  </h1>
                  <p className='text-slate-600'>
                    View your contracts and manage your account
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-2 mt-2'>
                <Badge
                  variant='secondary'
                  className='bg-gray-100 text-gray-800 border-gray-200'
                >
                  User
                </Badge>
                <Badge variant='outline' className='text-slate-600'>
                  Active Account
                </Badge>
              </div>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center'>
              <div className='text-sm text-slate-600'>
                Welcome back,{' '}
                {profile?.full_name ||
                  profile?.display_name ||
                  user?.email ||
                  'User'}
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

                <Link href='/profile'>
                  <Button size='sm' className='flex items-center gap-2'>
                    <Edit className='w-4 h-4' />
                    Edit Profile
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className='space-y-8'>
            {/* User Overview Stats */}
            <Suspense
              fallback={
                <div className='h-64 bg-slate-100 rounded-lg animate-pulse' />
              }
            >
              <UserStatsOverview />
            </Suspense>

            {/* User Quick Actions */}
            <Suspense
              fallback={
                <div className='h-64 bg-slate-100 rounded-lg animate-pulse' />
              }
            >
              <UserQuickActions />
            </Suspense>

            {/* Recent Contracts */}
            <Suspense
              fallback={
                <div className='h-64 bg-slate-100 rounded-lg animate-pulse' />
              }
            >
              <RecentContracts />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
