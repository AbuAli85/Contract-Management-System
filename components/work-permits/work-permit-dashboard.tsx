'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Plus,
  Eye,
  Edit,
  Search,
  Filter,
  Download,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  ExternalLink,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';

interface WorkPermitApplication {
  id: string;
  application_number: string;
  application_type: string;
  status: string;
  employee_name_en: string;
  employee_name_ar?: string;
  job_title: string;
  work_permit_number?: string;
  work_permit_start_date?: string;
  work_permit_end_date?: string;
  work_permit_expiry_date?: string;
  created_at: string;
  updated_at: string;
  employer?: {
    id: string;
    email: string;
    full_name: string;
  };
  employee?: {
    id: string;
    email: string;
    full_name: string;
  };
  employer_party?: {
    id: string;
    name_en: string;
    name_ar: string;
  };
}

interface ComplianceSummary {
  compliant: number;
  expiring_soon: number;
  expired: number;
  non_compliant: number;
  pending_renewal: number;
}

export function WorkPermitDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [applications, setApplications] = useState<WorkPermitApplication[]>([]);
  const [compliance, setCompliance] = useState<any[]>([]);
  const [summary, setSummary] = useState<ComplianceSummary>({
    compliant: 0,
    expiring_soon: 0,
    expired: 0,
    non_compliant: 0,
    pending_renewal: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, [statusFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch applications
      const appsParams = new URLSearchParams();
      if (statusFilter !== 'all') appsParams.append('status', statusFilter);
      if (typeFilter !== 'all') appsParams.append('type', typeFilter);

      const [appsResponse, complianceResponse] = await Promise.all([
        fetch(`/api/work-permits?${appsParams.toString()}`),
        fetch('/api/work-permits/compliance'),
      ]);

      const appsData = await appsResponse.json();
      const complianceData = await complianceResponse.json();

      if (appsData.success) {
        setApplications(appsData.applications || []);
      }

      if (complianceData.success) {
        setCompliance(complianceData.compliance || []);
        setSummary(complianceData.summary || summary);
      }
    } catch (error) {
      console.error('Error fetching work permit data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load work permit data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'submitted':
      case 'under_review':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'draft':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400';
      case 'cancelled':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'renewal':
        return 'bg-purple-100 text-purple-800';
      case 'transfer':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const expiry = parseISO(expiryDate);
    const days = differenceInDays(expiry, new Date());

    if (days < 0) {
      return { label: 'Expired', color: 'text-red-600', days: Math.abs(days) };
    } else if (days <= 7) {
      return { label: 'Expiring Soon', color: 'text-red-600', days };
    } else if (days <= 30) {
      return { label: 'Expiring Soon', color: 'text-orange-600', days };
    } else if (days <= 60) {
      return { label: 'Expiring Soon', color: 'text-yellow-600', days };
    }
    return { label: 'Valid', color: 'text-green-600', days };
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch =
      app.application_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      app.employee_name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.work_permit_number?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-3'>
            <Building2 className='h-8 w-8 text-blue-600' />
            Work Permit Management
          </h1>
          <p className='text-muted-foreground mt-1'>
            Manage work permit applications and track compliance
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            onClick={() =>
              window.open(
                'https://sso.mol.gov.om/login.aspx?ReturnUrl=https://eservices.mol.gov.om/Wppa/list',
                '_blank'
              )
            }
            title='Open Ministry of Labour Portal'
          >
            <ExternalLink className='h-4 w-4 mr-2' />
            MOL Portal
          </Button>
          <Button onClick={() => router.push(`/${locale}/work-permits/new`)}>
            <Plus className='h-4 w-4 mr-2' />
            New Application
          </Button>
        </div>
      </div>

      {/* Compliance Summary Cards */}
      <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
        <Card className='border-l-4 border-l-green-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Compliant</CardTitle>
            <CheckCircle className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.compliant}</div>
            <p className='text-xs text-muted-foreground'>Valid work permits</p>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-yellow-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Expiring Soon</CardTitle>
            <Clock className='h-4 w-4 text-yellow-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.expiring_soon}</div>
            <p className='text-xs text-muted-foreground'>Need renewal</p>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-red-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Expired</CardTitle>
            <AlertTriangle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.expired}</div>
            <p className='text-xs text-muted-foreground'>
              Urgent action needed
            </p>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-orange-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Pending Renewal
            </CardTitle>
            <FileText className='h-4 w-4 text-orange-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.pending_renewal}</div>
            <p className='text-xs text-muted-foreground'>Renewal in progress</p>
          </CardContent>
        </Card>

        <Card className='border-l-4 border-l-gray-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Non-Compliant</CardTitle>
            <AlertTriangle className='h-4 w-4 text-gray-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{summary.non_compliant}</div>
            <p className='text-xs text-muted-foreground'>Issues to resolve</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='p-4'>
          <div className='flex flex-col md:flex-row gap-4'>
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
              <Input
                placeholder='Search by application number, employee name, or work permit number...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Filter by status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='draft'>Draft</SelectItem>
                <SelectItem value='submitted'>Submitted</SelectItem>
                <SelectItem value='under_review'>Under Review</SelectItem>
                <SelectItem value='approved'>Approved</SelectItem>
                <SelectItem value='rejected'>Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className='w-48'>
                <SelectValue placeholder='Filter by type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='new'>New</SelectItem>
                <SelectItem value='renewal'>Renewal</SelectItem>
                <SelectItem value='transfer'>Transfer</SelectItem>
                <SelectItem value='cancellation'>Cancellation</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Work Permit Applications ({filteredApplications.length})
          </CardTitle>
          <CardDescription>
            Track all work permit applications and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Application #</TableHead>
                <TableHead>Employee</TableHead>
                <TableHead>Job Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Work Permit #</TableHead>
                <TableHead>Expiry Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='text-center py-8'>
                    <FileText className='h-12 w-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-500'>
                      No work permit applications found
                    </p>
                    <Button
                      variant='outline'
                      className='mt-4'
                      onClick={() => router.push(`/${locale}/work-permits/new`)}
                    >
                      <Plus className='h-4 w-4 mr-2' />
                      Create First Application
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                filteredApplications.map(app => {
                  const expiryStatus = getExpiryStatus(
                    app.work_permit_end_date || app.work_permit_expiry_date
                  );

                  return (
                    <TableRow key={app.id}>
                      <TableCell className='font-mono text-sm'>
                        {app.application_number}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className='font-medium'>{app.employee_name_en}</p>
                          {app.employee_name_ar && (
                            <p className='text-sm text-muted-foreground'>
                              {app.employee_name_ar}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{app.job_title}</TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            'text-xs',
                            getTypeColor(app.application_type)
                          )}
                        >
                          {app.application_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn('text-xs', getStatusColor(app.status))}
                        >
                          {app.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className='font-mono text-sm'>
                        {app.work_permit_number || '-'}
                      </TableCell>
                      <TableCell>
                        {app.work_permit_end_date ||
                        app.work_permit_expiry_date ? (
                          <div>
                            <p className='text-sm'>
                              {format(
                                parseISO(
                                  app.work_permit_end_date ||
                                    app.work_permit_expiry_date ||
                                    ''
                                ),
                                'MMM dd, yyyy'
                              )}
                            </p>
                            {expiryStatus && (
                              <p className={cn('text-xs', expiryStatus.color)}>
                                {expiryStatus.label}
                                {expiryStatus.days !== undefined &&
                                  ` (${expiryStatus.days} days)`}
                              </p>
                            )}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() =>
                              router.push(`/en/work-permits/${app.id}`)
                            }
                            title='View Details'
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          {app.status === 'draft' && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                router.push(`/en/work-permits/${app.id}/edit`)
                              }
                              title='Edit Application'
                            >
                              <Edit className='h-4 w-4' />
                            </Button>
                          )}
                          {(app.status === 'draft' ||
                            app.status === 'submitted') && (
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => {
                                window.open(
                                  `/api/work-permits/${app.id}/export?format=json`,
                                  '_blank'
                                );
                              }}
                              title='Export for Ministry Submission'
                            >
                              <Download className='h-4 w-4' />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
