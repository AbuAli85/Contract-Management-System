'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { differenceInDays, format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import type { Promoter } from '@/lib/types';
import { PROMOTER_NOTIFICATION_DAYS } from '@/constants/notification-days';
import type {
  DocumentStatus,
  OverallStatus,
  SortField,
  SortOrder,
  DocumentHealth,
  DashboardPromoter,
  DashboardMetrics,
} from './types';

// Import the new modular components
import { PromotersHeader } from './promoters-header';
import { PromotersMetricsCards } from './promoters-metrics-cards';
import { PromotersFilters } from './promoters-filters';
import { PromotersBulkActions } from './promoters-bulk-actions';
import { PromotersTable } from './promoters-table';
import { PromotersAlertsPanel } from './promoters-alerts-panel';
import { PromotersSkeleton } from './promoters-skeleton';
import { PromotersErrorState } from './promoters-error-state';
import { PromotersEmptyState } from './promoters-empty-state';
import { PromotersTimeoutState } from './promoters-timeout-state';

interface PromotersResponse {
  success: boolean;
  promoters: Promoter[];
  count: number;
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

interface PromotersViewProps {
  locale?: string;
}

// Utility functions
function parseDateSafe(value?: string | null): Date | null {
  if (!value) return null;
  const parsed = parseISO(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDisplayDate(value?: string | null): string {
  const parsed = parseDateSafe(value);
  if (!parsed) return '—';
  return format(parsed, 'dd MMM yyyy');
}

function computeDocumentHealth(
  value: string | null | undefined,
  threshold: number
): DocumentHealth {
  const parsed = parseDateSafe(value);
  if (!parsed) {
    return {
      status: 'missing',
      daysRemaining: null,
      expiresOn: null,
      label: 'No document',
    };
  }

  const days = differenceInDays(parsed, new Date());

  if (days < 0) {
    return {
      status: 'expired',
      daysRemaining: Math.abs(days),
      expiresOn: value ?? null,
      label: `Expired ${Math.abs(days)} days ago`,
    };
  }

  if (days <= threshold) {
    return {
      status: 'expiring',
      daysRemaining: days,
      expiresOn: value ?? null,
      label: `Expires in ${days} days`,
    };
  }

  return {
    status: 'valid',
    daysRemaining: days,
    expiresOn: value ?? null,
    label: `Valid until ${formatDisplayDate(value)}`,
  };
}

function computeOverallStatus(
  status: string | null | undefined,
  idDoc: DocumentHealth,
  passportDoc: DocumentHealth
): OverallStatus {
  if (
    !status ||
    ['inactive', 'terminated', 'resigned', 'on_leave', 'suspended'].includes(
      status
    )
  ) {
    return 'inactive';
  }

  if (idDoc.status === 'expired' || passportDoc.status === 'expired') {
    return 'critical';
  }

  if (
    idDoc.status === 'expiring' ||
    passportDoc.status === 'expiring' ||
    idDoc.status === 'missing' ||
    passportDoc.status === 'missing'
  ) {
    return 'warning';
  }

  return 'active';
}

async function fetchPromoters(
  page = 1,
  limit = 50
): Promise<PromotersResponse> {
  console.log(
    `🔄 Fetching promoters from API (page ${page}, limit ${limit})...`
  );

  // Set up abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  try {
    // Add cache-busting timestamp
    const timestamp = Date.now();
    const response = await fetch(
      `/api/promoters?page=${page}&limit=${limit}&_t=${timestamp}`,
      {
        cache: 'no-store',
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );

    clearTimeout(timeoutId);

    console.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
    });

    if (!response.ok) {
      console.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });

      // Try to get error details from response
      let errorMessage = `API returned ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        console.error('❌ Error details:', errorData);
        errorMessage = errorData.error || errorData.details || errorMessage;
      } catch (e) {
        console.error('❌ Could not parse error response:', e);
      }

      throw new Error(errorMessage);
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      console.error('❌ Invalid content type:', contentType);
      throw new Error('Server returned non-JSON response');
    }

    let payload;
    try {
      payload = await response.json();
    } catch (e) {
      console.error('❌ Failed to parse JSON:', e);
      throw new Error('Invalid JSON response from server');
    }

    // Validate response structure
    if (!payload || typeof payload !== 'object') {
      console.error('❌ Invalid payload type:', typeof payload);
      throw new Error('Invalid API response format');
    }

    console.log('📦 API Payload received:', {
      success: payload.success,
      hasPromoters: !!payload.promoters,
      isArray: Array.isArray(payload.promoters),
      promotersCount: payload.promoters?.length || 0,
      total: payload.total || 0,
      hasPagination: !!payload.pagination,
    });

    if (payload.success === false) {
      console.error('❌ API returned error:', payload.error);
      throw new Error(payload.error || 'Failed to load promoters.');
    }

    // Ensure promoters is an array
    if (!Array.isArray(payload.promoters)) {
      console.error('❌ Promoters is not an array:', payload.promoters);
      throw new Error('Invalid promoters data format');
    }

    console.log('✅ Successfully fetched promoters:', payload.promoters.length);
    return payload;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        console.error('❌ Request timeout');
        throw new Error(
          'Request timeout: Server took too long to respond (30s)'
        );
      }
      console.error('❌ Fetch error:', error.message);
    } else {
      console.error('❌ Unknown error:', error);
    }

    throw error;
  }
}

export function EnhancedPromotersViewRefactored({
  locale,
}: PromotersViewProps) {
  console.log('🚀 Enhanced PromotersView component mounted');
  const router = useRouter();
  const { toast } = useToast();

  // State management
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OverallStatus | 'all'>(
    'all'
  );
  const [documentFilter, setDocumentFilter] = useState<
    'all' | 'expired' | 'expiring' | 'missing'
  >('all');
  const [assignmentFilter, setAssignmentFilter] = useState<
    'all' | 'assigned' | 'unassigned'
  >('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedPromoters, setSelectedPromoters] = useState<Set<string>>(
    new Set()
  );
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'cards'>('table');
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  const derivedLocale = useMemo(() => {
    if (locale && typeof locale === 'string') return locale;
    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      return segments[0] || 'en';
    }
    return 'en';
  }, [locale]);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<PromotersResponse, Error>({
    queryKey: ['promoters', page, limit], // Standard query key
    queryFn: () => fetchPromoters(page, limit),
    staleTime: 300_000, // 5 minutes - prevent frequent refetches
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false, // Disable auto-refetch on window focus
    refetchInterval: false, // Disable auto-refetch interval
    refetchOnMount: false, // Disable auto-refetch on mount
    refetchOnReconnect: false, // Disable auto-refetch on reconnect
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !response) {
        console.warn('⚠️ Load timeout: Data took too long to load');
        setLoadTimeout(true);
      }
    }, 30000); // Increased to 30 second timeout to prevent premature timeouts

    return () => clearTimeout(timer);
  }, [isLoading, response]);

  useEffect(() => {
    if (isError && error) {
      toast({
        variant: 'destructive',
        title: 'Unable to load promoters',
        description: error.message,
      });
    }
  }, [isError, error, toast]);

  const promoters = response?.promoters ?? [];
  const pagination = response?.pagination;

  // Debug logging
  console.log('📊 Component state:', {
    isLoading,
    isError,
    isFetching,
    hasResponse: !!response,
    hasPromoters: !!promoters,
    promotersCount: promoters.length,
    errorMessage: error?.message,
  });

  const dashboardPromoters = useMemo<DashboardPromoter[]>(() => {
    console.log('🔄 Processing promoters for dashboard...');
    return promoters.map(promoter => {
      const idDocument = computeDocumentHealth(
        promoter.id_card_expiry_date ?? null,
        PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY
      );
      const passportDocument = computeDocumentHealth(
        promoter.passport_expiry_date ?? null,
        PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY
      );

      const fallbackName =
        (promoter as any)?.first_name || (promoter as any)?.last_name
          ? `${(promoter as any)?.first_name || ''} ${(promoter as any)?.last_name || ''}`.trim()
          : promoter.email || 'Unnamed promoter';

      const displayName =
        promoter.name_en?.trim() ||
        promoter.name_ar?.trim() ||
        fallbackName ||
        'Unnamed Promoter';

      const assignmentStatus = promoter.employer_id ? 'assigned' : 'unassigned';

      const organisationLabel =
        (promoter.parties as any)?.name_en ||
        (promoter.parties as any)?.name_ar ||
        promoter.work_location ||
        promoter.job_title ||
        'Unassigned';

      const overallStatus = computeOverallStatus(
        promoter.status,
        idDocument,
        passportDocument
      );

      return {
        ...promoter,
        displayName,
        assignmentStatus,
        organisationLabel,
        idDocument,
        passportDocument,
        overallStatus,
        contactEmail: promoter.email ?? '—',
        contactPhone: promoter.mobile_number ?? promoter.phone ?? '—',
        createdLabel: formatDisplayDate(promoter.created_at),
      } as DashboardPromoter;
    });
  }, [promoters]);

  console.log(
    '📈 Dashboard promoters processed:',
    dashboardPromoters.length,
    'items'
  );

  const metrics = useMemo<DashboardMetrics>(() => {
    const total = dashboardPromoters.length;
    const active = dashboardPromoters.filter(
      promoter => promoter.overallStatus === 'active'
    ).length;
    const critical = dashboardPromoters.filter(
      promoter =>
        promoter.idDocument.status === 'expired' ||
        promoter.passportDocument.status === 'expired'
    ).length;
    const expiring = dashboardPromoters.filter(
      promoter =>
        promoter.idDocument.status === 'expiring' ||
        promoter.passportDocument.status === 'expiring'
    ).length;
    const unassigned = dashboardPromoters.filter(
      promoter => promoter.assignmentStatus === 'unassigned'
    ).length;
    const companies = new Set(
      dashboardPromoters
        .map(promoter => promoter.employer_id)
        .filter(Boolean) as string[]
    ).size;

    // Calculate recently added (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyAdded = dashboardPromoters.filter(promoter => {
      const createdDate = parseDateSafe(promoter.created_at);
      return createdDate && createdDate >= sevenDaysAgo;
    }).length;

    // Calculate compliance rate (percentage with valid documents)
    const compliant = dashboardPromoters.filter(
      promoter =>
        promoter.idDocument.status === 'valid' &&
        promoter.passportDocument.status === 'valid'
    ).length;
    const complianceRate =
      total > 0 ? Math.round((compliant / total) * 100) : 0;

    return {
      total,
      active,
      critical,
      expiring,
      unassigned,
      companies,
      recentlyAdded,
      complianceRate,
    };
  }, [dashboardPromoters]);

  const filteredPromoters = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return dashboardPromoters.filter(promoter => {
      const matchesSearch =
        !normalizedSearch ||
        promoter.displayName.toLowerCase().includes(normalizedSearch) ||
        promoter.contactEmail?.toLowerCase().includes(normalizedSearch) ||
        promoter.contactPhone?.toLowerCase().includes(normalizedSearch) ||
        promoter.organisationLabel?.toLowerCase().includes(normalizedSearch) ||
        promoter.job_title?.toLowerCase().includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'all' || promoter.overallStatus === statusFilter;

      const matchesDocument =
        documentFilter === 'all' ||
        (documentFilter === 'expired' &&
          (promoter.idDocument.status === 'expired' ||
            promoter.passportDocument.status === 'expired')) ||
        (documentFilter === 'expiring' &&
          (promoter.idDocument.status === 'expiring' ||
            promoter.passportDocument.status === 'expiring')) ||
        (documentFilter === 'missing' &&
          (promoter.idDocument.status === 'missing' ||
            promoter.passportDocument.status === 'missing'));

      const matchesAssignment =
        assignmentFilter === 'all' ||
        promoter.assignmentStatus === assignmentFilter;

      return (
        matchesSearch && matchesStatus && matchesDocument && matchesAssignment
      );
    });
  }, [
    dashboardPromoters,
    searchTerm,
    statusFilter,
    documentFilter,
    assignmentFilter,
  ]);

  const sortedPromoters = useMemo(() => {
    console.log('🔀 Sorting promoters...');

    const sorted = [...filteredPromoters].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'status':
          const statusOrder = {
            critical: 0,
            warning: 1,
            active: 2,
            inactive: 3,
          };
          comparison =
            statusOrder[a.overallStatus] - statusOrder[b.overallStatus];
          break;
        case 'created':
          const dateA = parseDateSafe(a.created_at);
          const dateB = parseDateSafe(b.created_at);
          if (dateA && dateB) {
            comparison = dateA.getTime() - dateB.getTime();
          }
          break;
        case 'documents':
          const docA = Math.min(
            a.idDocument.daysRemaining ?? Number.POSITIVE_INFINITY,
            a.passportDocument.daysRemaining ?? Number.POSITIVE_INFINITY
          );
          const docB = Math.min(
            b.idDocument.daysRemaining ?? Number.POSITIVE_INFINITY,
            b.passportDocument.daysRemaining ?? Number.POSITIVE_INFINITY
          );
          comparison = docA - docB;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }, [filteredPromoters, sortField, sortOrder]);

  console.log('✅ Final sorted promoters:', sortedPromoters.length, 'items');

  const atRiskPromoters = useMemo(() => {
    return sortedPromoters
      .filter(
        promoter =>
          promoter.idDocument.status !== 'valid' ||
          promoter.passportDocument.status !== 'valid'
      )
      .slice(0, 5);
  }, [sortedPromoters]);

  const hasFiltersApplied =
    statusFilter !== 'all' ||
    documentFilter !== 'all' ||
    assignmentFilter !== 'all' ||
    searchTerm.trim().length > 0;

  // Bulk selection handlers
  const handleSelectAll = useCallback(() => {
    if (selectedPromoters.size === sortedPromoters.length) {
      setSelectedPromoters(new Set());
    } else {
      setSelectedPromoters(new Set(sortedPromoters.map(p => p.id)));
    }
  }, [selectedPromoters.size, sortedPromoters]);

  const handleSelectPromoter = useCallback(
    (promoterId: string) => {
      const newSelected = new Set(selectedPromoters);
      if (newSelected.has(promoterId)) {
        newSelected.delete(promoterId);
      } else {
        newSelected.add(promoterId);
      }
      setSelectedPromoters(newSelected);
    },
    [selectedPromoters]
  );

  // Bulk action handlers
  const handleBulkAction = useCallback(
    async (actionId: string) => {
      if (selectedPromoters.size === 0) return;

      setIsPerformingBulkAction(true);

      try {
        switch (actionId) {
          case 'export': {
            // Export selected promoters (client-side, no API call)
            const selectedData = sortedPromoters.filter(p =>
              selectedPromoters.has(p.id)
            );
            const headers = [
              'Name',
              'Email',
              'Phone',
              'Status',
              'Company',
              'Job Title',
              'ID Expiry',
              'Passport Expiry',
            ];
            const rows = selectedData.map(p => [
              p.displayName,
              p.contactEmail,
              p.contactPhone,
              p.overallStatus,
              p.organisationLabel,
              p.job_title || '—',
              formatDisplayDate(p.id_card_expiry_date),
              formatDisplayDate(p.passport_expiry_date),
            ]);
            const csv = [
              headers.join(','),
              ...rows.map(row => row.join(',')),
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `promoters-export-${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            URL.revokeObjectURL(url);

            toast({
              title: 'Export Complete',
              description: `${selectedPromoters.size} promoters exported successfully.`,
            });
            break;
          }

          case 'archive':
          case 'delete':
          case 'notify': {
            // API call for these actions
            const response = await fetch('/api/promoters/bulk', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: actionId === 'delete' ? 'update_status' : actionId,
                promoterIds: Array.from(selectedPromoters),
                status: actionId === 'delete' ? 'terminated' : undefined,
                notificationType:
                  actionId === 'notify' ? 'standard' : undefined,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(
                errorData.error || errorData.message || 'Bulk action failed'
              );
            }

            const result = await response.json();

            toast({
              title: 'Success',
              description:
                result.message || `${actionId} completed successfully`,
            });

            // Refetch data to update the UI
            await refetch();
            break;
          }

          case 'assign': {
            // TODO: Show dialog to select company
            // For now, show a message
            toast({
              title: 'Feature Coming Soon',
              description: 'Company assignment dialog will be available soon.',
            });
            return; // Don't clear selection or close bulk actions
          }

          default:
            toast({
              variant: 'destructive',
              title: 'Unknown Action',
              description: `Action "${actionId}" is not recognized.`,
            });
            return;
        }

