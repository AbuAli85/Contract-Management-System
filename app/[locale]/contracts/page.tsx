'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// ✅ CONSTANTS: Extract magic numbers for maintainability
const CONSTANTS = {
  EXPIRING_SOON_DAYS: 30,
  DEFAULT_PAGE_SIZE: 20,
  ID_DISPLAY_LENGTH: 8,
  SEARCH_DEBOUNCE_MS: 300,
  VIEW_PREFERENCE_KEY: 'contracts-view-preference',
} as const;
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { ContractWithRelations } from '@/hooks/use-contracts';
import {
  useContractsQuery,
  useDeleteContractMutation as useDeleteContractMutationQuery,
} from '@/hooks/use-contracts-query';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { CurrencyDisplay } from '@/components/ui/currency-display';
import { CurrencyIndicator } from '@/components/ui/currency-indicator';
import { useCurrencyPreference } from '@/hooks/use-currency-preference';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, parseISO, differenceInDays, isValid, parse } from 'date-fns';
import {
  Loader2,
  Eye,
  Trash2,
  Download,
  MoreHorizontal,
  Filter,
  ArrowUpDown,
  Search,
  RefreshCw,
  Grid,
  List,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Clock,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Building2,
  User,
  Edit,
  Copy,
  Archive,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Share,
  FileDown,
  Plus,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ContractStatusBadge } from '@/components/contracts/contract-status-badge';
import { useTranslations } from 'next-intl';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState, EmptySearchState } from '@/components/ui/empty-state';
import { ContractsLoadingState, PermissionsLoadingState } from '@/components/contracts/enhanced-loading-state';
import { EnhancedEmptyState } from '@/components/contracts/enhanced-empty-state';

import { FileTextIcon } from '@radix-ui/react-icons';
import { cn } from '@/lib/utils';
import { ProtectedRoute } from '@/components/protected-route';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Enhanced Contract interface
interface EnhancedContract extends ContractWithRelations {
  status_type: 'active' | 'expired' | 'upcoming' | 'unknown';
  days_until_expiry?: number;
  contract_duration_days?: number;
  age_days?: number;
}

// Statistics interface
interface ContractStats {
  total: number;
  active: number;
  expired: number;
  upcoming: number;
  unknown: number;
  pending: number; // ✅ NEW: Count of contracts with status='pending'
  draft: number; // ✅ NEW: Count of contracts with status='draft'
  processing: number; // ✅ NEW: Count of contracts with status='processing'
  expiring_soon: number;
  total_value: number;
  avg_duration: number;
}

// ✅ UTILITY: Extract party/promoter name to avoid duplication
const getLocalizedName = (
  entity: any,
  locale: string,
  fallback: string = 'N/A'
): string => {
  if (!entity || typeof entity !== 'object') return fallback;
  
  if (!('name_en' in entity)) return fallback;
  
  if (locale === 'ar') {
    return entity.name_ar || entity.name_en || fallback;
  }
  return entity.name_en || entity.name_ar || fallback;
};

