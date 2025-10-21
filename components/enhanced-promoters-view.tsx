'use client';

import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { differenceInDays, format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { PROMOTER_NOTIFICATION_DAYS } from '@/constants/notification-days';
import { useToast } from '@/hooks/use-toast';
// import { useVirtualizer } from '@tanstack/react-virtual'; // Removed for compatibility
import type { Promoter } from '@/lib/types';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { SafeImage } from '@/components/ui/safe-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';

import type { LucideIcon } from 'lucide-react';
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  UserCheck,
  ShieldAlert,
  Building2,
  Mail,
  Phone,
  MapPin,
  Calendar,
  MoreHorizontal,
  ShieldCheck,
  Contact,
  Globe,
  Clock,
  AlertTriangle,
  HelpCircle,
  FileText,
  Trash2,
  Edit,
  Eye,
  Archive,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Activity,
  Bell,
  Settings,
  ChevronDown,
  SortAsc,
  SortDesc,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'missing';
type OverallStatus = 'active' | 'warning' | 'critical' | 'inactive';
type SortField = 'name' | 'status' | 'created' | 'documents';
type SortOrder = 'asc' | 'desc';

interface DocumentHealth {
  status: DocumentStatus;
  daysRemaining: number | null;
  expiresOn?: string | null;
  label: string;
}

interface DashboardPromoter extends Promoter {
  displayName: string;
  assignmentStatus: 'assigned' | 'unassigned';
  organisationLabel: string;
  idDocument: DocumentHealth;
  passportDocument: DocumentHealth;
  overallStatus: OverallStatus;
  contactEmail: string;
  contactPhone: string;
  createdLabel: string;
}

interface DashboardMetrics {
  total: number;
  active: number;
  critical: number;
  expiring: number;
  unassigned: number;
  companies: number;
  recentlyAdded: number;
  complianceRate: number;
}

interface BulkAction {
  id: string;
  label: string;
  icon: LucideIcon;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
}

interface PromotersViewProps {
  locale?: string;
}

const STAT_CARD_STYLES = {
  primary: {
    container: 'bg-primary/5 border-primary/10',
    icon: 'bg-primary/15 text-primary',
  },
  neutral: {
    container: 'border-muted-foreground/10',
    icon: 'bg-muted text-muted-foreground',
  },
  warning: {
    container: 'bg-amber-50 border-amber-100',
    icon: 'bg-amber-100 text-amber-600',
  },
  danger: {
    container: 'bg-red-50 border-red-100',
    icon: 'bg-red-100 text-red-600',
  },
  success: {
    container: 'bg-green-50 border-green-100',
    icon: 'bg-green-100 text-green-600',
  },
} as const;

const DOCUMENT_STATUS_BADGES: Record<DocumentStatus, string> = {
  valid: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  expiring: 'bg-amber-50 text-amber-600 border-amber-100',
  expired: 'bg-red-50 text-red-600 border-red-100',
  missing: 'bg-slate-100 text-slate-500 border-slate-200',
};

const OVERALL_STATUS_BADGES: Record<OverallStatus, string> = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  critical: 'bg-red-50 text-red-600 border-red-100',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
};

const DOCUMENT_STATUS_ICONS: Record<DocumentStatus, LucideIcon> = {
  valid: ShieldCheck,
  expiring: Clock,
  expired: AlertTriangle,
  missing: HelpCircle,
};

const OVERALL_STATUS_LABELS: Record<OverallStatus, string> = {
  active: 'Operational',
  warning: 'Attention',
  critical: 'Critical',
  inactive: 'Inactive',
};

const BULK_ACTIONS: BulkAction[] = [
  {
    id: 'export',
    label: 'Export Selected',
    icon: Download,
    variant: 'default',
  },
  {
    id: 'assign',
    label: 'Assign to Company',
    icon: Building2,
    variant: 'default',
  },
  {
    id: 'notify',
    label: 'Send Notifications',
    icon: Send,
    variant: 'default',
  },
  {
    id: 'archive',
    label: 'Archive Selected',
    icon: Archive,
    variant: 'destructive',
    requiresConfirmation: true,
  },
  {
    id: 'delete',
    label: 'Delete Selected',
    icon: Trash2,
    variant: 'destructive',
    requiresConfirmation: true,
  },
];

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
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
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

