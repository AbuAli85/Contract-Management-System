'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { differenceInDays, format, parseISO } from 'date-fns';
import { AlertTriangle, RefreshCw, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { toTitleCase } from '@/lib/utils/text-formatting';
import type { Promoter } from '@/lib/types';
import { PROMOTER_NOTIFICATION_DAYS } from '@/constants/notification-days';
import { updatePromoter as updatePromoterAction } from '@/app/actions/promoters-improved';
import { logger } from '@/lib/utils/logger';
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
import { PromotersNoResultsState } from './promoters-no-results-state';
import { PromotersTimeoutState } from './promoters-timeout-state';
import { MetricsCardsSkeleton } from './metric-card-skeleton';
import { RefreshIndicator } from './promoters-refresh-indicator';
import { PromotersStatsCharts } from './promoters-stats-charts';
import { PromotersDocumentExpiryChart } from './promoters-document-expiry-chart';
import { PromotersAnalyticsCharts } from './promoters-analytics-charts';
import { WorkforceAnalyticsSummary } from './workforce-analytics-summary';
import { AnalyticsLoadingSkeleton } from './analytics-loading-skeleton';
import { AnalyticsToolbar } from './analytics-toolbar';
import { AnalyticsInsightsPanel } from './analytics-insights-panel';
import { Button } from '../ui/button';

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
  if (
    !value ||
    value.trim() === '' ||
    value === 'null' ||
    value === 'undefined'
  ) {
    return {
      status: 'missing',
      daysRemaining: null,
      expiresOn: null,
      label: 'Not provided',
    };
  }

  const parsed = parseDateSafe(value);
  if (!parsed) {
    logger.warn('⚠️ Invalid date format:', value);
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

// Function to fetch ALL promoters for analytics (with proper pagination)
async function fetchAllPromotersForAnalytics(): Promise<PromotersResponse> {
  logger.log(
    '🔄 Fetching ALL promoters for analytics dashboard with pagination...'
  );

  const controller = new AbortController();
  let timeoutId: NodeJS.Timeout | null = null;

  try {
    const allPromoters: any[] = [];
    let page = 1;
    const limit = 100; // Use API's maximum allowed limit
    let totalPages = 1;
    let totalCount = 0;

    timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout for complete fetch

    // Fetch all pages of data
    do {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sortField: 'created_at',
        sortOrder: 'desc',
      });

      logger.log(`📞 Fetching page ${page}/${totalPages} for analytics...`);

      const response = await fetch(`/api/promoters?${params.toString()}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Analytics-Request': 'true',
        },
      });

      if (!response.ok) {
        throw new Error(
          `API returned ${response.status}: ${response.statusText}`
        );
      }

      const payload = await response.json();

      if (payload.success === false) {
        throw new Error(
          payload.error || 'Failed to load promoters for analytics.'
        );
      }

      if (!Array.isArray(payload.promoters)) {
        throw new Error('Invalid analytics data format');
      }

      // Add promoters from this page
      allPromoters.push(...payload.promoters);

      // Update pagination info from first response
      if (page === 1) {
        totalCount = payload.total || payload.pagination?.total || 0;
        totalPages = Math.ceil(totalCount / limit);
        logger.log(
          `📊 Total workforce: ${totalCount} members across ${totalPages} pages`
        );
      }

      logger.log(
        `✅ Fetched page ${page}: ${payload.promoters.length} promoters (Total so far: ${allPromoters.length}/${totalCount})`
      );
      page++;
    } while (page <= totalPages && allPromoters.length < totalCount);

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Create final response with all promoters
    const finalResponse: PromotersResponse = {
      success: true,
      promoters: allPromoters,
      count: allPromoters.length,
      total: totalCount,
      pagination: {
        page: 1,
        limit: allPromoters.length,
        total: totalCount,
        totalPages: 1,
        hasNext: false,
        hasPrev: false,
      },
      timestamp: new Date().toISOString(),
    };

    logger.log(
      `🎉 Successfully fetched ALL ${allPromoters.length} promoters for analytics dashboard!`
    );
    return finalResponse;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error(
          'Analytics request timeout: Complete workforce fetch took too long'
        );
      }
    }
    throw error;
  }
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
    `🔄 Fetching promoters from API (page ${page}, limit ${limit}, filters:`,
    filters,
    ')...'
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
    if (filters?.status && filters.status !== 'all')
      params.set('status', filters.status);
    if (filters?.documents && filters.documents !== 'all')
      params.set('documents', filters.documents);
    if (filters?.assignment && filters.assignment !== 'all')
      params.set('assignment', filters.assignment);
    if (filters?.sortField) params.set('sortField', filters.sortField);
    if (filters?.sortOrder) params.set('sortOrder', filters.sortOrder);

    timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    logger.log(
      '📞 Making API request with server-side filtering:',
      params.toString()
    );

    const response = await fetch(`/api/promoters?${params.toString()}`, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    logger.log('📡 API Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      contentType: response.headers.get('content-type'),
    });

    if (!response.ok) {
      logger.error('❌ API request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url,
      });

      // Try to get error details from response
      let errorMessage = `API returned ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        logger.error('❌ Error details:', errorData);
        errorMessage = errorData.error || errorData.details || errorMessage;
      } catch (e) {
        logger.error('❌ Could not parse error response:', e);
      }

      throw new Error(errorMessage);
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      logger.error('❌ Invalid content type:', contentType);
      throw new Error('Server returned non-JSON response');
    }

    let payload;
    try {
      payload = await response.json();
    } catch (e) {
      logger.error('❌ Failed to parse JSON:', e);
      throw new Error('Invalid JSON response from server');
    }

    // Validate response structure
    if (!payload || typeof payload !== 'object') {
      logger.error('❌ Invalid payload type:', typeof payload);
      throw new Error('Invalid API response format');
    }

    logger.log('📦 API Payload received:', {
      success: payload.success,
      hasPromoters: !!payload.promoters,
      isArray: Array.isArray(payload.promoters),
      promotersCount: payload.promoters?.length || 0,
      total: payload.total || 0,
      hasPagination: !!payload.pagination,
    });

    if (payload.success === false) {
      logger.error('❌ API returned error:', payload.error);
      throw new Error(payload.error || 'Failed to load promoters.');
    }

    // Ensure promoters is an array
    if (!Array.isArray(payload.promoters)) {
      logger.error('❌ Promoters is not an array:', payload.promoters);
      throw new Error('Invalid promoters data format');
    }

    logger.log('✅ Successfully fetched promoters:', payload.promoters.length);
    return payload;
  } catch (error) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        logger.error('❌ Request timeout');
        throw new Error(
          'Request timeout: Server took too long to respond (30s)'
        );
      }
      logger.error('❌ Fetch error:', error.message);
    } else {
      logger.error('❌ Unknown error:', error);
    }

    throw error;
  }
}

