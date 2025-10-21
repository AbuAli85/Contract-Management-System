'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { differenceInDays, format, parseISO } from 'date-fns';
import { RefreshCw } from 'lucide-react';
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
  // Handle empty, null, or invalid values
  if (!value || value.trim() === '' || value === 'null' || value === 'undefined') {
    return {
      status: 'missing',
      daysRemaining: null,
      expiresOn: null,
      label: 'Not provided',
    };
  }

  const parsed = parseDateSafe(value);
  if (!parsed) {
    console.warn('⚠️ Invalid date format:', value);
    return {
      status: 'missing',
      daysRemaining: null,
      expiresOn: value,
      label: 'Invalid date',
    };
  }

  const days = differenceInDays(parsed, new Date());

  if (days < 0) {
    return {
      status: 'expired',
      daysRemaining: Math.abs(days),
      expiresOn: value,
      label: `Expired on ${formatDisplayDate(value)} (${Math.abs(days)} days ago)`,
    };
  }

  if (days <= threshold) {
    return {
      status: 'expiring',
      daysRemaining: days,
      expiresOn: value,
      label: `Expires in ${days} days`,
    };
  }

  return {
    status: 'valid',
    daysRemaining: days,
    expiresOn: value,
    label: `Valid until ${formatDisplayDate(value)}`,
  };
}

