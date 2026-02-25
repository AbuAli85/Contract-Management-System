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
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  RefreshCw,
  Settings,
  AlertTriangle,
  Users,
  FileText,
  Activity,
  Building2,
  Bell,
  DollarSign,
  Clock,
  CheckCircle,
  UserCheck,
  Target,
  BarChart3,
  Award,
  Eye,
} from 'lucide-react';

// Manager-specific quick actions
function ManagerQuickActions() {
  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center'>
          <Settings className='w-4 h-4 text-purple-600' />
        </div>
        <h2 className='text-xl font-semibold text-slate-900'>
          Management Actions
        </h2>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <Link href='/manage-promoters' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-purple-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <UserCheck className='w-8 h-8 text-purple-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>
                    Team Overview
                  </h3>
                  <p className='text-sm text-slate-600'>Manage team members</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/contracts' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-blue-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <FileText className='w-8 h-8 text-blue-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>
                    Contract Review
                  </h3>
                  <p className='text-sm text-slate-600'>Approve & monitor</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/analytics' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-green-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <BarChart3 className='w-8 h-8 text-green-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>Performance</h3>
                  <p className='text-sm text-slate-600'>Team analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/companies' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-orange-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <Building2 className='w-8 h-8 text-orange-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>
                    Client Relations
                  </h3>
                  <p className='text-sm text-slate-600'>Manage partnerships</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/notifications' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-indigo-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <Bell className='w-8 h-8 text-indigo-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>
                    Notifications
                  </h3>
                  <p className='text-sm text-slate-600'>Important alerts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/reports' className='group'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-gray-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <Award className='w-8 h-8 text-gray-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>Reports</h3>
                  <p className='text-sm text-slate-600'>Generate insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

// Manager stats overview
function ManagerStatsOverview() {
  const [stats, setStats] = useState({
    teamMembers: 0,
    activeContracts: 0,
    pendingApprovals: 0,
    monthlyRevenue: 0,
    teamEfficiency: 0,
    clientSatisfaction: 0,
  });

  useEffect(() => {
    // Fetch manager-specific stats
    const fetchStats = async () => {
      try {
        // This would be replaced with actual API calls
        setStats({
          teamMembers: 25,
          activeContracts: 18,
          pendingApprovals: 5,
          monthlyRevenue: 245000,
          teamEfficiency: 87,
          clientSatisfaction: 4.6,
        });
      } catch (error) {

      }
    };

    fetchStats();
  }, []);

  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
          <Target className='w-4 h-4 text-blue-600' />
        </div>
        <h2 className='text-xl font-semibold text-slate-900'>
          Management Overview
        </h2>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Team Members
              </CardDescription>
              <Users className='w-8 h-8 text-purple-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.teamMembers}</div>
            <p className='text-xs text-muted-foreground'>Under management</p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Active Contracts
              </CardDescription>
              <FileText className='w-8 h-8 text-blue-600' />
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
                Pending Approvals
              </CardDescription>
              <AlertTriangle className='w-8 h-8 text-orange-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.pendingApprovals}</div>
            <p className='text-xs text-muted-foreground'>Awaiting review</p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Monthly Revenue
              </CardDescription>
              <DollarSign className='w-8 h-8 text-green-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₹{stats.monthlyRevenue.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>This month</p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Team Efficiency
              </CardDescription>
              <Activity className='w-8 h-8 text-indigo-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.teamEfficiency}%</div>
            <Progress value={stats.teamEfficiency} className='mt-2' />
            <p className='text-xs text-muted-foreground mt-1'>
              Performance metric
            </p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Client Satisfaction
              </CardDescription>
              <Award className='w-8 h-8 text-yellow-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {stats.clientSatisfaction}/5.0
            </div>
            <p className='text-xs text-muted-foreground'>Average rating</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Recent team activities
interface Activity {
  id: number;
  type: string;
  message: string;
  user: string;
  timestamp: string;
  status: string;
}

function RecentTeamActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    // Fetch recent team activities
    const fetchActivities = async () => {
      try {
        // This would be replaced with actual API calls
        setActivities([
          {
            id: 1,
            type: 'contract_signed',
            message: 'New contract signed with TechCorp Ltd',
            user: 'Sarah Ahmed',
            timestamp: '2 hours ago',
            status: 'success',
          },
          {
            id: 2,
            type: 'approval_pending',
            message: 'Contract approval needed for Marketing Campaign',
            user: 'Ahmed Hassan',
            timestamp: '4 hours ago',
            status: 'warning',
          },
          {
            id: 3,
            type: 'team_added',
            message: 'New team member onboarded',
            user: 'Fatima Al-Zahra',
            timestamp: '1 day ago',
            status: 'info',
          },
        ]);
      } catch (error) {

      }
    };

    fetchActivities();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='w-4 h-4 text-green-600' />;
      case 'warning':
        return <AlertTriangle className='w-4 h-4 text-orange-600' />;
      case 'info':
        return <Activity className='w-4 h-4 text-blue-600' />;
      default:
        return <Clock className='w-4 h-4 text-gray-600' />;
    }
  };

  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'>
      <div className='flex items-center justify-between mb-6'>
        <div className='flex items-center gap-3'>
          <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
            <Activity className='w-4 h-4 text-green-600' />
          </div>
          <h2 className='text-xl font-semibold text-slate-900'>
            Recent Team Activities
          </h2>
        </div>

        <Link href='/activities'>
          <Button variant='outline' size='sm'>
            View All
          </Button>
        </Link>
      </div>

      <div className='space-y-4'>
        {activities.length === 0 ? (
          <div className='text-center py-8'>
            <Activity className='w-12 h-12 text-gray-300 mx-auto mb-4' />
            <p className='text-gray-600'>No recent activities</p>
            <p className='text-sm text-gray-500'>
              Team activities will appear here
            </p>
          </div>
        ) : (
          activities.map(activity => (
            <Card key={activity.id} className='border-slate-200/60'>
              <CardContent className='p-4'>
                <div className='flex items-start gap-3'>
                  <div className='mt-1'>{getStatusIcon(activity.status)}</div>

                  <div className='flex-1'>
                    <p className='text-sm font-medium text-slate-900'>
                      {activity.message}
                    </p>
                    <p className='text-xs text-slate-600'>by {activity.user}</p>
                    <p className='text-xs text-slate-500 mt-1'>
                      {activity.timestamp}
                    </p>
                  </div>

                  <Button variant='ghost' size='sm'>
                    <Eye className='w-4 h-4' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

export default function ManagerDashboard({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = params;
  const { user, loading: _authLoading } = useAuth();
  const { profile, loading: _profileLoading } = useUserProfile();
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
    <DashboardAuthGuard locale={locale} requiredRole='manager'>
      <SilentSessionTimeout />
      <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
        <div className='container mx-auto px-4 py-8 max-w-7xl'>
          {/* Header */}
          <div className='flex flex-col gap-6 mb-8'>
            <div className='flex flex-col gap-2'>
              <div className='flex items-center gap-3'>
                <div className='w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <Settings className='w-5 h-5 text-purple-600' />
                </div>
                <div>
                  <h1 className='text-3xl font-bold text-slate-900'>
                    Manager Dashboard
                  </h1>
                  <p className='text-slate-600'>
                    Oversee operations and manage your team
                  </p>
                </div>
              </div>

              <div className='flex items-center gap-2 mt-2'>
                <Badge
                  variant='secondary'
                  className='bg-purple-100 text-purple-800 border-purple-200'
                >
                  Manager
                </Badge>
                <Badge variant='outline' className='text-slate-600'>
                  Team Leader
                </Badge>
              </div>
            </div>

            <div className='flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center'>
              <div className='text-sm text-slate-600'>
                Welcome back,{' '}
                {profile?.getDisplayName?.() ||
                  profile?.full_name ||
                  profile?.display_name ||
                  user?.email ||
                  'Manager'}
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

                <Link href='/manage-promoters'>
                  <Button size='sm' className='flex items-center gap-2'>
                    <UserCheck className='w-4 h-4' />
                    Manage Team
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className='space-y-8'>
            {/* Manager Overview Stats */}
            <Suspense
              fallback={
                <div className='h-64 bg-slate-100 rounded-lg animate-pulse' />
              }
            >
              <ManagerStatsOverview />
            </Suspense>

            {/* Manager Quick Actions */}
            <Suspense
              fallback={
                <div className='h-64 bg-slate-100 rounded-lg animate-pulse' />
              }
            >
              <ManagerQuickActions />
            </Suspense>

            {/* Recent Team Activities */}
            <Suspense
              fallback={
                <div className='h-64 bg-slate-100 rounded-lg animate-pulse' />
              }
            >
              <RecentTeamActivities />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardAuthGuard>
  );
}