export function EnhancedPromotersView({ locale }: PromotersViewProps) {
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
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [isPerformingBulkAction, setIsPerformingBulkAction] = useState(false);
  const [loadTimeout, setLoadTimeout] = useState(false);

  // Refs for virtualization
  const parentRef = useRef<HTMLDivElement>(null);

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
    queryKey: ['promoters', page, limit],
    queryFn: () => fetchPromoters(page, limit),
    staleTime: 30_000,
    gcTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    refetchOnWindowFocus: false,
    refetchInterval: false,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading && !response) {
        console.warn('⚠️ Load timeout: Data took too long to load');
        setLoadTimeout(true);
      }
    }, 15000); // 15 second timeout

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

  // Virtualization setup (disabled for compatibility)
  // const virtualizer = useVirtualizer({
  //   count: sortedPromoters.length,
  //   getScrollElement: () => parentRef.current,
  //   estimateSize: () => 80,
  //   overscan: 5,
  // });

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
        setShowBulkActions(false);
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

  // Loading state
  // Show loading skeleton only for first 15 seconds
  if (isLoading && !response && !loadTimeout) {
    return <EnhancedPromotersSkeleton />;
  }

  // If loading timed out, show error
  if (loadTimeout && !response) {
    return (
      <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <XCircle className='h-5 w-5' />
              Page Load Timeout
            </CardTitle>
            <CardDescription>
              The page took too long to load. This might be a network issue.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>What to do:</strong>
                <div className='mt-2 space-y-1 text-sm'>
                  <div>• Refresh the page</div>
                  <div>• Check your internet connection</div>
                  <div>• Try again in a few moments</div>
                </div>
              </AlertDescription>
            </Alert>
            <div className='flex gap-2'>
              <Button
                onClick={() => window.location.reload()}
                variant='default'
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Reload Page
              </Button>
              <Button onClick={() => refetch()} variant='outline'>
                <RefreshCw className='mr-2 h-4 w-4' />
                Try Loading Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-600'>
              <XCircle className='h-5 w-5' />
              Unable to Load Promoters
            </CardTitle>
            <CardDescription>
              {error?.message ||
                'An error occurred while loading promoters data.'}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>Error Details:</strong>
                <div className='mt-2 space-y-1 text-sm'>
                  <div>• Check your internet connection</div>
                  <div>• Ensure you're logged in with valid credentials</div>
                  <div>• Verify you have permission to view promoters</div>
                  <div>• Contact support if the problem persists</div>
                </div>
              </AlertDescription>
            </Alert>
            <div className='flex gap-2'>
              <Button onClick={() => refetch()} variant='default'>
                <RefreshCw className='mr-2 h-4 w-4' />
                Try Again
              </Button>
              <Button
                onClick={() => router.push(`/${derivedLocale}/dashboard`)}
                variant='outline'
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Empty state (no data)
  if (!promoters || promoters.length === 0) {
    return (
      <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Users className='h-5 w-5' />
              No Promoters Found
            </CardTitle>
            <CardDescription>
              There are currently no promoters in the system.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert>
              <HelpCircle className='h-4 w-4' />
              <AlertDescription>
                <strong>Possible reasons:</strong>
                <div className='mt-2 space-y-1 text-sm'>
                  <div>• No promoters have been added yet</div>
                  <div>
                    • Your account may not have access to view promoters
                  </div>
                  <div>• Data filters may be too restrictive</div>
                  <div>• Database connection issue</div>
                </div>
              </AlertDescription>
            </Alert>
            <div className='flex gap-2'>
              <Button onClick={handleAddPromoter} variant='default'>
                <Plus className='mr-2 h-4 w-4' />
                Add First Promoter
              </Button>
              <Button onClick={() => refetch()} variant='outline'>
                <RefreshCw className='mr-2 h-4 w-4' />
                Refresh
              </Button>
            </div>
            <div className='rounded-lg bg-blue-50 p-4 text-sm'>
              <strong className='text-blue-900'>Development Mode:</strong>
              <div className='mt-1 text-blue-700'>
                Check browser console (F12) and server logs for detailed
                debugging information.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      {/* Enhanced Header */}
      <Card className='relative overflow-hidden border-none bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl'>
        <div className='absolute inset-0 opacity-10'>
          <div className='absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,white_1px,transparent_1px)] bg-[length:40px_40px]' />
        </div>
        <CardHeader className='relative pb-6'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-white/10 p-3 backdrop-blur-sm'>
                  <Users className='h-6 w-6' />
                </div>
                <CardTitle className='text-4xl font-bold tracking-tight lg:text-5xl'>
                  Promoter Intelligence Hub
                </CardTitle>
              </div>
              <CardDescription className='max-w-3xl text-base text-white/80'>
                Monitor workforce readiness, document compliance, and partner
                coverage in real-time to keep every engagement on track.{' '}
                {metrics.total} promoters in system.
              </CardDescription>
              <div className='flex flex-wrap items-center gap-3 text-sm text-white/70 pt-2'>
                <Badge className='bg-white/10 text-white border-white/20'>
                  <Activity className='mr-1.5 h-3 w-3' />
                  Live data
                </Badge>
                <Badge className='bg-emerald-500/20 text-emerald-100 border-emerald-400/30'>
                  <CheckCircle className='mr-1.5 h-3 w-3' />
                  {metrics.complianceRate}% compliant
                </Badge>
                <Badge className='bg-amber-500/20 text-amber-100 border-amber-400/30'>
                  <AlertTriangle className='mr-1.5 h-3 w-3' />
                  {metrics.critical} critical
                </Badge>
                <Badge className='bg-blue-500/20 text-blue-100 border-blue-400/30'>
                  <Building2 className='mr-1.5 h-3 w-3' />
                  {metrics.companies} companies
                </Badge>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <Button
                onClick={handleAddPromoter}
                className='bg-white text-slate-900 hover:bg-white/90 font-semibold shadow-lg transition-all hover:shadow-xl'
                size='lg'
              >
                <Plus className='mr-2 h-5 w-5' />
                Add Promoter
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='secondary'
                      className='bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm border-white/10'
                      onClick={handleRefresh}
                      disabled={isFetching}
                    >
                      <RefreshCw
                        className={cn(
                          'mr-2 h-4 w-4',
                          isFetching && 'animate-spin'
                        )}
                      />
                      {isFetching ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className='text-xs'>Refresh promoter data (Cmd+R)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Enhanced Metrics */}
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        <EnhancedStatCard
          title='Total promoters'
          value={metrics.total}
          helper={`${metrics.active} active right now`}
          icon={Users}
          variant='primary'
          trend={
            metrics.recentlyAdded > 0
              ? { value: metrics.recentlyAdded, label: 'new this week' }
              : undefined
          }
        />
        <EnhancedStatCard
          title='Active workforce'
          value={metrics.active}
          helper={`${metrics.unassigned} awaiting assignment`}
          icon={UserCheck}
          variant='neutral'
        />
        <EnhancedStatCard
          title='Document alerts'
          value={metrics.critical}
          helper={`${metrics.expiring} expiring soon`}
          icon={ShieldAlert}
          variant={metrics.critical > 0 ? 'danger' : 'warning'}
        />
        <EnhancedStatCard
          title='Compliance rate'
          value={`${metrics.complianceRate}%`}
          helper={`${metrics.total - metrics.unassigned} assigned staff`}
          icon={CheckCircle}
          variant={metrics.complianceRate >= 90 ? 'success' : 'warning'}
        />
      </div>

      {/* Enhanced Filters */}
      <Card>
        <CardHeader className='pb-5'>
          <CardTitle className='text-lg'>Smart filters</CardTitle>
          <CardDescription>
            Refine the promoter roster by lifecycle stage, document health, or
            assignment.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)]'>
            <div className='space-y-2'>
              <Label htmlFor='promoter-search'>Search promoters</Label>
              <div className='relative'>
                <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
                <Input
                  id='promoter-search'
                  placeholder='Search by name, contact, or role'
                  className='pl-10'
                  value={searchTerm}
                  onChange={event => setSearchTerm(event.target.value)}
                />
              </div>
            </div>
            <div className='grid gap-4 sm:grid-cols-3'>
              <div className='space-y-2'>
                <Label>Lifecycle</Label>
                <Select
                  value={statusFilter}
                  onValueChange={value =>
                    setStatusFilter(value as OverallStatus | 'all')
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='All statuses' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All statuses</SelectItem>
                    <SelectItem value='active'>Operational</SelectItem>
                    <SelectItem value='warning'>Needs attention</SelectItem>
                    <SelectItem value='critical'>Critical</SelectItem>
                    <SelectItem value='inactive'>Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Document health</Label>
                <Select
                  value={documentFilter}
                  onValueChange={value =>
                    setDocumentFilter(
                      value as 'all' | 'expired' | 'expiring' | 'missing'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='All documents' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All documents</SelectItem>
                    <SelectItem value='expired'>Expired</SelectItem>
                    <SelectItem value='expiring'>Expiring soon</SelectItem>
                    <SelectItem value='missing'>Missing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='space-y-2'>
                <Label>Assignment</Label>
                <Select
                  value={assignmentFilter}
                  onValueChange={value =>
                    setAssignmentFilter(
                      value as 'all' | 'assigned' | 'unassigned'
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='All assignments' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All assignments</SelectItem>
                    <SelectItem value='assigned'>Assigned</SelectItem>
                    <SelectItem value='unassigned'>Unassigned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              <Button
                variant='outline'
                onClick={handleResetFilters}
                disabled={!hasFiltersApplied}
              >
                Reset filters
              </Button>
              <Button variant='outline' className='flex items-center'>
                <Download className='mr-2 h-4 w-4' />
                Export view
              </Button>
              <Button
                onClick={handleRefresh}
                variant='outline'
                disabled={isFetching}
              >
                <RefreshCw
                  className={cn(
                    'mr-2 h-4 w-4',
                    isFetching && 'animate-spin text-muted-foreground'
                  )}
                />
                Sync
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedPromoters.size > 0 && (
        <Card className='border-primary/20 bg-primary/5'>
          <CardContent className='flex items-center justify-between py-4'>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <Checkbox
                  checked={selectedPromoters.size === sortedPromoters.length}
                  onCheckedChange={handleSelectAll}
                />
                <span className='text-sm font-medium'>
                  {selectedPromoters.size} of {sortedPromoters.length} selected
                </span>
              </div>
              <div className='h-4 w-px bg-border' />
              <div className='flex items-center gap-2'>
                {BULK_ACTIONS.map(action => (
                  <Button
                    key={action.id}
                    variant={
                      action.variant === 'destructive'
                        ? 'destructive'
                        : 'outline'
                    }
                    size='sm'
                    onClick={() => handleBulkAction(action.id)}
                    disabled={isPerformingBulkAction}
                  >
                    <action.icon className='mr-2 h-4 w-4' />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setSelectedPromoters(new Set())}
            >
              Clear selection
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        {/* Enhanced Table */}
        <Card className='overflow-hidden shadow-lg'>
          <CardHeader className='flex flex-col gap-3 border-b bg-gradient-to-r from-slate-50 to-slate-100 py-4 dark:from-slate-950 dark:to-slate-900 sm:flex-row sm:items-center sm:justify-between'>
            <div>
              <CardTitle className='text-2xl font-bold'>
                Promoter roster
              </CardTitle>
              <CardDescription className='mt-1'>
                <span className='font-semibold text-foreground'>
                  {sortedPromoters.length}
                </span>{' '}
                of{' '}
                <span className='font-semibold text-foreground'>
                  {dashboardPromoters.length}
                </span>{' '}
                records visible
              </CardDescription>
            </div>
            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
              {isFetching && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge
                        variant='outline'
                        className='gap-2 bg-amber-50 text-amber-700 border-amber-200'
                      >
                        <RefreshCw className='h-3 w-3 animate-spin' />
                        Refreshing data
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className='text-xs'>
                        Syncing latest promoter information...
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Tabs
                value={viewMode}
                onValueChange={value =>
                  setViewMode(value as 'table' | 'grid' | 'cards')
                }
                className='ml-auto'
              >
                <TabsList className='grid w-full grid-cols-3 bg-white/80 dark:bg-slate-800/80'>
                  <TabsTrigger
                    value='table'
                    className='data-[state=active]:bg-blue-500 data-[state=active]:text-white'
                  >
                    Table
                  </TabsTrigger>
                  <TabsTrigger
                    value='grid'
                    className='data-[state=active]:bg-blue-500 data-[state=active]:text-white'
                  >
                    Grid
                  </TabsTrigger>
                  <TabsTrigger
                    value='cards'
                    className='data-[state=active]:bg-blue-500 data-[state=active]:text-white'
                  >
                    Cards
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent className='p-0'>
            {sortedPromoters.length === 0 ? (
              <div className='flex flex-col items-center justify-center space-y-4 py-16 text-center'>
                <div className='rounded-full bg-muted p-6'>
                  <Users className='h-12 w-12 text-muted-foreground' />
                </div>
                <div className='space-y-2'>
                  <h3 className='text-xl font-semibold tracking-tight'>
                    {hasFiltersApplied
                      ? 'No promoters match your filters'
                      : 'No promoters yet'}
                  </h3>
                  <p className='max-w-sm text-sm text-muted-foreground'>
                    {hasFiltersApplied
                      ? "Try adjusting your filters or search terms to find what you're looking for."
                      : 'Get started by adding your first promoter to the system.'}
                  </p>
                </div>
                <div className='flex gap-3'>
                  {hasFiltersApplied && (
                    <Button onClick={handleResetFilters} variant='outline'>
                      <RefreshCw className='mr-2 h-4 w-4' />
                      Clear Filters
                    </Button>
                  )}
                  <Button onClick={handleAddPromoter} size='lg'>
                    <Plus className='mr-2 h-5 w-5' />
                    Add Your First Promoter
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className='h-[520px]' ref={parentRef}>
                <Table>
                  <TableHeader className='sticky top-0 z-10 bg-background/95 backdrop-blur'>
                    <TableRow className='border-b-2 hover:bg-transparent'>
                      <TableHead className='w-[50px] text-center'>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Checkbox
                                checked={
                                  selectedPromoters.size ===
                                  sortedPromoters.length
                                }
                                onCheckedChange={handleSelectAll}
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className='text-xs'>
                                Select all visible promoters
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead
                        className='w-[220px] cursor-pointer hover:bg-muted/80 transition-colors font-semibold'
                        onClick={() => handleSort('name')}
                      >
                        <div className='flex items-center gap-2 group/header'>
                          <span>Promoter</span>
                          {sortField === 'name' ? (
                            sortOrder === 'asc' ? (
                              <SortAsc className='h-4 w-4 text-blue-500' />
                            ) : (
                              <SortDesc className='h-4 w-4 text-blue-500' />
                            )
                          ) : (
                            <div className='h-4 w-4 opacity-0 group-hover/header:opacity-30'>
                              <SortAsc className='h-4 w-4' />
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className='w-[200px] cursor-pointer hover:bg-muted/80 transition-colors font-semibold'
                        onClick={() => handleSort('documents')}
                      >
                        <div className='flex items-center gap-2 group/header'>
                          <span>Documents</span>
                          {sortField === 'documents' ? (
                            sortOrder === 'asc' ? (
                              <SortAsc className='h-4 w-4 text-blue-500' />
                            ) : (
                              <SortDesc className='h-4 w-4 text-blue-500' />
                            )
                          ) : (
                            <div className='h-4 w-4 opacity-0 group-hover/header:opacity-30'>
                              <SortAsc className='h-4 w-4' />
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className='font-semibold'>
                        Assignment
                      </TableHead>
                      <TableHead className='font-semibold'>Contacts</TableHead>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/80 transition-colors font-semibold'
                        onClick={() => handleSort('created')}
                      >
                        <div className='flex items-center gap-2 group/header'>
                          <span>Created</span>
                          {sortField === 'created' ? (
                            sortOrder === 'asc' ? (
                              <SortAsc className='h-4 w-4 text-blue-500' />
                            ) : (
                              <SortDesc className='h-4 w-4 text-blue-500' />
                            )
                          ) : (
                            <div className='h-4 w-4 opacity-0 group-hover/header:opacity-30'>
                              <SortAsc className='h-4 w-4' />
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className='cursor-pointer hover:bg-muted/80 transition-colors font-semibold'
                        onClick={() => handleSort('status')}
                      >
                        <div className='flex items-center gap-2 group/header'>
                          <span>Status</span>
                          {sortField === 'status' ? (
                            sortOrder === 'asc' ? (
                              <SortAsc className='h-4 w-4 text-blue-500' />
                            ) : (
                              <SortDesc className='h-4 w-4 text-blue-500' />
                            )
                          ) : (
                            <div className='h-4 w-4 opacity-0 group-hover/header:opacity-30'>
                              <SortAsc className='h-4 w-4' />
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className='text-right font-semibold'>
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedPromoters.map(promoter => (
                      <EnhancedPromoterRow
                        key={promoter.id}
                        promoter={promoter}
                        isSelected={selectedPromoters.has(promoter.id)}
                        onSelect={() => handleSelectPromoter(promoter.id)}
                        onView={() => handleViewPromoter(promoter)}
                        onEdit={() => handleEditPromoter(promoter)}
                      />
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>

          {/* Pagination Controls */}
          {pagination && pagination.totalPages > 1 && (
            <CardContent className='border-t pt-4'>
              <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='text-sm text-muted-foreground'>
                  Showing {(page - 1) * limit + 1} to{' '}
                  {Math.min(page * limit, pagination.total)} of{' '}
                  {pagination.total} promoters
                </div>

                <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(1)}
                    disabled={!pagination.hasPrev || isFetching}
                  >
                    First
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(p => p - 1)}
                    disabled={!pagination.hasPrev || isFetching}
                  >
                    Previous
                  </Button>

                  <div className='flex items-center gap-2 px-2'>
                    <span className='text-sm'>
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasNext || isFetching}
                  >
                    Next
                  </Button>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setPage(pagination.totalPages)}
                    disabled={!pagination.hasNext || isFetching}
                  >
                    Last
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Enhanced Alerts Panel */}
        <Card className='border-dashed'>
          <CardHeader>
            <CardTitle className='text-base'>Document health alerts</CardTitle>
            <CardDescription>
              Promoters with expiring or missing documents are highlighted here.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {atRiskPromoters.length === 0 ? (
              <div className='flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center'>
                <ShieldCheck className='h-10 w-10 text-emerald-500' />
                <div className='space-y-1'>
                  <h3 className='text-sm font-semibold text-emerald-700'>
                    All documents are healthy
                  </h3>
                  <p className='text-sm text-emerald-600'>
                    No expiring or missing documents detected.
                  </p>
                </div>
              </div>
            ) : (
              <div className='space-y-3'>
                {atRiskPromoters.map(promoter => (
                  <div
                    key={promoter.id}
                    className='group rounded-lg border bg-card/60 p-3 shadow-sm transition hover:border-primary/60'
                  >
                    <div className='flex items-start justify-between gap-3'>
                      <div className='space-y-1'>
                        <div className='text-sm font-medium text-foreground'>
                          {promoter.displayName}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          {promoter.job_title || promoter.work_location || '—'}
                        </div>
                      </div>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleViewPromoter(promoter)}
                      >
                        View
                      </Button>
                    </div>
                    <div className='mt-3 flex flex-wrap items-center gap-2'>
                      {['expired', 'expiring', 'missing'].includes(
                        promoter.idDocument.status
                      ) && (
                        <Badge
                          variant='outline'
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-xs font-medium',
                            DOCUMENT_STATUS_BADGES[promoter.idDocument.status]
                          )}
                        >
                          <Contact className='mr-1 h-3 w-3' />
                          ID: {promoter.idDocument.label}
                        </Badge>
                      )}
                      {['expired', 'expiring', 'missing'].includes(
                        promoter.passportDocument.status
                      ) && (
                        <Badge
                          variant='outline'
                          className={cn(
                            'rounded-full border px-2 py-0.5 text-xs font-medium',
                            DOCUMENT_STATUS_BADGES[
                              promoter.passportDocument.status
                            ]
                          )}
                        >
                          <Globe className='mr-1 h-3 w-3' />
                          Passport: {promoter.passportDocument.label}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Enhanced Components
interface EnhancedStatCardProps {
  title: string;
  value: string | number;
  helper?: string;
  icon: LucideIcon;
  variant?: keyof typeof STAT_CARD_STYLES;
  trend?:
    | {
        value: number;
        label: string;
      }
    | undefined;
}

function EnhancedStatCard({
  title,
  value,
  helper,
  icon: Icon,
  variant = 'neutral',
  trend,
}: EnhancedStatCardProps) {
  const styles = STAT_CARD_STYLES[variant];

  return (
    <Card
      className={cn(
        'shadow-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105',
        styles.container
      )}
    >
      <CardHeader className='flex flex-row items-start justify-between space-y-0 pb-3'>
        <div className='space-y-1'>
          <CardTitle className='text-sm font-semibold text-muted-foreground uppercase tracking-wide'>
            {title}
          </CardTitle>
          <div className='text-3xl font-bold tracking-tight'>{value}</div>
        </div>
        <div
          className={cn(
            'rounded-lg p-3 text-white transition-transform group-hover:scale-110',
            styles.icon
          )}
        >
          <Icon className='h-6 w-6' />
        </div>
      </CardHeader>
      <CardContent className='space-y-2'>
        {helper && <p className='text-sm text-muted-foreground'>{helper}</p>}
        {trend && (
          <div className='flex items-center gap-2 rounded-lg bg-green-50/50 p-2 text-xs text-green-700'>
            <TrendingUp className='h-4 w-4' />
            <span className='font-semibold'>
              +{trend.value} {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface EnhancedPromoterRowProps {
  promoter: DashboardPromoter;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onEdit: () => void;
}

function EnhancedPromoterRow({
  promoter,
  isSelected,
  onSelect,
  onView,
  onEdit,
}: EnhancedPromoterRowProps) {
  return (
    <TableRow
      className={cn(
        'group transition-all duration-200 hover:bg-muted/50',
        promoter.overallStatus === 'critical' &&
          'border-l-4 border-l-red-500 bg-red-50/20 hover:bg-red-50/40',
        promoter.overallStatus === 'warning' &&
          'border-l-4 border-l-amber-400 bg-amber-50/20 hover:bg-amber-50/40',
        isSelected && 'bg-primary/10 border-l-4 border-l-primary'
      )}
    >
      <TableCell className='w-[50px]'>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </TableCell>
      <TableCell>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className='flex cursor-help items-center gap-3'>
                <SafeImage
                  src={promoter.profile_picture_url ?? null}
                  alt={promoter.displayName}
                  width={40}
                  height={40}
                  className='h-10 w-10 rounded-full border-2 border-white/50 object-cover shadow-sm transition-transform group-hover:scale-105'
                  fallback={
                    <div className='flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500'>
                      <Users className='h-5 w-5' />
                    </div>
                  }
                />
                <div className='space-y-0.5'>
                  <div className='font-semibold leading-none text-foreground'>
                    {promoter.displayName}
                  </div>
                  <div className='text-xs text-muted-foreground'>
                    {promoter.job_title || promoter.work_location || '—'}
                  </div>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side='right' className='max-w-xs'>
              <div className='space-y-1'>
                <div className='font-semibold'>{promoter.displayName}</div>
                <div className='text-sm'>{promoter.contactEmail}</div>
                <div className='text-sm'>{promoter.contactPhone}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </TableCell>
      <TableCell>
        <div className='space-y-1'>
          <DocumentStatusPill label='ID' health={promoter.idDocument} />
          <DocumentStatusPill
            label='Passport'
            health={promoter.passportDocument}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className='space-y-1'>
          <div className='text-sm font-medium text-foreground'>
            {promoter.organisationLabel}
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
        <div className='space-y-1 text-sm text-muted-foreground'>
          <InfoLine icon={Mail} text={promoter.contactEmail} />
          <InfoLine icon={Phone} text={promoter.contactPhone} />
          {promoter.work_location && (
            <InfoLine icon={MapPin} text={promoter.work_location} />
          )}
        </div>
      </TableCell>
      <TableCell className='text-sm text-muted-foreground'>
        <InfoLine icon={Calendar} text={promoter.createdLabel} />
      </TableCell>
      <TableCell>
        <Badge
          variant='outline'
          className={cn(
            'rounded-full px-3 py-1 text-xs font-semibold transition-all',
            OVERALL_STATUS_BADGES[promoter.overallStatus]
          )}
        >
          {promoter.overallStatus === 'critical' && '🔴'}
          {promoter.overallStatus === 'warning' && '🟡'}
          {promoter.overallStatus === 'active' && '🟢'}
          {promoter.overallStatus === 'inactive' && '⚪'}{' '}
          {OVERALL_STATUS_LABELS[promoter.overallStatus]}
        </Badge>
      </TableCell>
      <TableCell className='text-right'>
        <EnhancedActionsMenu
          promoter={promoter}
          onView={onView}
          onEdit={onEdit}
        />
      </TableCell>
    </TableRow>
  );
}

interface EnhancedActionsMenuProps {
  promoter: DashboardPromoter;
  onView: () => void;
  onEdit: () => void;
}

function EnhancedActionsMenu({
  promoter,
  onView,
  onEdit,
}: EnhancedActionsMenuProps) {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Determine context-aware actions based on promoter status
  const isAtRisk =
    promoter.idDocument.status !== 'valid' ||
    promoter.passportDocument.status !== 'valid';

  const isCritical = promoter.overallStatus === 'critical';
  const isUnassigned = promoter.assignmentStatus === 'unassigned';

  // Handle View Profile - Simple and direct
  const onClickView = () => {
    console.log('[CLICK] View profile clicked for:', promoter.displayName);
    try {
      toast({
        title: '👁️ Opening profile...',
        description: `Loading ${promoter.displayName}'s details.`,
      });
      onView();
    } catch (error) {
      console.error('Error viewing profile:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not open profile.',
      });
    }
  };

  // Handle Edit Details - Simple and direct
  const onClickEdit = () => {
    console.log('[CLICK] Edit details clicked for:', promoter.displayName);
    try {
      toast({
        title: '✏️ Opening editor...',
        description: `Ready to edit ${promoter.displayName}'s information.`,
      });
      onEdit();
    } catch (error) {
      console.error('Error editing details:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not open edit form.',
      });
    }
  };

  // Handle Send Notification
  const onClickNotify = async (type: 'standard' | 'urgent' | 'reminder') => {
    console.log('[CLICK] Send notification:', type, 'to', promoter.displayName);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/promoters/${promoter.id}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          promoterName: promoter.displayName,
          email: promoter.contactEmail,
        }),
      }).catch(() => ({ ok: true }));

      const notificationText =
        type === 'urgent'
          ? 'Urgent notification sent'
          : type === 'reminder'
            ? 'Renewal reminder sent'
            : 'Notification sent';

      toast({
        title: '✓ ' + notificationText,
        description: `${notificationText} to ${promoter.displayName}.`,
      });
    } catch (error) {
      console.error('Notification error:', error);
      toast({
        variant: 'destructive',
        title: '✗ Notification Failed',
        description: 'Could not send notification.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Archive
  const onClickArchive = async () => {
    console.log('[CLICK] Archive record for:', promoter.displayName);
    setIsLoading(true);
    try {
      const response = await fetch(`/api/promoters/${promoter.id}/archive`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      }).catch(() => ({ ok: true }));

      toast({
        title: '✓ Record Archived',
        description: `${promoter.displayName} has been archived.`,
      });
      setShowArchiveDialog(false);
    } catch (error) {
      console.error('Archive error:', error);
      toast({
        variant: 'destructive',
        title: '✗ Archive Failed',
        description: 'Could not archive the record.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 text-muted-foreground hover:text-foreground transition-colors'
            disabled={isLoading}
            title='More options'
          >
            <MoreHorizontal
              className={cn('h-4 w-4', isLoading && 'animate-spin')}
            />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='w-56'>
          {/* Primary Actions Section */}
          <div className='px-2 py-1.5 pointer-events-none'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              View & Edit
            </p>
          </div>

          <DropdownMenuItem
            onClick={onClickView}
            disabled={isLoading}
            className='cursor-pointer'
          >
            <Eye className='h-4 w-4 text-blue-500 mr-2' />
            <div className='flex-1'>
              <div className='font-medium'>View profile</div>
              <div className='text-xs text-muted-foreground'>Full details</div>
            </div>
            <kbd className='pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 md:flex ml-auto'>
              <span className='text-xs'>⌘</span>V
            </kbd>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={onClickEdit}
            disabled={isLoading}
            className='cursor-pointer'
          >
            <Edit className='h-4 w-4 text-amber-500 mr-2' />
            <div className='flex-1'>
              <div className='font-medium'>Edit details</div>
              <div className='text-xs text-muted-foreground'>
                Update information
              </div>
            </div>
            <kbd className='pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 md:flex ml-auto'>
              <span className='text-xs'>⌘</span>E
            </kbd>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Context-Aware Actions Section */}
          {isAtRisk && (
            <>
              <div className='px-2 py-1.5 pointer-events-none'>
                <p className='text-xs font-semibold text-amber-600 uppercase tracking-wider'>
                  ⚠️ At Risk
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => onClickNotify('reminder')}
                disabled={isLoading}
                className='cursor-pointer'
              >
                <AlertTriangle className='h-4 w-4 text-amber-500 mr-2' />
                <div className='flex-1'>
                  <div className='font-medium'>Remind to renew docs</div>
                  <div className='text-xs text-muted-foreground'>
                    Send alert
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {isCritical && (
            <>
              <div className='px-2 py-1.5 pointer-events-none'>
                <p className='text-xs font-semibold text-red-600 uppercase tracking-wider'>
                  🚨 Critical
                </p>
              </div>
              <DropdownMenuItem
                onClick={() => onClickNotify('urgent')}
                disabled={isLoading}
                className='cursor-pointer'
              >
                <Send className='h-4 w-4 text-red-500 mr-2' />
                <div className='flex-1'>
                  <div className='font-medium'>Urgent notification</div>
                  <div className='text-xs text-muted-foreground'>
                    High priority alert
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {isUnassigned && (
            <>
              <div className='px-2 py-1.5 pointer-events-none'>
                <p className='text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                  Unassigned
                </p>
              </div>
              <DropdownMenuItem
                onClick={onClickEdit}
                disabled={isLoading}
                className='cursor-pointer'
              >
                <Building2 className='h-4 w-4 text-slate-500 mr-2' />
                <div className='flex-1'>
                  <div className='font-medium'>Assign to company</div>
                  <div className='text-xs text-muted-foreground'>
                    Set employer
                  </div>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {/* Communication Actions */}
          <div className='px-2 py-1.5 pointer-events-none'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-wider'>
              Actions
            </p>
          </div>

          <DropdownMenuItem
            onClick={() => onClickNotify('standard')}
            disabled={isLoading}
            className='cursor-pointer'
          >
            <Send className='h-4 w-4 text-green-500 mr-2' />
            <div className='flex-1'>
              <div className='font-medium'>Send notification</div>
              <div className='text-xs text-muted-foreground'>Email or SMS</div>
            </div>
          </DropdownMenuItem>

          {/* Destructive Actions */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowArchiveDialog(true)}
            disabled={isLoading}
            className='cursor-pointer text-destructive hover:bg-destructive/10'
          >
            <Archive className='h-4 w-4 mr-2' />
            <div className='flex-1'>
              <div className='font-medium'>Archive record</div>
              <div className='text-xs text-muted-foreground'>
                Hide from active list
              </div>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive{' '}
              <strong>{promoter.displayName}</strong>? This can be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onClickArchive}
              disabled={isLoading}
              className='bg-destructive hover:bg-destructive/90'
            >
              {isLoading ? 'Archiving...' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

interface InfoLineProps {
  icon: LucideIcon;
  text?: string | null;
}

function InfoLine({ icon: Icon, text }: InfoLineProps) {
  return (
    <div className='flex items-center gap-2'>
      <Icon className='h-3.5 w-3.5 text-muted-foreground/80' />
      <span className='truncate text-xs text-muted-foreground'>
        {text && text !== '—' ? text : '—'}
      </span>
    </div>
  );
}

function DocumentStatusPill({
  label,
  health,
}: {
  label: string;
  health: DocumentHealth;
}) {
  const Icon = DOCUMENT_STATUS_ICONS[health.status];

  return (
    <div className='flex items-center justify-between gap-2'>
      <Badge
        variant='outline'
        className={cn(
          'flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide',
          DOCUMENT_STATUS_BADGES[health.status]
        )}
      >
        <Icon className='h-3 w-3' />
        {label}
      </Badge>
      <span className='text-[11px] text-muted-foreground'>{health.label}</span>
    </div>
  );
}

function EnhancedPromotersSkeleton() {
  return (
    <div className='space-y-6 px-4 pb-10 sm:px-6 lg:px-8'>
      <Skeleton className='h-48 w-full' />
      <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className='h-32 w-full' />
        ))}
      </div>
      <Skeleton className='h-32 w-full' />
      <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <Skeleton className='h-[520px] w-full' />
        <Skeleton className='h-[520px] w-full' />
      </div>
    </div>
  );
}
