'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Factory,
  Network,
  TrendingUp,
  DollarSign,
  Star,
  Activity,
  ArrowRight,
  Eye,
  Settings,
  Bell,
  Calendar,
  Plus,
  BarChart3,
  PieChart,
  Zap,
  Target,
  Award,
  Heart,
  CheckCircle,
  AlertCircle,
  Clock,
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Import the specific dashboard components
import { ClientManagementDashboard } from '@/components/client-management/client-management-dashboard';
import { ProviderManagementDashboard } from '@/components/provider-management/provider-management-dashboard';
import { ClientProviderRelationships } from '@/components/relationships/client-provider-relationships';

interface SystemStats {
  total_clients: number;
  total_providers: number;
  active_relationships: number;
  total_value: number;
  system_health: number;
  growth_rate: number;
  satisfaction_avg: number;
  pending_actions: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: string;
}

interface RecentActivity {
  id: string;
  type: 'client' | 'provider' | 'relationship' | 'contract';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info';
}

export function UnifiedBusinessDashboard() {
  const [selectedView, setSelectedView] = useState<
    'overview' | 'clients' | 'providers' | 'relationships'
  >('overview');
  const [systemStats] = useState<SystemStats>({
    total_clients: 12,
    total_providers: 16,
    active_relationships: 18,
    total_value: 675000,
    system_health: 94,
    growth_rate: 23.5,
    satisfaction_avg: 4.4,
    pending_actions: 3,
  });

  const quickActions: QuickAction[] = [
    {
      title: 'Add New Client',
      description: 'Onboard a new client to the system',
      icon: Users,
      color: 'blue',
      action: 'client-add',
    },
    {
      title: 'Register Provider',
      description: 'Add a new service provider',
      icon: Factory,
      color: 'green',
      action: 'provider-add',
    },
    {
      title: 'Create Partnership',
      description: 'Establish client-provider relationship',
      icon: Heart,
      color: 'purple',
      action: 'relationship-add',
    },
    {
      title: 'Generate Report',
      description: 'Create business intelligence report',
      icon: BarChart3,
      color: 'orange',
      action: 'report-generate',
    },
  ];

  const recentActivities: RecentActivity[] = [
    {
      id: '1',
      type: 'relationship',
      title: 'New Partnership Established',
      description: 'Oman National Bank partnered with Smart Pro Services',
      time: '2 hours ago',
      status: 'success',
    },
    {
      id: '2',
      type: 'client',
      title: 'Client Contract Renewed',
      description: 'Muscat Municipality renewed annual contract',
      time: '4 hours ago',
      status: 'info',
    },
    {
      id: '3',
      type: 'provider',
      title: 'Provider Capacity Alert',
      description: 'TechFlow Solutions approaching capacity limit',
      time: '6 hours ago',
      status: 'warning',
    },
    {
      id: '4',
      type: 'contract',
      title: 'Contract Milestone Achieved',
      description: 'Elite Workforce completed Q1 objectives',
      time: '1 day ago',
      status: 'success',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'client':
        return Users;
      case 'provider':
        return Factory;
      case 'relationship':
        return Heart;
      case 'contract':
        return Award;
      default:
        return Activity;
    }
  };

  const getActivityColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getQuickActionColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700';
      case 'green':
        return 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700';
      case 'purple':
        return 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700';
      case 'orange':
        return 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700';
      default:
        return 'from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700';
    }
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'client-add':
        setSelectedView('clients');
        // In a real app, this would open a client creation modal
        break;
      case 'provider-add':
        setSelectedView('providers');
        // In a real app, this would open a provider registration modal
        break;
      case 'partnership-create':
        setSelectedView('relationships');
        // In a real app, this would open a partnership creation modal
        break;
      case 'analytics-view':
        // In a real app, this would open analytics dashboard
        break;
      default:
    }
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-blue-50'>
      <div className='space-y-6 p-6'>
        {/* Header */}
        <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
          <div>
            <h1 className='text-4xl font-bold tracking-tight flex items-center gap-3'>
              <div className='p-3 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg'>
                <LayoutDashboard className='h-10 w-10 text-white' />
              </div>
              Business Management System
            </h1>
            <p className='text-muted-foreground mt-2 text-lg'>
              Comprehensive client and provider relationship management platform
            </p>
          </div>

          <div className='flex items-center gap-3'>
            <Button
              variant='outline'
              className='flex items-center gap-2'
              onClick={() => console.log('Opening notifications panel...')}
            >
              <Bell className='h-4 w-4' />
              Notifications
              {systemStats.pending_actions > 0 && (
                <Badge variant='destructive' className='ml-1'>
                  {systemStats.pending_actions}
                </Badge>
              )}
            </Button>
            <Button
              variant='outline'
              className='flex items-center gap-2'
              onClick={() => console.log('Opening settings panel...')}
            >
              <Settings className='h-4 w-4' />
              Settings
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs
          value={selectedView}
          onValueChange={v => setSelectedView(v as any)}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-4 h-14'>
            <TabsTrigger
              value='overview'
              className='flex items-center gap-2 h-full'
            >
              <LayoutDashboard className='h-4 w-4' />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value='clients'
              className='flex items-center gap-2 h-full'
            >
              <Users className='h-4 w-4' />
              Clients
            </TabsTrigger>
            <TabsTrigger
              value='providers'
              className='flex items-center gap-2 h-full'
            >
              <Factory className='h-4 w-4' />
              Providers
            </TabsTrigger>
            <TabsTrigger
              value='relationships'
              className='flex items-center gap-2 h-full'
            >
              <Network className='h-4 w-4' />
              Relationships
            </TabsTrigger>
          </TabsList>

          <TabsContent value='overview' className='space-y-8'>
            {/* Complete System Features Showcase */}
            <Card className='bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-indigo-200'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2 text-indigo-800'>
                  <LayoutDashboard className='h-6 w-6 text-indigo-600' />
                  Complete Business Management System Features
                </CardTitle>
                <CardDescription className='text-indigo-600'>
                  Comprehensive platform for client, provider, and relationship
                  management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  {/* Client Management Features */}
                  <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
                    <div className='flex items-center gap-2 mb-3'>
                      <Users className='h-6 w-6 text-blue-600' />
                      <h3 className='font-semibold text-blue-800'>
                        Client Management
                      </h3>
                    </div>
                    <ul className='space-y-1 text-sm text-blue-600'>
                      <li>• Complete client profiles</li>
                      <li>• Revenue tracking</li>
                      <li>• Satisfaction monitoring</li>
                      <li>• Contract management</li>
                      <li>• Advanced search & filters</li>
                    </ul>
                  </div>

                  {/* Provider Management Features */}
                  <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                    <div className='flex items-center gap-2 mb-3'>
                      <Factory className='h-6 w-6 text-green-600' />
                      <h3 className='font-semibold text-green-800'>
                        Provider Management
                      </h3>
                    </div>
                    <ul className='space-y-1 text-sm text-green-600'>
                      <li>• Promoter allocation</li>
                      <li>• Capacity tracking</li>
                      <li>• Performance metrics</li>
                      <li>• Service portfolio</li>
                      <li>• Quality assurance</li>
                    </ul>
                  </div>

                  {/* Relationship Management Features */}
                  <div className='p-4 bg-purple-50 rounded-lg border border-purple-200'>
                    <div className='flex items-center gap-2 mb-3'>
                      <Heart className='h-6 w-6 text-purple-600' />
                      <h3 className='font-semibold text-purple-800'>
                        Relationship Management
                      </h3>
                    </div>
                    <ul className='space-y-1 text-sm text-purple-600'>
                      <li>• Network visualization</li>
                      <li>• Strength scoring</li>
                      <li>• Partnership tracking</li>
                      <li>• Value attribution</li>
                      <li>• Smart recommendations</li>
                    </ul>
                  </div>

                  {/* Analytics & Intelligence Features */}
                  <div className='p-4 bg-orange-50 rounded-lg border border-orange-200'>
                    <div className='flex items-center gap-2 mb-3'>
                      <BarChart3 className='h-6 w-6 text-orange-600' />
                      <h3 className='font-semibold text-orange-800'>
                        Analytics & Intelligence
                      </h3>
                    </div>
                    <ul className='space-y-1 text-sm text-orange-600'>
                      <li>• Real-time dashboards</li>
                      <li>• Performance KPIs</li>
                      <li>• Predictive insights</li>
                      <li>• Growth forecasting</li>
                      <li>• Automated reporting</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Overview Stats */}
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className='relative overflow-hidden'>
                  <div className='absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full -mr-12 -mt-12' />
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Total Clients
                    </CardTitle>
                    <Users className='h-4 w-4 text-blue-500' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-3xl font-bold'>
                      {systemStats.total_clients}
                    </div>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <TrendingUp className='h-3 w-3 text-green-500' />
                      <span>+2 this month</span>
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
                  <div className='absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full -mr-12 -mt-12' />
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Service Providers
                    </CardTitle>
                    <Factory className='h-4 w-4 text-green-500' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-3xl font-bold'>
                      {systemStats.total_providers}
                    </div>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <TrendingUp className='h-3 w-3 text-green-500' />
                      <span>+3 this month</span>
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
                  <div className='absolute top-0 right-0 w-24 h-24 bg-purple-500/10 rounded-full -mr-12 -mt-12' />
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Active Partnerships
                    </CardTitle>
                    <Heart className='h-4 w-4 text-purple-500' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-3xl font-bold'>
                      {systemStats.active_relationships}
                    </div>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <TrendingUp className='h-3 w-3 text-green-500' />
                      <span>+{systemStats.growth_rate}% growth</span>
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
                  <div className='absolute top-0 right-0 w-24 h-24 bg-orange-500/10 rounded-full -mr-12 -mt-12' />
                  <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      Total Value
                    </CardTitle>
                    <DollarSign className='h-4 w-4 text-orange-500' />
                  </CardHeader>
                  <CardContent>
                    <div className='text-3xl font-bold'>
                      ${(systemStats.total_value / 1000).toFixed(0)}K
                    </div>
                    <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                      <TrendingUp className='h-3 w-3 text-green-500' />
                      <span>Network value</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* System Health & Performance */}
            <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
              <Card className='lg:col-span-2'>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Activity className='h-5 w-5' />
                    System Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-2 gap-6'>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium'>
                          System Health
                        </span>
                        <span className='text-sm font-bold text-green-600'>
                          {systemStats.system_health}%
                        </span>
                      </div>
                      <Progress
                        value={systemStats.system_health}
                        className='h-2'
                      />
                    </div>
                    <div className='space-y-3'>
                      <div className='flex justify-between items-center'>
                        <span className='text-sm font-medium'>
                          Client Satisfaction
                        </span>
                        <span className='text-sm font-bold text-blue-600'>
                          {systemStats.satisfaction_avg}/5.0
                        </span>
                      </div>
                      <Progress
                        value={(systemStats.satisfaction_avg / 5) * 100}
                        className='h-2'
                      />
                    </div>
                  </div>

                  <div className='grid grid-cols-3 gap-4 pt-4 border-t'>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-green-600'>
                        98%
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Uptime
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-blue-600'>
                        156
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Active Promoters
                      </div>
                    </div>
                    <div className='text-center'>
                      <div className='text-2xl font-bold text-purple-600'>
                        89%
                      </div>
                      <div className='text-xs text-muted-foreground'>
                        Efficiency
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Zap className='h-5 w-5' />
                    System Insights
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200'>
                    <CheckCircle className='h-4 w-4 text-green-600 mt-0.5' />
                    <div>
                      <p className='text-sm font-medium text-green-800'>
                        Excellent Growth
                      </p>
                      <p className='text-xs text-green-600'>
                        System showing strong expansion
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200'>
                    <Target className='h-4 w-4 text-blue-600 mt-0.5' />
                    <div>
                      <p className='text-sm font-medium text-blue-800'>
                        Optimization Ready
                      </p>
                      <p className='text-xs text-blue-600'>
                        Ready for scaling initiatives
                      </p>
                    </div>
                  </div>
                  <div className='flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200'>
                    <Clock className='h-4 w-4 text-yellow-600 mt-0.5' />
                    <div>
                      <p className='text-sm font-medium text-yellow-800'>
                        Pending Reviews
                      </p>
                      <p className='text-xs text-yellow-600'>
                        {systemStats.pending_actions} items need attention
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Zap className='h-5 w-5' />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Streamline your workflow with these common tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                  {quickActions.map((action, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Button
                        variant='outline'
                        onClick={() => handleQuickAction(action.action)}
                        className={`w-full h-auto p-4 flex flex-col items-center gap-3 hover:scale-105 transition-all duration-200 bg-gradient-to-br ${getQuickActionColor(action.color)} text-white border-0`}
                      >
                        <action.icon className='h-8 w-8' />
                        <div className='text-center'>
                          <div className='font-medium'>{action.title}</div>
                          <div className='text-xs opacity-90'>
                            {action.description}
                          </div>
                        </div>
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-5 w-5' />
                  Recent Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {recentActivities.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    return (
                      <motion.div
                        key={activity.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className='flex items-center gap-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors'
                      >
                        <div
                          className={`p-2 rounded-full ${getActivityColor(activity.status)}`}
                        >
                          <ActivityIcon className='h-4 w-4' />
                        </div>
                        <div className='flex-1'>
                          <p className='font-medium text-sm'>
                            {activity.title}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            {activity.description}
                          </p>
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {activity.time}
                        </div>
                        <Button variant='ghost' size='sm'>
                          <ArrowRight className='h-4 w-4' />
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='clients'>
            <ClientManagementDashboard />
          </TabsContent>

          <TabsContent value='providers'>
            <ProviderManagementDashboard />
          </TabsContent>

          <TabsContent value='relationships'>
            <ClientProviderRelationships />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
