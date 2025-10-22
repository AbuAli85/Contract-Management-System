'use client';

import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';

import PartyForm from '@/components/party-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Party } from '@/lib/types';
import { PaginationControls } from '@/components/ui/pagination-controls';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import {
  usePartiesQuery,
  useDeletePartyMutation,
} from '@/hooks/use-parties-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  EditIcon,
  PlusCircleIcon,
  ArrowLeftIcon,
  BuildingIcon,
  Loader2,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Trash2,
  RefreshCw,
  Grid,
  List,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  Activity,
  TrendingUp,
  Clock,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  FileText,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Shield,
  Eye,
  Building2,
  Briefcase,
  Home,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInDays, isValid, parse } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

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

const safeFormatDate = (dateString: string | null | undefined, formatStr: string = 'MMM dd, yyyy'): string => {
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

interface PartyWithContractCount extends Party {
  contract_count?: number;
}

// Enhanced Party interface
interface EnhancedParty extends Party {
  cr_status: 'valid' | 'expiring' | 'expired' | 'missing';
  license_status: 'valid' | 'expiring' | 'expired' | 'missing';
  overall_status: 'active' | 'warning' | 'critical' | 'inactive';
  days_until_cr_expiry?: number | undefined;
  days_until_license_expiry?: number | undefined;
  contract_count?: number | undefined;
}

// Statistics interface
interface PartyStats {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  expiring_documents: number;
  expired_documents: number;
  employers: number;
  clients: number;
  total_contracts: number;
}

// Error boundary component for better error handling
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class PartiesErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Parties page error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className='flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
          <Card className='w-full max-w-2xl border-red-200 dark:border-red-800'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='rounded-full bg-red-100 p-3 dark:bg-red-900'>
                  <AlertTriangle className='h-6 w-6 text-red-600 dark:text-red-300' />
                </div>
                <div>
                  <CardTitle className='text-red-900 dark:text-red-100'>
                    Application Error
                  </CardTitle>
                  <CardDescription className='text-red-700 dark:text-red-300'>
                    Something went wrong with the parties page
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-lg bg-red-50 p-4 dark:bg-red-900/20'>
                <p className='text-sm text-red-800 dark:text-red-200'>
                  {this.state.error?.message || 'An unexpected error occurred'}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className='mt-2'>
                    <summary className='cursor-pointer text-xs text-red-600 dark:text-red-400'>
                      Technical Details
                    </summary>
                    <pre className='mt-2 text-xs text-red-600 dark:text-red-400'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
              <div className='flex gap-2'>
                <Button
                  variant='outline'
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Reload Page
                </Button>
                <Button asChild>
                  <Link href='/en/dashboard'>
                    <Home className='mr-2 h-4 w-4' />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function ManagePartiesPage() {
  return (
    <PartiesErrorBoundary>
      <ManagePartiesContent />
    </PartiesErrorBoundary>
  );
}

function ManagePartiesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get pagination params from URL
  const currentPage = parseInt(searchParams?.get('page') || '1', 10);
  const pageSize = parseInt(searchParams?.get('limit') || '20', 10);
  
  // Use React Query for data fetching with automatic caching and retry
  const {
    data: partiesData,
    isLoading,
    isFetching,
    error,
    refetch,
    isError,
    failureCount,
    failureReason,
  } = usePartiesQuery(currentPage, pageSize, {
    retry: (failureCount, error) => {
      // Retry up to 3 times with exponential backoff
      if (failureCount < 3) {
        console.log(`Retrying parties fetch (attempt ${failureCount + 1}/3):`, error?.message);
        return true;
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Extract parties and total count from React Query response
  const parties = partiesData?.parties || [];
  const totalCount = partiesData?.total || 0;
  
  const [filteredParties, setFilteredParties] = useState<EnhancedParty[]>([]);
  const [selectedParties, setSelectedParties] = useState<string[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [currentView, setCurrentView] = useState<'table' | 'grid'>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [documentFilter, setDocumentFilter] = useState('all');
  const [sortBy, setSortBy] = useState<
    'name' | 'cr_expiry_date' | 'license_expiry' | 'contracts'
  >('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showStats, setShowStats] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();
  const isMountedRef = useRef(true);

  // Clean up on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Track retry attempts
  useEffect(() => {
    if (isError && failureCount) {
      setRetryCount(failureCount);
    }
  }, [isError, failureCount]);

  // Apply filters whenever parties or filter settings change
  useEffect(() => {
    applyFilters();
  }, [
    parties,
    searchTerm,
    statusFilter,
    typeFilter,
    documentFilter,
    sortBy,
    sortOrder,
  ]);

  // Helper functions for enhanced party data
  const getDocumentStatusType = (
    daysUntilExpiry: number | null,
    dateString: string | null
  ): 'valid' | 'expiring' | 'expired' | 'missing' => {
    if (!dateString) return 'missing';
    if (daysUntilExpiry === null) return 'missing';
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring';
    return 'valid';
  };

  const getOverallStatus = (
    party: Party
  ): 'active' | 'warning' | 'critical' | 'inactive' => {
    if (party.status === 'Inactive') return 'inactive';
    if (party.status === 'Suspended') return 'critical';

    const crStatus = getDocumentStatusType(
      safeDifferenceInDays(party.cr_expiry_date),
      party.cr_expiry_date || null
    );
    const licenseStatus = getDocumentStatusType(
      safeDifferenceInDays(party.license_expiry),
      party.license_expiry || null
    );

    if (crStatus === 'expired' || licenseStatus === 'expired') return 'critical';
    if (crStatus === 'expiring' || licenseStatus === 'expiring') return 'warning';
    return 'active';
  };

  const enhanceParty = (party: Party): EnhancedParty => {
    const crExpiryDays = safeDifferenceInDays(party.cr_expiry_date);
    const licenseExpiryDays = safeDifferenceInDays(party.license_expiry);

    return {
      ...party,
      cr_status: getDocumentStatusType(crExpiryDays, party.cr_expiry_date || null),
      license_status: getDocumentStatusType(licenseExpiryDays, party.license_expiry || null),
      overall_status: getOverallStatus(party),
      days_until_cr_expiry: crExpiryDays ?? undefined,
      days_until_license_expiry: licenseExpiryDays ?? undefined,
      contract_count: 0, // Will be calculated separately
    };
  };

  // Apply filters and sorting
  const applyFilters = useCallback(() => {
    if (!parties || !Array.isArray(parties)) {
      setFilteredParties([]);
      return;
    }

    try {
      const enhanced = parties.map(enhanceParty);

      let filtered = enhanced.filter(party => {
        // Search filter
        const matchesSearch = !searchTerm || 
          party.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.crn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          party.contact_email?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
        const matchesStatus = statusFilter === 'all' || party.status === statusFilter;

      // Type filter
        const matchesType = typeFilter === 'all' || party.type === typeFilter;

        // Document filter
        const matchesDocument = documentFilter === 'all' ||
          (documentFilter === 'expired' && (party.cr_status === 'expired' || party.license_status === 'expired')) ||
          (documentFilter === 'expiring' && (party.cr_status === 'expiring' || party.license_status === 'expiring')) ||
          (documentFilter === 'valid' && party.cr_status === 'valid' && party.license_status === 'valid');

        return matchesSearch && matchesStatus && matchesType && matchesDocument;
      });

      // Sort
      filtered.sort((a, b) => {
        let aVal: any, bVal: any;

      switch (sortBy) {
        case 'name':
            aVal = a.name_en || '';
            bVal = b.name_en || '';
          break;
        case 'cr_expiry_date':
            aVal = a.cr_expiry_date ? new Date(a.cr_expiry_date).getTime() : 0;
            bVal = b.cr_expiry_date ? new Date(b.cr_expiry_date).getTime() : 0;
          break;
        case 'license_expiry':
            aVal = a.license_expiry ? new Date(a.license_expiry).getTime() : 0;
            bVal = b.license_expiry ? new Date(b.license_expiry).getTime() : 0;
          break;
        case 'contracts':
            aVal = a.contract_count || 0;
            bVal = b.contract_count || 0;
          break;
        default:
            aVal = a.name_en || '';
            bVal = b.name_en || '';
      }

      if (sortOrder === 'asc') {
          return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      } else {
          return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
        }
      });

      setFilteredParties(filtered);
    } catch (error) {
      console.error('Error applying filters:', error);
      setFilteredParties([]);
    }
  }, [parties, searchTerm, statusFilter, typeFilter, documentFilter, sortBy, sortOrder]);

  // Calculate statistics
  const partyStats = useMemo((): PartyStats => {
    if (!parties || !Array.isArray(parties)) {
    return {
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
        expiring_documents: 0,
        expired_documents: 0,
        employers: 0,
        clients: 0,
        total_contracts: 0,
      };
    }

    try {
      const enhanced = parties.map(enhanceParty);
      
      return {
        total: enhanced.length,
        active: enhanced.filter(p => p.status === 'Active').length,
        inactive: enhanced.filter(p => p.status === 'Inactive').length,
        suspended: enhanced.filter(p => p.status === 'Suspended').length,
        expiring_documents: enhanced.filter(p => 
          p.cr_status === 'expiring' || p.license_status === 'expiring'
        ).length,
        expired_documents: enhanced.filter(p => 
          p.cr_status === 'expired' || p.license_status === 'expired'
        ).length,
        employers: enhanced.filter(p => p.type === 'Employer').length,
        clients: enhanced.filter(p => p.type === 'Client').length,
        total_contracts: enhanced.reduce((sum, p) => sum + (p.contract_count || 0), 0),
      };
    } catch (error) {
      console.error('Error calculating party stats:', error);
      return {
        total: 0,
        active: 0,
        inactive: 0,
        suspended: 0,
        expiring_documents: 0,
        expired_documents: 0,
        employers: 0,
        clients: 0,
        total_contracts: 0,
      };
    }
  }, [parties]);

  // Enhanced error handling with retry functionality
  const handleRetry = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refetch();
      setRetryCount(0);
      toast({
        title: 'Data refreshed',
        description: 'Parties data has been successfully reloaded.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Retry failed:', error);
      toast({
        title: 'Retry failed',
        description: 'Unable to reload data. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, toast]);

  // Handle manual refresh
  const handleRefresh = useCallback(async () => {
    await handleRetry();
  }, [handleRetry]);

  // Get error message based on error type
  const getErrorMessage = (error: any): { title: string; message: string; canRetry: boolean } => {
    if (!error) {
      return { title: 'Unknown Error', message: 'An unexpected error occurred', canRetry: true };
    }

    const errorMessage = error.message || error.toString();
    
    // Network/connection errors
    if (errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
      return {
        title: 'Request Timeout',
        message: 'The server took too long to respond. This might be due to network issues or server load.',
        canRetry: true,
      };
    }
    
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        canRetry: true,
      };
    }
    
    // Authentication errors
    if (errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
      return {
        title: 'Authentication Required',
        message: 'Your session has expired. Please log in again to continue.',
        canRetry: false,
      };
    }
    
    // Server errors
    if (errorMessage.includes('500') || errorMessage.includes('Internal server error')) {
      return {
        title: 'Server Error',
        message: 'The server encountered an error while processing your request. Please try again later.',
        canRetry: true,
      };
    }
    
    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('Failed to fetch parties')) {
      return {
        title: 'Database Error',
        message: 'Unable to retrieve parties data from the database. Please try again.',
        canRetry: true,
      };
    }
    
    // Default error
    return {
      title: 'Failed to Load Parties',
      message: errorMessage || 'We encountered an error while fetching party data',
      canRetry: true,
    };
  };

  // Loading state with better UX
  if (isLoading && !isFetching) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
        <Card className='w-full max-w-md'>
          <CardContent className='flex flex-col items-center justify-center p-8'>
            <div className='relative'>
              <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
              <div className='absolute inset-0 rounded-full border-2 border-blue-200'></div>
            </div>
            <h3 className='mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100'>
              Loading Parties
            </h3>
            <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
              Please wait while we fetch your parties data...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Enhanced error state with retry functionality
  if (isError && error) {
    const errorInfo = getErrorMessage(error);
    
    return (
      <div className='flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
        <Card className='w-full max-w-2xl border-red-200 dark:border-red-800'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='rounded-full bg-red-100 p-3 dark:bg-red-900'>
                <AlertTriangle className='h-6 w-6 text-red-600 dark:text-red-300' />
              </div>
              <div>
                <CardTitle className='text-red-900 dark:text-red-100'>
                  {errorInfo.title}
                </CardTitle>
                <CardDescription className='text-red-700 dark:text-red-300'>
                  {errorInfo.message}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {/* Retry information */}
            {retryCount > 0 && (
              <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
                <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                  <Clock className='mr-2 inline h-4 w-4' />
                  Attempted {retryCount} retries automatically
              </p>
            </div>
            )}

            {/* Technical details in development */}
            {process.env.NODE_ENV === 'development' && (
              <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-900'>
                <details className='text-sm'>
                  <summary className='cursor-pointer font-medium text-gray-700 dark:text-gray-300'>
                    Technical Details
                  </summary>
                  <pre className='mt-2 text-xs text-gray-600 dark:text-gray-400'>
                    {JSON.stringify({
                      error: error.message,
                      failureCount,
                      failureReason: failureReason?.message,
                      timestamp: new Date().toISOString(),
                    }, null, 2)}
                  </pre>
                </details>
            </div>
            )}

            {/* Action buttons */}
            <div className='flex flex-wrap gap-2'>
              {errorInfo.canRetry && (
              <Button
                  onClick={handleRetry}
                  disabled={isRefreshing}
                  className='flex-1 min-w-[120px]'
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Retrying...
                    </>
                  ) : (
                    <>
                <RefreshCw className='mr-2 h-4 w-4' />
                Try Again
                    </>
                  )}
              </Button>
              )}
              
              <Button variant='outline' asChild>
                <Link href='/en/dashboard'>
                  <Home className='mr-2 h-4 w-4' />
                  Back to Dashboard
                </Link>
              </Button>
              
              <Button variant='outline' onClick={() => window.location.reload()}>
                <RefreshCw className='mr-2 h-4 w-4' />
                Reload Page
              </Button>
            </div>

            {/* Network status indicator */}
            <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
              {navigator.onLine ? (
                <>
                  <Wifi className='h-4 w-4 text-green-500' />
                  Online
                </>
              ) : (
                <>
                  <WifiOff className='h-4 w-4 text-red-500' />
                  Offline - Check your internet connection
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Event handlers
  const handleFormClose = useCallback(() => {
    setShowForm(false);
    setSelectedParty(null);
    handleRefresh();
  }, [handleRefresh]);

  const handleFormSuccess = useCallback(() => {
    setShowForm(false);
    setSelectedParty(null);
    handleRefresh();
    toast({
      title: 'Success',
      description: 'Party saved successfully.',
    });
  }, [handleRefresh, toast]);

  const handleEdit = useCallback((party: Party) => {
    setSelectedParty(party);
    setShowForm(true);
  }, []);

  const handleAddNew = useCallback(() => {
    setSelectedParty(null);
    setShowForm(true);
  }, []);

  // Empty state
  if (!isLoading && (!parties || parties.length === 0)) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Manage Parties</h1>
            <p className='text-muted-foreground'>
              Manage your business parties and organizations
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <PlusCircleIcon className='mr-2 h-4 w-4' />
            Add New Party
          </Button>
        </div>

        <EmptyState
          icon={BuildingIcon}
          title='No parties found'
          description='Get started by adding your first party or organization.'
          action={{
            label: 'Add New Party',
            onClick: () => setShowForm(true),
          }}
        />

        {showForm && (
          <PartyForm
            partyToEdit={selectedParty}
            onFormSubmit={handleFormSuccess}
          />
        )}
      </div>
    );
  }

  // Main component render
  return (
    <div className='container mx-auto px-4 py-8'>
      {/* Header */}
      <div className='mb-6 flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Manage Parties</h1>
          <p className='text-muted-foreground'>
            Manage your business parties and organizations
          </p>
          </div>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
            ) : (
              <RefreshCw className='mr-2 h-4 w-4' />
            )}
              Refresh
            </Button>
          <Button onClick={handleAddNew}>
            <PlusCircleIcon className='mr-2 h-4 w-4' />
              Add New Party
            </Button>
          </div>
        </div>

      {/* Statistics Cards */}
        {showStats && (
        <div className='mb-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Parties</CardTitle>
              <BuildingIcon className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{partyStats.total}</div>
              <p className='text-xs text-muted-foreground'>
                {partyStats.active} active
              </p>
              </CardContent>
            </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Employers</CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{partyStats.employers}</div>
              <p className='text-xs text-muted-foreground'>
                {partyStats.clients} clients
              </p>
              </CardContent>
            </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Document Alerts</CardTitle>
              <AlertTriangle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>
                {partyStats.expired_documents}
                  </div>
              <p className='text-xs text-muted-foreground'>
                {partyStats.expiring_documents} expiring soon
              </p>
              </CardContent>
            </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total Contracts</CardTitle>
              <FileText className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{partyStats.total_contracts}</div>
              <p className='text-xs text-muted-foreground'>
                Across all parties
              </p>
              </CardContent>
            </Card>
          </div>
        )}

      {/* Filters and Search */}
      <Card className='mb-6'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='h-5 w-5' />
            Filters & Search
          </CardTitle>
          </CardHeader>
        <CardContent>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-2'>
              <Label htmlFor='search'>Search</Label>
                <div className='relative'>
                <Search className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='search'
                  placeholder='Search parties...'
                    value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <Label>Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder='All types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All Types</SelectItem>
                  <SelectItem value='Employer'>Employer</SelectItem>
                  <SelectItem value='Client'>Client</SelectItem>
                  <SelectItem value='Generic'>Generic</SelectItem>
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

      {/* Parties Table */}
      <Card>
        <CardHeader>
              <div className='flex items-center justify-between'>
            <CardTitle>
              Parties ({filteredParties.length} of {totalCount})
            </CardTitle>
            <div className='flex items-center gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                onClick={() => setCurrentView(currentView === 'table' ? 'grid' : 'table')}
                  >
                {currentView === 'table' ? (
                  <Grid className='h-4 w-4' />
                    ) : (
                  <List className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
        <CardContent>
          {isFetching && !isLoading && (
            <div className='mb-4 flex items-center gap-2 text-sm text-muted-foreground'>
              <Loader2 className='h-4 w-4 animate-spin' />
              Updating data...
            </div>
          )}

          {currentView === 'table' ? (
              <div className='overflow-x-auto'>
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className='w-[50px]'>
                        <Checkbox
                        checked={selectedParties.length === filteredParties.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedParties(filteredParties.map(p => p.id));
                          } else {
                            setSelectedParties([]);
                          }
                        }}
                        />
                      </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>CR Expiry</TableHead>
                    <TableHead>License Expiry</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead className='w-[100px]'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {filteredParties.map((party) => (
                    <TableRow key={party.id}>
                      <TableCell>
                            <Checkbox
                          checked={selectedParties.includes(party.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedParties(prev => [...prev, party.id]);
                            } else {
                              setSelectedParties(prev => prev.filter(id => id !== party.id));
                            }
                          }}
                            />
                          </TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>{party.name_en}</div>
                          {party.name_ar && (
                            <div className='text-sm text-muted-foreground'>
                                  {party.name_ar}
                                  </div>
                                )}
                            </div>
                          </TableCell>
                      <TableCell>
                        <Badge variant='outline'>{party.type}</Badge>
                          </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            party.overall_status === 'active'
                              ? 'default'
                              : party.overall_status === 'warning'
                              ? 'secondary'
                              : 'destructive'
                          }
                        >
                          {party.status}
                        </Badge>
                          </TableCell>
                      <TableCell>
                        {party.cr_expiry_date ? (
                          <div className='text-sm'>
                            <div>{safeFormatDate(party.cr_expiry_date, 'MMM dd, yyyy')}</div>
                            <div className={cn(
                              'text-xs',
                              party.cr_status === 'expired' && 'text-red-600',
                              party.cr_status === 'expiring' && 'text-yellow-600',
                              party.cr_status === 'valid' && 'text-green-600'
                            )}>
                              {party.cr_status === 'expired' && 'Expired'}
                              {party.cr_status === 'expiring' && `${party.days_until_cr_expiry} days left`}
                              {party.cr_status === 'valid' && 'Valid'}
                              {party.cr_status === 'missing' && 'Missing'}
                                  </div>
                                </div>
                        ) : (
                          <span className='text-muted-foreground'>Not set</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {party.license_expiry ? (
                          <div className='text-sm'>
                            <div>{safeFormatDate(party.license_expiry, 'MMM dd, yyyy')}</div>
                            <div className={cn(
                              'text-xs',
                              party.license_status === 'expired' && 'text-red-600',
                              party.license_status === 'expiring' && 'text-yellow-600',
                              party.license_status === 'valid' && 'text-green-600'
                            )}>
                              {party.license_status === 'expired' && 'Expired'}
                              {party.license_status === 'expiring' && `${party.days_until_license_expiry} days left`}
                              {party.license_status === 'valid' && 'Valid'}
                              {party.license_status === 'missing' && 'Missing'}
                                </div>
                                </div>
                        ) : (
                          <span className='text-muted-foreground'>Not set</span>
                              )}
                          </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                                {party.contract_count || 0}
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
                            <DropdownMenuItem onClick={() => handleEdit(party)}>
                                    <EditIcon className='mr-2 h-4 w-4' />
                              Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                            <DropdownMenuItem className='text-red-600'>
                                    <Trash2 className='mr-2 h-4 w-4' />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                          </TableCell>
                        </TableRow>
                  ))}
                  </TableBody>
                </Table>
              </div>
          ) : (
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {filteredParties.map((party) => (
                <Card key={party.id}>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div>
                        <CardTitle className='text-lg'>{party.name_en}</CardTitle>
                        {party.name_ar && (
                          <CardDescription>{party.name_ar}</CardDescription>
                            )}
                        </div>
                      <Badge
                        variant={
                          party.overall_status === 'active'
                            ? 'default'
                            : party.overall_status === 'warning'
                            ? 'secondary'
                            : 'destructive'
                        }
                      >
                        {party.status}
                      </Badge>
                        </div>
                  </CardHeader>
                  <CardContent>
                      <div className='space-y-2'>
                      <div className='flex items-center gap-2'>
                        <Building2 className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm'>{party.type}</span>
                        </div>
                          {party.contact_email && (
                        <div className='flex items-center gap-2'>
                          <Mail className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm'>{party.contact_email}</span>
                            </div>
                          )}
                      <div className='flex items-center gap-2'>
                        <Briefcase className='h-4 w-4 text-muted-foreground' />
                        <span className='text-sm'>{party.contract_count || 0} contracts</span>
                            </div>
                        </div>
                    <div className='mt-4 flex gap-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEdit(party)}
                        className='flex-1'
                      >
                        <EditIcon className='mr-2 h-4 w-4' />
                        Edit
                      </Button>
                      <Button variant='outline' size='sm'>
                        <Eye className='h-4 w-4' />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        )}
        </CardContent>
      </Card>
        
      {/* Pagination */}
      {totalCount > pageSize && (
          <div className='mt-6'>
            <PaginationControls
              currentPage={currentPage}
              totalPages={Math.ceil(totalCount / pageSize)}
              pageSize={pageSize}
              totalItems={totalCount}
            onPageChange={(page) => {
              const params = new URLSearchParams(searchParams?.toString() || '');
              params.set('page', page.toString());
              router.push(`${window.location.pathname}?${params.toString()}`);
            }}
            />
          </div>
        )}

      {/* Party Form Modal */}
      {showForm && (
        <PartyForm
          partyToEdit={selectedParty}
          onFormSubmit={handleFormSuccess}
        />
      )}
    </div>
  );
}