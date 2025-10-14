'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { format, parseISO, differenceInDays } from 'date-fns';
import Link from 'next/link';
import nextDynamic from 'next/dynamic';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { SafeImage } from '@/components/ui/safe-image';
import { cn } from '@/lib/utils';

// Icons
import {
  Search,
  Eye,
  Edit3,
  Trash2,
  UserPlus,
  FileSpreadsheet,
  RefreshCw,
  ArrowLeftIcon,
  PlusCircleIcon,
  BriefcaseIcon,
  UserIcon,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Building,
  Download,
} from 'lucide-react';

// Types and Utils
import type { Promoter } from '@/lib/types';
import { useSupabase } from '@/app/providers';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { PROMOTER_NOTIFICATION_DAYS } from '@/constants/notification-days';

// Enhanced Promoter Interface
interface EnhancedPromoter extends Promoter {
  id_card_status: 'valid' | 'expiring' | 'expired' | 'missing';
  passport_status: 'valid' | 'expiring' | 'expired' | 'missing';
  overall_status: 'active' | 'warning' | 'critical' | 'inactive';
  days_until_id_expiry?: number;
  days_until_passport_expiry?: number;
  active_contracts_count?: number;
  employer?: {
    id: string;
    name_en: string;
    name_ar: string;
  } | null;
}

// Statistics interface
interface PromoterStats {
  total: number;
  active: number;
  expiring_documents: number;
  expired_documents: number;
  total_contracts: number;
  companies_count: number;
}

// Page props interface
interface PromoterManagementProps {
  params: {
    locale: string;
  };
}

