'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Percent,
  RefreshCw,
  Bell,
  Eye,
  Filter,
  Download,
  Plus,
  ArrowRight,
  Activity,
  BookOpen,
  MapPin,
  MessageSquare,
  Settings,
  Zap,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

import { BookingService } from '@/lib/advanced/booking-service';
import { TrackingService } from '@/lib/advanced/tracking-service';
import { SimpleNotificationService } from '@/lib/advanced/simple-notification-service';

interface DashboardMetrics {
  contracts: {
    total: number;
    active: number;
    pending: number;
    completed: number;
    value: number;
    growth: number;
  };
  documents: {
    total: number;
    active: number;
    expired: number;
    expiring: number;
    compliance_rate: number;
  };
  bookings: {
    total: number;
    today: number;
    upcoming: number;
    utilization: number;
  };
  notifications: {
    total: number;
    unread: number;
    urgent: number;
  };
  activity: {
    total_events: number;
    today_events: number;
    active_users: number;
  };
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: string;
  status: string;
  priority?: string;
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export function AdvancedDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>(
    '7d'
  );
  const [selectedView, setSelectedView] = useState<
    'overview' | 'analytics' | 'activity'
  >('overview');

  const bookingService = new BookingService();
  const trackingService = new TrackingService();
  const notificationService = new SimpleNotificationService();

  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate comprehensive data loading
      await new Promise(resolve => setTimeout(resolve, 1500));

      setMetrics({
        contracts: {
          total: 287,
          active: 156,
          pending: 42,
          completed: 89,
          value: 4850000,
          growth: 12.5,
        },
        documents: {
          total: 1834,
          active: 1687,
          expired: 23,
          expiring: 124,
          compliance_rate: 94.2,
        },
        bookings: {
          total: 156,
          today: 8,
          upcoming: 24,
          utilization: 78.5,
        },
        notifications: {
          total: 89,
          unread: 12,
          urgent: 3,
        },
        activity: {
          total_events: 2341,
          today_events: 47,
          active_users: 89,
        },
      });

