'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Plus,
  Filter,
  Calendar,
  Star,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  Eye,
  Edit,
  Download,
  Archive,
  RefreshCw,
  BarChart3,
  FileText,
  Briefcase,
  Target,
  Award,
  MapPin,
  Phone,
  Mail,
  Heart,
  Share2,
  Settings,
  Bell,
  Activity,
  Zap,
  Package,
  Loader2,
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
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';

interface ClientProject {
  id: string;
  title: string;
  description: string;
  provider: {
    id: string;
    name: string;
    avatar_url: string;
    rating: number;
    email: string;
  };
  status: 'active' | 'completed' | 'pending' | 'cancelled' | 'in_review';
  progress: number;
  budget: number;
  deadline: string;
  category: string;
  service_type: string;
  created_at: string;
  updated_at: string;
}

interface ClientStats {
  active_projects: number;
  completed_projects: number;
  total_spent: number;
  saved_providers: number;
  pending_reviews: number;
  avg_project_rating: number;
  this_month_spent: number;
}

interface RealTimeClientDashboardProps {
  clientId: string;
}

export function RealTimeClientDashboard({
  clientId,
}: RealTimeClientDashboardProps) {
  const { hasPermission } = useEnhancedRBAC();
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [projects, setProjects] = useState<ClientProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    if (clientId && hasPermission('dashboard.view')) {
      loadClientData();
      setupRealtimeSubscriptions();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadClientStats(), loadClientProjects()]);
    } catch (error) {
      console.error('Error loading client data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadClientStats = async () => {
    try {
      const response = await fetch('/api/client/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch client stats');
      }

      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error loading client stats:', error);
      toast.error('Failed to load client statistics');
    }
  };

  const loadClientProjects = async () => {
    try {
      const response = await fetch('/api/client/projects');
      if (!response.ok) {
        throw new Error('Failed to fetch client projects');
      }

      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      console.error('Error loading client projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to bookings changes for this client
    const bookingsSubscription = supabase
      .channel('client-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          loadClientProjects();
          loadClientStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(bookingsSubscription);
    };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClientData();
    setRefreshing(false);
    toast.success('Dashboard refreshed!');
  };

  const handleProjectAction = async (action: string, projectId: string) => {
    try {
      const response = await fetch('/api/client/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} project`);
      }

      await loadClientProjects();
      await loadClientStats();
      toast.success(`Project ${action} completed!`);
    } catch (error) {
      console.error(`Error ${action} project:`, error);
      toast.error(`Failed to ${action} project`);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'in_review':
        return 'bg-purple-100 text-purple-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Activity className='h-4 w-4' />;
      case 'completed':
        return <CheckCircle className='h-4 w-4' />;
      case 'pending':
        return <Clock className='h-4 w-4' />;
      case 'in_review':
        return <Eye className='h-4 w-4' />;
      case 'cancelled':
        return <AlertCircle className='h-4 w-4' />;
      default:
        return <Package className='h-4 w-4' />;
    }
  };

  const getServiceTypeLabel = (serviceType: string): string => {
    const labels: Record<string, string> = {
      seo_audit: 'SEO Audit',
      google_ads: 'Google Ads',
      social_media: 'Social Media',
      content_marketing: 'Content Marketing',
      ppc_management: 'PPC Management',
      email_marketing: 'Email Marketing',
      web_analytics: 'Web Analytics',
      conversion_optimization: 'Conversion Optimization',
    };
    return labels[serviceType] || serviceType;
  };

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='animate-pulse space-y-8'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            {[...Array(6)].map((_, i) => (
              <div key={i} className='h-32 bg-gray-200 rounded'></div>
            ))}
          </div>
          <div className='h-96 bg-gray-200 rounded'></div>
        </div>
      </div>
    );
  }

  if (!hasPermission('dashboard.view')) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Card>
          <CardContent className='p-12 text-center'>
            <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Access Denied
            </h3>
            <p className='text-gray-600'>
              You don't have permission to access the client dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 space-y-8'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Client Dashboard</h1>
          <p className='text-gray-600'>
            Manage your projects, discover services, and track progress
          </p>
        </div>

        <div className='flex space-x-3'>
          <Button
            onClick={handleRefresh}
            variant='outline'
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'>
            <Plus className='h-4 w-4 mr-2' />
            New Project
          </Button>
          <Link href='/marketplace/services'>
            <Button variant='outline'>
              <Search className='h-4 w-4 mr-2' />
              Browse Services
            </Button>
          </Link>
        </div>
      </div>

      {/* Overview Stats */}
      <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4'>
        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-blue-100 rounded-lg'>
                <Activity className='h-5 w-5 text-blue-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>Active Projects</p>
                <p className='text-2xl font-bold'>
                  {stats?.active_projects || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-green-100 rounded-lg'>
                <CheckCircle className='h-5 w-5 text-green-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>Completed</p>
                <p className='text-2xl font-bold'>
                  {stats?.completed_projects || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-purple-100 rounded-lg'>
                <DollarSign className='h-5 w-5 text-purple-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>Total Spent</p>
                <p className='text-2xl font-bold'>
                  ${stats?.total_spent.toLocaleString() || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-yellow-100 rounded-lg'>
                <Heart className='h-5 w-5 text-yellow-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>Saved Providers</p>
                <p className='text-2xl font-bold'>
                  {stats?.saved_providers || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-orange-100 rounded-lg'>
                <Star className='h-5 w-5 text-orange-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>Avg Rating</p>
                <p className='text-2xl font-bold'>
                  {stats?.avg_project_rating || '0'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-4'>
            <div className='flex items-center space-x-3'>
              <div className='p-2 bg-red-100 rounded-lg'>
                <AlertCircle className='h-5 w-5 text-red-600' />
              </div>
              <div>
                <p className='text-sm text-gray-600'>Pending Reviews</p>
                <p className='text-2xl font-bold'>
                  {stats?.pending_reviews || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-6'
      >
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='projects'>
            My Projects ({projects.length})
          </TabsTrigger>
          <TabsTrigger value='services'>Discover Services</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  Recent Projects
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setActiveTab('projects')}
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {projects.slice(0, 3).map(project => (
                    <div
                      key={project.id}
                      className='flex items-center space-x-4 p-3 rounded-lg border'
                    >
                      <Avatar>
                        <AvatarImage src={project.provider.avatar_url} />
                        <AvatarFallback>
                          {project.provider.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className='flex-1 min-w-0'>
                        <h4 className='font-medium text-sm text-gray-900 truncate'>
                          {project.title}
                        </h4>
                        <p className='text-sm text-gray-600'>
                          {project.provider.name}
                        </p>
                        <div className='flex items-center space-x-2 mt-1'>
                          <Badge className={getStatusColor(project.status)}>
                            {getStatusIcon(project.status)}
                            <span className='ml-1 capitalize'>
                              {project.status}
                            </span>
                          </Badge>
                          <span className='text-xs text-gray-500'>
                            ${project.budget.toLocaleString()}
                          </span>
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className='text-sm font-medium'>
                          {project.progress}%
                        </div>
                        <Progress
                          value={project.progress}
                          className='w-16 h-2 mt-1'
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-2 gap-4'>
                  <Link href='/marketplace/services'>
                    <Button variant='outline' className='h-16 flex-col w-full'>
                      <Search className='h-6 w-6 mb-2' />
                      Find Services
                    </Button>
                  </Link>
                  <Button variant='outline' className='h-16 flex-col'>
                    <MessageCircle className='h-6 w-6 mb-2' />
                    Contact Provider
                  </Button>
                  <Button
                    variant='outline'
                    className='h-16 flex-col'
                    onClick={() => setActiveTab('analytics')}
                  >
                    <BarChart3 className='h-6 w-6 mb-2' />
                    View Reports
                  </Button>
                  <Button variant='outline' className='h-16 flex-col'>
                    <Calendar className='h-6 w-6 mb-2' />
                    Schedule Meeting
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
              <CardDescription>
                Your project portfolio and spending summary
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <div className='text-center'>
                  <div className='text-3xl font-bold text-blue-600 mb-2'>
                    ${stats?.this_month_spent.toLocaleString() || '0'}
                  </div>
                  <p className='text-sm text-gray-600'>This Month Spent</p>
                  <div className='flex items-center justify-center mt-2 text-sm'>
                    <TrendingUp className='h-4 w-4 text-green-500 mr-1' />
                    <span className='text-green-500'>Budget on track</span>
                  </div>
                </div>

                <div className='text-center'>
                  <div className='text-3xl font-bold text-green-600 mb-2'>
                    {Math.round(
                      ((stats?.completed_projects || 0) /
                        Math.max(
                          stats?.active_projects ||
                            1 + stats?.completed_projects ||
                            0,
                          1
                        )) *
                        100
                    )}
                    %
                  </div>
                  <p className='text-sm text-gray-600'>Success Rate</p>
                  <Progress
                    value={Math.round(
                      ((stats?.completed_projects || 0) /
                        Math.max(
                          stats?.active_projects ||
                            1 + stats?.completed_projects ||
                            0,
                          1
                        )) *
                        100
                    )}
                    className='mt-2'
                  />
                </div>

                <div className='text-center'>
                  <div className='text-3xl font-bold text-yellow-600 mb-2'>
                    {stats?.avg_project_rating || '0'}
                  </div>
                  <p className='text-sm text-gray-600'>Average Rating Given</p>
                  <div className='flex justify-center mt-2'>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(stats?.avg_project_rating || 0)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value='projects' className='space-y-6'>
          <div className='flex items-center space-x-4'>
            <Input
              placeholder='Search projects...'
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className='max-w-sm'
            />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Projects</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='in_review'>In Review</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {projects
              .filter(
                project =>
                  filterCategory === 'all' || project.status === filterCategory
              )
              .filter(
                project =>
                  project.title
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()) ||
                  project.provider.name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
              )
              .map(project => (
                <Card
                  key={project.id}
                  className='hover:shadow-lg transition-shadow'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between'>
                      <Badge className={getStatusColor(project.status)}>
                        {getStatusIcon(project.status)}
                        <span className='ml-1 capitalize'>
                          {project.status}
                        </span>
                      </Badge>
                      <span className='text-sm text-gray-500'>
                        {getServiceTypeLabel(project.service_type)}
                      </span>
                    </div>
                    <h3 className='font-semibold text-lg'>{project.title}</h3>
                  </CardHeader>

                  <CardContent>
                    <div className='space-y-4'>
                      <div className='flex items-center space-x-3'>
                        <Avatar>
                          <AvatarImage src={project.provider.avatar_url} />
                          <AvatarFallback>
                            {project.provider.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className='font-medium text-sm'>
                            {project.provider.name}
                          </p>
                          <div className='flex items-center text-xs text-gray-500'>
                            <Star className='h-3 w-3 fill-yellow-400 text-yellow-400 mr-1' />
                            {project.provider.rating}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className='flex justify-between text-sm mb-2'>
                          <span>Progress</span>
                          <span>{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className='h-2' />
                      </div>

                      <div className='flex items-center justify-between text-sm'>
                        <div>
                          <span className='text-gray-600'>Budget: </span>
                          <span className='font-medium'>
                            ${project.budget.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className='text-gray-600'>Due: </span>
                          <span className='font-medium'>
                            {new Date(project.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className='flex space-x-2'>
                        <Button variant='outline' size='sm' className='flex-1'>
                          <Eye className='h-4 w-4 mr-1' />
                          View
                        </Button>
                        <Button variant='outline' size='sm' className='flex-1'>
                          <MessageCircle className='h-4 w-4 mr-1' />
                          Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        {/* Discover Services Tab */}
        <TabsContent value='services' className='space-y-6'>
          <Card>
            <CardContent className='p-12 text-center'>
              <Search className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>
                Discover New Services
              </h3>
              <p className='text-gray-600 mb-4'>
                Browse our marketplace to find the perfect service provider for
                your next project
              </p>
              <Link href='/marketplace/services'>
                <Button>
                  <Search className='h-4 w-4 mr-2' />
                  Browse Marketplace
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value='analytics' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Client Analytics</CardTitle>
              <CardDescription>
                Track your project performance and spending patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
                <div>
                  <h4 className='font-semibold text-gray-900 mb-4'>
                    Project Performance
                  </h4>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>
                        Completion Rate
                      </span>
                      <span className='font-medium'>
                        {Math.round(
                          ((stats?.completed_projects || 0) /
                            Math.max(
                              stats?.active_projects ||
                                1 + stats?.completed_projects ||
                                0,
                              1
                            )) *
                            100
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={Math.round(
                        ((stats?.completed_projects || 0) /
                          Math.max(
                            stats?.active_projects ||
                              1 + stats?.completed_projects ||
                              0,
                            1
                          )) *
                          100
                      )}
                      className='h-2'
                    />

                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>
                        Average Rating Given
                      </span>
                      <span className='font-medium'>
                        {stats?.avg_project_rating || '0'}/5
                      </span>
                    </div>
                    <Progress
                      value={(stats?.avg_project_rating || 0) * 20}
                      className='h-2'
                    />

                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-gray-600'>
                        On-Time Delivery
                      </span>
                      <span className='font-medium'>95%</span>
                    </div>
                    <Progress value={95} className='h-2' />
                  </div>
                </div>

                <div>
                  <h4 className='font-semibold text-gray-900 mb-4'>
                    Spending Analysis
                  </h4>
                  <div className='space-y-4'>
                    <div className='p-4 bg-blue-50 rounded-lg'>
                      <div className='text-2xl font-bold text-blue-600'>
                        ${stats?.total_spent.toLocaleString() || '0'}
                      </div>
                      <p className='text-sm text-blue-700'>Total Investment</p>
                    </div>

                    <div className='p-4 bg-green-50 rounded-lg'>
                      <div className='text-2xl font-bold text-green-600'>
                        ${stats?.this_month_spent.toLocaleString() || '0'}
                      </div>
                      <p className='text-sm text-green-700'>This Month</p>
                    </div>

                    <div className='p-4 bg-purple-50 rounded-lg'>
                      <div className='text-2xl font-bold text-purple-600'>
                        $
                        {Math.round(
                          (stats?.total_spent || 0) /
                            Math.max(stats?.completed_projects || 1, 1)
                        ).toLocaleString()}
                      </div>
                      <p className='text-sm text-purple-700'>
                        Average per Project
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
