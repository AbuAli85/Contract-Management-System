'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  FileText,
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

interface Client {
  id: string;
  name_en: string;
  name_ar: string;
  crn: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  address_en: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  active_contracts: number;
  total_spent: number;
  satisfaction_score: number;
  created_at: string;
  last_activity: string;
  industry: string;
  company_size: string;
  preferred_providers: string[];
  service_categories: string[];
}

interface ClientStats {
  total: number;
  active: number;
  inactive: number;
  new_this_month: number;
  total_revenue: number;
  avg_satisfaction: number;
  top_services: Array<{ name: string; count: number }>;
}

export function ClientManagementDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    active: 0,
    inactive: 0,
    new_this_month: 0,
    total_revenue: 0,
    avg_satisfaction: 0,
    top_services: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [selectedView, setSelectedView] = useState<
    'overview' | 'list' | 'analytics'
  >('overview');

  const router = useRouter();

  // Handler functions for interactivity
  const handleAddClient = () => {
    router.push(`/${locale}/manage-parties?type=Client`);
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
        'Active Contracts',
        'Total Spent',
      ];
      const rows = clients.map(client => [
        client.name_en,
        client.name_ar,
        client.crn,
        client.contact_person,
        client.contact_email,
        client.contact_phone,
        client.status,
        client.active_contracts.toString(),
        client.total_spent.toString(),
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
        `clients-report-${new Date().toISOString().split('T')[0]}.csv`
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

  const handleViewClient = (clientId: string) => {
    router.push(`/en/manage-parties?id=${clientId}`);
  };

  const handleEditClient = (clientId: string) => {
    router.push(`/en/manage-parties?id=${clientId}`);
  };

  // Real-time data loading from Supabase
  useEffect(() => {
    let isMounted = true;

    const loadRealData = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);
        setError(null);

        // Import Supabase client dynamically to avoid SSR issues
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        // Fetch clients (parties with type 'Client')
        const { data: clientsData, error: clientsError } = await supabase
          .from('parties')
          .select(
            `
            id, name_en, name_ar, crn, contact_person, contact_email, 
            contact_phone, address_en, status, created_at,
            contracts!contracts_first_party_id_fkey(id, status, contract_value)
          `
          )
          .eq('type', 'Client')
          .order('created_at', { ascending: false });

        if (clientsError) {
          throw new Error(clientsError.message);
        }

        // Transform data to match Client interface
        const transformedClients: Client[] = (clientsData || []).map(
          (party: any) => {
            const activeContracts =
              party.contracts?.filter((c: any) =>
                ['active', 'pending'].includes(c.status?.toLowerCase())
              ) || [];

            const totalSpent =
              party.contracts?.reduce(
                (sum: number, contract: any) =>
                  sum + (contract.contract_value || 0),
                0
              ) || 0;

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
              active_contracts: activeContracts.length,
              total_spent: totalSpent,
              satisfaction_score: 4.0, // Default value - could be calculated from reviews
              created_at: party.created_at,
              last_activity: new Date().toISOString().split('T')[0], // Today as default
              industry: 'General', // Could be added to parties table
              company_size: 'Medium', // Could be added to parties table
              preferred_providers: [], // Could be calculated from contract history
              service_categories: [], // Could be calculated from contract types
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

        const realStats: ClientStats = {
          total: transformedClients.length,
          active: transformedClients.filter(c => c.status === 'Active').length,
          inactive: transformedClients.filter(c => c.status !== 'Active')
            .length,
          new_this_month: transformedClients.filter(
            c => new Date(c.created_at) >= firstDayOfMonth
          ).length,
          total_revenue: transformedClients.reduce(
            (sum, client) => sum + client.total_spent,
            0
          ),
          avg_satisfaction:
            transformedClients.length > 0
              ? transformedClients.reduce(
                  (sum, client) => sum + client.satisfaction_score,
                  0
                ) / transformedClients.length
              : 0,
          top_services: [
            {
              name: 'Professional Services',
              count: Math.floor(transformedClients.length * 0.4),
            },
            {
              name: 'Consulting',
              count: Math.floor(transformedClients.length * 0.3),
            },
            {
              name: 'Support Services',
              count: Math.floor(transformedClients.length * 0.3),
            },
          ],
        };

        if (isMounted) {
          setStats(realStats);
          setClients(transformedClients);
        }
      } catch (err) {
        console.error('Error loading client data:', err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load client data'
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

  const filteredClients = clients.filter(client => {
    const matchesSearch =
      (client.name_en ?? "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact_person.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || client.status.toLowerCase() === statusFilter;
    const matchesIndustry =
      industryFilter === 'all' || client.industry === industryFilter;

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

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
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
                Error Loading Client Data
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
            <div className='p-2 bg-blue-100 rounded-lg'>
              <Building2 className='h-8 w-8 text-blue-600' />
            </div>
            Client Management
          </h1>
          <p className='text-muted-foreground mt-2'>
            Manage your clients, track relationships, and analyze performance
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
            className='flex items-center gap-2 bg-blue-600 hover:bg-blue-700'
            onClick={handleAddClient}
          >
            <Plus className='h-4 w-4' />
            Add New Client
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
            <div className='absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10' />
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Clients
              </CardTitle>
              <Users className='h-4 w-4 text-blue-500' />
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
            <div className='absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10' />
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Active Clients
              </CardTitle>
              <CheckCircle className='h-4 w-4 text-green-500' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stats.active}</div>
              <p className='text-xs text-muted-foreground'>
                {Math.round((stats.active / stats.total) * 100)}% of total
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
                Across all active contracts
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
              <p className='text-xs text-muted-foreground'>Out of 5.0 rating</p>
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
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='list'>Client List</TabsTrigger>
          <TabsTrigger value='analytics'>Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-6'>
          {/* Client Dashboard Features Showcase */}
          <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-blue-800'>
                <Star className='h-6 w-6 text-blue-600' />
                Client Management Features
              </CardTitle>
              <CardDescription className='text-blue-600'>
                Comprehensive client lifecycle management with advanced
                analytics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200'>
                  <Users className='h-8 w-8 text-blue-600' />
                  <div>
                    <p className='font-semibold text-blue-800'>
                      Client Profiles
                    </p>
                    <p className='text-sm text-blue-600'>
                      Complete client information management
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200'>
                  <TrendingUp className='h-8 w-8 text-green-600' />
                  <div>
                    <p className='font-semibold text-blue-800'>
                      Revenue Tracking
                    </p>
                    <p className='text-sm text-blue-600'>
                      Real-time financial analytics
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200'>
                  <Star className='h-8 w-8 text-yellow-600' />
                  <div>
                    <p className='font-semibold text-blue-800'>
                      Satisfaction Monitoring
                    </p>
                    <p className='text-sm text-blue-600'>
                      Client happiness tracking
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200'>
                  <FileText className='h-8 w-8 text-purple-600' />
                  <div>
                    <p className='font-semibold text-blue-800'>
                      Contract Management
                    </p>
                    <p className='text-sm text-blue-600'>
                      Full contract lifecycle tracking
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200'>
                  <Search className='h-8 w-8 text-orange-600' />
                  <div>
                    <p className='font-semibold text-blue-800'>
                      Advanced Search
                    </p>
                    <p className='text-sm text-blue-600'>
                      Smart filtering and discovery
                    </p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-200'>
                  <BarChart3 className='h-8 w-8 text-indigo-600' />
                  <div>
                    <p className='font-semibold text-blue-800'>
                      Analytics Dashboard
                    </p>
                    <p className='text-sm text-blue-600'>
                      Data-driven insights
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
            {/* Recent Activities */}
            <Card className='lg:col-span-2'>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Activity className='h-5 w-5' />
                  Recent Client Activities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {[
                    {
                      client: 'Oman Oil Company',
                      action: 'New contract signed',
                      time: '2 hours ago',
                      type: 'success',
                    },
                    {
                      client: 'ABC Construction',
                      action: 'Payment received',
                      time: '4 hours ago',
                      type: 'info',
                    },
                    {
                      client: 'XYZ Manufacturing',
                      action: 'Service request submitted',
                      time: '1 day ago',
                      type: 'warning',
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
                        {activity.type === 'success' ? (
                          <CheckCircle className='h-4 w-4 text-green-600' />
                        ) : activity.type === 'info' ? (
                          <FileText className='h-4 w-4 text-blue-600' />
                        ) : (
                          <Clock className='h-4 w-4 text-yellow-600' />
                        )}
                      </div>
                      <div className='flex-1'>
                        <p className='font-medium'>{activity.client}</p>
                        <p className='text-sm text-muted-foreground'>
                          {activity.action}
                        </p>
                      </div>
                      <span className='text-xs text-muted-foreground'>
                        {activity.time}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Services */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Target className='h-5 w-5' />
                  Top Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {stats.top_services.map((service, index) => (
                    <div key={index} className='space-y-2'>
                      <div className='flex justify-between text-sm'>
                        <span>{service.name}</span>
                        <span>{service.count} clients</span>
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
                      placeholder='Search clients...'
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
                    <SelectItem value='Oil & Gas'>Oil & Gas</SelectItem>
                    <SelectItem value='Construction'>Construction</SelectItem>
                    <SelectItem value='Manufacturing'>Manufacturing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Client Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Client Directory ({filteredClients.length} clients)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead>Satisfaction</TableHead>
                    <TableHead>Total Spent</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar>
                            <AvatarFallback className='bg-blue-100 text-blue-600'>
                              {(client.name_en ?? "").charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className='font-medium'>{client.name_en}</p>
                            <p className='text-sm text-muted-foreground'>
                              {client.industry}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className='font-medium'>{client.contact_person}</p>
                          <p className='text-sm text-muted-foreground'>
                            {client.contact_email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(client.status)}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className='font-medium'>
                          {client.active_contracts}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Star
                            className={`h-4 w-4 ${getSatisfactionColor(client.satisfaction_score)}`}
                          />
                          <span
                            className={getSatisfactionColor(
                              client.satisfaction_score
                            )}
                          >
                            {client.satisfaction_score.toFixed(1)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className='font-medium'>
                          ${client.total_spent.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleViewClient(client.id)}
                            title='View client details'
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEditClient(client.id)}
                            title='Edit client'
                          >
                            <Edit className='h-4 w-4' />
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

        <TabsContent value='analytics' className='space-y-6'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <PieChart className='h-5 w-5' />
                  Client Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center text-muted-foreground'>
                  <div className='text-center'>
                    <PieChart className='h-12 w-12 mx-auto mb-4 opacity-50' />
                    <p>Client distribution chart</p>
                    <p className='text-sm'>Chart integration pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <TrendingUp className='h-5 w-5' />
                  Revenue Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='h-64 flex items-center justify-center text-muted-foreground'>
                  <div className='text-center'>
                    <BarChart3 className='h-12 w-12 mx-auto mb-4 opacity-50' />
                    <p>Revenue trends over time</p>
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