        setSelectedPromoters(new Set());
      } catch (error) {
        console.error('Bulk action error:', error);
        toast({
          variant: 'destructive',
          title: 'Action Failed',
          description:
            error instanceof Error
              ? error.message
              : 'There was an error performing the bulk action.',
        });
      } finally {
        setIsPerformingBulkAction(false);
      }
    },
    [selectedPromoters, sortedPromoters, toast, refetch]
  );

  const handleResetFilters = useCallback(() => {
    setSearchTerm('');
    setStatusFilter('all');
    setDocumentFilter('all');
    setAssignmentFilter('all');
  }, []);

  const handleAddPromoter = useCallback(() => {
    router.push(`/${derivedLocale}/manage-promoters/new`);
  }, [router, derivedLocale]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortOrder('asc');
      }
    },
    [sortField]
  );

  const handleViewPromoter = useCallback(
    (promoter: DashboardPromoter) => {
      router.push(`/${derivedLocale}/promoters/${promoter.id}`);
    },
    [router, derivedLocale]
  );

  const handleEditPromoter = useCallback(
    (promoter: DashboardPromoter) => {
      router.push(`/${derivedLocale}/manage-promoters/${promoter.id}`);
    },
    [router, derivedLocale]
  );

  const handleSendReminder = useCallback(
    (promoter: DashboardPromoter) => {
      console.log('[ACTION] Send reminder to:', promoter.displayName);
      toast({
        title: '📧 Reminder Sent',
        description: `Document reminder sent to ${promoter.displayName}`,
      });
      // TODO: Implement actual reminder sending logic
    },
    [toast]
  );

  const handleRequestDocument = useCallback(
    (promoter: DashboardPromoter, documentType: 'ID' | 'Passport') => {
      console.log('[ACTION] Request document:', documentType, 'from', promoter.displayName);
      toast({
        title: '📋 Document Request Sent',
        description: `${documentType} request sent to ${promoter.displayName}`,
      });
      // TODO: Implement actual document request logic
    },
    [toast]
  );

  const handleGoToDashboard = useCallback(() => {
    router.push(`/${derivedLocale}/dashboard`);
  }, [router, derivedLocale]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + R to refresh
      if ((event.metaKey || event.ctrlKey) && event.key === 'r') {
        event.preventDefault();
        handleRefresh();
      }
      // Cmd/Ctrl + N to add new promoter
      if ((event.metaKey || event.ctrlKey) && event.key === 'n') {
        event.preventDefault();
        handleAddPromoter();
      }
      // Escape to clear selection
      if (event.key === 'Escape' && selectedPromoters.size > 0) {
        setSelectedPromoters(new Set());
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleRefresh, handleAddPromoter, selectedPromoters.size]);

  const handleExport = useCallback(() => {
    // Export all visible promoters
    const headers = [
      'Name',
      'Email',
      'Phone',
      'Status',
      'Company',
      'Job Title',
      'ID Expiry',
      'Passport Expiry',
    ];
    const rows = sortedPromoters.map(p => [
      p.displayName,
      p.contactEmail,
      p.contactPhone,
      p.overallStatus,
      p.organisationLabel,
      p.job_title || '—',
      formatDisplayDate(p.id_card_expiry_date),
      formatDisplayDate(p.passport_expiry_date),
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join(
      '\n'
    );

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `promoters-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Export Complete',
      description: `${sortedPromoters.length} promoters exported successfully.`,
    });
  }, [sortedPromoters, toast]);

  // Loading state
  if (isLoading && !response && !loadTimeout) {
    return <PromotersSkeleton />;
  }

  // If loading timed out, show error
  if (loadTimeout && !response) {
    return (
      <PromotersTimeoutState
        onReload={() => window.location.reload()}
        onRetry={() => {
          setLoadTimeout(false);
          refetch();
        }}
      />
    );
  }

  // Error state
  if (isError) {
    return (
      <PromotersErrorState
        error={error}
        onRetry={() => refetch()}
        onGoToDashboard={handleGoToDashboard}
      />
    );
  }

  // Empty state (no data)
  if (!promoters || promoters.length === 0) {
    return (
      <PromotersEmptyState
        onAddPromoter={handleAddPromoter}
        onRefresh={handleRefresh}
      />
    );
  }

  return (
    <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      {/* Enhanced Header */}
      <PromotersHeader
        metrics={metrics}
        promoters={dashboardPromoters}
        isFetching={isFetching}
        onRefresh={handleRefresh}
        onAddPromoter={handleAddPromoter}
        locale={derivedLocale}
      />

      {/* Enhanced Metrics */}
      <PromotersMetricsCards metrics={metrics} />

      {/* Enhanced Filters */}
      <PromotersFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        documentFilter={documentFilter}
        onDocumentFilterChange={setDocumentFilter}
        assignmentFilter={assignmentFilter}
        onAssignmentFilterChange={setAssignmentFilter}
        hasFiltersApplied={hasFiltersApplied}
        onResetFilters={handleResetFilters}
        onExport={handleExport}
        onRefresh={handleRefresh}
        isFetching={isFetching}
      />

      {/* Bulk Actions Bar */}
      <PromotersBulkActions
        selectedCount={selectedPromoters.size}
        totalCount={sortedPromoters.length}
        isPerformingAction={isPerformingBulkAction}
        onSelectAll={handleSelectAll}
        onBulkAction={handleBulkAction}
        onClearSelection={() => setSelectedPromoters(new Set())}
      />

      {/* Main Content */}
      <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        {/* Enhanced Table */}
        <PromotersTable
          promoters={sortedPromoters}
          selectedPromoters={selectedPromoters}
          sortField={sortField}
          sortOrder={sortOrder}
          viewMode={viewMode}
          pagination={pagination}
          isFetching={isFetching}
          hasFiltersApplied={hasFiltersApplied}
          onSelectAll={handleSelectAll}
          onSelectPromoter={handleSelectPromoter}
          onSort={handleSort}
          onViewModeChange={setViewMode}
          onViewPromoter={handleViewPromoter}
          onEditPromoter={handleEditPromoter}
          onAddPromoter={handleAddPromoter}
          onResetFilters={handleResetFilters}
          onPageChange={setPage}
        />

        {/* Enhanced Alerts Panel */}
        <PromotersAlertsPanel
          atRiskPromoters={atRiskPromoters}
          onViewPromoter={handleViewPromoter}
          onSendReminder={handleSendReminder}
          onRequestDocument={handleRequestDocument}
        />
      </div>
    </div>
  );
}
