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

interface ClientDashboardData {
  overview: {
    activeProjects: number;
    completedProjects: number;
    totalSpent: number;
    savedProviders: number;
    pendingReviews: number;
    avgProjectRating: number;
  };

  recentProjects: {
    id: string;
    title: string;
    provider: {
      id: string;
      name: string;
      avatar: string;
      rating: number;
    };
    status: 'active' | 'completed' | 'pending' | 'cancelled' | 'in_review';
    progress: number;
    budget: number;
    deadline: string;
    category: string;
    lastUpdate: string;
  }[];

  availableServices: {
    id: string;
    title: string;
    description: string;
    provider: {
      id: string;
      name: string;
      avatar: string;
      rating: number;
      responseTime: string;
    };
    price: number;
    duration: string;
    category: string;
    featured: boolean;
    tags: string[];
  }[];

  messages: {
    id: string;
    providerId: string;
    providerName: string;
    providerAvatar: string;
    lastMessage: string;
    timestamp: string;
    unread: boolean;
    projectId: string;
    projectTitle: string;
  }[];

  savedProviders: {
    id: string;
    name: string;
    avatar: string;
    specialization: string;
    rating: number;
    completedProjects: number;
    responseTime: string;
    lastActive: string;
  }[];
}

export function ComprehensiveClientDashboard() {
  const [dashboardData, setDashboardData] =
    useState<ClientDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch real data from API
      const [contractsResponse, partiesResponse] = await Promise.all([
        fetch('/api/contracts?limit=1000'),
        fetch('/api/parties?type=Client&limit=1000'),
      ]);

      const contractsData = await contractsResponse.json();
      const partiesData = await partiesResponse.json();

      // Get current user's client party (if any)
      const clientParties = partiesData.success
        ? (partiesData.parties || []).filter((p: any) => p.type === 'Client')
        : [];
      const contracts = contractsData.success
        ? contractsData.contracts || []
        : [];

      // Calculate overview stats
      const activeContracts = contracts.filter((c: any) =>
        ['active', 'pending', 'in_progress'].includes(c.status?.toLowerCase())
      );
      const completedContracts = contracts.filter((c: any) =>
        ['completed', 'closed', 'finished'].includes(c.status?.toLowerCase())
      );
      const totalSpent = contracts.reduce(
        (sum: number, c: any) => sum + (parseFloat(c.contract_value) || 0),
        0
      );

      // Transform contracts to projects format
      const recentProjects = activeContracts
        .slice(0, 10)
        .map((contract: any, index: number) => ({
          id: contract.id || `contract_${index}`,
          title:
            contract.title || contract.contract_number || 'Untitled Contract',
          provider: {
            id: contract.employer_id || '',
            name: contract.employer_name || 'Unknown Employer',
            avatar: null,
            rating: 0,
          },
          status: contract.status?.toLowerCase() || 'active',
          progress: contract.progress || 0,
          budget: parseFloat(contract.contract_value) || 0,
          deadline: contract.contract_end_date || '',
          category: contract.contract_type || 'General',
          lastUpdate: contract.updated_at || contract.created_at,
        }));

      const dashboardData: ClientDashboardData = {
        overview: {
          activeProjects: activeContracts.length,
          completedProjects: completedContracts.length,
          totalSpent,
          savedProviders: 0, // Could be calculated from favorite employers
          pendingReviews: 0, // Could be calculated from pending reviews
          avgProjectRating: 0, // Could be calculated from ratings
        },

        recentProjects,

        availableServices: [], // Services marketplace - can be implemented later
        messages: [], // Messages - can be implemented later
        savedProviders: [], // Saved providers - can be implemented later
      };

      setDashboardData(dashboardData);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      setLoading(false);
    }
  };

  const handleBookService = (service: any) => {
    setSelectedService(service);
    setShowBookingModal(true);
  };

  const handleStartProject = () => {
    toast.success('Project booking initiated! Redirecting to booking form...');
    setShowBookingModal(false);
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

  if (loading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='animate-pulse space-y-8'>
          <div className='h-8 bg-gray-200 rounded w-1/3'></div>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-32 bg-gray-200 rounded'></div>
            ))}
          </div>
          <div className='h-96 bg-gray-200 rounded'></div>
        </div>
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
                  {dashboardData?.overview.activeProjects}
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
                  {dashboardData?.overview.completedProjects}
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
                  ${dashboardData?.overview.totalSpent.toLocaleString()}
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
                  {dashboardData?.overview.savedProviders}
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
                  {dashboardData?.overview.avgProjectRating}
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
                  {dashboardData?.overview.pendingReviews}
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
        <TabsList className='grid w-full grid-cols-5'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='projects'>My Projects</TabsTrigger>
          <TabsTrigger value='services'>Discover Services</TabsTrigger>
          <TabsTrigger value='messages'>Messages</TabsTrigger>
          <TabsTrigger value='providers'>Saved Providers</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value='overview' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Recent Projects */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center justify-between'>
                  Recent Projects
                  <Link href='#' onClick={() => setActiveTab('projects')}>
                    <Button variant='ghost' size='sm'>
                      View All
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {dashboardData?.recentProjects.slice(0, 3).map(project => (
                    <div
                      key={project.id}
                      className='flex items-center space-x-4 p-3 rounded-lg border'
                    >
                      <Avatar>
                        <AvatarImage src={project.provider.avatar} />
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
                            ${project.budget}
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
                  <Button variant='outline' className='h-16 flex-col'>
                    <Search className='h-6 w-6 mb-2' />
                    Find Services
                  </Button>
                  <Button variant='outline' className='h-16 flex-col'>
                    <MessageCircle className='h-6 w-6 mb-2' />
                    Contact Provider
                  </Button>
                  <Button variant='outline' className='h-16 flex-col'>
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

          {/* Recent Messages */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center justify-between'>
                Recent Messages
                <Link href='#' onClick={() => setActiveTab('messages')}>
                  <Button variant='ghost' size='sm'>
                    View All
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {dashboardData?.messages.slice(0, 3).map(message => (
                  <div
                    key={message.id}
                    className='flex items-start space-x-3 p-3 rounded-lg border'
                  >
                    <Avatar>
                      <AvatarImage src={message.providerAvatar} />
                      <AvatarFallback>
                        {message.providerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center space-x-2'>
                        <h4 className='font-medium text-sm'>
                          {message.providerName}
                        </h4>
                        <span className='text-xs text-gray-500'>
                          {message.projectTitle}
                        </span>
                        {message.unread && (
                          <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                        )}
                      </div>
                      <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
                        {message.lastMessage}
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {new Date(message.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant='ghost' size='sm'>
                      <MessageCircle className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
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
            {dashboardData?.recentProjects.map(project => (
              <Card
                key={project.id}
                className='hover:shadow-lg transition-shadow'
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <Badge className={getStatusColor(project.status)}>
                      {getStatusIcon(project.status)}
                      <span className='ml-1 capitalize'>{project.status}</span>
                    </Badge>
                    <span className='text-sm text-gray-500'>
                      {project.category}
                    </span>
                  </div>
                  <h3 className='font-semibold text-lg'>{project.title}</h3>
                </CardHeader>

                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex items-center space-x-3'>
                      <Avatar>
                        <AvatarImage src={project.provider.avatar} />
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
                        <span className='font-medium'>${project.budget}</span>
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
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
            <div className='flex items-center space-x-4'>
              <Input
                placeholder='Search services...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='max-w-sm'
              />
              <Select>
                <SelectTrigger className='w-48'>
                  <SelectValue placeholder='Category' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Categories</SelectItem>
                  <SelectItem value='digital-marketing'>
                    Digital Marketing
                  </SelectItem>
                  <SelectItem value='web-development'>
                    Web Development
                  </SelectItem>
                  <SelectItem value='graphic-design'>Graphic Design</SelectItem>
                  <SelectItem value='writing'>Content Writing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Link href='/marketplace/services'>
              <Button variant='outline'>
                Browse All Services
                <Search className='h-4 w-4 ml-2' />
              </Button>
            </Link>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {dashboardData?.availableServices.map(service => (
              <Card
                key={service.id}
                className='hover:shadow-lg transition-shadow'
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between'>
                    <div className='flex space-x-2'>
                      <Badge variant='outline'>{service.category}</Badge>
                      {service.featured && (
                        <Badge className='bg-gradient-to-r from-purple-500 to-pink-500 text-white'>
                          <Star className='h-3 w-3 mr-1' />
                          Featured
                        </Badge>
                      )}
                    </div>
                  </div>
                  <h3 className='font-semibold text-lg'>{service.title}</h3>
                  <p className='text-sm text-gray-600 line-clamp-2'>
                    {service.description}
                  </p>
                </CardHeader>

                <CardContent>
                  <div className='space-y-4'>
                    <div className='flex items-center space-x-3'>
                      <Avatar>
                        <AvatarImage src={service.provider.avatar} />
                        <AvatarFallback>
                          {service.provider.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className='font-medium text-sm'>
                          {service.provider.name}
                        </p>
                        <div className='flex items-center text-xs text-gray-500'>
                          <Star className='h-3 w-3 fill-yellow-400 text-yellow-400 mr-1' />
                          {service.provider.rating}
                          <span className='mx-1'>•</span>
                          <Clock className='h-3 w-3 mr-1' />
                          {service.provider.responseTime}
                        </div>
                      </div>
                    </div>

                    <div className='flex flex-wrap gap-1'>
                      {service.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant='secondary'
                          className='text-xs'
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className='flex items-center justify-between'>
                      <div>
                        <span className='text-2xl font-bold'>
                          ${service.price}
                        </span>
                        <span className='text-sm text-gray-500 ml-1'>
                          / {service.duration}
                        </span>
                      </div>
                      <Button onClick={() => handleBookService(service)}>
                        Book Now
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value='messages' className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Project Messages</CardTitle>
              <CardDescription>
                Communicate with your service providers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {dashboardData?.messages.map(message => (
                  <div
                    key={message.id}
                    className='flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer'
                  >
                    <Avatar>
                      <AvatarImage src={message.providerAvatar} />
                      <AvatarFallback>
                        {message.providerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center space-x-2 mb-1'>
                        <h4 className='font-medium'>{message.providerName}</h4>
                        <Badge variant='outline' className='text-xs'>
                          {message.projectTitle}
                        </Badge>
                        {message.unread && (
                          <div className='w-2 h-2 bg-blue-600 rounded-full'></div>
                        )}
                      </div>
                      <p className='text-sm text-gray-700'>
                        {message.lastMessage}
                      </p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button variant='ghost' size='sm'>
                      <MessageCircle className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Saved Providers Tab */}
        <TabsContent value='providers' className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {dashboardData?.savedProviders.map(provider => (
              <Card
                key={provider.id}
                className='hover:shadow-lg transition-shadow'
              >
                <CardContent className='p-6'>
                  <div className='flex items-center space-x-4 mb-4'>
                    <Avatar className='h-12 w-12'>
                      <AvatarImage src={provider.avatar} />
                      <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className='flex-1'>
                      <h3 className='font-semibold'>{provider.name}</h3>
                      <p className='text-sm text-gray-600'>
                        {provider.specialization}
                      </p>
                      <div className='flex items-center text-sm text-gray-500 mt-1'>
                        <Star className='h-3 w-3 fill-yellow-400 text-yellow-400 mr-1' />
                        {provider.rating}
                        <span className='mx-2'>•</span>
                        {provider.completedProjects} projects
                      </div>
                    </div>
                  </div>

                  <div className='space-y-2 text-sm'>
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-600'>Response time:</span>
                      <span className='font-medium'>
                        {provider.responseTime}
                      </span>
                    </div>
                    <div className='flex items-center justify-between'>
                      <span className='text-gray-600'>Last active:</span>
                      <span className='font-medium'>{provider.lastActive}</span>
                    </div>
                  </div>

                  <div className='flex space-x-2 mt-4'>
                    <Button variant='outline' size='sm' className='flex-1'>
                      <Eye className='h-4 w-4 mr-1' />
                      View Profile
                    </Button>
                    <Button size='sm' className='flex-1'>
                      <MessageCircle className='h-4 w-4 mr-1' />
                      Contact
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Booking Modal */}
      <Dialog open={showBookingModal} onOpenChange={setShowBookingModal}>
        <DialogContent className='sm:max-w-[500px]'>
          <DialogHeader>
            <DialogTitle>Book Service</DialogTitle>
            <DialogDescription>
              {selectedService?.title} by {selectedService?.provider.name}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-4 py-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium'>Project Description</label>
              <textarea
                className='w-full h-24 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Describe your project requirements...'
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Budget</label>
                <Input placeholder='$500' />
              </div>
              <div className='space-y-2'>
                <label className='text-sm font-medium'>Deadline</label>
                <Input type='date' />
              </div>
            </div>
            <div className='flex space-x-3'>
              <Button
                onClick={() => setShowBookingModal(false)}
                variant='outline'
                className='flex-1'
              >
                Cancel
              </Button>
              <Button onClick={handleStartProject} className='flex-1'>
                Start Project
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