export function EnhancedPromotersViewRefactored({
  locale,
}: PromotersViewProps) {
  logger.log('🚀 Enhanced PromotersView component mounted');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Helper function to safely get search params (not a hook)
  const getParamValue = useCallback(
    (key: string, defaultValue: string = ''): string => {
      try {
        if (!searchParams || typeof searchParams.get !== 'function') {
          return defaultValue;
        }
        const value = searchParams.get(key);
        return value !== null && value !== undefined ? value : defaultValue;
      } catch (error) {
        logger.error(`Error getting search param "${key}":`, error);
        return defaultValue;
      }
    },
    [searchParams]
  );

  // Memoized version for use in effects and callbacks (stable reference)
  const getParamSafely = getParamValue;

  // Get initial values from URL (computed once on mount)
  const initialValues = useMemo(() => {
    const getParam = (key: string, defaultValue: string = '') => {
      try {
        if (!searchParams || typeof searchParams.get !== 'function') {
          return defaultValue;
        }
        const value = searchParams.get(key);
        return value !== null && value !== undefined ? value : defaultValue;
      } catch {
        return defaultValue;
      }
    };

    const urlStatus = getParam('status', '');
    const urlDocFilter = getParam('document_filter', '') || getParam('documents', '');
    const urlAssignment = getParam('assignment_filter', '') || getParam('assignment', '');
    const urlSortField = getParam('sortField', '');
    const urlSortOrder = getParam('sortOrder', '');
    const urlView = getParam('view', '');

    // Determine view mode (check URL first, then localStorage)
    let viewMode: 'table' | 'grid' | 'cards' | 'analytics' = 'table';
    if (
      urlView === 'table' ||
      urlView === 'grid' ||
      urlView === 'cards' ||
      urlView === 'analytics'
    ) {
      viewMode = urlView;
    } else if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('promoters-view-mode');
      if (
        savedView === 'table' ||
        savedView === 'grid' ||
        savedView === 'cards' ||
        savedView === 'analytics'
      ) {
        viewMode = savedView;
      }
    }

    return {
      searchTerm: getParam('search', ''),
      statusFilter:
        urlStatus === 'critical' ||
        urlStatus === 'active' ||
        urlStatus === 'inactive' ||
        urlStatus === 'warning'
          ? (urlStatus as OverallStatus)
          : ('all' as const),
      documentFilter:
        urlDocFilter === 'expired' ||
        urlDocFilter === 'expiring' ||
        urlDocFilter === 'missing'
          ? (urlDocFilter as 'expired' | 'expiring' | 'missing')
          : ('all' as const),
      assignmentFilter:
        urlAssignment === 'assigned' || urlAssignment === 'unassigned'
          ? (urlAssignment as 'assigned' | 'unassigned')
          : ('all' as const),
      sortField:
        urlSortField === 'name' ||
        urlSortField === 'status' ||
        urlSortField === 'created' ||
        urlSortField === 'documents'
          ? (urlSortField as SortField)
          : ('name' as SortField),
      sortOrder:
        urlSortOrder === 'asc' || urlSortOrder === 'desc'
          ? (urlSortOrder as SortOrder)
          : ('asc' as SortOrder),
      viewMode,
    };
  }, [searchParams]);

  // Get pagination params from URL (memoized to prevent re-renders)
  const page = useMemo(
    () => parseInt(getParamValue('page', '1'), 10),
    [getParamValue]
  );
  const limit = useMemo(
    () => parseInt(getParamValue('limit', '20'), 10),
    [getParamValue]
  );

  // State management - Initialize from computed initial values
  const [searchTerm, setSearchTerm] = useState(initialValues.searchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OverallStatus | 'all'>(
    initialValues.statusFilter
  );
  const [documentFilter, setDocumentFilter] = useState<
    'all' | 'expired' | 'expiring' | 'missing'
  >(initialValues.documentFilter);
  const [assignmentFilter, setAssignmentFilter] = useState<
    'all' | 'assigned' | 'unassigned'
  >(initialValues.assignmentFilter);
  const [sortField, setSortField] = useState<SortField>(initialValues.sortField);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialValues.sortOrder);
  const [selectedPromoters, setSelectedPromoters] = useState<Set<string>>(
    new Set()
  );
  const [viewMode, setViewMode] = useState<
    'table' | 'grid' | 'cards' | 'analytics'
  >(initialValues.viewMode);
    if (
      urlView === 'table' ||
      urlView === 'grid' ||
      urlView === 'cards' ||
      urlView === 'analytics'
    ) {
      return urlView;
    }

    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const savedView = localStorage.getItem('promoters-view-mode');
      if (
        savedView === 'table' ||
        savedView === 'grid' ||
        savedView === 'cards' ||
        savedView === 'analytics'
      ) {
        return savedView;
      }
    }
    return 'table';
  });
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);
  const [activeMetricFilter, setActiveMetricFilter] = useState<
    'all' | 'active' | 'alerts' | 'compliance' | null
  >(null);

  // Separate state for analytics data (all workforce)
  const [allPromotersData, setAllPromotersData] =
    useState<PromotersResponse | null>(null);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  const derivedLocale = useMemo(() => {
    if (locale && typeof locale === 'string') return locale;
    if (typeof window !== 'undefined') {
      const segments = window.location.pathname.split('/').filter(Boolean);
      return segments[0] || 'en';
    }
    return 'en';
  }, [locale]);

  // Sync URL parameters with state when URL changes
  useEffect(() => {
    const urlStatus = getParamSafely('status', '');
    const urlDocFilter =
      getParamSafely('document_filter', '') || getParamSafely('documents', '');
    const urlAssignment =
      getParamSafely('assignment_filter', '') || getParamSafely('assignment', '');
    const urlView = getParamSafely('view', '');
    const urlSearch = getParamSafely('search', '');

    // Update status filter from URL
    if (
      urlStatus &&
      (urlStatus === 'critical' ||
        urlStatus === 'active' ||
        urlStatus === 'inactive' ||
        urlStatus === 'warning')
    ) {
      setStatusFilter(urlStatus);
    } else if (urlStatus === null) {
      setStatusFilter('all');
    }

    // Update document filter from URL
    if (
      urlDocFilter &&
      (urlDocFilter === 'expired' ||
        urlDocFilter === 'expiring' ||
        urlDocFilter === 'missing')
    ) {
      setDocumentFilter(urlDocFilter);
    } else if (urlDocFilter === null) {
      setDocumentFilter('all');
    }

    // Update assignment filter from URL
    if (
      urlAssignment &&
      (urlAssignment === 'assigned' || urlAssignment === 'unassigned')
    ) {
      setAssignmentFilter(urlAssignment);
    } else if (urlAssignment === null) {
      setAssignmentFilter('all');
    }

    // Update view mode from URL
    if (
      urlView &&
      (urlView === 'table' ||
        urlView === 'grid' ||
        urlView === 'cards' ||
        urlView === 'analytics')
    ) {
      setViewMode(urlView);
    }

    // Update search term from URL
    if (urlSearch !== null) {
      setSearchTerm(urlSearch || '');
    }
  }, [getParamSafely, setStatusFilter, setDocumentFilter, setAssignmentFilter, setViewMode, setSearchTerm]);

  // Debounce search term to prevent excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 600); // Optimized to 600ms for better stability and prevent timeout issues

    return () => clearTimeout(timer);
  }, [searchTerm]);

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

    if (debouncedSearchTerm) result.search = debouncedSearchTerm;
    if (statusFilter !== 'all') result.status = statusFilter;
    if (documentFilter !== 'all') result.documents = documentFilter;
    if (assignmentFilter !== 'all') result.assignment = assignmentFilter;
    if (sortField) result.sortField = sortField;
    if (sortOrder) result.sortOrder = sortOrder;

    return result;
  }, [
    debouncedSearchTerm,
    statusFilter,
    documentFilter,
    assignmentFilter,
    sortField,
    sortOrder,
  ]);

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

  // Separate search-specific loading state from general data fetching
  const isSearching =
    searchTerm !== debouncedSearchTerm && debouncedSearchTerm !== '';
  const isDataFetching = isFetching && !isSearching;

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !response) {
        logger.warn('⚠️ Load timeout: Data took too long to load');
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
  logger.log('📊 Component state:', {
    isLoading,
    isError,
    isFetching,
    hasResponse: !!response,
    hasPromoters: !!promoters,
    promotersCount: promoters.length,
    errorMessage: error?.message,
  });

  // Regular dashboard promoters (paginated)
  const dashboardPromoters = useMemo<DashboardPromoter[]>(() => {
    logger.log('🔄 Processing promoters for dashboard...');
    logger.log('📊 Raw promoter data sample:', promoters.slice(0, 2));

    return promoters.map(promoter => {
      // Debug logging for each promoter
      logger.log('🔍 Processing promoter:', {
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
        else if (
          (promoter as any)?.first_name ||
          (promoter as any)?.last_name
        ) {
          const firstName = (promoter as any)?.first_name || '';
          const lastName = (promoter as any)?.last_name || '';
          rawName = `${firstName} ${lastName}`.trim();
        }
        // Try email as last resort
        else if (promoter.email?.trim()) {
          rawName =
            promoter.email.split('@')[0]?.replace(/[._]/g, ' ').trim() ||
            'Unknown';
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
        if (promoter.mobile_number?.trim())
          return promoter.mobile_number.trim();
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

      logger.log('✅ Processed promoter result:', {
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

  // Load ALL promoters for analytics when analytics view is accessed
  const loadAnalyticsData = useCallback(
    async (forceRefresh = false) => {
      if (allPromotersData && !isLoadingAnalytics && !forceRefresh) {
        logger.log('📊 Using cached analytics data');
        return; // Already loaded
      }

      setIsLoadingAnalytics(true);
      setAnalyticsError(null);

      try {
        logger.log(
          '🔄 Loading ALL promoters for analytics dashboard with pagination...'
        );
        const analyticsData = await fetchAllPromotersForAnalytics();
        setAllPromotersData(analyticsData);
        logger.log(
          '✅ Analytics data loaded successfully:',
          analyticsData.promoters.length,
          'out of',
          analyticsData.total,
          'total workforce members'
        );

        // Verify we got all the data
        if (analyticsData.promoters.length !== analyticsData.total) {
          logger.warn('⚠️ Potential data mismatch:', {
            fetched: analyticsData.promoters.length,
            total: analyticsData.total,
            difference: analyticsData.total - analyticsData.promoters.length,
          });
        } else {
          logger.log(
            '✅ Data verification passed: All workforce members loaded'
          );
        }
      } catch (error) {
        logger.error('❌ Failed to load analytics data:', error);
        setAnalyticsError(
          error instanceof Error
            ? error.message
            : 'Failed to load analytics data'
        );
      } finally {
        setIsLoadingAnalytics(false);
      }
    },
    [allPromotersData, isLoadingAnalytics]
  );

  // Auto-load analytics data when switching to analytics view
  useEffect(() => {
    if (viewMode === 'analytics') {
      loadAnalyticsData();
    }
  }, [viewMode, loadAnalyticsData]);

  // ALL promoters for analytics (complete workforce)
  const allDashboardPromoters = useMemo<DashboardPromoter[]>(() => {
    if (!allPromotersData?.promoters) {
      return [];
    }

    logger.log('🔄 Processing ALL promoters for analytics dashboard...');
    logger.log('📊 ALL promoters count:', allPromotersData.promoters.length);

    return allPromotersData.promoters.map(promoter => {
      const idDocument = computeDocumentHealth(
        promoter.id_card_expiry_date ?? null,
        PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY
      );
      const passportDocument = computeDocumentHealth(
        promoter.passport_expiry_date ?? null,
        PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY
      );

      // Same transformation logic as regular dashboard promoters
      const displayName = (() => {
        if (promoter.name_en && promoter.name_ar) {
          return `${toTitleCase(promoter.name_en)} (${promoter.name_ar})`;
        }
        return toTitleCase(
          promoter.name_en || promoter.name_ar || 'Unnamed Promoter'
        );
      })();

      const assignmentStatus: 'assigned' | 'unassigned' = promoter.employer_id
        ? 'assigned'
        : 'unassigned';
      const organisationLabel =
        (promoter as any).parties?.name_en || 'Unassigned';

      return {
        ...promoter,
        displayName,
        assignmentStatus,
        organisationLabel,
        idDocument,
        passportDocument,
        overallStatus: computeOverallStatus(
          promoter.status,
          idDocument,
          passportDocument
        ),
        nationality: promoter.nationality || 'Unknown',
        job_title: promoter.job_title || 'General Promoter',
        created_at: promoter.created_at || new Date().toISOString(),
      } as DashboardPromoter;
    });
  }, [allPromotersData]);

  console.log(
    '📈 Dashboard promoters processed:',
    dashboardPromoters.length,
    'items'
  );

  // 🎯 FIX: Fetch system-wide metrics from dedicated API
  // This ensures metrics represent the ENTIRE database, not just the current page
  const { data: apiMetricsData, isLoading: metricsLoading } = useQuery({
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
    // ✅ PRIORITY: Use API metrics when available (system-wide data)
    if (apiMetricsData?.metrics) {
      const apiMetrics = apiMetricsData.metrics;
      logger.log('✅ Using system-wide metrics from API:', apiMetrics);

      // Calculate page-specific metrics that don't exist in API
      const companies = new Set(
        dashboardPromoters.map(p => p.employer_id).filter(Boolean) as string[]
      ).size;

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const recentlyAdded = dashboardPromoters.filter(p => {
        const createdDate = parseDateSafe(p.created_at);
        return createdDate && createdDate >= sevenDaysAgo;
      }).length;

      return {
        total: apiMetrics.total, // ✅ System-wide
        active: apiMetrics.active, // ✅ System-wide
        critical: apiMetrics.critical, // ✅ System-wide
        expiring: apiMetrics.expiring, // ✅ System-wide
        unassigned: apiMetrics.unassigned, // ✅ System-wide
        companies, // Page-specific (OK for this metric)
        recentlyAdded, // Page-specific (OK for this metric)
        complianceRate: apiMetrics.complianceRate, // ✅ System-wide
      };
    }

    // ⚠️ FALLBACK: Calculate from current page only when API fails
    logger.warn(
      '⚠️ API metrics not available, using page-based calculation (may be inaccurate)'
    );
    const total = pagination?.total || dashboardPromoters.length;
    const active = dashboardPromoters.filter(
      p => p.overallStatus === 'active'
    ).length;
    const critical = dashboardPromoters.filter(
      p =>
        p.idDocument.status === 'expired' ||
        p.passportDocument.status === 'expired'
    ).length;
    const expiring = dashboardPromoters.filter(
      p =>
        p.idDocument.status === 'expiring' ||
        p.passportDocument.status === 'expiring'
    ).length;
    const unassigned = dashboardPromoters.filter(
      p => p.assignmentStatus === 'unassigned'
    ).length;
    const companies = new Set(
      dashboardPromoters.map(p => p.employer_id).filter(Boolean) as string[]
    ).size;
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentlyAdded = dashboardPromoters.filter(p => {
      const createdDate = parseDateSafe(p.created_at);
      return createdDate && createdDate >= sevenDaysAgo;
    }).length;
    const compliant = dashboardPromoters.filter(
      p =>
        p.idDocument.status === 'valid' && p.passportDocument.status === 'valid'
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
  }, [dashboardPromoters, pagination, apiMetricsData]);

  // ✅ PERFORMANCE: Server-side filtering implemented
  // No need for client-side filtering as the API handles all filtering
  const filteredPromoters = useMemo(() => {
    logger.log(
      '✅ Using server-filtered promoters directly (no client-side filtering needed)'
    );
    return dashboardPromoters;
  }, [dashboardPromoters]);

  // ✅ PERFORMANCE: Server-side sorting implemented
  // No need for client-side sorting as the API handles sorting
  const sortedPromoters = useMemo(() => {
    logger.log(
      '✅ Using server-sorted promoters directly (no client-side sorting needed)'
    );
    return filteredPromoters;
  }, [filteredPromoters]);

  logger.log('✅ Final sorted promoters:', sortedPromoters.length, 'items');

  const atRiskPromoters = useMemo(() => {
    return sortedPromoters
      .filter(
        (promoter: DashboardPromoter) =>
          promoter.idDocument.status !== 'valid' ||
          promoter.passportDocument.status !== 'valid'
      )
      .slice(0, 5);
  }, [sortedPromoters]);

  const hasFiltersApplied = useMemo(
    () =>
      statusFilter !== 'all' ||
      documentFilter !== 'all' ||
      assignmentFilter !== 'all' ||
      debouncedSearchTerm.trim().length > 0, // Use debouncedSearchTerm to prevent constant recalculation
    [statusFilter, documentFilter, assignmentFilter, debouncedSearchTerm]
  );

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
            const companies = await fetch('/api/parties?type=company').then(
              res => res.json()
            );

            if (!companies.success || !companies.parties?.length) {
              toast({
                title: 'No Companies Available',
                description: 'No companies found to assign promoters to.',
                variant: 'destructive',
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
        logger.error('Bulk action error:', error);
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
        const tableSection = document.querySelector(
          '[aria-labelledby="promoters-content-heading"]'
        );
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

  // Inline update handler for quick edits
  const handleInlineUpdate = useCallback(
    async (promoterId: string, field: string, value: string) => {
      try {
        const result = await updatePromoterAction(promoterId, {
          [field]: value,
        });

        if (result.success) {
          toast({
            title: 'Updated successfully',
            description: `${field} has been updated.`,
          });
          // Trigger a refetch to update the UI
          refetch();
        } else {
          throw new Error(result.message || 'Failed to update');
        }
      } catch (error) {
        toast({
          title: 'Update failed',
          description:
            error instanceof Error ? error.message : 'Could not save changes',
          variant: 'destructive',
        });
        throw error; // Re-throw so the cell stays in edit mode
      }
    },
    [toast, refetch]
  );

  const handlePartyAssignmentUpdate = useCallback(
    async (promoterId: string, partyId: string | null) => {
      // Update the local promoter data optimistically
      try {
        // Show success message
        toast({
          title: 'Success',
          description: partyId
            ? 'Party assignment updated successfully'
            : 'Promoter unassigned from party',
        });

        // Refetch data to get updated party information
        await refetch();
      } catch (error) {
        logger.error('Error handling party assignment update:', error);
        toast({
          title: 'Error',
          description: 'Failed to refresh data after assignment update',
          variant: 'destructive',
        });
      }
    },
    [toast, refetch]
  );

  const handleSendReminder = useCallback(
    async (promoter: DashboardPromoter) => {
      logger.log('[ACTION] Send reminder to:', promoter.displayName);

      try {
        // Determine which document needs reminder based on expiry status
        let documentType: 'id_card' | 'passport' = 'id_card';
        let expiryDate = promoter.id_card_expiry_date;
        let daysBeforeExpiry = 30;

        // Check passport if ID card is valid or missing
        if (
          promoter.idDocument.status === 'valid' &&
          promoter.passportDocument.status !== 'valid'
        ) {
          documentType = 'passport';
          expiryDate = promoter.passport_expiry_date;
        }

        // Calculate days before expiry
        if (expiryDate) {
          const expiryDateObj = new Date(expiryDate);
          const today = new Date();
          daysBeforeExpiry = Math.ceil(
            (expiryDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
          );
        }

        // Import and send reminder
        const { sendDocumentExpiryReminder } = await import(
          '@/lib/services/promoter-notification.service'
        );

        if (!expiryDate) {
          throw new Error('No expiry date available for reminder');
        }

        const result = await sendDocumentExpiryReminder({
          promoterId: promoter.id,
          documentType,
          expiryDate,
          daysBeforeExpiry: Math.max(1, daysBeforeExpiry),
        });

        if (result.success) {
          toast({
            title: '📧 Reminder Sent',
            description: `Document reminder sent to ${promoter.displayName}`,
          });
        } else {
          throw new Error(result.error || 'Failed to send reminder');
        }
      } catch (error) {
        logger.error('Error sending reminder:', error);
        toast({
          title: 'Error',
          description:
            error instanceof Error ? error.message : 'Failed to send reminder',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const handleRequestDocument = useCallback(
    async (promoter: DashboardPromoter, documentType: 'ID' | 'Passport') => {
      logger.log(
        '[ACTION] Request document:',
        documentType,
        'from',
        promoter.displayName
      );

      try {
        // Import and send document request
        const { sendDocumentRequest } = await import(
          '@/lib/services/promoter-notification.service'
        );

        const result = await sendDocumentRequest({
          promoterId: promoter.id,
          documentType: documentType === 'ID' ? 'id_card' : 'passport',
          reason: 'Document required for compliance',
          priority: 'high',
        });

        if (result.success) {
          toast({
            title: '📋 Document Request Sent',
            description: `${documentType} request sent to ${promoter.displayName}`,
          });
        } else {
          throw new Error(result.error || 'Failed to send document request');
        }
      } catch (error) {
        logger.error('Error requesting document:', error);
        toast({
          title: 'Error',
          description:
            error instanceof Error
              ? error.message
              : 'Failed to send document request',
          variant: 'destructive',
        });
      }
    },
    [toast]
  );

  const handleGoToDashboard = useCallback(() => {
    router.push(`/${derivedLocale}/dashboard`);
  }, [router, derivedLocale]);

  const handleViewModeChange = useCallback(
    (mode: 'table' | 'grid' | 'cards' | 'analytics') => {
      setViewMode(mode);
      // Persist view preference to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('promoters-view-mode', mode);
      }
    },
    []
  );

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

  const handlePageChange = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('page', newPage.toString());
      params.set('limit', limit.toString());
      router.push(`${window.location.pathname}?${params.toString()}`);
    },
    [searchParams, limit, router]
  );

  const handlePageSizeChange = useCallback(
    (newLimit: number) => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      params.set('page', '1'); // Reset to page 1 when changing page size
      params.set('limit', newLimit.toString());
      router.push(`${window.location.pathname}?${params.toString()}`);
    },
    [searchParams, router]
  );

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
    // Show no-results state if filters are applied, otherwise show empty state
    if (hasFiltersApplied || searchTerm) {
      return (
        <PromotersNoResultsState
          searchTerm={searchTerm}
          hasFiltersApplied={hasFiltersApplied}
          onClearFilters={handleResetFilters}
          onClearSearch={() => setSearchTerm('')}
          locale={derivedLocale}
        />
      );
    }
    return (
      <PromotersEmptyState
        onAddPromoter={handleAddPromoter}
        onRefresh={handleRefresh}
      />
    );
  }

  // Show loading overlay if data is being refreshed
  const showLoadingOverlay = isDataFetching && response;

  return (
    <main className='relative space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      {/* Loading overlay */}
      {showLoadingOverlay && (
        <div
          className='absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center'
          role='status'
          aria-live='polite'
        >
          <div className='flex items-center gap-3 bg-card p-4 rounded-lg shadow-lg border'>
            <RefreshCw
              className='h-5 w-5 animate-spin text-primary'
              aria-hidden='true'
            />
            <span className='text-sm font-medium'>
              Updating promoters data...
            </span>
          </div>
        </div>
      )}
      {/* Enhanced Header */}
      <header>
        <PromotersHeader
          metrics={metrics}
          promoters={dashboardPromoters}
          isFetching={isDataFetching}
          onRefresh={handleRefresh}
          onAddPromoter={handleAddPromoter}
          locale={derivedLocale}
        />
      </header>

      {/* Enhanced Metrics */}
      <section aria-labelledby='metrics-heading'>
        <h2 id='metrics-heading' className='sr-only'>
          Promoter Statistics
        </h2>
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
          <h2 id='insights-heading' className='sr-only'>
            Data Insights and Analytics
          </h2>
          <PromotersStatsCharts
            metrics={metrics}
            promoters={dashboardPromoters}
            hasFiltersApplied={hasFiltersApplied}
          />
        </section>
      )}

      {/* Refresh Indicator */}
      <RefreshIndicator
        isFetching={isDataFetching && !isLoading}
        showFloating={true}
      />

      {/* Enhanced Filters */}
      <section aria-labelledby='filters-heading'>
        <h2 id='filters-heading' className='sr-only'>
          Search and Filter Options
        </h2>
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
          isFetching={isDataFetching}
          metrics={metrics}
          locale={derivedLocale}
        />
      </section>

      {/* Bulk Actions Bar */}
      <section aria-labelledby='bulk-actions-heading'>
        <h2 id='bulk-actions-heading' className='sr-only'>
          Bulk Actions
        </h2>
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
            {/* Analytics View Header with Navigation */}
            <div className='bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900 rounded-xl shadow-xl border-0 p-6'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='space-y-2'>
                  <div className='flex items-center gap-3'>
                    <div className='p-2 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg'>
                      <Users className='h-6 w-6 text-white' />
                    </div>
                    <div>
                      <h1 className='text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-300'>
                        Workforce Analytics Dashboard
                      </h1>
                      <p className='text-base text-slate-600 dark:text-slate-400 mt-1'>
                        <span className='font-bold text-purple-600 dark:text-purple-400 text-lg'>
                          {allDashboardPromoters.length || 'Loading...'}
                        </span>{' '}
                        <span className='text-slate-600 dark:text-slate-400'>
                          total workforce members • Complete analytics coverage
                        </span>
                        {allPromotersData && (
                          <span className='block text-sm text-green-600 dark:text-green-400 mt-1'>
                            ✅ Showing complete workforce data (
                            {allPromotersData.total} members) • Last updated:{' '}
                            {new Date(
                              allPromotersData.timestamp
                            ).toLocaleTimeString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* View Mode Selector - Always Visible */}
                <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
                  {/* Quick Back to List Button */}
                  <button
                    onClick={() => handleViewModeChange('table')}
                    className='inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors shadow-sm'
                    title='Return to promoter list view'
                  >
                    ← Back to List
                  </button>
                  {isDataFetching && (
                    <Badge
                      variant='outline'
                      className='gap-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200/80 shadow-sm w-fit'
                    >
                      <RefreshCw className='h-3.5 w-3.5 animate-spin' />
                      <span className='font-medium'>Syncing</span>
                    </Badge>
                  )}
                  <div className='bg-white/90 dark:bg-slate-800/90 shadow-lg border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm rounded-lg p-1'>
                    <div className='grid grid-cols-4 gap-1'>
                      <button
                        onClick={() => handleViewModeChange('table')}
                        className='px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white'
                      >
                        Table
                      </button>
                      <button
                        onClick={() => handleViewModeChange('grid')}
                        className='px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white'
                      >
                        Grid
                      </button>
                      <button
                        onClick={() => handleViewModeChange('cards')}
                        className='px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 hover:bg-gradient-to-r hover:from-blue-500 hover:to-indigo-600 hover:text-white'
                      >
                        Cards
                      </button>
                      <button
                        className='px-4 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md cursor-default'
                        disabled
                        title='Currently viewing Analytics'
                      >
                        Analytics ✓
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Loading State for Analytics */}
            {isLoadingAnalytics && <AnalyticsLoadingSkeleton />}

            {/* Error State for Analytics */}
            {analyticsError && (
              <div className='bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-6 border border-red-200 dark:border-red-800'>
                <div className='flex items-center gap-3'>
                  <div className='p-2 rounded-full bg-red-100 dark:bg-red-900/30'>
                    <AlertTriangle className='h-6 w-6 text-red-600 dark:text-red-400' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-red-900 dark:text-red-100'>
                      Failed to Load Analytics Data
                    </h3>
                    <p className='text-red-700 dark:text-red-300 mt-1'>
                      {analyticsError}
                    </p>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => loadAnalyticsData(true)}
                      className='mt-3 bg-white/80 hover:bg-white dark:bg-slate-800/80 dark:hover:bg-slate-800'
                    >
                      <RefreshCw className='h-4 w-4 mr-2' />
                      Retry Loading Analytics
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Professional Analytics Dashboard */}
            {!isLoadingAnalytics &&
              !analyticsError &&
              allDashboardPromoters.length > 0 && (
                <div className='space-y-6'>
                  {/* Analytics Toolbar */}
                  <AnalyticsToolbar
                    totalRecords={allDashboardPromoters.length}
                    isLoading={isLoadingAnalytics || metricsLoading}
                    onRefresh={async () => {
                      // Refresh both analytics data and metrics
                      logger.log(
                        '🔄 Manual refresh triggered from analytics toolbar'
                      );
                      await Promise.all([
                        loadAnalyticsData(true), // Force refresh
                        refetch(), // Refetch metrics
                      ]);
                      toast({
                        title: '✅ Analytics Refreshed',
                        description: `All data updated • ${allDashboardPromoters.length} workforce members loaded`,
                      });
                    }}
                    onExport={format => logger.log(`Export ${format}`)}
                    onPrint={() => window.print()}
                    onFullScreen={() =>
                      document.documentElement.requestFullscreen()
                    }
                    lastUpdated={allPromotersData?.timestamp || undefined}
                  />

                  {/* Metrics Overview Cards - System-Wide Data */}
                  <PromotersMetricsCards
                    metrics={metrics}
                    onCardClick={filterType => {
                      // Switch back to table view with filter applied
                      handleViewModeChange('table');
                      if (filterType === 'alerts') setStatusFilter('critical');
                      else if (filterType === 'active')
                        setStatusFilter('active');
                      else setStatusFilter('all');
                    }}
                    activeFilter={null}
                  />

                  {/* Stats Charts - Quick Insights */}
                  <PromotersStatsCharts
                    metrics={metrics}
                    promoters={allDashboardPromoters}
                    hasFiltersApplied={hasFiltersApplied}
                  />

                  {/* Workforce Summary */}
                  <WorkforceAnalyticsSummary
                    promoters={allDashboardPromoters}
                    isRealTime={true}
                    lastUpdated={allPromotersData?.timestamp || undefined}
                  />

                  {/* Smart Insights Panel */}
                  <AnalyticsInsightsPanel
                    promoters={allDashboardPromoters}
                    locale={locale || 'en'}
                  />

                  {/* Document Expiry Analysis */}
                  <PromotersDocumentExpiryChart
                    promoters={allDashboardPromoters}
                    title='Document Expiry Timeline - Complete Workforce'
                    description={`Monitor document expiration patterns across all ${allDashboardPromoters.length} workforce members`}
                  />

                  {/* Comprehensive Analytics Charts */}
                  <PromotersAnalyticsCharts
                    promoters={allDashboardPromoters}
                    isRealTime={true}
                    onRefresh={loadAnalyticsData}
                    isFetching={isLoadingAnalytics}
                  />
                </div>
              )}
          </div>
        ) : (
          /* Table/Grid/Cards View */
          <div className='grid gap-4 lg:grid-cols-1 xl:grid-cols-[minmax(900px,2fr)_minmax(300px,1fr)]'>
            <PromotersTable
              promoters={sortedPromoters}
              selectedPromoters={selectedPromoters}
              sortField={sortField}
              sortOrder={sortOrder}
              viewMode={viewMode}
              pagination={pagination}
              isFetching={isDataFetching}
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
              onPartyAssignmentUpdate={handlePartyAssignmentUpdate}
              enableEnhancedPartyManagement={true}
              onInlineUpdate={handleInlineUpdate}
              enableInlineEdit={true}
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
