'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { differenceInDays, format, parseISO } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { toTitleCase } from '@/lib/utils/text-formatting';
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
import { MetricsCardsSkeleton } from './metric-card-skeleton';
import { RefreshIndicator } from './promoters-refresh-indicator';
import { PromotersStatsCharts } from './promoters-stats-charts';
import { PromotersDocumentExpiryChart } from './promoters-document-expiry-chart';
import { PromotersAnalyticsCharts } from './promoters-analytics-charts';

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
  limit = 50,
  filters?: {
    search?: string;
    status?: string;
    documents?: string;
    assignment?: string;
    sortField?: string;
    sortOrder?: string;
  }
): Promise<PromotersResponse> {
  console.log(
    `🔄 Fetching promoters from API (page ${page}, limit ${limit}, filters:`, filters, ')...'
  );

  // Set up abort controller for timeout
  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;
  
  try {
    // Build URL with filter parameters for server-side filtering
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (filters?.search) params.set('search', filters.search);
    if (filters?.status && filters.status !== 'all') params.set('status', filters.status);
    if (filters?.documents && filters.documents !== 'all') params.set('documents', filters.documents);
    if (filters?.assignment && filters.assignment !== 'all') params.set('assignment', filters.assignment);
    if (filters?.sortField) params.set('sortField', filters.sortField);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    console.log('📞 Making API request with server-side filtering:', params.toString());
    
    const response = await fetch(
      `/api/promoters?${params.toString()}`,
      {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }
    );

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

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
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

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
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'cards' | 'analytics'>(() => {
    // Load view preference from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('promoters-view-mode');
      if (savedView === 'table' || savedView === 'grid' || savedView === 'cards' || savedView === 'analytics') {
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

  // Create filters object for server-side filtering
  const filters = useMemo(() => {
    const result: {
      search?: string;
      status?: string;
      documents?: string;
      assignment?: string;
      sortField?: string;
      sortOrder?: string;
    } = {};

    if (searchTerm) result.search = searchTerm;
    if (statusFilter !== 'all') result.status = statusFilter;
    if (documentFilter !== 'all') result.documents = documentFilter;
    if (assignmentFilter !== 'all') result.assignment = assignmentFilter;
    if (sortField) result.sortField = sortField;
    if (sortOrder) result.sortOrder = sortOrder;

    return result;
  }, [searchTerm, statusFilter, documentFilter, assignmentFilter, sortField, sortOrder]);

  const {
    data: response,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<PromotersResponse, Error>({
    queryKey: ['promoters', page, limit, filters, 'v5-server-filtered'],
    queryFn: () => fetchPromoters(page, limit, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes - shorter cache for filtered results
    gcTime: 5 * 60 * 1000, // 5 minutes - keep unused data in cache
    retry: 2, // Retry failed requests twice
    refetchOnWindowFocus: false, // Disable to prevent too many refetches with filters
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

      // Improved name resolution with better fallbacks and Title Case formatting
      const displayName = (() => {
        let rawName = '';
        
        // Try English name first
        if (promoter.name_en?.trim()) {
          rawName = promoter.name_en.trim();
        }
        // Try Arabic name
        else if (promoter.name_ar?.trim()) {
          rawName = promoter.name_ar.trim();
        }
        // Try legacy name field
        else if ((promoter as any)?.name?.trim()) {
          rawName = (promoter as any).name.trim();
        }
        // Try first_name + last_name combination
        else if ((promoter as any)?.first_name || (promoter as any)?.last_name) {
          const firstName = (promoter as any)?.first_name || '';
          const lastName = (promoter as any)?.last_name || '';
          rawName = `${firstName} ${lastName}`.trim();
        }
        // Try email as last resort
        else if (promoter.email?.trim()) {
          rawName = promoter.email.split('@')[0]?.replace(/[._]/g, ' ').trim() || 'Unknown';
        }
        // Final fallback
        else {
          rawName = `Promoter ${promoter.id.slice(-4)}`;
        }
        
        // Apply Title Case formatting to all names
        return toTitleCase(rawName) || rawName;
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

  // 🎯 FIX for Issue #3: Fetch system-wide metrics from dedicated API
  const { data: apiMetricsData } = useQuery({
    queryKey: ['promoter-metrics'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/promoter-metrics');
      if (!res.ok) throw new Error('Failed to fetch metrics');
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const metrics = useMemo<DashboardMetrics>(() => {
    // Always calculate client-side metrics since API doesn't return all required fields
    const total = pagination?.total || dashboardPromoters.length;
    const active = dashboardPromoters.filter(p => p.overallStatus === 'active').length;
    const critical = dashboardPromoters.filter(p =>
      p.idDocument.status === 'expired' || p.passportDocument.status === 'expired'
    ).length;
    const expiring = dashboardPromoters.filter(p =>
      p.idDocument.status === 'expiring' || p.passportDocument.status === 'expiring'
    ).length;
    const unassigned = dashboardPromoters.filter(p => p.assignmentStatus === 'unassigned').length;
    const companies = new Set(dashboardPromoters.map(p => p.employer_id).filter(Boolean) as string[]).size;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyAdded = dashboardPromoters.filter(p => {
      const createdDate = parseDateSafe(p.created_at);
      return createdDate && createdDate >= sevenDaysAgo;
    }).length;
    const compliant = dashboardPromoters.filter(p =>
      p.idDocument.status === 'valid' && p.passportDocument.status === 'valid'
    ).length;
    const complianceRate = dashboardPromoters.length > 0 
      ? Math.round((compliant / dashboardPromoters.length) * 100) 
      : 0;

    // If API metrics are available, use them for total count (more accurate)
    const finalTotal = apiMetricsData?.metrics?.total || total;

    return { 
      total: finalTotal, 
      active, 
      critical, 
      expiring, 
      unassigned, 
      companies, 
      recentlyAdded, 
      complianceRate 
    };
  }, [dashboardPromoters, pagination, apiMetricsData]);

  // ✅ PERFORMANCE: Server-side filtering implemented
  // No need for client-side filtering as the API handles all filtering
  const filteredPromoters = useMemo(() => {
    console.log('✅ Using server-filtered promoters directly (no client-side filtering needed)');
    return dashboardPromoters;
  }, [dashboardPromoters]);

  // ✅ PERFORMANCE: Server-side sorting implemented
  // No need for client-side sorting as the API handles sorting
  const sortedPromoters = useMemo(() => {
    console.log('✅ Using server-sorted promoters directly (no client-side sorting needed)');
    return filteredPromoters;
  }, [filteredPromoters]);

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
            // Show dialog to select company
            const companies = await fetch('/api/parties?type=company').then(res => res.json());
            
            if (!companies.success || !companies.parties?.length) {
              toast({
                title: 'No Companies Available',
                description: 'No companies found to assign promoters to.',
                variant: 'destructive'
              });
              return;
            }

            // For now, auto-assign to first available company (in production, show dialog)
            const firstCompany = companies.parties[0];
            
            const response = await fetch('/api/promoters/bulk', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'assign',
                promoterIds: Array.from(selectedPromoters),
                companyId: firstCompany.id,
              }),
            });

            if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(
                errorData.error || errorData.message || 'Assignment failed'
              );
            }

            const result = await response.json();

            toast({
              title: 'Success',
              description: `Assigned ${selectedPromoters.size} promoters to ${firstCompany.name_en}`,
            });

            // Refetch data to update the UI
            await refetch();
            break;
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

  const handleViewModeChange = useCallback((mode: 'table' | 'grid' | 'cards' | 'analytics') => {
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
        {isLoading ? (
          <MetricsCardsSkeleton />
        ) : (
          <PromotersMetricsCards 
            metrics={metrics} 
            onCardClick={handleMetricCardClick}
            activeFilter={activeMetricFilter}
          />
        )}
      </section>

      {/* Data Insights & Charts */}
      {!isLoading && dashboardPromoters.length > 0 && (
        <section aria-labelledby='insights-heading' className='mt-6'>
          <h2 id='insights-heading' className='sr-only'>Data Insights and Analytics</h2>
          <PromotersStatsCharts 
            metrics={metrics} 
            promoters={dashboardPromoters}
          />
        </section>
      )}
      
      {/* Refresh Indicator */}
      <RefreshIndicator isFetching={isFetching && !isLoading} showFloating={true} />

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
        <h2 id='promoters-content-heading' className='sr-only'>
          {viewMode === 'analytics' ? 'Promoters Analytics' : 'Promoters List'}
        </h2>
        
        {viewMode === 'analytics' ? (
          /* Analytics View */
          <div className='space-y-6'>
            <PromotersDocumentExpiryChart 
              promoters={dashboardPromoters}
              title="Document Expiry Timeline"
              description="Monitor document expiration patterns and upcoming renewals"
            />
            <PromotersAnalyticsCharts 
              promoters={dashboardPromoters}
            />
          </div>
        ) : (
          /* Table/Grid/Cards View */
          <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
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

            {/* Enhanced Alerts Panel - Only show in non-analytics view */}
            <PromotersAlertsPanel
              atRiskPromoters={atRiskPromoters}
              onViewPromoter={handleViewPromoter}
              onSendReminder={handleSendReminder}
              onRequestDocument={handleRequestDocument}
            />
          </div>
        )}
      </section>
    </main>
  );
}
