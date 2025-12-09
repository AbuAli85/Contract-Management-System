'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Filter,
  Download,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Building,
  Mail,
  Phone,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type {
  DashboardPromoter,
  DashboardMetrics,
  PromotersResponse,
} from './types';

interface PromotersStaticViewProps {
  locale?: string;
}

export function PromotersStaticView({
  locale = 'en',
}: PromotersStaticViewProps) {
  const [promoters, setPromoters] = useState<DashboardPromoter[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [total, setTotal] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [manualRefresh, setManualRefresh] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  // Fetch promoters data - ONLY when manually triggered
  const fetchPromoters = useCallback(
    async (forceRefresh = false) => {
      if (!forceRefresh && promoters.length > 0 && !manualRefresh) {
        console.log(
          '🚫 Skipping fetch - data already exists and not manual refresh'
        );
        return;
      }

      console.log('📡 Fetching promoters data...', {
        forceRefresh,
        manualRefresh,
      });
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/promoters?page=${page}&limit=${limit}`,
          {
            cache: 'force-cache',
            headers: {
              'Cache-Control': 'max-age=86400', // 24 hours
              'X-Requested-With': 'XMLHttpRequest',
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: PromotersResponse = await response.json();

        setPromoters(data.promoters || []);
        setMetrics(data.metrics || null);
        setTotal(data.pagination?.total || 0);
        setLastFetchTime(new Date());
        setManualRefresh(false);

        console.log('✅ Promoters data loaded:', {
          count: data.promoters?.length || 0,
          total: data.pagination?.total || 0,
          timestamp: new Date().toISOString(),
        });
      } catch (err) {
        console.error('❌ Error fetching promoters:', err);
        setError(
          err instanceof Error ? err.message : 'Failed to fetch promoters'
        );
      } finally {
        setLoading(false);
      }
    },
    [page, limit, promoters.length, manualRefresh]
  );

  // Initial load - ONLY on mount
  useEffect(() => {
    console.log('🚀 Initial load - fetching promoters data');
    fetchPromoters(true);
  }, []); // Empty dependency array - only run once

  // Manual refresh handler
  const handleManualRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered');
    setManualRefresh(true);
    fetchPromoters(true);
    toast({
      title: 'Data Refreshed',
      description: 'Promoters data has been updated',
    });
  }, [fetchPromoters, toast]);

  // Filtered promoters based on search
  const filteredPromoters = useMemo(() => {
    if (!searchTerm.trim()) return promoters;

    const term = searchTerm.toLowerCase();
    return promoters.filter(
      promoter =>
        promoter.displayName.toLowerCase().includes(term) ||
        promoter.email?.toLowerCase().includes(term) ||
        promoter.organisationLabel?.toLowerCase().includes(term)
    );
  }, [promoters, searchTerm]);

  // Calculate pagination
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = Math.min(startIndex + limit, total);

  if (loading && promoters.length === 0) {
    return (
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-10 w-32' />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className='h-6 w-32' />
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-16 w-full' />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6'>
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>Error loading promoters: {error}</AlertDescription>
        </Alert>
        <Button onClick={handleManualRefresh} variant='outline'>
          <RefreshCw className='mr-2 h-4 w-4' />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Promoters</h1>
          <p className='text-muted-foreground'>
            Manage promoters and staff members
            {lastFetchTime && (
              <span className='ml-2 text-xs'>
                (Last updated: {format(lastFetchTime, 'HH:mm:ss')})
              </span>
            )}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Button onClick={handleManualRefresh} variant='outline' size='sm'>
            <RefreshCw className='mr-2 h-4 w-4' />
            Refresh
          </Button>
          <Button onClick={() => router.push(`/${locale}/promoters/new`)}>
            <Plus className='mr-2 h-4 w-4' />
            Add Promoter
          </Button>
        </div>
      </div>

      {/* Metrics */}
      {metrics && (
        <div className='grid gap-4 md:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Promoters
              </CardTitle>
              <User className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{metrics.totalPromoters}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Compliance Rate
              </CardTitle>
              <CheckCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>
                {metrics.complianceRate}%
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Assigned Staff
              </CardTitle>
              <Building className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{metrics.assignedStaff}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>At Risk</CardTitle>
              <AlertCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{metrics.atRiskCount}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <div className='relative'>
                <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  placeholder='Search promoters...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-8 w-64'
                />
              </div>
            </div>
            <div className='flex items-center space-x-2'>
              <Button variant='outline' size='sm'>
                <Download className='mr-2 h-4 w-4' />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Promoters Table */}
          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Assignment Status</TableHead>
                  <TableHead>Document Health</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPromoters.map(promoter => (
                  <TableRow key={promoter.id}>
                    <TableCell>
                      <div className='flex items-center space-x-2'>
                        <div className='h-8 w-8 rounded-full bg-muted flex items-center justify-center'>
                          <User className='h-4 w-4' />
                        </div>
                        <div>
                          <div className='font-medium'>
                            {promoter.displayName}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {promoter.role || 'Promoter'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-1'>
                        <Mail className='h-3 w-3 text-muted-foreground' />
                        <span className='text-sm'>
                          {promoter.email || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-1'>
                        <Phone className='h-3 w-3 text-muted-foreground' />
                        <span className='text-sm'>
                          {promoter.phone || 'N/A'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <div className='text-sm font-medium text-foreground'>
                          {promoter.assignmentStatus === 'assigned'
                            ? promoter.organisationLabel
                            : 'No Assignment'}
                        </div>
                        <Badge
                          variant='outline'
                          className={cn(
                            'w-fit rounded-full border px-2 py-0.5 text-xs font-medium transition-colors',
                            promoter.assignmentStatus === 'assigned'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          )}
                        >
                          {promoter.assignmentStatus === 'assigned'
                            ? '✓ Assigned'
                            : '○ Unassigned'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center space-x-1'>
                        {promoter.documentHealth === 'healthy' ? (
                          <CheckCircle className='h-4 w-4 text-green-500' />
                        ) : promoter.documentHealth === 'warning' ? (
                          <Clock className='h-4 w-4 text-yellow-500' />
                        ) : (
                          <AlertCircle className='h-4 w-4 text-red-500' />
                        )}
                        <span className='text-sm capitalize'>
                          {promoter.documentHealth}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='ghost' size='sm'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/${locale}/promoters/${promoter.id}`)
                            }
                          >
                            <Eye className='mr-2 h-4 w-4' />
                            View Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(
                                `/${locale}/promoters/${promoter.id}/edit`
                              )
                            }
                          >
                            <Edit className='mr-2 h-4 w-4' />
                            Edit Details
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between mt-4'>
            <div className='text-sm text-muted-foreground'>
              Showing {startIndex + 1} to {endIndex} of {total} total promoters
            </div>
            <div className='flex items-center space-x-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className='text-sm'>
                Page {page} of {totalPages}
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