// Safe date parsing functions to prevent "Invalid time value" errors
const safeParseISO = (dateString: string | null | undefined): Date | null => {
  if (!dateString || typeof dateString !== 'string') return null;
  
  try {
    const parsed = parseISO(dateString);
    if (isValid(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn('Invalid ISO date string:', dateString, error);
  }
  
  // Try alternative parsing for common formats
  try {
    const formats = ['yyyy-MM-dd', 'dd/MM/yyyy', 'MM/dd/yyyy', 'dd-MM-yyyy'];
    for (const formatStr of formats) {
      const parsed = parse(dateString, formatStr, new Date());
      if (isValid(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('Failed to parse date with alternative formats:', dateString, error);
  }
  
  return null;
};

const safeFormatDate = (dateString: string | null | undefined, formatStr: string = 'dd-MM-yyyy'): string => {
  const date = safeParseISO(dateString);
  if (!date) return 'Invalid date';
  
  try {
    return format(date, formatStr);
  } catch (error) {
    console.warn('Failed to format date:', date, error);
    return 'Invalid date';
  }
};

const safeDifferenceInDays = (dateString: string | null | undefined, compareDate: Date = new Date()): number | null => {
  const date = safeParseISO(dateString);
  if (!date) return null;
  
  try {
    return differenceInDays(date, compareDate);
  } catch (error) {
    console.warn('Failed to calculate date difference:', date, error);
    return null;
  }
};

type ContractStatus = 'draft' | 'pending' | 'processing' | 'approved' | 'Active' | 'Expired' | 'Upcoming' | 'Unknown';

function getContractStatus(contract: ContractWithRelations): ContractStatus {
  // ✅ PRIORITY 1: Use the actual database status if it exists and is a workflow status
  if (contract.status) {
    const dbStatus = contract.status.toLowerCase();
    // If status is a workflow status (draft, pending, processing, approved), use it directly
    if (['draft', 'pending', 'processing', 'approved'].includes(dbStatus)) {
      return dbStatus as ContractStatus;
    }
  }
  
  // ✅ PRIORITY 2: Calculate status based on dates (for contracts without explicit workflow status)
  if (!contract.contract_start_date || !contract.contract_end_date)
    return 'Unknown';
  const now = new Date();
  const startDate = safeParseISO(contract.contract_start_date);
  const endDate = safeParseISO(contract.contract_end_date);
  
  if (!startDate || !endDate) return 'Unknown';
  
  if (now >= startDate && now <= endDate) return 'Active';
  if (now > endDate) return 'Expired';
  if (now < startDate) return 'Upcoming';
  return 'Unknown';
}

function enhanceContract(contract: ContractWithRelations): EnhancedContract {
  const status = getContractStatus(contract);
  const now = new Date();

  let days_until_expiry: number | undefined;
  let contract_duration_days: number | undefined;
  let age_days: number | undefined;

  if (contract.contract_end_date) {
    days_until_expiry = safeDifferenceInDays(contract.contract_end_date, now) ?? undefined;
  }

  if (contract.contract_start_date && contract.contract_end_date) {
    const startDate = safeParseISO(contract.contract_start_date);
    const endDate = safeParseISO(contract.contract_end_date);
    if (startDate && endDate) {
      contract_duration_days = differenceInDays(endDate, startDate);
    }
  }

  if (contract.created_at) {
    age_days = safeDifferenceInDays(contract.created_at, now) ?? undefined;
  }

  return {
    ...contract,
    status_type: status.toLowerCase() as
      | 'active'
      | 'expired'
      | 'upcoming'
      | 'unknown',
    days_until_expiry,
    contract_duration_days,
    age_days,
  } as EnhancedContract;
}

export default function ContractsDashboardPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return <ContractsContent />;
}

function ContractsContent() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const t = useTranslations('contracts');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Add authentication check
  const { user, loading: authLoading } = useAuth();
  
  // Get user's preferred currency
  const { preferredCurrency } = useCurrencyPreference();

  // Get pagination params from URL
  const currentPage = parseInt(searchParams?.get('page') || '1', 10);
  const pageSize = parseInt(searchParams?.get('limit') || '20', 10);

  // Use React Query for data fetching with automatic caching and refetching
  const {
    data: contractsData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useContractsQuery(currentPage, pageSize);

  // Extract contracts and total count from React Query response
  const contracts = contractsData?.contracts || [];
  // Use totalContracts (actual DB count) not total (paginated results length)
  const totalCount = contractsData?.totalContracts || 0;

  // Debug: Log contract data to see promoter information
  if (contracts.length > 0 && contracts[0]) {
    console.log('🔍 Frontend - Sample contract data:', {
      contract_id: contracts[0].id,
      contract_number: contracts[0].contract_number,
      promoter_id: contracts[0].promoter_id,
      promoters: contracts[0].promoters,
      has_promoter_data: !!contracts[0].promoters
    });
  }

  // All hooks must be called at the top level, before any conditional returns
  const deleteContractMutation = useDeleteContractMutationQuery();
  const { toast } = useToast();
  const permissions = usePermissions();

  // Enhanced state management - moved before conditional returns
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  // ✅ PERSISTENCE: Load view preference from localStorage
  const [currentView, setCurrentView] = useState<'table' | 'grid'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CONSTANTS.VIEW_PREFERENCE_KEY);
      return (saved as 'table' | 'grid') || 'table';
    }
    return 'table';
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ContractStatus>(
    'all'
  );
  const [sortColumn, setSortColumn] = useState<
    keyof ContractWithRelations | 'status'
  >('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [contractToDelete, setContractToDelete] =
    useState<ContractWithRelations | null>(null);
  const [showStats, setShowStats] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [contractToEmail, setContractToEmail] =
    useState<ContractWithRelations | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // All hooks must be called before any conditional returns
  const isMountedRef = useRef(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ PERFORMANCE: Debounce search input
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, CONSTANTS.SEARCH_DEBOUNCE_MS);
    
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm]);

  // ✅ PERSISTENCE: Save view preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(CONSTANTS.VIEW_PREFERENCE_KEY, currentView);
    }
  }, [currentView]);

  // Calculate statistics BEFORE permission check
  const contractStats = useMemo((): ContractStats => {
    if (!contracts || !Array.isArray(contracts))
      return {
        total: 0,
        active: 0,
        expired: 0,
        upcoming: 0,
        unknown: 0,
        pending: 0,
        draft: 0,
        processing: 0,
        expiring_soon: 0,
        total_value: 0,
        avg_duration: 0,
      };

    try {
      const enhanced = contracts.map(enhanceContract);
      const now = new Date();

      // ✅ Count actual workflow statuses from database
      const pendingCount = enhanced.filter(c => getContractStatus(c) === 'pending').length;
      const draftCount = enhanced.filter(c => getContractStatus(c) === 'draft').length;
      const processingCount = enhanced.filter(c => getContractStatus(c) === 'processing').length;

      return {
        // Use totalCount (actual DB total) not enhanced.length (paginated results)
        total: totalCount,
        active: enhanced.filter(c => c.status_type === 'active').length,
        expired: enhanced.filter(c => c.status_type === 'expired').length,
        upcoming: enhanced.filter(c => c.status_type === 'upcoming').length,
        unknown: enhanced.filter(c => c.status_type === 'unknown').length,
        pending: pendingCount, // ✅ FIX: Actual pending contracts
        draft: draftCount, // ✅ NEW: Draft contracts
        processing: processingCount, // ✅ NEW: Processing contracts
        expiring_soon: enhanced.filter(
          c =>
            c.days_until_expiry !== undefined &&
            c.days_until_expiry > 0 &&
            c.days_until_expiry <= CONSTANTS.EXPIRING_SOON_DAYS
        ).length,
        total_value: enhanced.reduce(
          (sum, c) => sum + (c.contract_value || 0),
          0
        ),
        avg_duration:
          enhanced.reduce(
            (sum, c) => sum + (c.contract_duration_days || 0),
            0
          ) / enhanced.length || 0,
      };
    } catch (error) {
      console.error('Error calculating contract stats:', error);
      return {
        total: 0,
        active: 0,
        expired: 0,
        upcoming: 0,
        unknown: 0,
        pending: 0,
        draft: 0,
        processing: 0,
        expiring_soon: 0,
        total_value: 0,
        avg_duration: 0,
      };
    }
  }, [contracts, totalCount]);

  // Enhanced filtering and sorting (no client-side pagination, data is already paginated from API)
  const filteredAndSortedContracts = useMemo(() => {
    if (!contracts || !Array.isArray(contracts)) return [];

    try {
      const enhanced = contracts.map(enhanceContract);

      const filtered = enhanced.filter(contract => {
        const contractStatus = getContractStatus(contract);
        const matchesStatus =
          statusFilter === 'all' || contractStatus === statusFilter;

        // ✅ REFACTOR: Use utility function for name extraction
        const firstParty = getLocalizedName(contract.first_party, locale);
        const secondParty = getLocalizedName(contract.second_party, locale);
        const promoterName = getLocalizedName(contract.promoters, locale);

        // ✅ PERFORMANCE: Use debounced search term
        const matchesSearch =
          !debouncedSearchTerm ||
          contract.id.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          firstParty.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          secondParty.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (promoterName || '').toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          (contract.job_title &&
            contract.job_title
              .toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase())) ||
          (contract.contract_number &&
            contract.contract_number
              .toLowerCase()
              .includes(debouncedSearchTerm.toLowerCase()));

        return matchesStatus && matchesSearch;
      });

      const sorted = filtered.sort((a, b) => {
        let valA, valB;
        if (sortColumn === 'status') {
          valA = getContractStatus(a);
          valB = getContractStatus(b);
        } else {
          valA = a[sortColumn as keyof ContractWithRelations];
          valB = b[sortColumn as keyof ContractWithRelations];
        }

        if (valA === null || valA === undefined) valA = '';
        if (valB === null || valB === undefined) valB = '';

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortDirection === 'asc'
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        }
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortDirection === 'asc' ? valA - valB : valB - valA;
        }
        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });

      return sorted;
    } catch (error) {
      console.error('Error filtering and sorting contracts:', error);
      return [];
    }
  }, [
    contracts,
    debouncedSearchTerm, // ✅ Use debounced version
    statusFilter,
    sortColumn,
    sortDirection,
    locale,
  ]);

  // Handler functions - moved BEFORE permission check
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast({
        title: '✅ Data Refreshed',
        description: `Updated ${contracts.length} contracts successfully`,
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: '❌ Refresh Failed',
        description: 'Failed to update contract data',
        variant: 'destructive',
      });
    }
  }, [refetch, toast, contracts.length]);

  const handleSort = (column: keyof ContractWithRelations | 'status') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    // Reset to first page when sorting changes
    const params = new URLSearchParams(searchParams?.toString() || '');
    params.set('page', '1');
    router.push(`${window.location.pathname}?${params.toString()}`);
  };

  // Reset pagination when search or filter changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (params.get('page') !== '1') {
      params.set('page', '1');
      router.push(`${window.location.pathname}?${params.toString()}`);
    }
  }, [debouncedSearchTerm, statusFilter, searchParams, router]); // ✅ Use debounced version

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedContracts(filteredAndSortedContracts.map(c => c.id));
    } else {
      setSelectedContracts([]);
    }
  };

  const handleSelectContract = (contractId: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts(prev => [...prev, contractId]);
    } else {
      setSelectedContracts(prev => prev.filter(id => id !== contractId));
    }
  };

  const handleBulkDelete = async () => {
    setBulkActionLoading(true);
    try {
      await Promise.all(
        selectedContracts.map(id => deleteContractMutation.mutateAsync(id))
      );
      toast({
        title: 'Success',
        description: `Deleted ${selectedContracts.length} contracts`,
        variant: 'default',
      });
      setSelectedContracts([]);
    } catch (error) {
      console.error('Error deleting contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete contracts',
        variant: 'destructive',
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleDownloadContract = async (contract: ContractWithRelations) => {
    if (!contract.pdf_url) {
      toast({
        title: 'No PDF Available',
        description: 'This contract does not have a PDF file yet.',
        variant: 'destructive',
      });
      return;
    }

    setIsDownloading(contract.id);
    try {
      const response = await fetch(contract.pdf_url);
      if (!response.ok) throw new Error('Failed to download PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${contract.contract_number || contract.id}-contract.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: '✅ Download Successful',
        description: 'Contract PDF downloaded successfully',
        variant: 'default',
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: '❌ Download Failed',
        description: 'Failed to download contract PDF',
        variant: 'destructive',
      });
    } finally {
      setIsDownloading(null);
    }
  };

  const handleEmailContract = (contract: ContractWithRelations) => {
    setContractToEmail(contract);
    setShowEmailDialog(true);
  };

  const handleSendEmail = async (emailData: {
    to: string;
    subject: string;
    message: string;
  }) => {
    if (!contractToEmail) return;

    setIsSendingEmail(true);
    try {
      const response = await fetch('/api/contracts/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: contractToEmail.id,
          to: emailData.to,
          subject: emailData.subject,
          message: emailData.message,
          pdfUrl: contractToEmail.pdf_url,
        }),
      });

      if (!response.ok) throw new Error('Failed to send email');

      toast({
        title: '✅ Email Sent',
        description: `Contract sent to ${emailData.to} successfully`,
        variant: 'default',
      });

      setShowEmailDialog(false);
      setContractToEmail(null);
    } catch (error) {
      console.error('Email error:', error);
      toast({
        title: '❌ Email Failed',
        description: 'Failed to send contract email',
        variant: 'destructive',
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvData = filteredAndSortedContracts.map(contract => ({
        'Contract ID': contract.id,
        'Contract Number': contract.contract_number || 'N/A',
        'First Party':
          contract.first_party &&
          typeof contract.first_party === 'object' &&
          'name_en' in contract.first_party
            ? contract.first_party.name_en || 'N/A'
            : 'N/A',
        'Second Party':
          contract.second_party &&
          typeof contract.second_party === 'object' &&
          'name_en' in contract.second_party
            ? contract.second_party.name_en || 'N/A'
            : 'N/A',
        Promoter:
          contract.promoters && typeof contract.promoters === 'object'
            ? contract.promoters.name_en || 'N/A'
            : 'N/A',
        'Job Title': contract.job_title || 'N/A',
        'Start Date': safeFormatDate(contract.contract_start_date, 'dd-MM-yyyy'),
        'End Date': safeFormatDate(contract.contract_end_date, 'dd-MM-yyyy'),
        Status: getContractStatus(contract),
        'Contract Value': contract.contract_value || 0,
        'Work Location': contract.work_location || 'N/A',
        Email: contract.email || 'N/A',
        'PDF URL': contract.pdf_url || 'N/A',
        'Created At': safeFormatDate(contract.created_at, 'dd-MM-yyyy'),
        'Days Until Expiry': contract.days_until_expiry || 'N/A',
        'Contract Duration (Days)': contract.contract_duration_days || 'N/A',
      }));

      // Create CSV with proper escaping and BOM for Excel compatibility
      const escapeCSVValue = (val: any): string => {
        if (val === null || val === undefined) return '';
        const str = String(val);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (
          str.includes(',') ||
          str.includes('"') ||
          str.includes('\n') ||
          str.includes('\r')
        ) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      const csv = [
        Object.keys(csvData[0] || {})
          .map(escapeCSVValue)
          .join(','),
        ...csvData.map(row => Object.values(row).map(escapeCSVValue).join(',')),
      ].join('\n');

      // Add BOM for proper UTF-8 encoding in Excel
      const csvWithBOM = '\uFEFF' + csv;

      const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `contracts-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({
        title: '✅ Export Successful',
        description: `Exported ${csvData.length} contracts to CSV`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: '❌ Export Failed',
        description: 'Failed to export contracts',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteClick = (contract: ContractWithRelations) => {
    setContractToDelete(contract);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!contractToDelete) return;
    try {
      await deleteContractMutation.mutateAsync(contractToDelete.id);
      toast({
        title: 'Success',
        description: 'Contract deleted successfully.',
      });
    } catch (e: any) {
      toast({
        title: 'Error',
        description: `Failed to delete contract: ${e.message}`,
        variant: 'destructive',
      });
    } finally {
      setShowDeleteConfirm(false);
      setContractToDelete(null);
    }
  };

  const renderSortIcon = (column: keyof ContractWithRelations | 'status') => {
    if (sortColumn === column) {
      return sortDirection === 'asc' ? (
        <ChevronUp className='ml-2 inline h-4 w-4' />
      ) : (
        <ChevronDown className='ml-2 inline h-4 w-4' />
      );
    }
    return <ArrowUpDown className='ml-2 inline h-4 w-4 opacity-50' />;
  };

  const getStatusBadge = (status: ContractStatus) => {
    // Map old statuses to new workflow statuses
    const statusMap: Record<string, string> = {
      'Active': 'active',
      'Expired': 'expired', 
      'Upcoming': 'pending',
      'Unknown': 'draft',
    };
    
    const mappedStatus = statusMap[status] || status.toLowerCase();
    
    return (
      <ContractStatusBadge 
        status={mappedStatus as any} 
        size="sm"
      />
    );
  };

  // Enhanced Statistics cards component
  const StatisticsCards = () => (
    <div className='grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8'>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className='bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 cursor-help'>
              <CardContent className='p-4'>
                <div className='flex items-center justify-between'>
                  <div>
                    <div className='flex items-center gap-1'>
                      <p className='text-sm text-blue-100 font-medium'>
                        Total Contracts
                      </p>
                      <Info className='h-3 w-3 text-blue-200' />
                    </div>
                    <p className='text-2xl font-bold'>{contractStats.total}</p>
                    <p className='text-xs text-blue-200 mt-1'>
                      {totalCount === contractStats.total 
                        ? 'All contracts in database' 
                        : `Showing ${contracts.length} of ${contractStats.total}`}
                    </p>
                  </div>
                  <div className='p-2 bg-blue-400/20 rounded-lg'>
                    <FileText className='h-6 w-6 text-blue-200' />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p className='max-w-xs'>
              Total number of contracts. Based on your access level, you see:
              <br />• Admins: All contracts in system
              <br />• Users: Only your own contracts
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Card className='bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-green-100 font-medium'>Active</p>
              <p className='text-2xl font-bold'>{contractStats.active}</p>
              <p className='text-xs text-green-200 mt-1'>Currently active</p>
            </div>
            <div className='p-2 bg-green-400/20 rounded-lg'>
              <CheckCircle className='h-6 w-6 text-green-200' />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-amber-100 font-medium'>
                Expiring Soon
              </p>
              <p className='text-2xl font-bold'>
                {contractStats.expiring_soon}
              </p>
              <p className='text-xs text-amber-200 mt-1'>Within 30 days</p>
            </div>
            <div className='p-2 bg-amber-400/20 rounded-lg'>
              <AlertTriangle className='h-6 w-6 text-amber-200' />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-gradient-to-br from-red-500 via-red-600 to-red-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-red-100 font-medium'>Expired</p>
              <p className='text-2xl font-bold'>{contractStats.expired}</p>
              <p className='text-xs text-red-200 mt-1'>Past end date</p>
            </div>
            <div className='p-2 bg-red-400/20 rounded-lg'>
              <XCircle className='h-6 w-6 text-red-200' />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-purple-100 font-medium'>Pending</p>
              <p className='text-2xl font-bold'>{contractStats.pending}</p>
              <p className='text-xs text-purple-200 mt-1'>Awaiting approval</p>
            </div>
            <div className='p-2 bg-purple-400/20 rounded-lg'>
              <Clock className='h-6 w-6 text-purple-200' />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-gradient-to-br from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-indigo-100 font-medium'>Total Value</p>
              <p className='text-lg font-bold'>
                <CurrencyDisplay
                  amount={contractStats.total_value}
                  currency="USD"
                  displayCurrency={preferredCurrency}
                  showTooltip={true}
                  className="text-white"
                />
              </p>
              <p className='text-xs text-indigo-200 mt-1'>All contracts</p>
            </div>
            <div className='p-2 bg-blue-400/20 rounded-lg'>
              <TrendingUp className='h-6 w-6 text-indigo-200' />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-gradient-to-br from-pink-500 via-pink-600 to-pink-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-pink-100 font-medium'>Avg Duration</p>
              <p className='text-lg font-bold'>
                {Math.round(contractStats.avg_duration)}d
              </p>
              <p className='text-xs text-pink-200 mt-1'>Days</p>
            </div>
            <div className='p-2 bg-pink-400/20 rounded-lg'>
              <Calendar className='h-6 w-6 text-pink-200' />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className='bg-gradient-to-br from-gray-500 via-gray-600 to-gray-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-gray-100 font-medium'>Generated</p>
              <p className='text-2xl font-bold'>{contractStats.unknown}</p>
              <p className='text-xs text-gray-200 mt-1'>Recently created</p>
            </div>
            <div className='p-2 bg-gray-400/20 rounded-lg'>
              <Activity className='h-6 w-6 text-gray-200' />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // NOW we can check permissions and return early if needed
  if (permissions.isLoading) {
    return <PermissionsLoadingState />;
  }

  // Role-based access control - NOW CALLED AFTER ALL HOOKS
  const canCreateContract = permissions.canCreateContract();
  const canEditContract = permissions.canEditContract();
  const canDeleteContract = permissions.canDeleteContract();
  const canExportContracts = permissions.canExportContracts();
  const canGenerateContract = permissions.canGenerateContract();

  if (isLoading) {
    return (
      <div className='space-y-6 p-4 md:p-6 loading-fade-in'>
        <ContractsLoadingState />
      </div>
    );
  }

  if (error) {
    return (
      <div className='space-y-6 p-4 md:p-6'>
        <Card className='border-destructive'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-destructive'>
              <AlertTriangle className='h-5 w-5' />
              Error Loading Contracts
            </CardTitle>
            <CardDescription>
              There was a problem loading your contracts. Please try again or
              contact support if the issue persists.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <div className='space-y-2'>
                  <p className='font-medium'>{error?.message || error?.toString() || 'Unknown error'}</p>
                  {process.env.NODE_ENV === 'development' && (
                    <details className='mt-2'>
                      <summary className='cursor-pointer text-sm font-medium text-muted-foreground'>
                        Debug Information
                      </summary>
                      <div className='mt-2 rounded bg-muted p-3 text-xs font-mono'>
                        <p>Error: {error?.message || error?.toString()}</p>
                        <p>Timestamp: {new Date().toISOString()}</p>
                        <p>
                          User Agent:{' '}
                          {typeof window !== 'undefined'
                            ? window.navigator.userAgent
                            : 'Server-side'}
                        </p>
                        <p>
                          URL:{' '}
                          {typeof window !== 'undefined'
                            ? window.location.href
                            : 'Server-side'}
                        </p>
                      </div>
                    </details>
                  )}
                </div>
              </AlertDescription>
            </Alert>

            <div className='flex gap-2'>
              <Button
                onClick={() => refetch()}
                className='flex items-center gap-2'
              >
                <RefreshCw className='h-4 w-4' />
                Try Again
              </Button>
              <Button
                variant='outline'
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
              <Button
                variant='outline'
                onClick={() => (window.location.href = `/${locale}/dashboard`)}
              >
                Go to Dashboard
              </Button>
            </div>

            <div className='text-sm text-muted-foreground'>
              <p>If this error persists, try:</p>
              <ul className='list-disc list-inside mt-1 space-y-1'>
                <li>Checking your internet connection</li>
                <li>Refreshing the page</li>
                <li>Clearing your browser cache</li>
                <li>Contacting support if the issue continues</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <main className='space-y-6 p-4 md:p-6'>
      {/* Page Header */}
      <header className='mb-6'>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          {t('dashboard.title')}
        </h1>
        <p className='text-gray-600 dark:text-gray-400 mt-2'>
          {t('dashboard.description')}
        </p>
      </header>

      {/* Currency Indicator */}
      <div className='mb-4'>
        <CurrencyIndicator currency={preferredCurrency} />
      </div>

      {/* Statistics Cards */}
      {showStats && (
        <section className='mb-6' aria-labelledby='stats-heading'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 id='stats-heading' className='text-lg font-semibold'>
              {t('dashboard.statistics')}
            </h2>
                  <Button
                    variant='ghost'
                    size='sm'
                    onClick={() => setShowStats(!showStats)}
                    aria-label={showStats ? 'Hide statistics' : 'Show statistics'}
                  >
                    {showStats ? tCommon('close') : tCommon('view')}
                  </Button>
          </div>
          <StatisticsCards />
        </section>
      )}

      <section aria-labelledby='contracts-heading'>
          <Card>
            <CardHeader>
              <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                  <CardTitle id='contracts-heading' className='flex items-center gap-2'>
                    <FileText className='h-5 w-5' aria-hidden='true' />
                    {t('dashboard.allContracts')}
                  </CardTitle>
                  <CardDescription>
                    {t('dashboard.description')}
                  </CardDescription>
                </div>

              <div className='flex items-center gap-2'>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={handleRefresh}
                        disabled={isFetching}
                        className='hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:border-blue-800 transition-colors duration-200'
                      >
                        <RefreshCw
                          className={cn(
                            'h-4 w-4',
                            isFetching && 'animate-spin text-blue-600'
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh data</p>
                      {isFetching && !isLoading && (
                        <p className='text-xs text-gray-400'>
                          Updating in background...
                        </p>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={() =>
                          setCurrentView(
                            currentView === 'table' ? 'grid' : 'table'
                          )
                        }
                      >
                        {currentView === 'table' ? (
                          <Grid className='h-4 w-4' />
                        ) : (
                          <List className='h-4 w-4' />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Toggle view</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {canExportContracts && (
                  <Button
                    variant='outline'
                    onClick={handleExportCSV}
                    disabled={isExporting}
                  >
                    {isExporting ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Download className='mr-2 h-4 w-4' />
                    )}
                    Export CSV
                  </Button>
                )}

                {canCreateContract && (
                  <Button asChild>
                    <Link href={`/${locale}/dashboard/generate-contract`}>
                      Create New Contract
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className='space-y-4'>
            {/* Filters and Search */}
            <div className='flex flex-col items-center gap-4 md:flex-row'>
              <div className='relative w-full flex-grow md:w-auto'>
                <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
                <Input
                  type='search'
                  placeholder='Search by ID, parties, promoter, job title...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-full pl-8'
                />
              </div>
              <div className='flex w-full items-center gap-2 md:w-auto'>
                <Filter className='h-5 w-5 text-muted-foreground' />
                <Select
                  value={statusFilter}
                  onValueChange={value =>
                    setStatusFilter(value as 'all' | ContractStatus)
                  }
                >
                  <SelectTrigger className='w-full md:w-[180px]'>
                    <SelectValue placeholder='Filter by status' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Statuses</SelectItem>
                    <SelectItem value='draft'>Draft</SelectItem>
                    <SelectItem value='pending'>Pending</SelectItem>
                    <SelectItem value='processing'>Processing</SelectItem>
                    <SelectItem value='Active'>Active</SelectItem>
                    <SelectItem value='Expired'>Expired</SelectItem>
                    <SelectItem value='Upcoming'>Upcoming</SelectItem>
                    <SelectItem value='approved'>Approved</SelectItem>
                    <SelectItem value='Unknown'>Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedContracts.length > 0 && canDeleteContract && (
              <div className='flex items-center gap-2 rounded-lg bg-muted p-3'>
                <span className='text-sm font-medium'>
                  {selectedContracts.length} contract(s) selected
                </span>
                <Button
                  variant='destructive'
                  size='sm'
                  onClick={handleBulkDelete}
                  disabled={bulkActionLoading}
                >
                  {bulkActionLoading ? (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  ) : (
                    <Trash2 className='mr-2 h-4 w-4' />
                  )}
                  Delete Selected
                </Button>
              </div>
            )}

            {/* Content */}
            {filteredAndSortedContracts.length === 0 ? (
              searchTerm || statusFilter !== 'all' ? (
                <EmptySearchState
                  searchTerm={searchTerm || `status: ${statusFilter}`}
                  onClearSearch={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                />
              ) : canCreateContract ? (
                <EmptyState
                  icon={FileText}
                  title={t('dashboard.noContractsFound')}
                  description={t('dashboard.noContractsDescription')}
                  action={{
                    label: t('dashboard.createNewContract'),
                    href: `/${locale}/dashboard/generate-contract`,
                  }}
                  secondaryAction={{
                    label: 'Learn More',
                    href: `/${locale}/help`,
                  }}
                />
              ) : (
                <EmptyState
                  icon={FileText}
                  title={t('dashboard.noContractsFound')}
                  description={t('dashboard.noContractsDescription')}
                  secondaryAction={{
                    label: 'Learn More',
                    href: `/${locale}/help`,
                  }}
                />
              )
            ) : currentView === 'table' ? (
              <>
                <div className='overflow-x-auto'>
                  <Table role='table' aria-label='Contracts table'>
                    <TableHeader>
                      <TableRow>
                        <TableHead className='w-12' scope='col'>
                          {canDeleteContract && (
                            <Checkbox
                              checked={
                                selectedContracts.length ===
                                filteredAndSortedContracts.length
                              }
                              onCheckedChange={handleSelectAll}
                              aria-label='Select all contracts'
                            />
                          )}
                        </TableHead>
                        <TableHead
                          className='cursor-pointer'
                          onClick={() => handleSort('id')}
                          scope='col'
                          aria-sort={sortColumn === 'id' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          Contract ID {renderSortIcon('id')}
                        </TableHead>
                        <TableHead scope='col'>First Party</TableHead>
                        <TableHead scope='col'>Second Party</TableHead>
                        <TableHead scope='col'>Promoter</TableHead>
                        <TableHead
                          className='cursor-pointer'
                          onClick={() => handleSort('contract_start_date')}
                          scope='col'
                          aria-sort={sortColumn === 'contract_start_date' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          Start Date {renderSortIcon('contract_start_date')}
                        </TableHead>
                        <TableHead
                          className='cursor-pointer'
                          onClick={() => handleSort('contract_end_date')}
                          scope='col'
                          aria-sort={sortColumn === 'contract_end_date' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          End Date {renderSortIcon('contract_end_date')}
                        </TableHead>
                        <TableHead
                          className='cursor-pointer'
                          onClick={() => handleSort('status')}
                          scope='col'
                          aria-sort={sortColumn === 'status' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                        >
                          Status {renderSortIcon('status')}
                        </TableHead>
                        <TableHead scope='col'>PDF</TableHead>
                        <TableHead className='text-right' scope='col'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAndSortedContracts.map(contract => {
                        const contractStatus = getContractStatus(contract);
                        const enhanced = enhanceContract(contract);
                        const promoterName: string = contract.promoters
                          ? locale === 'ar'
                            ? contract.promoters.name_ar ||
                              contract.promoters.name_en || ''
                            : contract.promoters.name_en ||
                              contract.promoters.name_ar || ''
                          : '';
                        return (
                          <TableRow
                            key={contract.id}
                            className='group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors duration-200'
                          >
                            <TableCell className='py-4'>
                              {canDeleteContract && (
                                <Checkbox
                                  checked={selectedContracts.includes(
                                    contract.id
                                  )}
                                  onCheckedChange={checked =>
                                    handleSelectContract(
                                      contract.id,
                                      checked as boolean
                                    )
                                  }
                                  className='data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                                  aria-label={`Select contract ${contract.id.substring(0, 8)}`}
                                />
                              )}
                            </TableCell>
                            <TableCell className='py-4'>
                              <div className='flex items-center gap-2'>
                                <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger className='font-mono text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors'>
                                      {contract.id.substring(0, 8)}...
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className='font-mono text-xs'>
                                        Full ID: {contract.id}
                                      </p>
                                      <p className='text-xs text-gray-400 mt-1'>
                                        Click to copy
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900'>
                                  <Building2 className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                                </div>
                                <span>
                                  {contract.first_party &&
                                  typeof contract.first_party === 'object' &&
                                  'name_en' in contract.first_party
                                    ? locale === 'ar'
                                      ? contract.first_party.name_ar ||
                                        contract.first_party.name_en ||
                                        'N/A'
                                      : contract.first_party.name_en ||
                                        contract.first_party.name_ar ||
                                        'N/A'
                                    : 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900'>
                                  <Building2 className='h-4 w-4 text-green-600 dark:text-green-400' />
                                </div>
                                <span>
                                  {contract.second_party &&
                                  typeof contract.second_party === 'object' &&
                                  'name_en' in contract.second_party
                                    ? locale === 'ar'
                                      ? contract.second_party.name_ar ||
                                        contract.second_party.name_en ||
                                        'N/A'
                                      : contract.second_party.name_en ||
                                        contract.second_party.name_ar ||
                                        'N/A'
                                    : 'N/A'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <div className='flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900'>
                                  <User className='h-4 w-4 text-purple-600 dark:text-purple-400' />
                                </div>
                                <span>{promoterName || 'N/A'}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {safeFormatDate(contract.contract_start_date, 'dd-MM-yyyy')}
                            </TableCell>
                            <TableCell>
                              <div className='flex flex-col'>
                                <span>
                                  {safeFormatDate(contract.contract_end_date, 'dd-MM-yyyy')}
                                </span>
                                {enhanced.days_until_expiry !== undefined &&
                                  enhanced.days_until_expiry <= 30 &&
                                  enhanced.days_until_expiry > 0 && (
                                    <span className='text-xs font-medium text-amber-600'>
                                      {enhanced.days_until_expiry} days left
                                    </span>
                                  )}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(contractStatus)}
                            </TableCell>
                            <TableCell className='py-4'>
                              {contract.pdf_url ? (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() =>
                                          handleDownloadContract(contract)
                                        }
                                        disabled={isDownloading === contract.id}
                                        className='inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800 text-green-600 dark:text-green-400 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
                                        title='Download contract PDF'
                                      >
                                        {isDownloading === contract.id ? (
                                          <Loader2 className='h-4 w-4 animate-spin' />
                                        ) : (
                                          <Download className='h-4 w-4' />
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Download PDF</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              ) : (
                                <div className='inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400'>
                                  <FileText className='h-4 w-4' />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className='text-right py-4'>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant='ghost'
                                    size='icon'
                                    className='opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                                  >
                                    <MoreHorizontal className='h-4 w-4' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align='end'>
                                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  <Link
                                    href={`/${locale}/contracts/${contract.id}`}
                                  >
                                    <DropdownMenuItem>
                                      <Eye className='mr-2 h-4 w-4' /> View
                                      Details
                                    </DropdownMenuItem>
                                  </Link>
                                  {contract.pdf_url && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleDownloadContract(contract)
                                      }
                                    >
                                      <FileDown className='mr-2 h-4 w-4' />{' '}
                                      Download PDF
                                    </DropdownMenuItem>
                                  )}
                                  {contract.pdf_url && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handleEmailContract(contract)
                                      }
                                    >
                                      <Mail className='mr-2 h-4 w-4' /> Send via
                                      Email
                                    </DropdownMenuItem>
                                  )}
                                  {canEditContract && (
                                    <DropdownMenuItem>
                                      <Edit className='mr-2 h-4 w-4' /> Edit
                                    </DropdownMenuItem>
                                  )}
                                  {canCreateContract && (
                                    <DropdownMenuItem>
                                      <Copy className='mr-2 h-4 w-4' />{' '}
                                      Duplicate
                                    </DropdownMenuItem>
                                  )}
                                  {canEditContract && (
                                    <DropdownMenuItem>
                                      <Archive className='mr-2 h-4 w-4' />{' '}
                                      Archive
                                    </DropdownMenuItem>
                                  )}
                                  {canDeleteContract && (
                                    <>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        onClick={() =>
                                          handleDeleteClick(contract)
                                        }
                                        className='text-red-600 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-700/20'
                                      >
                                        <Trash2 className='mr-2 h-4 w-4' />{' '}
                                        Delete
                                      </DropdownMenuItem>
                                    </>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination Controls */}
                <div className='px-2 py-4 border-t'>
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalCount / pageSize)}
                    pageSize={pageSize}
                    totalItems={totalCount}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Grid View */}
                <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
                  {filteredAndSortedContracts.map(contract => {
                    const contractStatus = getContractStatus(contract);
                    const enhanced = enhanceContract(contract);
                    const promoterName: string = contract.promoters
                      ? locale === 'ar'
                        ? contract.promoters.name_ar ||
                          contract.promoters.name_en || ''
                        : contract.promoters.name_en ||
                          contract.promoters.name_ar || ''
                      : '';

                    return (
                      <Card
                        key={contract.id}
                        className='group transition-shadow hover:shadow-md'
                      >
                        <CardContent className='p-4'>
                          <div className='mb-3 flex items-start justify-between'>
                            <div className='flex items-center gap-2'>
                              {canDeleteContract && (
                                <Checkbox
                                  checked={selectedContracts.includes(
                                    contract.id
                                  )}
                                  onCheckedChange={checked =>
                                    handleSelectContract(
                                      contract.id,
                                      checked as boolean
                                    )
                                  }
                                />
                              )}
                              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600'>
                                <FileText className='h-5 w-5 text-white' />
                              </div>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant='ghost'
                                  size='icon'
                                  className='opacity-0 group-hover:opacity-100'
                                >
                                  <MoreHorizontal className='h-4 w-4' />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align='end'>
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <Link
                                  href={`/${locale}/contracts/${contract.id}`}
                                >
                                  <DropdownMenuItem>
                                    <Eye className='mr-2 h-4 w-4' /> View
                                    Details
                                  </DropdownMenuItem>
                                </Link>
                                {contract.pdf_url && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleDownloadContract(contract)
                                    }
                                  >
                                    <FileDown className='mr-2 h-4 w-4' />{' '}
                                    Download PDF
                                  </DropdownMenuItem>
                                )}
                                {contract.pdf_url && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleEmailContract(contract)
                                    }
                                  >
                                    <Mail className='mr-2 h-4 w-4' /> Send via
                                    Email
                                  </DropdownMenuItem>
                                )}
                                {canEditContract && (
                                  <DropdownMenuItem>
                                    <Edit className='mr-2 h-4 w-4' /> Edit
                                  </DropdownMenuItem>
                                )}
                                {canDeleteContract && (
                                  <DropdownMenuItem
                                    onClick={() => handleDeleteClick(contract)}
                                    className='text-red-600'
                                  >
                                    <Trash2 className='mr-2 h-4 w-4' /> Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className='space-y-2'>
                            <div className='flex items-center justify-between'>
                              <h3 className='text-sm font-medium'>
                                Contract #{contract.id.substring(0, 8)}...
                              </h3>
                              {getStatusBadge(contractStatus)}
                            </div>

                            <div className='space-y-1 text-sm text-muted-foreground'>
                              <div className='flex items-center gap-1'>
                                <Building2 className='h-3 w-3' />
                                <span className='font-medium'>
                                  First Party:
                                </span>
                                <span>
                                  {contract.first_party &&
                                  typeof contract.first_party === 'object' &&
                                  'name_en' in contract.first_party
                                    ? contract.first_party.name_en || 'N/A'
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className='flex items-center gap-1'>
                                <Building2 className='h-3 w-3' />
                                <span className='font-medium'>
                                  Second Party:
                                </span>
                                <span>
                                  {contract.second_party &&
                                  typeof contract.second_party === 'object' &&
                                  'name_en' in contract.second_party
                                    ? contract.second_party.name_en || 'N/A'
                                    : 'N/A'}
                                </span>
                              </div>
                              <div className='flex items-center gap-1'>
                                <User className='h-3 w-3' />
                                <span className='font-medium'>Promoter:</span>
                                <span>{promoterName || 'N/A'}</span>
                              </div>
                            </div>

                            <div className='flex items-center justify-between border-t pt-2'>
                              <div className='text-xs text-muted-foreground'>
                                {contract.contract_start_date &&
                                  contract.contract_end_date && (
                                    <>
                                      {safeFormatDate(contract.contract_start_date, 'dd-MM-yyyy')}{' '}
                                      -{' '}
                                      {safeFormatDate(contract.contract_end_date, 'dd-MM-yyyy')}
                                      {enhanced.days_until_expiry !==
                                        undefined &&
                                        enhanced.days_until_expiry <= 30 &&
                                        enhanced.days_until_expiry > 0 && (
                                          <div className='font-medium text-amber-600'>
                                            {enhanced.days_until_expiry} days
                                            left
                                          </div>
                                        )}
                                    </>
                                  )}
                              </div>
                              <div className='flex items-center gap-2'>
                                {contract.pdf_url && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() =>
                                            handleDownloadContract(contract)
                                          }
                                          disabled={
                                            isDownloading === contract.id
                                          }
                                          className='text-primary hover:text-primary/80 transition-colors disabled:opacity-50'
                                          title='Download contract PDF'
                                        >
                                          {isDownloading === contract.id ? (
                                            <Loader2 className='h-4 w-4 animate-spin' />
                                          ) : (
                                            <Download className='h-4 w-4' />
                                          )}
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Download PDF</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {contract.pdf_url && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <button
                                          onClick={() =>
                                            handleEmailContract(contract)
                                          }
                                          className='text-primary hover:text-primary/80 transition-colors'
                                          title='Send via email'
                                        >
                                          <Mail className='h-4 w-4' />
                                        </button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Send via Email</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Pagination Controls for Grid View */}
                <div className='px-2 py-4 border-t'>
                  <PaginationControls
                    currentPage={currentPage}
                    totalPages={Math.ceil(totalCount / pageSize)}
                    pageSize={pageSize}
                    totalItems={totalCount}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
        </section>
      </main>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              contract "{contractToDelete?.id.substring(0, 8)}...".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setContractToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteContractMutation.isPending}
              className='bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600'
            >
              {deleteContractMutation.isPending && (
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Email Dialog */}
      <EmailDialog
        open={showEmailDialog}
        onOpenChange={setShowEmailDialog}
        contract={contractToEmail}
        onSend={handleSendEmail}
        isSending={isSendingEmail}
      />
    </>
  );
}

// Email Dialog Component
interface EmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: ContractWithRelations | null;
  onSend: (data: { to: string; subject: string; message: string }) => void;
  isSending: boolean;
}

function EmailDialog({
  open,
  onOpenChange,
  contract,
  onSend,
  isSending,
}: EmailDialogProps) {
  const [to, setTo] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    if (contract && open) {
      // Auto-populate email fields
      const firstPartyEmail =
        contract.first_party &&
        typeof contract.first_party === 'object' &&
        'email' in contract.first_party
          ? (contract.first_party.email as string) || ''
          : '';
      const secondPartyEmail =
        contract.second_party &&
        typeof contract.second_party === 'object' &&
        'email' in contract.second_party
          ? (contract.second_party.email as string) || ''
          : '';

      setTo(firstPartyEmail || secondPartyEmail || '');
      setSubject(
        `Contract ${contract.contract_number || contract.id.substring(0, 8)} - Employment Agreement`
      );
      setMessage(`Dear Sir/Madam,

Please find attached the employment contract for your review and signature.

Contract Details:
- Contract Number: ${contract.contract_number || 'N/A'}
- Job Title: ${contract.job_title || 'N/A'}
- Start Date: ${safeFormatDate(contract.contract_start_date, 'dd-MM-yyyy')}
- End Date: ${safeFormatDate(contract.contract_end_date, 'dd-MM-yyyy')}

Please review the attached contract and let us know if you have any questions.

Best regards,
Contract Management Team`);
    }
  }, [contract, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (to && subject && message) {
      onSend({ to, subject, message });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className='max-w-2xl'>
        <AlertDialogHeader>
          <AlertDialogTitle className='flex items-center gap-2'>
            <Mail className='h-5 w-5' />
            Send Contract via Email
          </AlertDialogTitle>
          <AlertDialogDescription>
            Send the contract PDF to the recipient via email.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label
              htmlFor='email-to'
              className='block text-sm font-medium mb-1'
            >
              To Email Address
            </label>
            <Input
              id='email-to'
              type='email'
              value={to}
              onChange={e => setTo(e.target.value)}
              placeholder='recipient@example.com'
              required
            />
          </div>

          <div>
            <label
              htmlFor='email-subject'
              className='block text-sm font-medium mb-1'
            >
              Subject
            </label>
            <Input
              id='email-subject'
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder='Email subject'
              required
            />
          </div>

          <div>
            <label
              htmlFor='email-message'
              className='block text-sm font-medium mb-1'
            >
              Message
            </label>
            <textarea
              id='email-message'
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder='Email message'
              className='w-full min-h-[120px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              required
            />
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel type='button' disabled={isSending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              type='submit'
              disabled={isSending || !to || !subject || !message}
              className='bg-blue-600 hover:bg-blue-700'
            >
              {isSending && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Send Email
            </AlertDialogAction>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic';
