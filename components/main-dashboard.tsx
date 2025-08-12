'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Calendar,
  Package,
  Bell,
  TrendingUp,
  Users,
  FileText,
  Activity,
  CheckCircle,
  AlertCircle,
  Clock,
  Star,
  BarChart3,
  Zap,
  ArrowRight,
  Plus,
  Search,
  Filter,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';

interface DashboardStats {
  contracts: {
    total: number;
    active: number;
    pending: number;
    expired: number;
  };
  bookings: {
    total: number;
    today: number;
    upcoming: number;
    completed: number;
  };
  tracking: {
    active: number;
    completed: number;
    delayed: number;
    onTrack: number;
  };
  notifications: { unread: number; total: number; urgent: number };
  users: { total: number; active: number; newThisWeek: number };
}

interface RecentActivity {
  id: string;
  type: 'contract' | 'booking' | 'tracking' | 'notification';
  title: string;
  description: string;
  timestamp: string;
  user: string;
  status: 'success' | 'warning' | 'info' | 'error';
}

interface QuickAction {
  name: string;
  description: string;
  href: string;
  icon: React.ElementType;
  color: string;
  isNew?: boolean;
}

export function MainDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    contracts: { total: 156, active: 89, pending: 23, expired: 44 },
    bookings: { total: 234, today: 8, upcoming: 15, completed: 211 },
    tracking: { active: 45, completed: 78, delayed: 3, onTrack: 42 },
    notifications: { unread: 12, total: 156, urgent: 3 },
    users: { total: 89, active: 76, newThisWeek: 5 },
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([
    {
      id: '1',
      type: 'contract',
      title: 'Partnership Agreement Signed',
      description:
        'TechCorp partnership contract has been successfully executed',
      timestamp: '2 hours ago',
      user: 'John Doe',
      status: 'success',
    },
    {
      id: '2',
      type: 'booking',
      title: 'Conference Room A Reserved',
      description: 'Team meeting scheduled for tomorrow 10:00 AM',
      timestamp: '4 hours ago',
      user: 'Jane Smith',
      status: 'info',
    },
    {
      id: '3',
      type: 'tracking',
      title: 'Project Milestone Completed',
      description: 'Digital Transformation Phase 1 completed ahead of schedule',
      timestamp: '6 hours ago',
      user: 'Mike Johnson',
      status: 'success',
    },
    {
      id: '4',
      type: 'notification',
      title: 'System Maintenance Alert',
      description: 'Scheduled maintenance this Saturday 2:00-6:00 AM',
      timestamp: '8 hours ago',
      user: 'System',
      status: 'warning',
    },
  ]);

  const quickActions: QuickAction[] = [
    {
      name: 'New Contract',
      description: 'Create a new contract',
      href: '/contracts/new',
      icon: FileText,
      color: 'bg-blue-500',
      isNew: false,
    },
    {
      name: 'Book Resource',
      description: 'Reserve meeting room or equipment',
      href: '/booking/new',
      icon: Calendar,
      color: 'bg-green-500',
      isNew: true,
    },
    {
      name: 'Track Project',
      description: 'Monitor project progress',
      href: '/tracking/new',
      icon: Package,
      color: 'bg-purple-500',
      isNew: true,
    },
    {
      name: 'View Notifications',
      description: 'Check recent notifications',
      href: '/notifications',
      icon: Bell,
      color: 'bg-orange-500',
      isNew: true,
    },
    {
      name: 'Advanced Analytics',
      description: 'Professional insights dashboard',
      href: '/dashboard/advanced',
      icon: TrendingUp,
      color: 'bg-indigo-500',
      isNew: true,
    },
    {
      name: 'Generate Report',
      description: 'Create custom reports',
      href: '/reports/custom',
      icon: BarChart3,
      color: 'bg-pink-500',
      isNew: false,
    },
  ];

  const phase4Features = [
    {
      name: 'Booking System',
      description: 'Complete resource booking and scheduling system',
      status: 'Active',
      usage: '89%',
      href: '/booking',
    },
    {
      name: 'Tracking Dashboard',
      description: 'Real-time project and delivery tracking',
      status: 'Active',
      usage: '76%',
      href: '/tracking',
    },
    {
      name: 'Notification Center',
      description: 'Comprehensive notification management',
      status: 'Active',
      usage: '94%',
      href: '/notifications',
    },
    {
      name: 'Advanced Analytics',
      description: 'Professional insights and reporting',
      status: 'Active',
      usage: '67%',
      href: '/dashboard/advanced',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return FileText;
      case 'booking':
        return Calendar;
      case 'tracking':
        return Package;
      case 'notification':
        return Bell;
      default:
        return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Contract Management Dashboard
          </h1>
          <div className='flex items-center gap-2 mt-2'>
            <Badge variant='default' className='bg-blue-500'>
              Phase 4 Active
            </Badge>
            <Badge variant='outline'>Advanced Professional System</Badge>
            <div className='flex items-center gap-1 ml-2'>
              <div className='h-2 w-2 bg-green-500 rounded-full animate-pulse' />
              <span className='text-sm text-muted-foreground'>
                All systems operational
              </span>
            </div>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Button variant='outline'>
            <RefreshCw className='h-4 w-4 mr-2' />
            Refresh
          </Button>
          <Button>
            <Plus className='h-4 w-4 mr-2' />
            Quick Action
          </Button>
        </div>
      </div>

      {/* Phase 4 Feature Showcase */}
      <Card className='border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50'>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Zap className='h-6 w-6 text-blue-600' />
            <CardTitle className='text-blue-900'>
              🚀 Phase 4: Advanced Professional Features
            </CardTitle>
          </div>
          <CardDescription className='text-blue-700'>
            Your system now includes enterprise-grade features for complete
            business management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {phase4Features.map((feature, index) => (
              <motion.div
                key={feature.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={feature.href}>
                  <Card className='hover:shadow-lg transition-shadow cursor-pointer border-blue-200'>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between mb-2'>
                        <Badge
                          variant='outline'
                          className='text-green-600 border-green-200'
                        >
                          {feature.status}
                        </Badge>
                        <Badge variant='secondary' className='text-xs'>
                          NEW
                        </Badge>
                      </div>
                      <h3 className='font-semibold text-sm mb-1'>
                        {feature.name}
                      </h3>
                      <p className='text-xs text-muted-foreground mb-3'>
                        {feature.description}
                      </p>
                      <div className='space-y-1'>
                        <div className='flex justify-between text-xs'>
                          <span>Usage</span>
                          <span>{feature.usage}</span>
                        </div>
                        <Progress
                          value={parseInt(feature.usage)}
                          className='h-1'
                        />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6'>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center'>
                  <FileText className='h-6 w-6 text-blue-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Contracts
                  </p>
                  <p className='text-2xl font-bold'>{stats.contracts.total}</p>
                  <p className='text-xs text-muted-foreground'>
                    {stats.contracts.active} active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center'>
                  <Calendar className='h-6 w-6 text-green-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Bookings
                  </p>
                  <p className='text-2xl font-bold'>{stats.bookings.total}</p>
                  <p className='text-xs text-muted-foreground'>
                    {stats.bookings.today} today
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center'>
                  <Package className='h-6 w-6 text-purple-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Tracking
                  </p>
                  <p className='text-2xl font-bold'>{stats.tracking.active}</p>
                  <p className='text-xs text-muted-foreground'>
                    {stats.tracking.onTrack} on track
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center relative'>
                  <Bell className='h-6 w-6 text-orange-600' />
                  {stats.notifications.unread > 0 && (
                    <div className='absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center'>
                      <span className='text-xs text-white font-medium'>
                        {stats.notifications.unread > 9
                          ? '9+'
                          : stats.notifications.unread}
                      </span>
                    </div>
                  )}
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Notifications
                  </p>
                  <p className='text-2xl font-bold'>
                    {stats.notifications.unread}
                  </p>
                  <p className='text-xs text-muted-foreground'>unread</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardContent className='p-6'>
              <div className='flex items-center gap-4'>
                <div className='w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center'>
                  <Users className='h-6 w-6 text-indigo-600' />
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Users
                  </p>
                  <p className='text-2xl font-bold'>{stats.users.total}</p>
                  <p className='text-xs text-muted-foreground'>
                    {stats.users.active} active
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Quick Actions */}
        <div className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Frequently used features and new Phase 4 capabilities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={action.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Link href={action.href}>
                        <Card className='hover:shadow-lg transition-all cursor-pointer group'>
                          <CardContent className='p-4 text-center'>
                            <div
                              className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}
                            >
                              <Icon className='h-6 w-6 text-white' />
                            </div>
                            <div className='flex items-center justify-center gap-1 mb-1'>
                              <h3 className='font-medium text-sm'>
                                {action.name}
                              </h3>
                              {action.isNew && (
                                <Badge
                                  variant='default'
                                  className='text-xs px-1 py-0'
                                >
                                  NEW
                                </Badge>
                              )}
                            </div>
                            <p className='text-xs text-muted-foreground'>
                              {action.description}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest system updates and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {recentActivity.map((activity, index) => {
                  const Icon = getActivityIcon(activity.type);
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className='flex gap-3'
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getStatusColor(activity.status)}`}
                      >
                        <Icon className='h-4 w-4' />
                      </div>
                      <div className='flex-1 min-w-0'>
                        <p className='text-sm font-medium'>{activity.title}</p>
                        <p className='text-xs text-muted-foreground mb-1'>
                          {activity.description}
                        </p>
                        <div className='flex items-center justify-between text-xs text-muted-foreground'>
                          <span>{activity.user}</span>
                          <span>{activity.timestamp}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <div className='mt-4 pt-4 border-t'>
                <Link href='/activity'>
                  <Button variant='outline' className='w-full' size='sm'>
                    View All Activity
                    <ArrowRight className='h-4 w-4 ml-2' />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status & Health</CardTitle>
          <CardDescription>
            Current system performance and feature availability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            <div className='flex items-center gap-3'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              <div>
                <p className='font-medium text-sm'>Database</p>
                <p className='text-xs text-muted-foreground'>Operational</p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              <div>
                <p className='font-medium text-sm'>Booking System</p>
                <p className='text-xs text-muted-foreground'>Active</p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              <div>
                <p className='font-medium text-sm'>Tracking System</p>
                <p className='text-xs text-muted-foreground'>Running</p>
              </div>
            </div>

            <div className='flex items-center gap-3'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              <div>
                <p className='font-medium text-sm'>Notifications</p>
                <p className='text-xs text-muted-foreground'>Online</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