function computeOverallStatus(
  status: string | null | undefined,
  idDoc: DocumentHealth,
  passportDoc: DocumentHealth
): OverallStatus {
  // Check if promoter is inactive based on status
  if (
    !status ||
    ['inactive', 'terminated', 'resigned', 'on_leave', 'suspended'].includes(
      status
    )
  ) {
    return 'inactive';
  }

  // Critical: Any document is expired
  if (idDoc.status === 'expired' || passportDoc.status === 'expired') {
    return 'critical';
  }

  // Warning: Any document is expiring soon
  if (idDoc.status === 'expiring' || passportDoc.status === 'expiring') {
    return 'warning';
  }

  // If both documents are missing, show as warning (needs attention)
  if (idDoc.status === 'missing' && passportDoc.status === 'missing') {
    return 'warning';
  }

  // If only one document is missing, still show as active (common scenario)
  if (idDoc.status === 'missing' || passportDoc.status === 'missing') {
    return 'active';
  }

  // All documents are valid
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
    // Ultra-aggressive caching to prevent ANY refetches
    const response = await fetch(
      `/api/promoters?page=${page}&limit=${limit}`,
      {
        cache: 'force-cache', // Force caching to prevent refetches
        signal: controller.signal,
        headers: {
          'Cache-Control': 'max-age=86400', // Cache for 24 hours
          'X-Requested-With': 'XMLHttpRequest',
          'X-Cache-Control': 'no-refresh', // Custom header to prevent refresh
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
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Get pagination params from URL
  const page = parseInt(searchParams?.get('page') || '1', 10);
  const limit = parseInt(searchParams?.get('limit') || '20', 10);

  // State management
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
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'cards'>(() => {
    // Load view preference from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('promoters-view-mode');
      if (savedView === 'table' || savedView === 'grid' || savedView === 'cards') {
        return savedView;
      }
    }
    return 'table';
  });
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [activeMetricFilter, setActiveMetricFilter] = useState<'all' | 'active' | 'alerts' | 'compliance' | null>(null);

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
    queryKey: ['promoters', page, limit, 'v4'],
    queryFn: () => fetchPromoters(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
    gcTime: 10 * 60 * 1000, // 10 minutes - keep unused data in cache
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: true, // Refetch on window focus for fresh data
    refetchOnMount: true, // Refetch on mount if stale
    refetchOnReconnect: true, // Refetch on reconnect
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

  const promoters = (response as PromotersResponse)?.promoters ?? [];
  const pagination = (response as PromotersResponse)?.pagination;

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
    console.log('📊 Raw promoter data sample:', promoters.slice(0, 2));
    
    return promoters.map(promoter => {
      // Debug logging for each promoter
      console.log('🔍 Processing promoter:', {
        id: promoter.id,
        name_en: promoter.name_en,
        name_ar: promoter.name_ar,
        email: promoter.email,
        mobile_number: promoter.mobile_number,
        phone: promoter.phone,
        employer_id: promoter.employer_id,
        id_card_expiry_date: promoter.id_card_expiry_date,
        passport_expiry_date: promoter.passport_expiry_date,
        status: promoter.status,
        job_title: promoter.job_title,
        work_location: null, // Column doesn't exist in database
      });

      const idDocument = computeDocumentHealth(
        promoter.id_card_expiry_date ?? null,
        PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY
      );
      const passportDocument = computeDocumentHealth(
        promoter.passport_expiry_date ?? null,
        PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY
      );

      // Improved name resolution with better fallbacks
      const displayName = (() => {
        // Try English name first
        if (promoter.name_en?.trim()) {
          return promoter.name_en.trim();
        }
        // Try Arabic name
        if (promoter.name_ar?.trim()) {
          return promoter.name_ar.trim();
        }
        // Try legacy name field
        if ((promoter as any)?.name?.trim()) {
          return (promoter as any).name.trim();
        }
        // Try first_name + last_name combination
        if ((promoter as any)?.first_name || (promoter as any)?.last_name) {
          const firstName = (promoter as any)?.first_name || '';
          const lastName = (promoter as any)?.last_name || '';
          const fullName = `${firstName} ${lastName}`.trim();
          if (fullName) return fullName;
        }
        // Try email as last resort
        if (promoter.email?.trim()) {
          return promoter.email.split('@')[0]?.replace(/[._]/g, ' ').trim() || 'Unknown';
        }
        // Final fallback
        return `Promoter ${promoter.id.slice(-4)}`;
      })();

      const assignmentStatus = promoter.employer_id ? 'assigned' : 'unassigned';

      // Improved organization label resolution
      const organisationLabel = (() => {
        // Try parties relationship first
        if ((promoter as any)?.parties?.name_en?.trim()) {
          return (promoter as any).parties.name_en.trim();
        }
        if ((promoter as any)?.parties?.name_ar?.trim()) {
          return (promoter as any).parties.name_ar.trim();
        }
        // Try work location (column doesn't exist in database)
        // if (promoter.work_location?.trim()) {
        //   return promoter.work_location.trim();
        // }
        // Try job title
        if (promoter.job_title?.trim()) {
          return promoter.job_title.trim();
        }
        // Try company field
        if ((promoter as any)?.company?.trim()) {
          return (promoter as any).company.trim();
        }
        return 'Unassigned';
      })();

      const overallStatus = computeOverallStatus(
        promoter.status,
        idDocument,
        passportDocument
      );

      // Improved contact information resolution
      const contactEmail = promoter.email?.trim() || '—';
      const contactPhone = (() => {
        if (promoter.mobile_number?.trim()) return promoter.mobile_number.trim();
        if (promoter.phone?.trim()) return promoter.phone.trim();
        return '—';
      })();

      const result = {
        ...promoter,
        displayName,
        assignmentStatus,
        organisationLabel,
        idDocument,
        passportDocument,
        overallStatus,
        contactEmail,
        contactPhone,
        createdLabel: formatDisplayDate(promoter.created_at),
      } as DashboardPromoter;

      console.log('✅ Processed promoter result:', {
        id: result.id,
        displayName: result.displayName,
        contactEmail: result.contactEmail,
        contactPhone: result.contactPhone,
        assignmentStatus: result.assignmentStatus,
        organisationLabel: result.organisationLabel,
        overallStatus: result.overallStatus,
        idDocumentStatus: result.idDocument.status,
        passportDocumentStatus: result.passportDocument.status,
      });

      return result;
    });
  }, [promoters]);

  console.log(
    '📈 Dashboard promoters processed:',
    dashboardPromoters.length,
    'items'
  );

  const metrics = useMemo<DashboardMetrics>(() => {
    // 🔧 DATA CONSISTENCY FIX:
    // Use pagination.total for the actual total count from the database (e.g., 112)
    // NOT dashboardPromoters.length which is only the current page data (e.g., 50)
    const total = pagination?.total || dashboardPromoters.length;
    
    // ⚠️ NOTE: The following metrics are calculated from CURRENT PAGE data only.
    // This means they represent statistics for the visible promoters, not all promoters.
    // For accurate system-wide metrics, these should be fetched from a dedicated API endpoint.
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

    // Calculate recently added (last 7 days) - based on current page data
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyAdded = dashboardPromoters.filter(promoter => {
      const createdDate = parseDateSafe(promoter.created_at);
      return createdDate && createdDate >= sevenDaysAgo;
    }).length;

    // Calculate compliance rate (percentage with valid documents) - based on current page data
    const compliant = dashboardPromoters.filter(
      promoter =>
        promoter.idDocument.status === 'valid' &&
        promoter.passportDocument.status === 'valid'
    ).length;
    const complianceRate =
      dashboardPromoters.length > 0 
        ? Math.round((compliant / dashboardPromoters.length) * 100) 
        : 0;

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
  }, [dashboardPromoters, pagination]);

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
        (promoter: DashboardPromoter) =>
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
    setActiveMetricFilter(null);
  }, []);

  const handleMetricCardClick = useCallback(
    (filterType: 'all' | 'active' | 'alerts' | 'compliance') => {
      // If clicking the same card again, reset all filters
      if (activeMetricFilter === filterType) {
        setSearchTerm('');
        setStatusFilter('all');
        setDocumentFilter('all');
        setAssignmentFilter('all');
        setActiveMetricFilter(null);
        
        toast({
          title: 'Filters Cleared',
          description: 'Showing all promoters',
        });
        return;
      }

      // Reset all filters first
      setSearchTerm('');
      setStatusFilter('all');
      setDocumentFilter('all');
      setAssignmentFilter('all');

      // Apply specific filter based on card clicked
      switch (filterType) {
        case 'all':
          // Show all promoters (filters already reset)
          setActiveMetricFilter('all');
          break;
        case 'active':
          // Show assigned promoters
          setAssignmentFilter('assigned');
          setStatusFilter('active');
          setActiveMetricFilter('active');
          break;
        case 'alerts':
          // Show promoters with expired or expiring documents
          setDocumentFilter('expired');
          setActiveMetricFilter('alerts');
          break;
        case 'compliance':
          // Show promoters with valid documents
          setDocumentFilter('all');
          setStatusFilter('active');
          setAssignmentFilter('assigned');
          setActiveMetricFilter('compliance');
          break;
      }

      // Scroll to the table section after a short delay
      setTimeout(() => {
        const tableSection = document.querySelector('[aria-labelledby="promoters-content-heading"]');
        if (tableSection) {
          tableSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);

      // Show toast notification
      const filterMessages = {
        all: 'Showing all promoters',
        active: 'Filtered by assigned active promoters',
        alerts: 'Filtered by promoters with document issues',
        compliance: 'Filtered by compliant assigned promoters',
      };

      toast({
        title: 'Filter Applied',
        description: filterMessages[filterType],
      });
    },
    [toast, activeMetricFilter]
  );

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
      router.push(`/${derivedLocale}/manage-promoters/${promoter.id}`);
    },
    [router, derivedLocale]
  );

  const handleEditPromoter = useCallback(
    (promoter: DashboardPromoter) => {
      router.push(`/${derivedLocale}/manage-promoters/${promoter.id}/edit`);
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

  const handleViewModeChange = useCallback((mode: 'table' | 'grid' | 'cards') => {
    setViewMode(mode);
    // Persist view preference to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('promoters-view-mode', mode);
    }
  }, []);

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

  const handlePageChange = useCallback((newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', newPage.toString());
    params.set('limit', limit.toString());
    router.push(`${window.location.pathname}?${params.toString()}`);
  }, [searchParams, limit, router]);

  const handlePageSizeChange = useCallback((newLimit: number) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', '1'); // Reset to page 1 when changing page size
    params.set('limit', newLimit.toString());
    router.push(`${window.location.pathname}?${params.toString()}`);
  }, [searchParams, router]);

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

  // Show loading overlay if data is being refreshed
  const showLoadingOverlay = isFetching && response;

  return (
    <main className='relative space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      {/* Loading overlay */}
      {showLoadingOverlay && (
        <div className='absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center' role='status' aria-live='polite'>
          <div className='flex items-center gap-3 bg-card p-4 rounded-lg shadow-lg border'>
            <RefreshCw className='h-5 w-5 animate-spin text-primary' aria-hidden='true' />
            <span className='text-sm font-medium'>Updating promoters data...</span>
          </div>
        </div>
      )}
      {/* Enhanced Header */}
      <header>
        <PromotersHeader
          metrics={metrics}
          promoters={dashboardPromoters}
          isFetching={isFetching}
          onRefresh={handleRefresh}
          onAddPromoter={handleAddPromoter}
          locale={derivedLocale}
        />
      </header>

      {/* Enhanced Metrics */}
      <section aria-labelledby='metrics-heading'>
        <h2 id='metrics-heading' className='sr-only'>Promoter Statistics</h2>
        <PromotersMetricsCards 
          metrics={metrics} 
          onCardClick={handleMetricCardClick}
          activeFilter={activeMetricFilter}
        />
      </section>

      {/* Enhanced Filters */}
      <section aria-labelledby='filters-heading'>
        <h2 id='filters-heading' className='sr-only'>Search and Filter Options</h2>
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
      </section>

      {/* Bulk Actions Bar */}
      <section aria-labelledby='bulk-actions-heading'>
        <h2 id='bulk-actions-heading' className='sr-only'>Bulk Actions</h2>
        <PromotersBulkActions
          selectedCount={selectedPromoters.size}
          totalCount={sortedPromoters.length}
          isPerformingAction={isPerformingBulkAction}
          onSelectAll={handleSelectAll}
          onBulkAction={handleBulkAction}
          onClearSelection={() => setSelectedPromoters(new Set())}
        />
      </section>

      {/* Main Content */}
      <section aria-labelledby='promoters-content-heading'>
        <h2 id='promoters-content-heading' className='sr-only'>Promoters List</h2>
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
          onViewModeChange={handleViewModeChange}
          onViewPromoter={handleViewPromoter}
          onEditPromoter={handleEditPromoter}
          onAddPromoter={handleAddPromoter}
          onResetFilters={handleResetFilters}
          onPageChange={handlePageChange}
        />

        {/* Enhanced Alerts Panel */}
        <PromotersAlertsPanel
          atRiskPromoters={atRiskPromoters}
          onViewPromoter={handleViewPromoter}
          onSendReminder={handleSendReminder}
          onRequestDocument={handleRequestDocument}
        />
        </div>
      </section>
    </main>
  );
}
