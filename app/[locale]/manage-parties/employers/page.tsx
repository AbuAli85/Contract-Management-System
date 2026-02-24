'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter , useParams} from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import type { Party } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  EditIcon,
  PlusCircleIcon,
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Building2,
  Users,
  AlertTriangle,
  FileText,
  ChevronDown,
  ChevronUp,
  Eye,
  MoreHorizontal,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInDays } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { ClickablePromoterCard } from '@/components/promoters/clickable-promoter-card';

interface Promoter {
  id: string;
  name_en: string;
  name_ar: string;
  mobile_number: string | null;
  id_card_number: string;
  status: string;
  job_title: string | null;
  profile_picture_url: string | null;
  id_card_expiry_date: string | null;
  passport_expiry_date: string | null;
  created_at: string;
  updated_at: string;
}

interface EnhancedParty extends Party {
  contract_count?: number;
  cr_status: 'valid' | 'expiring' | 'expired' | 'missing';
  license_status: 'valid' | 'expiring' | 'expired' | 'missing';
  days_until_cr_expiry?: number | undefined;
  days_until_license_expiry?: number | undefined;
}

/**
 * Employers View Page
 * Displays all employer-type parties with their details
 */
export default function EmployersPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const { toast } = useToast();

  const [employers, setEmployers] = useState<EnhancedParty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentFilter, setDocumentFilter] = useState('all');
  const [expandedEmployers, setExpandedEmployers] = useState<Set<string>>(
    new Set()
  );
  const [promotersByEmployer, setPromotersByEmployer] = useState<
    Record<string, Promoter[]>
  >({});
  const [loadingPromoters, setLoadingPromoters] = useState<Set<string>>(
    new Set()
  );

  // Fetch employers
  const fetchEmployers = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all employers with type filter and higher limit
      const response = await fetch('/api/parties?type=Employer&limit=1000');
      const data = await response.json();

      if (data.success) {
        // Filter only employers (double-check, though API should already filter)
        const employerParties = (data.parties || [])
          .filter((party: Party) => party.type === 'Employer')
          .map(enhanceParty);
        setEmployers(employerParties);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch employers',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching employers:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch employers',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchEmployers();
  }, [fetchEmployers]);

  // Helper function to enhance party data
  const enhanceParty = (party: Party): EnhancedParty => {
    const crExpiryDays = party.cr_expiry_date
      ? differenceInDays(parseISO(party.cr_expiry_date), new Date())
      : null;
    const licenseExpiryDays = party.license_expiry
      ? differenceInDays(parseISO(party.license_expiry), new Date())
      : null;

    return {
      ...party,
      cr_status: getDocumentStatus(crExpiryDays, party.cr_expiry_date),
      license_status: getDocumentStatus(
        licenseExpiryDays,
        party.license_expiry
      ),
      days_until_cr_expiry: crExpiryDays ?? undefined,
      days_until_license_expiry: licenseExpiryDays ?? undefined,
      contract_count: party.total_contracts || party.active_contracts || 0,
    };
  };

  const getDocumentStatus = (
    daysUntilExpiry: number | null,
    dateString: string | null | undefined
  ): 'valid' | 'expiring' | 'expired' | 'missing' => {
    if (!dateString) return 'missing';
    if (daysUntilExpiry === null) return 'missing';
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'valid';
  };

  // Helper function to safely format dates
  const formatDateSafely = (dateString: string | null | undefined): string => {
    if (!dateString) return 'Not set';
    try {
      const parsedDate = parseISO(dateString);
      if (isNaN(parsedDate.getTime())) {
        return 'Invalid date';
      }
      return format(parsedDate, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid date';
    }
  };

  // Filter employers
  const filteredEmployers = useMemo(() => {
    return employers.filter(employer => {
      const matchesSearch =
        !searchTerm ||
        employer.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employer.crn?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || employer.status === statusFilter;

      const matchesDocument =
        documentFilter === 'all' ||
        (documentFilter === 'expired' &&
          (employer.cr_status === 'expired' ||
            employer.license_status === 'expired')) ||
        (documentFilter === 'expiring' &&
          (employer.cr_status === 'expiring' ||
            employer.license_status === 'expiring')) ||
        (documentFilter === 'valid' &&
          employer.cr_status === 'valid' &&
          employer.license_status === 'valid');

      return matchesSearch && matchesStatus && matchesDocument;
    });
  }, [employers, searchTerm, statusFilter, documentFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: employers.length,
      active: employers.filter(e => e.status === 'Active').length,
      expiring: employers.filter(
        e => e.cr_status === 'expiring' || e.license_status === 'expiring'
      ).length,
      expired: employers.filter(
        e => e.cr_status === 'expired' || e.license_status === 'expired'
      ).length,
      total_contracts: employers.reduce(
        (sum, e) => sum + (e.contract_count || 0),
        0
      ),
    };
  }, [employers]);

  // Fetch promoters for an employer
  const fetchPromotersForEmployer = useCallback(
    async (employerId: string) => {
      if (promotersByEmployer[employerId] || loadingPromoters.has(employerId)) {
        return;
      }

      setLoadingPromoters(prev => new Set(prev).add(employerId));

      try {
        const response = await fetch(`/api/parties/${employerId}/promoters`);
        const data = await response.json();

        if (data.success) {
          setPromotersByEmployer(prev => ({
            ...prev,
            [employerId]: data.promoters || [],
          }));
        }
      } catch (error) {
        console.error('Error fetching promoters:', error);
      } finally {
        setLoadingPromoters(prev => {
          const newSet = new Set(prev);
          newSet.delete(employerId);
          return newSet;
        });
      }
    },
    [promotersByEmployer, loadingPromoters]
  );

  // Toggle employer expansion
  const toggleEmployerExpansion = useCallback(
    (employerId: string) => {
      setExpandedEmployers(prev => {
        const newSet = new Set(prev);
        if (newSet.has(employerId)) {
          newSet.delete(employerId);
        } else {
          newSet.add(employerId);
          fetchPromotersForEmployer(employerId);
        }
        return newSet;
      });
    },
    [fetchPromotersForEmployer]
  );

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            <Building2 className='h-8 w-8 text-blue-600' />
            Employers
          </h1>
          <p className='text-muted-foreground mt-1'>
            View and manage all employer parties
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={fetchEmployers}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          <Link href={`/${locale}/manage-parties`}>
            <Button>
              <PlusCircleIcon className='mr-2 h-4 w-4' />
              Add New Employer
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Employers
            </CardTitle>
            <Building2 className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.active} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Contracts
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total_contracts}</div>
            <p className='text-xs text-muted-foreground'>
              Across all employers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Expiring Soon</CardTitle>
            <Calendar className='h-4 w-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>
              {stats.expiring}
            </div>
            <p className='text-xs text-muted-foreground'>Documents expiring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Expired Documents
            </CardTitle>
            <AlertTriangle className='h-4 w-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {stats.expired}
            </div>
            <p className='text-xs text-muted-foreground'>Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label htmlFor='search'>Search</Label>
              <div className='relative'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                <Input
                  id='search'
                  placeholder='Search employers...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10'
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Statuses</SelectItem>
                  <SelectItem value='Active'>Active</SelectItem>
                  <SelectItem value='Inactive'>Inactive</SelectItem>
                  <SelectItem value='Suspended'>Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label>Documents</Label>
              <Select value={documentFilter} onValueChange={setDocumentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='All documents' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Documents</SelectItem>
                  <SelectItem value='expired'>Expired</SelectItem>
                  <SelectItem value='expiring'>Expiring Soon</SelectItem>
                  <SelectItem value='valid'>Valid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employers Table */}
      {filteredEmployers.length === 0 ? (
        <EmptyState
          icon={Building2}
          title='No employers found'
          description='No employers match your current filters'
          action={{
            label: 'Add New Employer',
            onClick: () => router.push(`/${locale}/manage-parties`),
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Employers ({filteredEmployers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>CR Expiry</TableHead>
                    <TableHead>License Expiry</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEmployers.map(employer => (
                    <React.Fragment key={employer.id}>
                      <TableRow>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <div>
                              <div className='font-medium'>
                                {employer.name_en}
                              </div>
                              {employer.name_ar && (
                                <div className='text-sm text-muted-foreground'>
                                  {employer.name_ar}
                                </div>
                              )}
                            </div>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                toggleEmployerExpansion(employer.id)
                              }
                              className='ml-2 h-8 w-8 p-0'
                            >
                              {expandedEmployers.has(employer.id) ? (
                                <ChevronUp className='h-4 w-4' />
                              ) : (
                                <ChevronDown className='h-4 w-4' />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              employer.status === 'Active'
                                ? 'default'
                                : employer.status === 'Inactive'
                                  ? 'secondary'
                                  : 'destructive'
                            }
                          >
                            {employer.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {employer.cr_expiry_date ? (
                            <div className='text-sm'>
                              <div>
                                {formatDateSafely(employer.cr_expiry_date)}
                              </div>
                              <div
                                className={cn(
                                  'text-xs',
                                  employer.cr_status === 'expired' &&
                                    'text-red-600',
                                  employer.cr_status === 'expiring' &&
                                    'text-yellow-600',
                                  employer.cr_status === 'valid' &&
                                    'text-green-600'
                                )}
                              >
                                {employer.cr_status === 'expired' && 'Expired'}
                                {employer.cr_status === 'expiring' &&
                                  `${employer.days_until_cr_expiry} days left`}
                                {employer.cr_status === 'valid' && 'Valid'}
                              </div>
                            </div>
                          ) : (
                            <span className='text-muted-foreground'>
                              Not set
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employer.license_expiry ? (
                            <div className='text-sm'>
                              <div>
                                {formatDateSafely(employer.license_expiry)}
                              </div>
                              <div
                                className={cn(
                                  'text-xs',
                                  employer.license_status === 'expired' &&
                                    'text-red-600',
                                  employer.license_status === 'expiring' &&
                                    'text-yellow-600',
                                  employer.license_status === 'valid' &&
                                    'text-green-600'
                                )}
                              >
                                {employer.license_status === 'expired' &&
                                  'Expired'}
                                {employer.license_status === 'expiring' &&
                                  `${employer.days_until_license_expiry} days left`}
                                {employer.license_status === 'valid' && 'Valid'}
                              </div>
                            </div>
                          ) : (
                            <span className='text-muted-foreground'>
                              Not set
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>
                            {employer.contract_count || 0}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant='ghost' size='sm'>
                                <MoreHorizontal className='h-4 w-4' />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/en/manage-parties?id=${employer.id}`
                                  )
                                }
                              >
                                <EditIcon className='mr-2 h-4 w-4' />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/en/manage-parties/${employer.id}`
                                  )
                                }
                              >
                                <Eye className='mr-2 h-4 w-4' />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>

                      {/* Expanded Promoters Row */}
                      {expandedEmployers.has(employer.id) && (
                        <TableRow>
                          <TableCell colSpan={6} className='p-0'>
                            <div className='bg-slate-50 dark:bg-slate-900 border-t'>
                              <div className='p-4'>
                                <div className='flex items-center gap-2 mb-4'>
                                  <Users className='h-5 w-5 text-blue-600' />
                                  <h3 className='text-lg font-semibold'>
                                    Assigned Promoters
                                  </h3>
                                  <Badge variant='outline'>
                                    {promotersByEmployer[employer.id]?.length ||
                                      0}{' '}
                                    Total
                                  </Badge>
                                </div>

                                {loadingPromoters.has(employer.id) ? (
                                  <div className='flex items-center justify-center py-8'>
                                    <Loader2 className='h-6 w-6 animate-spin' />
                                  </div>
                                ) : (
                                  (() => {
                                    const employerPromoters =
                                      promotersByEmployer[employer.id];
                                    return employerPromoters &&
                                      employerPromoters.length > 0 ? (
                                      <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-3'>
                                        {employerPromoters.map(promoter => (
                                          <ClickablePromoterCard
                                            key={promoter.id}
                                            promoter={promoter}
                                            locale='en'
                                            enableQuickActions={true}
                                          />
                                        ))}
                                      </div>
                                    ) : (
                                      <div className='text-center py-8 text-muted-foreground'>
                                        No promoters assigned to this employer
                                      </div>
                                    );
                                  })()
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
