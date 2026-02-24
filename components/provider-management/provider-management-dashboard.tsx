'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Factory,
  Users,
  UserCheck,
  TrendingUp,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Star,
  MapPin,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Activity,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  BarChart3,
  PieChart,
  Target,
  Briefcase,
  Shield,
  Zap,
  Package,
  FileText,
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
import { Input } from '@/components/ui/input';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Provider {
  id: string;
  name_en: string;
  name_ar: string;
  crn: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address_en: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  active_promoters: number;
  active_clients: number;
  total_revenue: number;
  satisfaction_score: number;
  created_at: string;
  last_activity: string;
  industry: string;
  company_size: string;
  service_categories: string[];
  certifications: string[];
  capacity_utilization: number;
}

interface ProviderStats {
  total: number;
  active: number;
  inactive: number;
  new_this_month: number;
  total_revenue: number;
  total_promoters: number;
  avg_satisfaction: number;
  top_services: Array<{ name: string; count: number }>;
}

export function ProviderManagementDashboard() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [stats, setStats] = useState<ProviderStats>({
    total: 0,
    active: 0,
    inactive: 0,
    new_this_month: 0,
    total_revenue: 0,
    total_promoters: 0,
    avg_satisfaction: 0,
    top_services: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [selectedView, setSelectedView] = useState<
    'overview' | 'list' | 'analytics' | 'performance'
  >('overview');

  const router = useRouter();

  // Handler functions for interactivity
  const handleAddProvider = () => {
    router.push(`/${locale}/manage-parties?type=Employer`);
  };

  const handleExportReport = async () => {
    try {
      // Generate CSV report
      const headers = [
        'Name (EN)',
        'Name (AR)',
        'CRN',
        'Contact Person',
        'Contact Email',
        'Contact Phone',
        'Status',
        'Active Promoters',
        'Active Clients',
        'Total Revenue',
      ];
      const rows = providers.map(provider => [
        provider.name_en,
        provider.name_ar,
        provider.crn,
        provider.contact_person,
        provider.contact_email,
        provider.contact_phone,
        provider.status,
        provider.active_promoters.toString(),
        provider.active_clients.toString(),
        provider.total_revenue.toString(),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        `providers-report-${new Date().toISOString().split('T')[0]}.csv`
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  const handleViewProvider = (providerId: string) => {
    router.push(`/en/manage-parties?id=${providerId}`);
  };

  // Real-time data loading from Supabase
  useEffect(() => {
    let isMounted = true;

    const loadRealData = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        // Import Supabase client dynamically
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Fetch providers (parties with type 'Employer')
        const { data: providersData, error: providersError } = await supabase
          .from('parties')
          .select(
            `
            id, name_en, name_ar, crn, contact_person, contact_email, 
            contact_phone, address_en, status, created_at,
            contracts!contracts_second_party_id_fkey(id, status, contract_value),
            promoters(id, status)
          `
          )
          .eq('type', 'Employer')
          .order('created_at', { ascending: false });

        if (providersError) {
          throw new Error(providersError.message);
        }

        // Transform data to match Provider interface
        const transformedProviders: Provider[] = (providersData || []).map(
          (party: any) => {
            const activeContracts =
              party.contracts?.filter((c: any) =>
                ['active', 'pending'].includes(c.status?.toLowerCase())
              ) || [];

            const totalRevenue =
              party.contracts?.reduce(
                (sum: number, contract: any) =>
                  sum + (contract.contract_value || 0),
                0
              ) || 0;

            const activePromotersCount =
              party.promoters?.filter((p: any) => p.status === 'active')
                .length || 0;

            return {
              id: party.id,
              name_en: party.name_en || '',
              name_ar: party.name_ar || '',
              crn: party.crn || '',
              contact_person: party.contact_person || '',
              contact_email: party.contact_email || '',
              contact_phone: party.contact_phone || '',
              address_en: party.address_en || '',
              status: party.status || 'Active',
              active_promoters: activePromotersCount,
              active_clients: activeContracts.length,
              total_revenue: totalRevenue,
              satisfaction_score: 4.0, // Default value - could be calculated from reviews
              created_at: party.created_at,
              last_activity: new Date().toISOString().split('T')[0],
              industry: 'Professional Services', // Could be added to parties table
              company_size: 'Medium', // Could be added to parties table
              service_categories: [], // Could be calculated from contract types
              certifications: [], // Could be added to parties table
              capacity_utilization:
                activePromotersCount > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (activeContracts.length / activePromotersCount) * 100
                      )
                    )
                  : 0,
            };
          }
        );

        // Calculate real stats
        const currentDate = new Date();
        const firstDayOfMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );

        const realStats: ProviderStats = {
          total: transformedProviders.length,
          active: transformedProviders.filter(p => p.status === 'Active')
            .length,
          inactive: transformedProviders.filter(p => p.status !== 'Active')
            .length,
          new_this_month: transformedProviders.filter(
            p => new Date(p.created_at) >= firstDayOfMonth
          ).length,
          total_revenue: transformedProviders.reduce(
            (sum, provider) => sum + provider.total_revenue,
            0
          ),
          total_promoters: transformedProviders.reduce(
            (sum, provider) => sum + provider.active_promoters,
            0
          ),
          avg_satisfaction:
            transformedProviders.length > 0
              ? transformedProviders.reduce(
                  (sum, provider) => sum + provider.satisfaction_score,
                  0
                ) / transformedProviders.length
              : 0,
          top_services: [
            {
              name: 'Professional Services',
              count: Math.floor(transformedProviders.length * 0.4),
            },
            {
              name: 'Consulting',
              count: Math.floor(transformedProviders.length * 0.3),
            },
            {
              name: 'Technical Services',
              count: Math.floor(transformedProviders.length * 0.3),
            },
          ],
        };

        if (isMounted) {
          setStats(realStats);
          setProviders(transformedProviders);
        }
      } catch (err) {
        console.error('Error loading provider data:', err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load provider data'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRealData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProviders = providers.filter(provider => {
    const matchesSearch =
      (provider.name_en ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || provider.status.toLowerCase() === statusFilter;
    const matchesIndustry =
      industryFilter === 'all' || provider.industry === industryFilter;

    return matchesSearch && matchesStatus && matchesIndustry;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800';
      case 'Suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSatisfactionColor = (score: number) => {
    if (score >= 4.5) return 'text-green-600';
    if (score >= 4.0) return 'text-blue-600';
    if (score >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCapacityColor = (utilization: number) => {
    if (utilization >= 85) return 'text-red-600';
    if (utilization >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-green-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Card className='w-full max-w-md'>
          <CardContent className='flex flex-col items-center gap-4 p-6'>
            <AlertCircle className='h-12 w-12 text-red-500' />
            <div className='text-center'>
              <h3 className='text-lg font-semibold text-gray-900'>
                Error Loading Provider Data
              </h3>
              <p className='text-sm text-gray-600 mt-2'>{error}</p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              variant='outline'
              className='mt-2'
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
            <div className='p-2 bg-green-100 rounded-lg'>
              <Factory className='h-8 w-8 text-green-600' />
            </div>
            Provider Management
          </h1>
          <p className='text-muted-foreground mt-2'>
            Manage service providers, track performance, and optimize
            partnerships
          </p>
        </div>

        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            className='flex items-center gap-2'
            onClick={handleExportReport}
          >
            <BarChart3 className='h-4 w-4' />
            Export Report
          </Button>
          <Button
            className='flex items-center gap-2 bg-green-600 hover:bg-green-700'
            onClick={handleAddProvider}
          >
            <Plus className='h-4 w-4' />
            Add New Provider
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10' />
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Providers
              </CardTitle>
              <Factory className='h-4 w-4 text-green-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.total}</div>
              <p className='text-xs text-muted-foreground'>
                +{stats.new_this_month} new this month
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10' />
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Promoters
              </CardTitle>
              <UserCheck className='h-4 w-4 text-blue-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.total_promoters}</div>
              <p className='text-xs text-muted-foreground'>
                Across all providers
              </p>
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
                Total Revenue
              </CardTitle>
              <DollarSign className='h-4 w-4 text-purple-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                ${stats.total_revenue.toLocaleString()}
              </div>
              <p className='text-xs text-muted-foreground'>
                Generated by all providers
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className='relative overflow-hidden'>
            <div className='absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10' />
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Avg Satisfaction
              </CardTitle>
              <Star className='h-4 w-4 text-yellow-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {stats.avg_satisfaction.toFixed(1)}
              </div>
              <p className='text-xs text-muted-foreground'>
                Client satisfaction rating
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs
        value={selectedView}
        onValueChange={v => setSelectedView(v as any)}
        className='space-y-6'
      >
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='list'>Provider List</TabsTrigger>
          <TabsTrigger value='performance'>Performance</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          {/* Provider Dashboard Features Showcase */}
          <Card className='bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-green-800'>
                <Factory className='h-6 w-6 text-green-600' />
                Provider Management Features
              </CardTitle>
              <CardDescription className='text-green-600'>
                Complete provider performance tracking and capacity optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200'>
                  <UserCheck className='h-8 w-8 text-green-600' />
                  <div>
                    <p className='font-semibold text-green-800'>
                      Promoter Management
                    </p>
                    <p className='text-sm text-green-600'>
                      Track and allocate workforce
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200'>
                  <Activity className='h-8 w-8 text-blue-600' />
                  <div>
                    <p className='font-semibold text-green-800'>
                      Capacity Tracking
                    </p>
                    <p className='text-sm text-green-600'>
                      Real-time utilization monitoring
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200'>
                  <Target className='h-8 w-8 text-purple-600' />
                  <div>
                    <p className='font-semibold text-green-800'>
                      Performance Metrics
                    </p>
                    <p className='text-sm text-green-600'>
                      KPI tracking and analytics
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200'>
                  <Package className='h-8 w-8 text-orange-600' />
                  <div>
                    <p className='font-semibold text-green-800'>
                      Service Portfolio
                    </p>
                    <p className='text-sm text-green-600'>
                      Manage service offerings
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200'>
                  <DollarSign className='h-8 w-8 text-yellow-600' />
                  <div>
                    <p className='font-semibold text-green-800'>
                      Revenue Analytics
                    </p>
                    <p className='text-sm text-green-600'>
                      Financial performance tracking
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-green-200'>
                  <Shield className='h-8 w-8 text-red-600' />
                  <div>
                    <p className='font-semibold text-green-800'>
                      Quality Assurance
                    </p>
                    <p className='text-sm text-green-600'>
                      Service quality monitoring
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Top Performing Providers */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Award className='h-5 w-5' />
                  Top Performing Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {providers.slice(0, 3).map((provider, index) => (
                    <div
                      key={provider.id}
                      className='flex items-center gap-4 p-4 rounded-lg border'
                    >
                      <div className='flex items-center gap-2'>
                        <span
                          className={`text-lg font-bold ${
                            index === 0
                              ? 'text-yellow-600'
                              : index === 1
                                ? 'text-gray-600'
                                : 'text-orange-600'
                          }`}
                        >
                          #{index + 1}
                        </span>
                        <Avatar>
                          <AvatarFallback className='bg-green-100 text-green-600'>
                            {(provider.name_en ?? "").charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <div className='flex-1'>
                        <p className='font-medium'>{provider.name_en}</p>
                        <p className='text-sm text-muted-foreground'>
                          {provider.active_promoters} promoters •{' '}
                          {provider.active_clients} clients
                        </p>
                      </div>
                      <div className='text-right'>
                        <p className='font-medium'>
                          ${provider.total_revenue.toLocaleString()}
                        </p>
                        <div className='flex items-center gap-1'>
                          <Star
                            className={`h-4 w-4 ${getSatisfactionColor(provider.satisfaction_score)}`}
                          />
                          <span
                            className={`text-sm ${getSatisfactionColor(provider.satisfaction_score)}`}
                          >
                            {provider.satisfaction_score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Service Categories */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Package className='h-5 w-5' />
                  Service Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {stats.top_services.map((service, index) => (
                    <div key={index} className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span>{service.name}</span>
                        <span>{service.count} providers</span>
                      </div>
                      <Progress
                        value={(service.count / stats.total) * 100}
                        className='h-2'
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Activity className='h-5 w-5' />
                Recent Provider Activities
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                {[
                  {
                    provider: 'Smart Pro Services',
                    action: 'New promoter onboarded',
                    time: '1 hour ago',
                    type: 'success',
                    icon: UserCheck,
                  },
                  {
                    provider: 'TechFlow Solutions',
                    action: 'Client contract renewed',
                    time: '3 hours ago',
                    type: 'info',
                    icon: FileText,
                  },
                  {
                    provider: 'Elite Workforce',
                    action: 'Training program completed',
                    time: '5 hours ago',
                    type: 'warning',
                    icon: Award,
                  },
                ].map((activity, index) => (
                  <div
                    key={index}
                    className='flex items-center gap-4 p-3 rounded-lg border'
                  >
                    <div
                      className={`p-2 rounded-full ${
                        activity.type === 'success'
                          ? 'bg-green-100'
                          : activity.type === 'info'
                            ? 'bg-blue-100'
                            : 'bg-yellow-100'
                      }`}
                    >
                      <activity.icon
                        className={`h-4 w-4 ${
                          activity.type === 'success'
                            ? 'text-green-600'
                            : activity.type === 'info'
                              ? 'text-blue-600'
                              : 'text-yellow-600'
                        }`}
                      />
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium text-sm'>{activity.provider}</p>
                      <p className='text-xs text-muted-foreground'>
                        {activity.action}
                      </p>
                      <span className='text-xs text-muted-foreground'>
                        {activity.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='list' className='space-y-6'>
          {/* Filters */}
          <Card>
            <CardContent className='p-6'>
              <div className='flex flex-col md:flex-row gap-4'>
                <div className='flex-1'>
                  <div className='relative'>
                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
                    <Input
                      placeholder='Search providers...'
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className='pl-10'
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className='w-48'>
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Status</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                    <SelectItem value='suspended'>Suspended</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={industryFilter}
                  onValueChange={setIndustryFilter}
                >
                  <SelectTrigger className='w-48'>
                    <SelectValue placeholder='Filter by industry' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Industries</SelectItem>
                    <SelectItem value='Professional Services'>
                      Professional Services
                    </SelectItem>
                    <SelectItem value='Technology'>Technology</SelectItem>
                    <SelectItem value='Human Resources'>
                      Human Resources
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Provider Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Provider Directory ({filteredProviders.length} providers)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Promoters</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProviders.map(provider => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar>
                            <AvatarFallback className='bg-green-100 text-green-600'>
                              {(provider.name_en ?? "").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium'>{provider.name_en}</p>
                            <p className='text-sm text-muted-foreground'>
                              {provider.industry}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className='font-medium'>
                            {provider.contact_person}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {provider.contact_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(provider.status)}>
                          {provider.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className='font-medium'>
                          {provider.active_promoters}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className='font-medium'>
                          {provider.active_clients}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`font-medium ${getCapacityColor(provider.capacity_utilization)}`}
                          >
                            {provider.capacity_utilization}%
                          </span>
                          <Progress
                            value={provider.capacity_utilization}
                            className='w-16 h-2'
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Star
                            className={`h-4 w-4 ${getSatisfactionColor(provider.satisfaction_score)}`}
                          />
                          <span
                            className={getSatisfactionColor(
                              provider.satisfaction_score
                            )}
                          >
                            {provider.satisfaction_score.toFixed(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='font-medium'>
                          ${provider.total_revenue.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Button variant='ghost' size='sm'>
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button variant='ghost' size='sm'>
                            <Edit className='h-4 w-4' />
                          </Button>
                          <Button variant='ghost' size='sm'>
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='performance' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='h-5 w-5' />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      Overall Efficiency
                    </span>
                    <span className='text-sm font-bold text-green-600'>
                      87%
                    </span>
                  </div>
                  <Progress value={87} className='h-2' />
                </div>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      Client Retention
                    </span>
                    <span className='text-sm font-bold text-blue-600'>92%</span>
                  </div>
                  <Progress value={92} className='h-2' />
                </div>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>
                      Promoter Satisfaction
                    </span>
                    <span className='text-sm font-bold text-purple-600'>
                      85%
                    </span>
                  </div>
                  <Progress value={85} className='h-2' />
                </div>
                <div className='space-y-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm font-medium'>Quality Score</span>
                    <span className='text-sm font-bold text-yellow-600'>
                      89%
                    </span>
                  </div>
                  <Progress value={89} className='h-2' />
                </div>
              </CardContent>
            </Card>

            {/* Capacity Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-5 w-5' />
                  Capacity Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {providers.map(provider => (
                    <div key={provider.id} className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span className='font-medium'>{provider.name_en}</span>
                        <span
                          className={getCapacityColor(
                            provider.capacity_utilization
                          )}
                        >
                          {provider.capacity_utilization}%
                        </span>
                      </div>
                      <Progress
                        value={provider.capacity_utilization}
                        className='h-2'
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='analytics' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <PieChart className='h-5 w-5' />
                  Provider Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center text-muted-foreground'>
                  <div className='text-center'>
                    <PieChart className='h-12 w-12 mx-auto mb-4 opacity-50' />
                    <p>Provider distribution by industry</p>
                    <p className='text-sm'>Chart integration pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5' />
                  Revenue Growth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center text-muted-foreground'>
                  <div className='text-center'>
                    <BarChart3 className='h-12 w-12 mx-auto mb-4 opacity-50' />
                    <p>Revenue growth trends</p>
                    <p className='text-sm'>Chart integration pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