      setRecentActivity([
        {
          id: '1',
          type: 'contract_signed',
          description: 'Contract ABC-2024-001 has been signed by all parties',
          user: 'John Doe',
          timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
          status: 'completed',
        },
        {
          id: '2',
          type: 'document_uploaded',
          description: 'New document uploaded for XYZ Corp verification',
          user: 'Jane Smith',
          timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
          status: 'pending',
        },
        {
          id: '3',
          type: 'booking_created',
          description: 'Conference room booked for contract review meeting',
          user: 'Mike Johnson',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          status: 'confirmed',
        },
        {
          id: '4',
          type: 'document_expiry',
          description: 'Document DEF-789 expires in 7 days',
          user: 'System',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          status: 'warning',
          priority: 'high',
        },
        {
          id: '5',
          type: 'user_registered',
          description: 'New user registration pending approval',
          user: 'Alex Wilson',
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
          status: 'pending',
        },
      ]);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number, showSign: boolean = false) => {
    const sign = showSign && value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getStatusColor = (status: string, priority?: string) => {
    if (priority === 'high' || status === 'urgent')
      return 'text-red-600 bg-red-50';
    if (status === 'completed') return 'text-green-600 bg-green-50';
    if (status === 'pending') return 'text-yellow-600 bg-yellow-50';
    if (status === 'warning') return 'text-orange-600 bg-orange-50';
    return 'text-blue-600 bg-blue-50';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contract_signed':
        return CheckCircle;
      case 'document_uploaded':
        return FileText;
      case 'booking_created':
        return Calendar;
      case 'document_expiry':
        return AlertTriangle;
      case 'user_registered':
        return Users;
      default:
        return Activity;
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'new_contract',
      title: 'Generate Contract',
      description: 'Create a new contract from template',
      icon: FileText,
      color: 'bg-blue-500',
      action: () => {},
    },
    {
      id: 'book_meeting',
      title: 'Book Meeting Room',
      description: 'Reserve a conference room',
      icon: Calendar,
      color: 'bg-green-500',
      action: () => {},
    },
    {
      id: 'upload_document',
      title: 'Upload Document',
      description: 'Upload compliance documents',
      icon: Upload,
      color: 'bg-purple-500',
      action: () => {},
    },
    {
      id: 'send_notification',
      title: 'Send Announcement',
      description: 'Broadcast system announcement',
      icon: Bell,
      color: 'bg-orange-500',
      action: () => {},
    },
  ];

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4' />
          <p className='text-muted-foreground text-lg'>
            Loading advanced dashboard...
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            Fetching real-time data
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'>
            Advanced Dashboard
          </h1>
          <p className='text-muted-foreground'>
            Comprehensive system overview with real-time insights and analytics
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Select
            value={timeRange}
            onValueChange={(value: any) => setTimeRange(value)}
          >
            <SelectTrigger className='w-[140px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='24h'>Last 24 hours</SelectItem>
              <SelectItem value='7d'>Last 7 days</SelectItem>
              <SelectItem value='30d'>Last 30 days</SelectItem>
              <SelectItem value='90d'>Last 90 days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>

          <Button>
            <Plus className='h-4 w-4 mr-2' />
            Quick Action
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10' />
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Active Contracts
              </CardTitle>
              <FileText className='h-4 w-4 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {metrics?.contracts.active}
              </div>
              <p className='text-xs text-muted-foreground'>
                <span className='text-green-600'>
                  {formatPercentage(metrics?.contracts.growth || 0, true)}
                </span>{' '}
                from last period
              </p>
              <div className='mt-2'>
                <Progress value={85} className='h-1' />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10' />
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Contract Value
              </CardTitle>
              <DollarSign className='h-4 w-4 text-green-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatCurrency(metrics?.contracts.value || 0)}
              </div>
              <p className='text-xs text-muted-foreground'>
                Total active contract value
              </p>
              <div className='mt-2'>
                <Progress value={92} className='h-1' />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10' />
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Compliance Rate
              </CardTitle>
              <Percent className='h-4 w-4 text-purple-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {formatPercentage(metrics?.documents.compliance_rate || 0)}
              </div>
              <p className='text-xs text-muted-foreground'>
                Document compliance score
              </p>
              <div className='mt-2'>
                <Progress
                  value={metrics?.documents.compliance_rate || 0}
                  className='h-1'
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10' />
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Urgent Alerts
              </CardTitle>
              <AlertTriangle className='h-4 w-4 text-orange-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-orange-600'>
                {metrics?.notifications.urgent}
              </div>
              <p className='text-xs text-muted-foreground'>
                Require immediate attention
              </p>
              <div className='mt-2'>
                <Progress value={15} className='h-1 bg-orange-100' />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={selectedView}
        onValueChange={(value: any) => setSelectedView(value)}
        className='space-y-6'
      >
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='overview'>System Overview</TabsTrigger>
          <TabsTrigger value='analytics'>Advanced Analytics</TabsTrigger>
          <TabsTrigger value='activity'>Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='h-5 w-5 text-yellow-500' />
                  Quick Actions
                </CardTitle>
                <CardDescription>Common tasks and shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4'>
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <Button
                        variant='outline'
                        className='h-auto p-4 flex flex-col gap-2 w-full hover:scale-105 transition-transform'
                        onClick={action.action}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center`}
                        >
                          <action.icon className='h-4 w-4 text-white' />
                        </div>
                        <div className='text-center'>
                          <div className='font-medium text-sm'>
                            {action.title}
                          </div>
                          <div className='text-xs text-muted-foreground'>
                            {action.description}
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-5 w-5 text-green-500' />
                  System Health
                </CardTitle>
                <CardDescription>
                  Real-time system status and performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 bg-green-500 rounded-full animate-pulse' />
                      <span className='text-sm'>Database Status</span>
                    </div>
                    <Badge variant='default'>Healthy</Badge>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 bg-blue-500 rounded-full' />
                      <span className='text-sm'>API Response Time</span>
                    </div>
                    <Badge variant='outline'>152ms</Badge>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 bg-yellow-500 rounded-full' />
                      <span className='text-sm'>Storage Usage</span>
                    </div>
                    <Badge variant='secondary'>67% Used</Badge>
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      <div className='w-3 h-3 bg-purple-500 rounded-full' />
                      <span className='text-sm'>Active Users</span>
                    </div>
                    <Badge variant='outline'>
                      {metrics?.activity.active_users}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Metrics */}
          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Document Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Active Documents</span>
                    <span className='font-medium'>
                      {metrics?.documents.active}
                    </span>
                  </div>
                  <Progress value={92} className='h-2' />

                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Expiring Soon</span>
                    <span className='font-medium text-orange-600'>
                      {metrics?.documents.expiring}
                    </span>
                  </div>
                  <Progress value={15} className='h-2 bg-orange-100' />

                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Expired</span>
                    <span className='font-medium text-red-600'>
                      {metrics?.documents.expired}
                    </span>
                  </div>
                  <Progress value={5} className='h-2 bg-red-100' />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='text-center'>
                    <div className='text-3xl font-bold text-blue-600'>
                      {formatPercentage(metrics?.bookings.utilization || 0)}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Resource Utilization
                    </div>
                  </div>

                  <Progress
                    value={metrics?.bookings.utilization || 0}
                    className='h-3'
                  />

                  <div className='grid grid-cols-2 gap-4 text-center'>
                    <div>
                      <div className='text-xl font-semibold'>
                        {metrics?.bookings.today}
                      </div>
                      <div className='text-xs text-muted-foreground'>Today</div>
                    </div>
                    <div>
                      <div className='text-xl font-semibold'>
                        {metrics?.bookings.upcoming}
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Upcoming
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Unread</span>
                    <Badge variant='destructive'>
                      {metrics?.notifications.unread}
                    </Badge>
                  </div>

                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Urgent</span>
                    <Badge variant='destructive'>
                      {metrics?.notifications.urgent}
                    </Badge>
                  </div>

                  <div className='flex justify-between items-center'>
                    <span className='text-sm'>Total</span>
                    <Badge variant='outline'>
                      {metrics?.notifications.total}
                    </Badge>
                  </div>

                  <Button variant='outline' className='w-full' size='sm'>
                    <Bell className='h-4 w-4 mr-2' />
                    View All Notifications
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='analytics' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
                <CardDescription>Key metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center text-muted-foreground'>
                  <div className='text-center'>
                    <BarChart3 className='h-12 w-12 mx-auto mb-4 opacity-50' />
                    <p>Advanced charts and analytics</p>
                    <p className='text-sm'>Integration with charting library</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contract Distribution</CardTitle>
                <CardDescription>Contract status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='text-center p-4 border rounded-lg'>
                      <div className='text-2xl font-bold text-green-600'>
                        {metrics?.contracts.active}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Active
                      </div>
                    </div>
                    <div className='text-center p-4 border rounded-lg'>
                      <div className='text-2xl font-bold text-yellow-600'>
                        {metrics?.contracts.pending}
                      </div>
                      <div className='text-sm text-muted-foreground'>
                        Pending
                      </div>
                    </div>
                  </div>
                  <div className='text-center p-4 border rounded-lg'>
                    <div className='text-2xl font-bold text-blue-600'>
                      {metrics?.contracts.completed}
                    </div>
                    <div className='text-sm text-muted-foreground'>
                      Completed
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='activity' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Activity className='h-5 w-5' />
                Recent System Activity
              </CardTitle>
              <CardDescription>
                Real-time activity feed across all system modules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <AnimatePresence>
                  {recentActivity.map((activity, index) => {
                    const Icon = getActivityIcon(activity.type);
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.1 }}
                        className='flex items-start gap-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors'
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusColor(activity.status, activity.priority)}`}
                        >
                          <Icon className='h-5 w-5' />
                        </div>
                        <div className='flex-1 min-w-0'>
                          <p className='font-medium text-sm'>
                            {activity.description}
                          </p>
                          <div className='flex items-center gap-2 mt-1'>
                            <span className='text-xs text-muted-foreground'>
                              {activity.user}
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              •
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {new Date(
                                activity.timestamp
                              ).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant='outline' className='capitalize'>
                          {activity.status}
                        </Badge>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>

              <div className='mt-6 text-center'>
                <Button variant='outline'>
                  View Full Activity Log
                  <ArrowRight className='h-4 w-4 ml-2' />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Placeholder Upload icon
const Upload = FileText;
