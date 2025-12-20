'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Users,
  FileText,
  Zap,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  Building,
  User,
  FileImage,
  Send,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import DocumentWorkflowWizard from '@/components/workflow/DocumentWorkflowWizard';

interface DashboardStats {
  totalPromoters: number;
  activeContracts: number;
  pendingDocuments: number;
  completedThisMonth: number;
  totalValue: number;
}

interface RecentActivity {
  id: string;
  type: 'contract' | 'promoter' | 'document';
  title: string;
  description: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'processing';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
  color: string;
}

export default function EnhancedCRMDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPromoters: 0,
    activeContracts: 0,
    pendingDocuments: 0,
    completedThisMonth: 0,
    totalValue: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [promoters, setPromoters] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showWorkflowWizard, setShowWorkflowWizard] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const supabase = createClient();

      // Load promoters
      const { data: promotersData } = (await supabase
        ?.from('promoters')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)) || { data: null };

      // Load contracts
      const { data: contractsData } = (await supabase
        ?.from('contracts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)) || { data: null };

      // Calculate stats
      const { count: totalPromoters } = (await supabase
        ?.from('promoters')
        .select('*', { count: 'exact', head: true })) || { count: 0 };

      const { count: activeContracts } = (await supabase
        ?.from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')) || { count: 0 };

      const { count: pendingDocuments } = (await supabase
        ?.from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')) || { count: 0 };

      // Calculate completed contracts this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const { count: completedThisMonth } = (await supabase
        ?.from('contracts')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')
        .gte('updated_at', startOfMonth.toISOString())) || { count: 0 };

      // Calculate total contract value
      const { data: allContracts } = (await supabase
        ?.from('contracts')
        .select('contract_value')
        .eq('status', 'active')) || { data: [] };
      
      const totalValue = (allContracts || []).reduce((sum: number, contract: any) => {
        return sum + (parseFloat(contract.contract_value) || 0);
      }, 0);

      // Helper function to calculate time ago
      const getTimeAgo = (date: Date): string => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 60) return `${diffMins} minutes ago`;
        if (diffHours < 24) return `${diffHours} hours ago`;
        return `${diffDays} days ago`;
      };

      // Generate real recent activity from contracts and promoters
      const recentActivity: RecentActivity[] = [];
      
      // Add recent contracts
      if (contractsData && contractsData.length > 0) {
        contractsData.slice(0, 3).forEach((contract: any) => {
          const timeAgo = getTimeAgo(new Date(contract.created_at));
          recentActivity.push({
            id: `contract_${contract.id}`,
            type: 'contract',
            title: contract.title || `Contract ${contract.contract_number || contract.id}`,
            description: `${contract.contract_type || 'Contract'} - ${contract.status}`,
            timestamp: timeAgo,
            status: contract.status === 'completed' ? 'completed' : contract.status === 'pending' ? 'processing' : 'completed',
          });
        });
      }

      // Add recent promoters if available
      if (promotersData && promotersData.length > 0 && recentActivity.length < 3) {
        promotersData.slice(0, 3 - recentActivity.length).forEach((promoter: any) => {
          const timeAgo = getTimeAgo(new Date(promoter.created_at));
          recentActivity.push({
            id: `promoter_${promoter.id}`,
            type: 'promoter',
            title: 'New Promoter Added',
            description: `${promoter.name_en || promoter.name_ar || 'Promoter'} registered`,
            timestamp: timeAgo,
            status: 'completed',
          });
        });
      }

      setStats({
        totalPromoters: totalPromoters || 0,
        activeContracts: activeContracts || 0,
        pendingDocuments: pendingDocuments || 0,
        completedThisMonth: completedThisMonth || 0,
        totalValue: totalValue,
      });

      setPromoters(promotersData || []);
      setContracts(contractsData || []);
      setRecentActivity(recentActivity);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const quickActions: QuickAction[] = [
    {
      id: 'generate-contract',
      title: 'Generate Contract',
      description: 'Create new employment or service contract',
      icon: <FileText className='h-6 w-6' />,
      action: () => setShowWorkflowWizard(true),
      color: 'bg-blue-500',
    },
    {
      id: 'add-promoter',
      title: 'Add Promoter',
      description: 'Register new promoter in the system',
      icon: <User className='h-6 w-6' />,
      action: () =>
        toast({
          title: 'Coming Soon',
          description: 'Promoter registration form',
        }),
      color: 'bg-green-500',
    },
    {
      id: 'bulk-import',
      title: 'Bulk Import',
      description: 'Import multiple promoters from Excel',
      icon: <Download className='h-6 w-6' />,
      action: () =>
        toast({ title: 'Coming Soon', description: 'Bulk import feature' }),
      color: 'bg-purple-500',
    },
    {
      id: 'automation-setup',
      title: 'Setup Automation',
      description: 'Configure Make.com workflows',
      icon: <Zap className='h-6 w-6' />,
      action: () =>
        toast({ title: 'Coming Soon', description: 'Automation setup' }),
      color: 'bg-orange-500',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contract':
        return <FileText className='h-4 w-4' />;
      case 'promoter':
        return <User className='h-4 w-4' />;
      case 'document':
        return <FileImage className='h-4 w-4' />;
      default:
        return <Clock className='h-4 w-4' />;
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='text-center'>
          <RefreshCw className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>CRM Dashboard</h1>
          <p className='text-muted-foreground'>
            Manage promoters, contracts, and document generation
          </p>
        </div>
        <Button onClick={() => setShowWorkflowWizard(true)}>
          <Plus className='h-4 w-4 mr-2' />
          Generate Document
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center'>
              <Users className='h-8 w-8 text-blue-600' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Promoters
                </p>
                <p className='text-2xl font-bold'>{stats.totalPromoters}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center'>
              <FileText className='h-8 w-8 text-green-600' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Active Contracts
                </p>
                <p className='text-2xl font-bold'>{stats.activeContracts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center'>
              <Clock className='h-8 w-8 text-yellow-600' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Pending Documents
                </p>
                <p className='text-2xl font-bold'>{stats.pendingDocuments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center'>
              <CheckCircle className='h-8 w-8 text-purple-600' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Completed This Month
                </p>
                <p className='text-2xl font-bold'>{stats.completedThisMonth}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='pt-6'>
            <div className='flex items-center'>
              <DollarSign className='h-8 w-8 text-emerald-600' />
              <div className='ml-4'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Value
                </p>
                <p className='text-2xl font-bold'>
                  ${stats.totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and document generation workflows
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {quickActions.map(action => (
              <motion.div
                key={action.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className='cursor-pointer hover:shadow-md transition-shadow'
                  onClick={action.action}
                >
                  <CardContent className='pt-6'>
                    <div className='flex items-center space-x-4'>
                      <div
                        className={`h-12 w-12 rounded-lg ${action.color} flex items-center justify-center text-white`}
                      >
                        {action.icon}
                      </div>
                      <div>
                        <h3 className='font-semibold'>{action.title}</h3>
                        <p className='text-sm text-muted-foreground'>
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue='overview' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='overview'>Overview</TabsTrigger>
          <TabsTrigger value='promoters'>Promoters</TabsTrigger>
          <TabsTrigger value='contracts'>Contracts</TabsTrigger>
          <TabsTrigger value='activity'>Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {/* Recent Promoters */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Recent Promoters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {promoters.slice(0, 5).map(promoter => (
                    <div
                      key={promoter.id}
                      className='flex items-center space-x-4'
                    >
                      <div className='h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center'>
                        <User className='h-5 w-5 text-primary' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-medium'>{promoter.name_en}</p>
                        <p className='text-sm text-muted-foreground'>
                          {promoter.email}
                        </p>
                      </div>
                      <Badge variant='outline'>{promoter.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Contracts */}
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <FileText className='h-5 w-5' />
                  Recent Contracts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {contracts.slice(0, 5).map(contract => (
                    <div
                      key={contract.id}
                      className='flex items-center space-x-4'
                    >
                      <div className='h-10 w-10 rounded-full bg-green-100 flex items-center justify-center'>
                        <FileText className='h-5 w-5 text-green-600' />
                      </div>
                      <div className='flex-1'>
                        <p className='font-medium'>{contract.title}</p>
                        <p className='text-sm text-muted-foreground'>
                          {contract.contract_number}
                        </p>
                      </div>
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='promoters' className='space-y-4'>
          <div className='flex items-center space-x-4'>
            <div className='flex-1'>
              <Input
                placeholder='Search promoters...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='max-w-sm'
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='inactive'>Inactive</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {promoters.map(promoter => (
              <Card key={promoter.id}>
                <CardContent className='pt-6'>
                  <div className='flex items-center space-x-4'>
                    <div className='h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center'>
                      <User className='h-6 w-6 text-primary' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-semibold'>{promoter.name_en}</h3>
                      <p className='text-sm text-muted-foreground'>
                        {promoter.email}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {promoter.mobile_number}
                      </p>
                    </div>
                    <Badge variant='outline'>{promoter.status}</Badge>
                  </div>
                  <div className='mt-4 flex space-x-2'>
                    <Button size='sm' variant='outline'>
                      <Eye className='h-4 w-4' />
                    </Button>
                    <Button size='sm' variant='outline'>
                      <Edit className='h-4 w-4' />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='contracts' className='space-y-4'>
          <div className='flex items-center space-x-4'>
            <div className='flex-1'>
              <Input
                placeholder='Search contracts...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='max-w-sm'
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className='w-40'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='pending'>Pending</SelectItem>
                <SelectItem value='processing'>Processing</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-4'>
            {contracts.map(contract => (
              <Card key={contract.id}>
                <CardContent className='pt-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-4'>
                      <div className='h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center'>
                        <FileText className='h-6 w-6 text-green-600' />
                      </div>
                      <div>
                        <h3 className='font-semibold'>{contract.title}</h3>
                        <p className='text-sm text-muted-foreground'>
                          {contract.contract_number} • {contract.contract_type}
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          Value: {contract.currency} {contract.value}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status}
                      </Badge>
                      <Button size='sm' variant='outline'>
                        <Eye className='h-4 w-4' />
                      </Button>
                      <Button size='sm' variant='outline'>
                        <Download className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='activity' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest actions and document generation activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {recentActivity.map(activity => (
                  <div
                    key={activity.id}
                    className='flex items-center space-x-4'
                  >
                    <div className='h-10 w-10 rounded-full bg-muted flex items-center justify-center'>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className='flex-1'>
                      <p className='font-medium'>{activity.title}</p>
                      <p className='text-sm text-muted-foreground'>
                        {activity.description}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {activity.timestamp}
                      </p>
                    </div>
                    <Badge className={getStatusColor(activity.status)}>
                      {activity.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Workflow Wizard Dialog */}
      <Dialog open={showWorkflowWizard} onOpenChange={setShowWorkflowWizard}>
        <DialogContent className='max-w-6xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>Document Generation Workflow</DialogTitle>
            <DialogDescription>
              Create contracts, letters, and offers with automated processing
            </DialogDescription>
          </DialogHeader>
          <DocumentWorkflowWizard />
        </DialogContent>
      </Dialog>
    </div>
  );
}
