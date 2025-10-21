'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { apiFetch } from '@/lib/http/api';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  useDeleteContractMutation,
  type ContractWithRelations,
} from '@/hooks/use-contracts';
import { usePermissions } from '@/hooks/use-permissions';
import { useAuth } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
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
import { format, parseISO, differenceInDays } from 'date-fns';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import { EmptyState, EmptySearchState } from '@/components/ui/empty-state';

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
  expiring_soon: number;
  total_value: number;
  avg_duration: number;
}

type ContractStatus = 'Active' | 'Expired' | 'Upcoming' | 'Unknown';

function getContractStatus(contract: ContractWithRelations): ContractStatus {
  if (!contract.contract_start_date || !contract.contract_end_date)
    return 'Unknown';
  const now = new Date();
  const startDate = parseISO(contract.contract_start_date);
  const endDate = parseISO(contract.contract_end_date);
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
    const endDate = parseISO(contract.contract_end_date);
    days_until_expiry = differenceInDays(endDate, now);
  }

  if (contract.contract_start_date && contract.contract_end_date) {
    const startDate = parseISO(contract.contract_start_date);
    const endDate = parseISO(contract.contract_end_date);
    contract_duration_days = differenceInDays(endDate, startDate);
  }

  if (contract.created_at) {
    const createdDate = parseISO(contract.created_at);
    age_days = differenceInDays(now, createdDate);
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

  // Add authentication check
  const { user, loading: authLoading } = useAuth();

  const [contracts, setContracts] = useState<ContractWithRelations[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch contracts data
  const fetchContracts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔍 Contracts Page: Fetching contracts...');
      console.log(
        '🔍 Contracts Page: User:',
        user?.id,
        'Auth loading:',
        authLoading
      );
      const response = await apiFetch('/api/contracts');

      if (!response.ok) {
        console.error(
          `❌ Contracts Page: HTTP ${response.status} - ${response.statusText}`
        );
        const errorText = await response.text();
        console.error('❌ Contracts Page: Error response:', errorText);

        setError(`HTTP ${response.status}: ${response.statusText}`);
        return;
      }

      const data = await response.json();
      console.log('🔍 Contracts Page: API response:', data);

      if (data.success) {
        setContracts(data.contracts || []);
        console.log(
          `✅ Contracts Page: Successfully loaded ${data.contracts?.length || 0} contracts`
        );
      } else {
        console.error(
          '❌ Contracts Page: API returned error:',
          data.error,
          data.details
        );
        setError(data.error || 'Failed to fetch contracts');
      }
    } catch (err) {
      console.error('❌ Contracts Page: Network error:', err);
      setError('Failed to fetch contracts - network error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContracts();
  }, [fetchContracts]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isRefreshing && !isLoading) {
        fetchContracts();
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchContracts, isRefreshing, isLoading]);

  // All hooks must be called at the top level, before any conditional returns
  const deleteContractMutation = useDeleteContractMutation();
  const { toast } = useToast();
  const permissions = usePermissions();

  // Enhanced state management - moved before conditional returns
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'table' | 'grid'>('table');
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [contractToEmail, setContractToEmail] =
    useState<ContractWithRelations | null>(null);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // All hooks must be called before any conditional returns
  const isMountedRef = useRef(true);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate statistics BEFORE permission check
  const contractStats = useMemo((): ContractStats => {
    if (!contracts || !Array.isArray(contracts))
      return {
        total: 0,
        active: 0,
        expired: 0,
        upcoming: 0,
        unknown: 0,
        expiring_soon: 0,
        total_value: 0,
        avg_duration: 0,
      };

    try {
      const enhanced = contracts.map(enhanceContract);
      const now = new Date();

      return {
        total: enhanced.length,
        active: enhanced.filter(c => c.status_type === 'active').length,
        expired: enhanced.filter(c => c.status_type === 'expired').length,
        upcoming: enhanced.filter(c => c.status_type === 'upcoming').length,
        unknown: enhanced.filter(c => c.status_type === 'unknown').length,
        expiring_soon: enhanced.filter(
          c =>
            c.days_until_expiry !== undefined &&
            c.days_until_expiry > 0 &&
            c.days_until_expiry <= 30
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
        expiring_soon: 0,
        total_value: 0,
        avg_duration: 0,
      };
    }
  }, [contracts]);

  // Enhanced filtering and sorting with pagination
  const filteredAndSortedContracts = useMemo(() => {
    if (!contracts || !Array.isArray(contracts)) return [];

    try {
      const enhanced = contracts.map(enhanceContract);

      const filtered = enhanced.filter(contract => {
        const contractStatus = getContractStatus(contract);
        const matchesStatus =
          statusFilter === 'all' || contractStatus === statusFilter;

        const firstParty =
          (contract.first_party &&
          typeof contract.first_party === 'object' &&
          'name_en' in contract.first_party
            ? locale === 'ar'
              ? contract.first_party.name_ar || contract.first_party.name_en
              : contract.first_party.name_en || contract.first_party.name_ar
            : '') || '';
        const secondParty =
          (contract.second_party &&
          typeof contract.second_party === 'object' &&
          'name_en' in contract.second_party
            ? locale === 'ar'
              ? contract.second_party.name_ar || contract.second_party.name_en
              : contract.second_party.name_en || contract.second_party.name_ar
            : '') || '';
        const promoterName: string = contract.promoters
          ? locale === 'ar'
            ? contract.promoters.name_ar || contract.promoters.name_en || ''
            : contract.promoters.name_en || contract.promoters.name_ar || ''
          : '';

        const matchesSearch =
          !searchTerm ||
          contract.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          firstParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
          secondParty.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (promoterName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (contract.job_title &&
            contract.job_title
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          (contract.contract_number &&
            contract.contract_number
              .toLowerCase()
              .includes(searchTerm.toLowerCase()));

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

      // Calculate pagination
      const totalItems = sorted.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      setTotalPages(totalPages);

      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return sorted.slice(startIndex, endIndex);
    } catch (error) {
      console.error('Error filtering and sorting contracts:', error);
      return [];
    }
  }, [
    contracts,
    searchTerm,
    statusFilter,
    sortColumn,
    sortDirection,
    locale,
    currentPage,
    pageSize,
  ]);

  // Handler functions - moved BEFORE permission check
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchContracts();
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
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchContracts, toast, contracts.length]);

  const handleSort = (column: keyof ContractWithRelations | 'status') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
    setCurrentPage(1); // Reset to first page when sorting changes
  };

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

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
          contract.promoters &&
          Array.isArray(contract.promoters) &&
          contract.promoters.length > 0
            ? contract.promoters[0].name_en || 'N/A'
            : 'N/A',
        'Job Title': contract.job_title || 'N/A',
        'Start Date': contract.contract_start_date
          ? format(parseISO(contract.contract_start_date), 'dd-MM-yyyy')
          : 'N/A',
        'End Date': contract.contract_end_date
          ? format(parseISO(contract.contract_end_date), 'dd-MM-yyyy')
          : 'N/A',
        Status: getContractStatus(contract),
        'Contract Value': contract.contract_value || 0,
        'Work Location': contract.work_location || 'N/A',
        Email: contract.email || 'N/A',
        'PDF URL': contract.pdf_url || 'N/A',
        'Created At': contract.created_at
          ? format(parseISO(contract.created_at), 'dd-MM-yyyy')
          : 'N/A',
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
    const variants = {
      Active: {
        variant: 'default' as const,
        className:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        icon: CheckCircle,
      },
      Expired: {
        variant: 'destructive' as const,
        className: '',
        icon: XCircle,
      },
      Upcoming: {
        variant: 'secondary' as const,
        className:
          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        icon: Clock,
      },
      Unknown: {
        variant: 'outline' as const,
        className: '',
        icon: AlertTriangle,
      },
    };
    const config = variants[status];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className={config.className}>
        <Icon className='mr-1 h-3 w-3' />
        {status}
      </Badge>
    );
  };

  // Enhanced Statistics cards component
  const StatisticsCards = () => (
    <div className='grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8'>
      <Card className='bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div>
              <p className='text-sm text-blue-100 font-medium'>
                Total Contracts
              </p>
              <p className='text-2xl font-bold'>{contractStats.total}</p>
              <p className='text-xs text-blue-200 mt-1'>All contracts</p>
            </div>
            <div className='p-2 bg-blue-400/20 rounded-lg'>
              <FileText className='h-6 w-6 text-blue-200' />
            </div>
          </div>
        </CardContent>
      </Card>

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
              <p className='text-2xl font-bold'>{contractStats.upcoming}</p>
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
                ${contractStats.total_value.toLocaleString()}
              </p>
              <p className='text-xs text-indigo-200 mt-1'>OMR</p>
            </div>
            <div className='p-2 bg-indigo-400/20 rounded-lg'>
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
    return (
      <div className='flex h-64 items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary'></div>
          <p className='text-muted-foreground'>Loading permissions...</p>
          <p className='text-xs text-muted-foreground mt-2'>
            This should only take a moment
          </p>
        </div>
      </div>
    );
  }

  // Role-based access control - NOW CALLED AFTER ALL HOOKS
  const canCreateContract = permissions.canCreateContract();
  const canEditContract = permissions.canEditContract();
  const canDeleteContract = permissions.canDeleteContract();
  const canExportContracts = permissions.canExportContracts();
  const canGenerateContract = permissions.canGenerateContract();

  if (isLoading) {
    return (
      <div className='space-y-6 p-4 md:p-6'>
        {/* Loading Statistics Cards */}
        <div className='mb-6'>
          <div className='mb-4 flex items-center justify-between'>
            <h2 className='text-lg font-semibold'>Contract Statistics</h2>
          </div>
          <div className='grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-8'>
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className='animate-pulse'>
                <CardContent className='p-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-2'>
                      <div className='h-3 w-16 bg-gray-200 rounded'></div>
                      <div className='h-6 w-8 bg-gray-200 rounded'></div>
                    </div>
                    <div className='h-8 w-8 bg-gray-200 rounded'></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Loading Table */}
        <Card>
          <CardHeader>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
              <div className='space-y-2'>
                <div className='h-6 w-48 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-4 w-64 bg-gray-200 rounded animate-pulse'></div>
              </div>
              <div className='flex items-center gap-2'>
                <div className='h-9 w-9 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-9 w-9 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-9 w-32 bg-gray-200 rounded animate-pulse'></div>
                <div className='h-9 w-40 bg-gray-200 rounded animate-pulse'></div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {/* Loading Search and Filters */}
              <div className='flex flex-col items-center gap-4 md:flex-row'>
                <div className='h-10 w-full bg-gray-200 rounded animate-pulse'></div>
                <div className='h-10 w-48 bg-gray-200 rounded animate-pulse'></div>
              </div>

              {/* Loading Table Rows */}
              <div className='space-y-3'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className='flex items-center space-x-4 p-4 border rounded-lg'
                  >
                    <div className='h-4 w-4 bg-gray-200 rounded animate-pulse'></div>
                    <div className='h-4 w-20 bg-gray-200 rounded animate-pulse'></div>
                    <div className='h-4 w-32 bg-gray-200 rounded animate-pulse'></div>
                    <div className='h-4 w-32 bg-gray-200 rounded animate-pulse'></div>
                    <div className='h-4 w-24 bg-gray-200 rounded animate-pulse'></div>
                    <div className='h-4 w-20 bg-gray-200 rounded animate-pulse'></div>
                    <div className='h-4 w-20 bg-gray-200 rounded animate-pulse'></div>
                    <div className='h-6 w-16 bg-gray-200 rounded animate-pulse'></div>
                    <div className='h-4 w-4 bg-gray-200 rounded animate-pulse'></div>
                    <div className='h-8 w-8 bg-gray-200 rounded animate-pulse'></div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
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
                  <p className='font-medium'>{error}</p>
                  {process.env.NODE_ENV === 'development' && (
                    <details className='mt-2'>
                      <summary className='cursor-pointer text-sm font-medium text-muted-foreground'>
                        Debug Information
                      </summary>
                      <div className='mt-2 rounded bg-muted p-3 text-xs font-mono'>
                        <p>Error: {error}</p>
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
                onClick={fetchContracts}
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
              {showStats ? t('common.close') : t('common.view')}
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
                        disabled={isRefreshing}
                        className='hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:border-blue-800 transition-colors duration-200'
                      >
                        <RefreshCw
                          className={cn(
                            'h-4 w-4',
                            isRefreshing && 'animate-spin text-blue-600'
                          )}
                        />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh data</p>
                      <p className='text-xs text-gray-400'>
                        Auto-refreshes every 30s
                      </p>
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
                    <SelectItem value='Active'>Active</SelectItem>
                    <SelectItem value='Expired'>Expired</SelectItem>
                    <SelectItem value='Upcoming'>Upcoming</SelectItem>
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
              ) : (
                <EmptyState
                  icon={FileText}
                  title={t('dashboard.noContractsFound')}
                  description={t('dashboard.noContractsDescription')}
                  action={
                    canCreateContract
                      ? {
                          label: t('dashboard.createNewContract'),
                          href: `/${locale}/dashboard/generate-contract`,
                        }
                      : undefined
                  }
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
                              {contract.contract_start_date
                                ? format(
                                    parseISO(contract.contract_start_date),
                                    'dd-MM-yyyy'
                                  )
                                : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <div className='flex flex-col'>
                                <span>
                                  {contract.contract_end_date
                                    ? format(
                                        parseISO(contract.contract_end_date),
                                        'dd-MM-yyyy'
                                      )
                                    : 'N/A'}
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
                {totalPages > 1 && (
                  <div className='flex items-center justify-between px-2 py-4 border-t'>
                    <div className='flex items-center gap-2 text-sm text-gray-500'>
                      <span>Showing</span>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={value => {
                          setPageSize(parseInt(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className='w-20 h-8'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='10'>10</SelectItem>
                          <SelectItem value='20'>20</SelectItem>
                          <SelectItem value='50'>50</SelectItem>
                          <SelectItem value='100'>100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span>per page</span>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </Button>

                      <div className='flex items-center gap-1'>
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const pageNum =
                              Math.max(
                                1,
                                Math.min(totalPages - 4, currentPage - 2)
                              ) + i;
                            if (pageNum > totalPages) return null;

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? 'default'
                                    : 'outline'
                                }
                                size='sm'
                                onClick={() => setCurrentPage(pageNum)}
                                className='w-8 h-8 p-0'
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </Button>
                    </div>

                    <div className='text-sm text-gray-500'>
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                )}
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
                                      {format(
                                        parseISO(contract.contract_start_date),
                                        'dd-MM-yyyy'
                                      )}{' '}
                                      -{' '}
                                      {format(
                                        parseISO(contract.contract_end_date),
                                        'dd-MM-yyyy'
                                      )}
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
                {totalPages > 1 && (
                  <div className='flex items-center justify-between px-2 py-4 border-t'>
                    <div className='flex items-center gap-2 text-sm text-gray-500'>
                      <span>Showing</span>
                      <Select
                        value={pageSize.toString()}
                        onValueChange={value => {
                          setPageSize(parseInt(value));
                          setCurrentPage(1);
                        }}
                      >
                        <SelectTrigger className='w-20 h-8'>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='10'>10</SelectItem>
                          <SelectItem value='20'>20</SelectItem>
                          <SelectItem value='50'>50</SelectItem>
                          <SelectItem value='100'>100</SelectItem>
                        </SelectContent>
                      </Select>
                      <span>per page</span>
                    </div>

                    <div className='flex items-center gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className='h-4 w-4' />
                      </Button>

                      <div className='flex items-center gap-1'>
                        {Array.from(
                          { length: Math.min(5, totalPages) },
                          (_, i) => {
                            const pageNum =
                              Math.max(
                                1,
                                Math.min(totalPages - 4, currentPage - 2)
                              ) + i;
                            if (pageNum > totalPages) return null;

                            return (
                              <Button
                                key={pageNum}
                                variant={
                                  currentPage === pageNum
                                    ? 'default'
                                    : 'outline'
                                }
                                size='sm'
                                onClick={() => setCurrentPage(pageNum)}
                                className='w-8 h-8 p-0'
                              >
                                {pageNum}
                              </Button>
                            );
                          }
                        )}
                      </div>

                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </Button>
                    </div>

                    <div className='text-sm text-gray-500'>
                      Page {currentPage} of {totalPages}
                    </div>
                  </div>
                )}
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
- Start Date: ${contract.contract_start_date ? format(parseISO(contract.contract_start_date), 'dd-MM-yyyy') : 'N/A'}
- End Date: ${contract.contract_end_date ? format(parseISO(contract.contract_end_date), 'dd-MM-yyyy') : 'N/A'}

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
