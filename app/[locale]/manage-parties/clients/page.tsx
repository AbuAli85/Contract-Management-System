'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Users,
  AlertTriangle,
  FileText,
  Mail,
  Phone,
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

interface EnhancedParty extends Party {
  contract_count?: number;
  cr_status: 'valid' | 'expiring' | 'expired' | 'missing';
  license_status: 'valid' | 'expiring' | 'expired' | 'missing';
  days_until_cr_expiry?: number | undefined;
  days_until_license_expiry?: number | undefined;
}

/**
 * Clients View Page
 * Displays all client-type parties with their details
 */
export default function ClientsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const { toast } = useToast();

  const [clients, setClients] = useState<EnhancedParty[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [documentFilter, setDocumentFilter] = useState('all');

  // Fetch clients
  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/parties');
      const data = await response.json();

      if (data.success) {
        // Filter only clients
        const clientParties = (data.parties || [])
          .filter((party: Party) => party.type === 'Client')
          .map(enhanceParty);
        setClients(clientParties);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to fetch clients',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch clients',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

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

  // Filter clients
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const matchesSearch =
        !searchTerm ||
        client.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.crn?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || client.status === statusFilter;

      const matchesDocument =
        documentFilter === 'all' ||
        (documentFilter === 'expired' &&
          (client.cr_status === 'expired' ||
            client.license_status === 'expired')) ||
        (documentFilter === 'expiring' &&
          (client.cr_status === 'expiring' ||
            client.license_status === 'expiring')) ||
        (documentFilter === 'valid' &&
          client.cr_status === 'valid' &&
          client.license_status === 'valid');

      return matchesSearch && matchesStatus && matchesDocument;
    });
  }, [clients, searchTerm, statusFilter, documentFilter]);

  // Statistics
  const stats = useMemo(() => {
    return {
      total: clients.length,
      active: clients.filter(c => c.status === 'Active').length,
      expiring: clients.filter(
        c => c.cr_status === 'expiring' || c.license_status === 'expiring'
      ).length,
      expired: clients.filter(
        c => c.cr_status === 'expired' || c.license_status === 'expired'
      ).length,
      total_contracts: clients.reduce(
        (sum, c) => sum + (c.contract_count || 0),
        0
      ),
    };
  }, [clients]);

  if (isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-green-600' />
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight flex items-center gap-2'>
            <Users className='h-8 w-8 text-green-600' />
            Clients
          </h1>
          <p className='text-muted-foreground mt-1'>
            View and manage all client parties
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={fetchClients}>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          <Link href={`/${locale}/manage-parties`}>
            <Button>
              <PlusCircleIcon className='mr-2 h-4 w-4' />
              Add New Client
            </Button>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className='mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Clients</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
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
            <p className='text-xs text-muted-foreground'>Across all clients</p>
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
                  placeholder='Search clients...'
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

      {/* Clients Table */}
      {filteredClients.length === 0 ? (
        <EmptyState
          icon={Users}
          title='No clients found'
          description='No clients match your current filters'
          action={{
            label: 'Add New Client',
            onClick: () => router.push(`/${locale}/manage-parties`),
          }}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Clients ({filteredClients.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>CR Expiry</TableHead>
                    <TableHead>License Expiry</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map(client => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{client.name_en}</div>
                          {client.name_ar && (
                            <div className='text-sm text-muted-foreground'>
                              {client.name_ar}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='space-y-1 text-sm'>
                          {client.contact_email && (
                            <div className='flex items-center gap-1'>
                              <Mail className='h-3 w-3 text-muted-foreground' />
                              <span className='text-xs'>
                                {client.contact_email}
                              </span>
                            </div>
                          )}
                          {client.contact_phone && (
                            <div className='flex items-center gap-1'>
                              <Phone className='h-3 w-3 text-muted-foreground' />
                              <span className='text-xs'>
                                {client.contact_phone}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            client.status === 'Active'
                              ? 'default'
                              : client.status === 'Inactive'
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {client.cr_expiry_date ? (
                          <div className='text-sm'>
                            <div>{formatDateSafely(client.cr_expiry_date)}</div>
                            <div
                              className={cn(
                                'text-xs',
                                client.cr_status === 'expired' &&
                                  'text-red-600',
                                client.cr_status === 'expiring' &&
                                  'text-yellow-600',
                                client.cr_status === 'valid' && 'text-green-600'
                              )}
                            >
                              {client.cr_status === 'expired' && 'Expired'}
                              {client.cr_status === 'expiring' &&
                                `${client.days_until_cr_expiry} days left`}
                              {client.cr_status === 'valid' && 'Valid'}
                            </div>
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {client.license_expiry ? (
                          <div className='text-sm'>
                            <div>{formatDateSafely(client.license_expiry)}</div>
                            <div
                              className={cn(
                                'text-xs',
                                client.license_status === 'expired' &&
                                  'text-red-600',
                                client.license_status === 'expiring' &&
                                  'text-yellow-600',
                                client.license_status === 'valid' &&
                                  'text-green-600'
                              )}
                            >
                              {client.license_status === 'expired' && 'Expired'}
                              {client.license_status === 'expiring' &&
                                `${client.days_until_license_expiry} days left`}
                              {client.license_status === 'valid' && 'Valid'}
                            </div>
                          </div>
                        ) : (
                          <span className='text-muted-foreground'>Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                          {client.contract_count || 0}
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
                                  `/${locale}/manage-parties?id=${client.id}`
                                )
                              }
                            >
                              <EditIcon className='mr-2 h-4 w-4' />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/${locale}/manage-parties/${client.id}`
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