export default function PromoterManagement({
  params,
}: PromoterManagementProps) {
  const { locale } = params;

  console.log('🚀 PromoterManagement component mounted');

  // Core state
  const [promoters, setPromoters] = useState<EnhancedPromoter[]>([]);
  
  // TEMPORARY: Simple test return
  if (typeof window !== 'undefined') {
    console.log('🌐 Running in browser, promoters count:', promoters.length);
  }
  const [filteredPromoters, setFilteredPromoters] = useState<
    EnhancedPromoter[]
  >([]);
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Hooks
  const router = useRouter();
  const { toast } = useToast();
  const { supabase, loading: authLoading } = useSupabase();
  const ExcelImportModal = useMemo(
    () =>
      nextDynamic(() => import('@/components/excel-import-modal'), {
        ssr: false,
      }),
    []
  );
  const [isImportOpen, setIsImportOpen] = useState(false);

  // Helper functions
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getDocumentStatusType = (
    daysUntilExpiry: number | null,
    dateString: string | null
  ): 'valid' | 'expiring' | 'expired' | 'missing' => {
    if (!dateString) return 'missing';
    if (daysUntilExpiry === null) return 'missing';
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY)
      return 'expiring';
    return 'valid';
  };

  const getOverallStatus = (
    promoter: Promoter
  ): 'active' | 'warning' | 'critical' | 'inactive' => {
    if (!promoter.status || promoter.status === 'inactive') return 'inactive';

    const idExpiry = promoter.id_card_expiry_date
      ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
      : null;
    const passportExpiry = promoter.passport_expiry_date
      ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date())
      : null;

    if (
      (idExpiry !== null && idExpiry < 0) ||
      (passportExpiry !== null && passportExpiry < 0)
    ) {
      return 'critical';
    }

    if (
      (idExpiry !== null && idExpiry <= PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY) ||
      (passportExpiry !== null &&
        passportExpiry <= PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY)
    ) {
      return 'warning';
    }

    return 'active';
  };

  // Helper function to enhance promoter data
  const enhancePromoterData = (promoter: any): EnhancedPromoter => {
    const idExpiryDays = promoter.id_card_expiry_date
      ? differenceInDays(
          parseISO(promoter.id_card_expiry_date),
          new Date()
        )
      : null;

    const passportExpiryDays = promoter.passport_expiry_date
      ? differenceInDays(
          parseISO(promoter.passport_expiry_date),
          new Date()
        )
      : null;

    const computedNameEn =
      promoter.name_en ||
      [promoter.first_name, promoter.last_name].filter(Boolean).join(' ');

    return {
      ...promoter,
      name_en: computedNameEn,
      id_card_status: getDocumentStatusType(
        idExpiryDays,
        promoter.id_card_expiry_date
      ),
      passport_status: getDocumentStatusType(
        passportExpiryDays,
        promoter.passport_expiry_date
      ),
      overall_status: getOverallStatus(promoter),
      days_until_id_expiry: idExpiryDays || undefined,
      days_until_passport_expiry: passportExpiryDays || undefined,
      active_contracts_count: 0,
      employer: promoter.parties ? {
        id: promoter.employer_id || '',
        name_en: promoter.parties.name_en || '',
        name_ar: promoter.parties.name_ar || ''
      } : null,
    };
  };

  // Data fetching
  const fetchPromoters = useCallback(async () => {
    try {
      console.log('🔄 Starting fetchPromoters...');
      setIsLoading(true);
      setError(null);

      // Use the API endpoint instead of direct Supabase access
      const response = await fetch('/api/promoters', { cache: 'no-store' });

      if (!response.ok) {
        throw new Error('Unable to load promoters from the server.');
      }

      const payload = await response.json();
      console.log('📡 API Response:', { success: payload.success, count: payload.promoters?.length || 0 });

      if (!payload.success) {
        throw new Error(payload.error || 'Failed to load promoters.');
      }

      const promotersData = payload.promoters || [];
      console.log('📊 Promoters data:', promotersData.length, 'items');

      if (!promotersData || promotersData.length === 0) {
        console.log('⚠️ No promoters data, setting empty array');
        setPromoters([]);
        return;
      }

      // Enhance promoter data
      const enhancedPromoters: EnhancedPromoter[] = promotersData.map(
        (promoter: any) => enhancePromoterData(promoter)
      );

      console.log('✅ Enhanced promoters:', enhancedPromoters.length, 'items');
      setPromoters(enhancedPromoters);
    } catch (error) {
      console.error('❌ Error in fetchPromoters:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to load promoters'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    console.log('🔄 useEffect triggered, calling fetchPromoters');
    fetchPromoters();
  }, [fetchPromoters]);

  // Filter promoters
  useEffect(() => {
    let filtered = promoters;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(promoter => {
        const searchLower = searchTerm.toLowerCase();
        return (
          promoter.name_en?.toLowerCase().includes(searchLower) ||
          promoter.name_ar?.toLowerCase().includes(searchLower) ||
          promoter.id_card_number?.toLowerCase().includes(searchLower) ||
          promoter.passport_number?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(
        promoter => promoter.overall_status === filterStatus
      );
    }

    setFilteredPromoters(filtered);
  }, [promoters, searchTerm, filterStatus]);

  // Calculate statistics
  const stats = useMemo((): PromoterStats => {
    console.log('📊 Calculating stats for', promoters.length, 'promoters');
    const total = promoters.length;
    const active = promoters.filter(p => p.overall_status === 'active').length;
    const expiring_documents = promoters.filter(
      p => p.id_card_status === 'expiring' || p.passport_status === 'expiring'
    ).length;
    const expired_documents = promoters.filter(
      p => p.id_card_status === 'expired' || p.passport_status === 'expired'
    ).length;
    const total_contracts = promoters.reduce(
      (sum, p) => sum + (p.active_contracts_count || 0),
      0
    );
    const companies_count = 0; // Simplified for now

    const statsResult = {
      total,
      active,
      expiring_documents,
      expired_documents,
      total_contracts,
      companies_count,
    };
    
    console.log('📊 Stats result:', statsResult);
    return statsResult;
  }, [promoters]);

  // Action handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchPromoters();
    setIsRefreshing(false);
  }, [fetchPromoters]);

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true);
    try {
      const csvData = filteredPromoters.map(promoter => ({
        'Name (EN)': promoter.name_en || 'N/A',
        'Name (AR)': promoter.name_ar || 'N/A',
        'ID Card Number': promoter.id_card_number || 'N/A',
        'Passport Number': promoter.passport_number || 'N/A',
        Mobile: promoter.mobile_number || 'N/A',
        Email: promoter.email || 'N/A',
        Status: promoter.status || 'N/A',
        'Overall Status': promoter.overall_status,
        'Created At': promoter.created_at
          ? format(parseISO(promoter.created_at), 'yyyy-MM-dd')
          : 'N/A',
      }));

      const csvContent = [
        Object.keys(csvData[0] || {}).join(','),
        ...csvData.map(row =>
          Object.values(row)
            .map(val => `"${val}"`)
            .join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `promoters-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      link.click();

      toast({
        title: 'Export Complete',
        description: `Exported ${filteredPromoters.length} promoters to CSV`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: 'Failed to export promoter data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredPromoters, toast]);

  const handleDelete = useCallback(
    async (promoter: Promoter) => {
      if (
        !confirm(
          `Are you sure you want to delete promoter "${promoter.name_en}"?`
        )
      ) {
        return;
      }

      try {
        const supabase = createClient();
        if (!supabase) {
          throw new Error('Database connection not available');
        }

        const { error } = await supabase
          .from('promoters')
          .delete()
          .eq('id', promoter.id);

        if (error) {
          throw new Error(error.message);
        }

        await fetchPromoters();

        toast({
          title: 'Promoter deleted',
          description: `Successfully deleted promoter "${promoter.name_en}"`,
        });
      } catch (error) {
        toast({
          title: 'Delete failed',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to delete promoter',
          variant: 'destructive',
        });
      }
    },
    [fetchPromoters, toast]
  );

  const toggleSelectAll = useCallback(() => {
    if (selectedPromoters.length === filteredPromoters.length) {
      setSelectedPromoters([]);
    } else {
      setSelectedPromoters(filteredPromoters.map(p => p.id));
    }
  }, [selectedPromoters.length, filteredPromoters]);

  const toggleSelectPromoter = useCallback((promoterId: string) => {
    setSelectedPromoters(prev =>
      prev.includes(promoterId)
        ? prev.filter(id => id !== promoterId)
        : [...prev, promoterId]
    );
  }, []);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className='h-4 w-4 text-green-600' />;
      case 'warning':
        return <AlertTriangle className='h-4 w-4 text-yellow-600' />;
      case 'critical':
        return <XCircle className='h-4 w-4 text-red-600' />;
      default:
        return <Clock className='h-4 w-4 text-gray-600' />;
    }
  }, []);

  const getStatusBadgeVariant = useCallback((status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  }, []);

  // View and Edit handlers
  const handleView = useCallback(
    (promoter: EnhancedPromoter) => {
      const safeLocale = locale || 'en';
      router.push(`/${safeLocale}/manage-promoters/${promoter.id}`);
    },
    [router, locale]
  );

  const handleEdit = useCallback(
    (promoter: EnhancedPromoter) => {
      const safeLocale = locale || 'en';
      router.push(`/${safeLocale}/manage-promoters/${promoter.id}/edit`);
    },
    [router, locale]
  );

  const handleAddNew = useCallback(() => {
    const safeLocale = locale || 'en';
    router.push(`/${safeLocale}/manage-promoters/new`);
  }, [router, locale]);

  if (isLoading || authLoading) {
    return (
      <div className='min-h-screen bg-background px-4 py-8'>
        <div className='mx-auto max-w-screen-xl'>
          <div className='flex items-center justify-center h-64'>
            <div className='flex items-center gap-2'>
              <Loader2 className='h-6 w-6 animate-spin' />
              <span>
                {authLoading ? 'Initializing...' : 'Loading promoters...'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background px-4 py-8'>
      <div className='mx-auto max-w-screen-xl'>
        {/* Header */}
        <div className='mb-8 flex flex-col gap-4'>
          <div className='flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center'>
            <div>
              <h1 className='text-3xl font-bold text-card-foreground'>
                Promoter Management
              </h1>
              <p className='text-muted-foreground mt-1'>
                Manage and monitor your promoters with full control
              </p>
            </div>

            <div className='flex flex-wrap gap-2'>
              <Button
                variant='outline'
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn('mr-2 h-4 w-4', isRefreshing && 'animate-spin')}
                />
                Refresh
              </Button>
              <Button onClick={handleAddNew} size='lg' className='bg-primary'>
                <PlusCircleIcon className='mr-2 h-5 w-5' />
                Add Promoter
              </Button>
            </div>
          </div>

          {/* Action Bar */}
          <div className='flex flex-wrap items-center gap-2 border-t pt-4'>
            <Button variant='outline' size='sm' onClick={() => setIsImportOpen(true)}>
              <FileSpreadsheet className='mr-2 h-4 w-4' />
              Import
            </Button>
            <Button
              onClick={handleExportCSV}
              variant='outline'
              size='sm'
              disabled={isExporting || filteredPromoters.length === 0}
            >
              {isExporting ? (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Download className='mr-2 h-4 w-4' />
              )}
              Export
            </Button>
            {selectedPromoters.length > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {selectedPromoters.length} selected
              </Badge>
            )}
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className='mb-6 border-red-200 bg-red-50'>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-2 text-red-800'>
                <AlertTriangle className='h-4 w-4' />
                <span className='font-medium'>Error: {error}</span>
              </div>
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                className='mt-2'
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Statistics Cards */}
        <div className='grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-6'>
          <Card>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-2'>
                <UserIcon className='h-4 w-4 text-blue-600' />
                <div>
                  <p className='text-2xl font-bold'>{stats.total}</p>
                  <p className='text-xs text-muted-foreground'>
                    Total Promoters
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <div>
                  <p className='text-2xl font-bold'>{stats.active}</p>
                  <p className='text-xs text-muted-foreground'>Active</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-4 w-4 text-yellow-600' />
                <div>
                  <p className='text-2xl font-bold'>
                    {stats.expiring_documents}
                  </p>
                  <p className='text-xs text-muted-foreground'>Expiring</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-2'>
                <XCircle className='h-4 w-4 text-red-600' />
                <div>
                  <p className='text-2xl font-bold'>
                    {stats.expired_documents}
                  </p>
                  <p className='text-xs text-muted-foreground'>Expired</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-2'>
                <BriefcaseIcon className='h-4 w-4 text-purple-600' />
                <div>
                  <p className='text-2xl font-bold'>{stats.total_contracts}</p>
                  <p className='text-xs text-muted-foreground'>Contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='pt-4'>
              <div className='flex items-center gap-2'>
                <Building className='h-4 w-4 text-indigo-600' />
                <div>
                  <p className='text-2xl font-bold'>{stats.companies_count}</p>
                  <p className='text-xs text-muted-foreground'>Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className='mb-6'>
          <CardContent className='pt-6'>
            <div className='space-y-4'>
              {/* Search Bar */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  placeholder='Search by name, ID card, passport, or company...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 h-11'
                />
              </div>

              {/* Filter Options */}
              <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3'>
                {/* Status Filter */}
                <div className='space-y-2'>
                  <label className='text-sm font-medium'>
                    Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    className='w-full h-10 px-3 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring'
                    aria-label='Filter by status'
                  >
                    <option value='all'>All Status</option>
                    <option value='active'>Active</option>
                    <option value='warning'>Warning</option>
                    <option value='critical'>Critical</option>
                    <option value='inactive'>Inactive</option>
                  </select>
                </div>

                {/* Quick Actions */}
                <div className='flex items-end gap-2'>
                  {(searchTerm || filterStatus !== 'all') && (
                    <Button
                      variant='outline'
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                      }}
                      className='h-10'
                    >
                      <RefreshCw className='mr-2 h-4 w-4' />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promoters Table */}
        {filteredPromoters.length === 0 ? (
          <Card>
            <CardContent className='flex flex-col items-center justify-center py-16'>
              <div className='rounded-full bg-muted p-6 mb-4'>
                <UserIcon className='h-12 w-12 text-muted-foreground' />
              </div>
              <h3 className='text-xl font-semibold mb-2'>
                {searchTerm || filterStatus !== 'all'
                  ? 'No promoters match your search'
                  : 'No promoters yet'}
              </h3>
              <p className='text-muted-foreground text-center mb-6 max-w-md'>
                {searchTerm || filterStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria to find what you\'re looking for.'
                  : 'Get started by adding your first promoter to the system.'}
              </p>
              <div className='flex gap-3'>
                {(searchTerm || filterStatus !== 'all') && (
                  <Button 
                    onClick={() => {
                      setSearchTerm('');
                      setFilterStatus('all');
                    }}
                    variant='outline'
                  >
                    <RefreshCw className='mr-2 h-4 w-4' />
                    Clear Filters
                  </Button>
                )}
                <Button onClick={handleAddNew} size='lg'>
                  <PlusCircleIcon className='mr-2 h-5 w-5' />
                  Add Promoter
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className='w-12'>
                    <Checkbox
                      checked={
                        selectedPromoters.length === filteredPromoters.length &&
                        filteredPromoters.length > 0
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>ID Card</TableHead>
                  <TableHead>Passport</TableHead>
                  <TableHead>ID Expiry</TableHead>
                  <TableHead>Passport Expiry</TableHead>
                  <TableHead>Contracts</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromoters.map(promoter => {
                  const isSelected = selectedPromoters.includes(promoter.id);
                  return (
                    <TableRow key={promoter.id}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() =>
                            toggleSelectPromoter(promoter.id)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-3'>
                          <SafeImage
                            src={promoter.profile_picture_url ?? null}
                            alt={promoter.name_en}
                            className='h-10 w-10 rounded-full'
                            fallback={
                              <UserIcon className='h-10 w-10 rounded-full bg-muted p-2' />
                            }
                          />
                          <div>
                            <div className='font-medium'>
                              {promoter.name_en}
                            </div>
                            <div className='text-sm text-muted-foreground'>
                              {promoter.name_ar}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-2'>
                          <Badge
                            variant={
                              promoter.id_card_status === 'valid'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {promoter.id_card_status}
                          </Badge>
                          {promoter.days_until_id_expiry !== undefined &&
                            promoter.days_until_id_expiry <= 30 && (
                              <span className='text-xs text-amber-600'>
                                {promoter.days_until_id_expiry}d
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-2'>
                          <Badge
                            variant={
                              promoter.passport_status === 'valid'
                                ? 'default'
                                : 'secondary'
                            }
                          >
                            {promoter.passport_status}
                          </Badge>
                          {promoter.days_until_passport_expiry !== undefined &&
                            promoter.days_until_passport_expiry <= 30 && (
                              <span className='text-xs text-amber-600'>
                                {promoter.days_until_passport_expiry}d
                              </span>
                            )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {formatDate(promoter.id_card_expiry_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='text-sm'>
                          {formatDate(promoter.passport_expiry_date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-2'>
                          <BriefcaseIcon className='h-4 w-4 text-muted-foreground' />
                          <span>{promoter.active_contracts_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center space-x-2'>
                          {getStatusIcon(promoter.overall_status)}
                          <Badge
                            variant={getStatusBadgeVariant(
                              promoter.overall_status
                            )}
                          >
                            {promoter.overall_status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex items-center justify-end gap-2'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleView(promoter)}
                          >
                            <Eye className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEdit(promoter)}
                          >
                            <Edit3 className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDelete(promoter)}
                          >
                            <Trash2 className='h-4 w-4 text-red-600' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
      {/* Import Modal */}
      <ExcelImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportComplete={async () => {
          setIsImportOpen(false);
          await fetchPromoters();
        }}
      />
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic';
