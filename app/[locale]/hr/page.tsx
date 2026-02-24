'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Clock,
  FileText,
  Calendar,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  CheckCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';

interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaveRequests: number;
  expiringDocuments: number;
  todayAttendance: number;
  recentHires: number;
}

function StatSkeleton() {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div className='h-4 w-32 bg-gray-200 rounded animate-pulse' />
        <div className='h-8 w-8 bg-gray-100 rounded-full animate-pulse' />
      </CardHeader>
      <CardContent>
        <div className='h-8 w-16 bg-gray-300 rounded animate-pulse mb-1' />
        <div className='h-3 w-24 bg-gray-100 rounded animate-pulse' />
      </CardContent>
    </Card>
  );
}

export default function HRDashboard() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [stats, setStats] = useState<HRStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaveRequests: 0,
    expiringDocuments: 0,
    todayAttendance: 0,
    recentHires: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHRStats = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const response = await fetch('/api/analytics/hr?period=month', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (response.ok) {
        const data = await response.json();
        const employees = data.employees || {};
        const attendance = data.attendance || {};
        const documents = data.documents || {};
        const leaves = data.leaves || {};
        setStats({
          totalEmployees: employees.total ?? 0,
          activeEmployees: employees.active ?? 0,
          pendingLeaveRequests: leaves.pending ?? 0,
          expiringDocuments: documents.expiring_soon ?? 0,
          todayAttendance: attendance.today_present ?? 0,
          recentHires: employees.recent_hires ?? 0,
        });
      }
    } catch (error) {
      console.error('Error fetching HR stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchHRStats();
  }, [fetchHRStats]);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      description: 'All employees in system',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: `/${locale}/hr/employees`,
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      description: 'Currently employed',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: `/${locale}/hr/employees`,
    },
    {
      title: 'Pending Leave Requests',
      value: stats.pendingLeaveRequests,
      description: 'Awaiting approval',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: `/${locale}/hr/leave-requests`,
      alert: stats.pendingLeaveRequests > 0,
    },
    {
      title: 'Expiring Documents',
      value: stats.expiringDocuments,
      description: 'Passports/Visas expiring soon',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      href: `/${locale}/hr/documents`,
      alert: stats.expiringDocuments > 0,
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      description: 'Employees checked in',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: `/${locale}/hr/attendance`,
    },
    {
      title: 'Recent Hires',
      value: stats.recentHires,
      description: 'This month',
      icon: UserPlus,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      href: `/${locale}/hr/employees`,
    },
  ];

  const quickActions = [
    {
      title: 'Add New Employee',
      description: 'Register a new employee',
      href: `/${locale}/hr/employees/new`,
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'View Attendance',
      description: 'Check attendance records',
      href: `/${locale}/hr/attendance`,
      icon: Clock,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Manage Leave Requests',
      description: 'Approve/reject leave requests',
      href: `/${locale}/hr/leave-requests`,
      icon: Calendar,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      title: 'Generate Documents',
      description: 'Create contracts and letters',
      href: `/${locale}/hr/documents/generate`,
      icon: FileText,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  const hrModules = [
    {
      title: 'Employees',
      description: 'Manage employee records, profiles, and information',
      href: `/${locale}/hr/employees`,
      icon: Users,
      count: stats.totalEmployees,
      countLabel: 'total',
      color: 'border-blue-200 hover:border-blue-400',
      iconColor: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Attendance',
      description: 'Track daily attendance and work hours',
      href: `/${locale}/hr/attendance`,
      icon: Clock,
      count: stats.todayAttendance,
      countLabel: 'today',
      color: 'border-green-200 hover:border-green-400',
      iconColor: 'text-green-600 bg-green-50',
    },
    {
      title: 'Leave Requests',
      description: 'Review and approve employee leave applications',
      href: `/${locale}/hr/leave-requests`,
      icon: Calendar,
      count: stats.pendingLeaveRequests,
      countLabel: 'pending',
      color: cn(
        'border-orange-200 hover:border-orange-400',
        stats.pendingLeaveRequests > 0 && 'ring-1 ring-orange-300'
      ),
      iconColor: 'text-orange-600 bg-orange-50',
    },
    {
      title: 'Documents',
      description: 'Manage passports, visas, and compliance documents',
      href: `/${locale}/hr/documents`,
      icon: FileText,
      count: stats.expiringDocuments,
      countLabel: 'expiring',
      color: cn(
        'border-red-200 hover:border-red-400',
        stats.expiringDocuments > 0 && 'ring-1 ring-red-300'
      ),
      iconColor: 'text-red-600 bg-red-50',
    },
    {
      title: 'Payroll',
      description: 'Process payroll and manage salary records',
      href: `/${locale}/hr/payroll`,
      icon: TrendingUp,
      count: null,
      countLabel: '',
      color: 'border-purple-200 hover:border-purple-400',
      iconColor: 'text-purple-600 bg-purple-50',
    },
    {
      title: 'Reports',
      description: 'Generate HR analytics and workforce reports',
      href: `/${locale}/hr/reports`,
      icon: TrendingUp,
      count: null,
      countLabel: '',
      color: 'border-indigo-200 hover:border-indigo-400',
      iconColor: 'text-indigo-600 bg-indigo-50',
    },
  ];

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>HR Dashboard</h1>
          <p className='text-gray-600 mt-1'>
            Manage your workforce efficiently
          </p>
        </div>
        <div className='flex space-x-3'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => fetchHRStats(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')}
            />
            Refresh
          </Button>
          <Button asChild>
            <Link href={`/${locale}/hr/employees/new`}>
              <UserPlus className='w-4 h-4 mr-2' />
              Add Employee
            </Link>
          </Button>
          <Button variant='outline' asChild>
            <Link href={`/${locale}/hr/reports`}>
              <TrendingUp className='w-4 h-4 mr-2' />
              Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <StatSkeleton key={i} />)
          : statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Link key={index} href={stat.href}>
                  <Card
                    className={cn(
                      'hover:shadow-lg transition-all cursor-pointer border-2',
                      stat.alert
                        ? 'border-red-200 bg-red-50/30'
                        : 'border-transparent hover:border-gray-200'
                    )}
                  >
                    <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                      <CardTitle className='text-sm font-medium text-gray-600'>
                        {stat.title}
                      </CardTitle>
                      <div className={`p-2 rounded-full ${stat.bgColor}`}>
                        <Icon className={`w-4 h-4 ${stat.color}`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className='flex items-end justify-between'>
                        <div>
                          <div className='text-2xl font-bold text-gray-900'>
                            {stat.value}
                          </div>
                          <p className='text-xs text-gray-500 mt-1'>
                            {stat.description}
                          </p>
                        </div>
                        {stat.alert && stat.value > 0 && (
                          <Badge variant='destructive' className='text-xs'>
                            Action needed
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common HR tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.href}>
                  <Card className='hover:shadow-md transition-shadow cursor-pointer h-full'>
                    <CardContent className='p-4 text-center'>
                      <div
                        className={`w-12 h-12 mx-auto mb-3 rounded-full ${action.color} flex items-center justify-center transition-colors`}
                      >
                        <Icon className='w-6 h-6 text-white' />
                      </div>
                      <h3 className='font-semibold text-gray-900 mb-1'>
                        {action.title}
                      </h3>
                      <p className='text-sm text-gray-500'>
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* HR Modules */}
      <div>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-semibold text-gray-900'>HR Modules</h2>
          <p className='text-sm text-gray-500'>Click any module to navigate</p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {hrModules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link key={index} href={module.href}>
                <Card
                  className={cn(
                    'hover:shadow-md transition-all cursor-pointer border-2 h-full group',
                    module.color
                  )}
                >
                  <CardContent className='p-5'>
                    <div className='flex items-start justify-between'>
                      <div className='flex items-start gap-3 flex-1'>
                        <div
                          className={cn(
                            'p-2.5 rounded-lg flex-shrink-0',
                            module.iconColor
                          )}
                        >
                          <Icon className='w-5 h-5' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <h3 className='font-semibold text-gray-900 mb-1'>
                            {module.title}
                          </h3>
                          <p className='text-sm text-gray-500 line-clamp-2'>
                            {module.description}
                          </p>
                          {module.count !== null && (
                            <div className='mt-2'>
                              <Badge
                                variant={
                                  module.count > 0 ? 'secondary' : 'outline'
                                }
                                className='text-xs'
                              >
                                {module.count} {module.countLabel}
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>
                      <ArrowRight className='w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0 mt-1' />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
