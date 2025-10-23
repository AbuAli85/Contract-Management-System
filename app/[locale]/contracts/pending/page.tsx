'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, Search, Filter, Eye, AlertTriangle, ShieldAlert, Mail, RefreshCw, Loader2, CheckCircle, XCircle, Edit, Send, Users, FileText, MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/use-permissions';
import { ContractsCardSkeleton, ContractsTableSkeleton } from '@/components/contracts/ContractsSkeleton';
import { ContractsErrorBoundary } from '@/components/error-boundary/ContractsErrorBoundary';
import { performanceMonitor } from '@/lib/performance-monitor';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { ContractStatusBadge } from '@/components/contracts/contract-status-badge';

interface Contract {
  id: string;
  contract_number: string;
  job_title: string;
  contract_type: string;
  status: string;
  approval_status: string;
  created_at: string;
  submitted_for_review_at: string;
  first_party: { name_en: string } | null;
  second_party: { name_en: string } | null;
  promoter: { name_en: string } | null;
  promoters: { name_en: string } | null;
}

function PendingContractsPageContent() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Action states
  const [selectedContracts, setSelectedContracts] = useState<string[]>([]);
  const [actionDialog, setActionDialog] = useState<{
    isOpen: boolean;
    action: string;
    contractId?: string;
    contractIds?: string[];
    title: string;
    description: string;
    requiresReason: boolean;
  }>({
    isOpen: false,
    action: '',
    title: '',
    description: '',
    requiresReason: false,
  });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showPartialResults, setShowPartialResults] = useState(false);
  const [forceLoad, setForceLoad] = useState(false);
  const fetchAttemptedRef = useRef(false);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const forceLoadRef = useRef(false);
  
  // Check permissions
  const permissions = usePermissions();
  const hasPermission = useMemo(() => 
    permissions.can('contract:read:own') || permissions.isAdmin || false, 
    [permissions.can, permissions.isAdmin]
  );

  // ✅ FIX: Use useCallback to memoize the fetch function
  const fetchPendingContracts = useCallback(async (force = false) => {
    // Prevent multiple simultaneous fetches
    if (fetchAttemptedRef.current && !force) {
      console.log('⏸️ Fetch already in progress, skipping...');
      return;
    }

    fetchAttemptedRef.current = true;
    
    // ✅ FIX: Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    let timeoutId: NodeJS.Timeout | null = null;
    timeoutId = setTimeout(() => {
      console.warn('⏱️ Request timeout - aborting after 10 seconds');
      controller.abort();
    }, 10000); // 10 second timeout

    // Show "taking longer than expected" message after 3 seconds
    const slowLoadingTimeoutId = setTimeout(() => {
      if (mountedRef.current) {
        setShowSlowLoadingMessage(true);
      }
    }, 3000);

    // Start performance tracking
    const operationId = performanceMonitor.startOperation('fetch-pending-contracts', {
      retryCount,
      endpoint: '/api/contracts?status=pending',
    });

    const startTime = Date.now();
    
    try {
      setLoading(true);
      setError(null);
      setPermissionError(false);
      setShowSlowLoadingMessage(false);
      setShowPartialResults(false);
      
      console.log('🔍 Pending Contracts Debug:', {
        timestamp: new Date().toISOString(),
        endpoint: '/api/contracts?status=pending',
        timeout: '10 seconds',
        retryCount
      });
      
      const response = await fetch('/api/contracts?status=pending', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        // Add cache control to prevent stale data
        cache: 'no-store',
      });
      
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(slowLoadingTimeoutId);
      const queryTime = Date.now() - startTime;
      console.log(`⏱️ API Response time: ${queryTime}ms`);
      
      const data = await response.json();

      if (!mountedRef.current) return;

      if (response.status === 403) {
        // ✅ FIX: Clear timeouts on permission error
        if (timeoutId) clearTimeout(timeoutId);
        clearTimeout(slowLoadingTimeoutId);
        
        // Permission denied
        performanceMonitor.endOperation('fetch-pending-contracts', false, 'Permission denied');
        setPermissionError(true);
        setError('Insufficient permissions to view pending contracts');
        console.error('❌ Permission denied for pending contracts:', data);
      } else if (response.status === 401) {
        // ✅ FIX: Clear timeouts on auth error
        if (timeoutId) clearTimeout(timeoutId);
        clearTimeout(slowLoadingTimeoutId);
        
        // Not authenticated
        performanceMonitor.endOperation('fetch-pending-contracts', false, 'Not authenticated');
        setError('Please log in to view pending contracts');
        console.error('❌ Authentication required for pending contracts');
      } else if (response.status === 504) {
        // ✅ FIX: Clear timeouts on server timeout
        if (timeoutId) clearTimeout(timeoutId);
        clearTimeout(slowLoadingTimeoutId);
        
        // Gateway timeout
        performanceMonitor.endOperation('fetch-pending-contracts', false, 'Server timeout');
        setError('Server timeout - the request took too long. Please try again.');
        console.error('❌ Server timeout for pending contracts:', {
          status: response.status,
          data,
          queryTime: `${queryTime}ms`
        });
      } else if (response.ok && data.success !== false) {
        // ✅ FIX: Clear timeouts on success
        if (timeoutId) clearTimeout(timeoutId);
        clearTimeout(slowLoadingTimeoutId);
        
        // ✅ FIX: Handle both success=true and undefined success (backward compatibility)
        const contractsList = data.contracts || [];
        setContracts(contractsList);
        setError(null); // Clear any previous errors
        
        performanceMonitor.endOperation('fetch-pending-contracts', true, undefined, {
          count: contractsList.length,
          queryTime: `${queryTime}ms`,
          requestId: data.requestId,
        });
        
        console.log('✅ Loaded pending contracts:', {
          count: contractsList.length,
          queryTime: `${queryTime}ms`,
          sampleIds: contractsList.slice(0, 3).map((c: any) => c.id),
          totalPending: data.pendingContracts,
          stats: data.stats,
          requestId: data.requestId,
          timestamp: new Date().toISOString()
        });
        
        // Show helpful message if 0 results
        if (contractsList.length === 0) {
          console.log('ℹ️ No pending contracts found - this is normal, not an error');
        }
      } else {
        // ✅ FIX: Clear timeouts on error
        if (timeoutId) clearTimeout(timeoutId);
        clearTimeout(slowLoadingTimeoutId);
        
        performanceMonitor.endOperation('fetch-pending-contracts', false, data.error || 'Unknown error');
        setError(data.error || data.message || 'Failed to fetch pending contracts');
        console.error('❌ Error fetching pending contracts:', {
          status: response.status,
          data,
          queryTime: `${queryTime}ms`
        });
      }
    } catch (err: any) {
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(slowLoadingTimeoutId);
      const queryTime = Date.now() - startTime;
      
      if (!mountedRef.current) return;
      
      if (err.name === 'AbortError') {
        performanceMonitor.endOperation('fetch-pending-contracts', false, 'Request aborted/timeout');
        setError('Request timeout - the server took too long to respond. Please try again.');
        console.error('❌ Request timeout after 10 seconds:', {
          queryTime: `${queryTime}ms`,
          timestamp: new Date().toISOString()
        });
      } else {
        performanceMonitor.endOperation('fetch-pending-contracts', false, err.message || 'Network error');
        setError(`Network error: ${err.message || 'Please check your connection and try again.'}`);
        console.error('❌ Exception fetching pending contracts:', {
          error: err,
          message: err.message,
          name: err.name,
          queryTime: `${queryTime}ms`,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      if (timeoutId) clearTimeout(timeoutId);
      clearTimeout(slowLoadingTimeoutId);
      if (mountedRef.current) {
        setLoading(false);
        setShowSlowLoadingMessage(false);
      }
      fetchAttemptedRef.current = false;
      abortControllerRef.current = null;
    }
  }, []);

  // ✅ FIX: Simplified useEffect with proper dependencies
  useEffect(() => {
    mountedRef.current = true;
    
    // Log permission check for debugging
    console.log('📋 Pending Contracts - Permission Check:', {
      hasPermission,
      isAdmin: permissions.isAdmin,
      isLoading: permissions.isLoading,
      canRead: permissions.can('contract:read:own'),
      forceLoad,
      timestamp: new Date().toISOString(),
      fetchAttempted: fetchAttemptedRef.current
    });

    // ✅ FIX: Force load after 4 seconds regardless of permissions (safety net)
    const forceLoadTimeout = setTimeout(() => {
      if (!fetchAttemptedRef.current) {
        console.warn('⚠️ Force loading after 4 seconds - permissions check may be stuck');
        forceLoadRef.current = true;
        setForceLoad(true);
      }
    }, 4000);

    // ✅ FIX: Add timeout to prevent infinite loading if permissions never load
    const permissionTimeout = setTimeout(() => {
      if (permissions.isLoading && !fetchAttemptedRef.current) {
        console.warn('⚠️ Permissions taking too long to load, proceeding with fetch anyway...');
        fetchPendingContracts();
      }
    }, 2000); // Reduced to 2 seconds for faster response

    if (!permissions.isLoading || forceLoadRef.current) {
      clearTimeout(permissionTimeout);
      clearTimeout(forceLoadTimeout);
      
      if (hasPermission || forceLoadRef.current) {
        console.log('✅ Permission granted (or forced), fetching pending contracts...');
        // Call fetchPendingContracts directly to avoid dependency loop
        fetchPendingContracts();
      } else {
        console.warn('⚠️ Insufficient permissions for pending contracts:', {
          required: 'contract:read:own or admin role',
          hasPermission,
          isAdmin: permissions.isAdmin,
          canRead: permissions.can('contract:read:own')
        });
        setLoading(false);
        setPermissionError(true);
      }
    } else {
      console.log('⏳ Waiting for permissions to load...');
    }

    return () => {
      mountedRef.current = false;
      clearTimeout(permissionTimeout);
      clearTimeout(forceLoadTimeout);
      // Cancel any ongoing fetch when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions.isLoading]); // ✅ FIX: Only depend on isLoading. fetchPendingContracts is intentionally excluded to prevent infinite loop

  // ✅ FIX: Add manual retry function
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchAttemptedRef.current = false; // Reset flag before retry
    fetchPendingContracts(true); // Force fetch even if one is in progress
  }, [fetchPendingContracts]);

  // ✅ FIX: Add cancel function for slow loading
  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setShowSlowLoadingMessage(false);
      setError('Request cancelled by user');
      console.log('🚫 Request cancelled by user');
    }
  }, []);

  // Action handlers
  const handleContractAction = useCallback((action: string, contractId: string) => {
    const actionConfig = {
      approve: {
        title: 'Approve Contract',
        description: 'Are you sure you want to approve this contract? This will activate the contract.',
        requiresReason: false,
      },
      reject: {
        title: 'Reject Contract',
        description: 'Are you sure you want to reject this contract? Please provide a reason.',
        requiresReason: true,
      },
      request_changes: {
        title: 'Request Changes',
        description: 'Request changes to this contract. Please provide details about what needs to be changed.',
        requiresReason: true,
      },
      send_to_legal: {
        title: 'Send to Legal Review',
        description: 'Send this contract to the legal team for review.',
        requiresReason: false,
      },
      send_to_hr: {
        title: 'Send to HR Review',
        description: 'Send this contract to the HR team for review.',
        requiresReason: false,
      },
    };

    const config = actionConfig[action as keyof typeof actionConfig];
    if (config) {
      setActionDialog({
        isOpen: true,
        action,
        contractId,
        title: config.title,
        description: config.description,
        requiresReason: config.requiresReason,
      });
    }
  }, []);

  const handleBulkAction = useCallback((action: string) => {
    if (selectedContracts.length === 0) {
      toast.error('Please select contracts to perform bulk action');
      return;
    }

    const actionConfig = {
      approve: {
        title: 'Approve Selected Contracts',
        description: `Are you sure you want to approve ${selectedContracts.length} contracts?`,
        requiresReason: false,
      },
      reject: {
        title: 'Reject Selected Contracts',
        description: `Are you sure you want to reject ${selectedContracts.length} contracts? Please provide a reason.`,
        requiresReason: true,
      },
      request_changes: {
        title: 'Request Changes',
        description: `Request changes for ${selectedContracts.length} contracts. Please provide details.`,
        requiresReason: true,
      },
      send_to_legal: {
        title: 'Send to Legal Review',
        description: `Send ${selectedContracts.length} contracts to the legal team for review.`,
        requiresReason: false,
      },
      send_to_hr: {
        title: 'Send to HR Review',
        description: `Send ${selectedContracts.length} contracts to the HR team for review.`,
        requiresReason: false,
      },
    };

    const config = actionConfig[action as keyof typeof actionConfig];
    if (config) {
      setActionDialog({
        isOpen: true,
        action,
        contractIds: selectedContracts,
        title: config.title,
        description: config.description,
        requiresReason: config.requiresReason,
      });
    }
  }, [selectedContracts]);

  const executeAction = useCallback(async () => {
    if (!actionDialog.action) return;

    setActionLoading(true);
    try {
      // Handle individual contract actions
      if (actionDialog.contractId) {
        const response = await fetch(`/api/contracts/${actionDialog.contractId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: actionDialog.action,
            reason: actionReason,
          }),
        });

        const data = await response.json();

        if (data.success) {
          toast.success(data.message);
          fetchPendingContracts(); // Refresh the list
        } else {
          toast.error(data.error || 'Action failed');
        }
      }
      // Handle bulk contract actions
      else if (actionDialog.contractIds) {
        const promises = actionDialog.contractIds.map(contractId =>
          fetch(`/api/contracts/${contractId}/approve`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              action: actionDialog.action,
              reason: actionReason,
            }),
          }).then(res => res.json())
        );

        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.success).length;
        
        if (successCount > 0) {
          toast.success(`${successCount} contract${successCount > 1 ? 's' : ''} ${actionDialog.action}ed successfully`);
          fetchPendingContracts(); // Refresh the list
        } else {
          toast.error('All actions failed');
        }
      }

      setActionDialog({ isOpen: false, action: '', title: '', description: '', requiresReason: false });
      setActionReason('');
      setSelectedContracts([]);
    } catch (error) {
      console.error('Error executing action:', error);
      toast.error('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  }, [actionDialog, actionReason, fetchPendingContracts]);

  const handleSelectContract = useCallback((contractId: string, checked: boolean) => {
    if (checked) {
      setSelectedContracts(prev => [...prev, contractId]);
    } else {
      setSelectedContracts(prev => prev.filter(id => id !== contractId));
    }
  }, []);

  const filteredContracts = contracts.filter(
    contract =>
      contract.contract_number
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contract.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.first_party?.name_en
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contract.second_party?.name_en
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contract.promoters?.name_en
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      contract.promoter?.name_en
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedContracts(filteredContracts.map(contract => contract.id));
    } else {
      setSelectedContracts([]);
    }
  }, [filteredContracts]);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Invalid Date';
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'legal_review':
        return 'bg-blue-100 text-blue-800';
      case 'hr_review':
        return 'bg-green-100 text-green-800';
      case 'final_approval':
        return 'bg-purple-100 text-purple-800';
      case 'signature':
        return 'bg-orange-100 text-orange-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'legal_review':
        return 'Legal Review';
      case 'hr_review':
        return 'HR Review';
      case 'final_approval':
        return 'Final Approval';
      case 'signature':
        return 'Awaiting Signature';
      case 'pending':
        return 'Pending Review';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Show permission error with helpful message
  if (permissionError && !loading) {
    return (
      <div className='container mx-auto space-y-6 py-6'>
        <div className='flex items-center gap-3'>
          <Clock className='h-8 w-8 text-orange-600' />
          <div>
            <h1 className='text-3xl font-bold'>Pending Contracts</h1>
            <p className='text-muted-foreground'>
              View all contracts awaiting approval
            </p>
          </div>
        </div>

        <Alert variant='destructive'>
          <ShieldAlert className='h-4 w-4' />
          <AlertTitle>Insufficient Permissions</AlertTitle>
          <AlertDescription className='space-y-3'>
            <p>
              You don't have permission to view pending contracts. This page requires one of the following:
            </p>
            <ul className='list-disc list-inside space-y-1 ml-2'>
              <li><strong>Permission:</strong> <code className='bg-muted px-1.5 py-0.5 rounded'>contract:read:own</code></li>
              <li><strong>OR Admin Role:</strong> System administrator access</li>
            </ul>
            <div className='flex gap-2 mt-4'>
              <Button variant='outline' asChild>
                <Link href='/en/dashboard'>
                  <Clock className='mr-2 h-4 w-4' />
                  Go to Dashboard
                </Link>
              </Button>
              <Button variant='outline' asChild>
                <Link href='/en/auth/unauthorized'>
                  <Mail className='mr-2 h-4 w-4' />
                  Request Access
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className='py-12'>
            <div className='text-center text-muted-foreground'>
              <ShieldAlert className='mx-auto mb-4 h-12 w-12 text-red-500' />
              <h3 className='text-lg font-semibold mb-2'>Access Restricted</h3>
              <p className='text-sm mb-4'>
                Contact your system administrator to request the necessary permissions.
              </p>
              <p className='text-xs text-muted-foreground'>
                Required Permission: <code className='bg-muted px-2 py-1 rounded'>contract:read:own</code>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ✅ FIX: Improved loading state with skeleton and cancel option
  if (loading && !showPartialResults) {
    return (
      <div className='container mx-auto py-6 space-y-4'>
        <div className='flex items-center gap-3 mb-6'>
          <Clock className='h-8 w-8 text-orange-600' />
          <div>
            <h1 className='text-3xl font-bold'>Pending Contracts</h1>
            <p className='text-muted-foreground'>
              View all contracts awaiting approval
            </p>
          </div>
        </div>
        
        {showSlowLoadingMessage ? (
          <Card>
            <CardContent className='py-12'>
              <div className='flex flex-col items-center justify-center space-y-4'>
                <Loader2 className='h-12 w-12 animate-spin text-orange-600' />
                <div className='text-center space-y-2'>
                  <p className='text-base font-medium'>Loading pending contracts...</p>
                  <p className='text-sm text-muted-foreground'>
                    This is taking longer than expected. The server might be busy.
                  </p>
                  <p className='text-xs text-muted-foreground'>
                    Request will timeout after 10 seconds
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button 
                    variant='outline' 
                    size='sm'
                    onClick={handleCancel}
                    className='mt-4'
                  >
                    <AlertTriangle className='mr-2 h-4 w-4' />
                    Cancel Request
                  </Button>
                  <Button 
                    variant='default' 
                    size='sm'
                    onClick={handleRetry}
                    className='mt-4 bg-orange-600 hover:bg-orange-700'
                  >
                    <RefreshCw className='mr-2 h-4 w-4' />
                    Retry
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <ContractsCardSkeleton />
        )}
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      <div className='flex items-center gap-3'>
        <Clock className='h-8 w-8 text-orange-600' />
        <div>
          <h1 className='text-3xl font-bold'>Pending Contracts</h1>
          <p className='text-muted-foreground'>
            View all contracts awaiting approval
          </p>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>Failed to Load Pending Contracts</AlertTitle>
          <AlertDescription className='space-y-3'>
            <p className='font-medium'>{error}</p>
            <div className='text-sm space-y-2'>
              <p className='text-muted-foreground'>Possible causes:</p>
              <ul className='list-disc list-inside space-y-1 ml-2'>
                <li>Network connectivity issues</li>
                <li>Server timeout (request took too long)</li>
                <li>Database query performance issues</li>
                <li>Permission or authentication problems</li>
              </ul>
            </div>
            <div className='flex flex-wrap gap-2 mt-4'>
              <Button 
                onClick={handleRetry} 
                variant='default' 
                size='sm'
                className='bg-orange-600 hover:bg-orange-700'
              >
                <RefreshCw className='mr-2 h-4 w-4' />
                Retry Now
              </Button>
              <Button variant='outline' size='sm' asChild>
                <Link href='/en/contracts'>
                  <Eye className='mr-2 h-4 w-4' />
                  View All Contracts
                </Link>
              </Button>
              <Button variant='outline' size='sm' asChild>
                <Link href='/en/dashboard'>
                  <Clock className='mr-2 h-4 w-4' />
                  Go to Dashboard
                </Link>
              </Button>
            </div>
            {retryCount > 0 && (
              <p className='text-xs text-muted-foreground mt-2'>
                Retry attempts: {retryCount}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='flex items-center gap-2'>
                Pending Contracts
                {contracts.length > 0 && (
                  <Badge variant='secondary' className='ml-2'>
                    {contracts.length}
                  </Badge>
                )}
                {filteredContracts.length > 0 && (
                  <div className='flex items-center gap-2 ml-4'>
                    <Checkbox
                      checked={selectedContracts.length === filteredContracts.length && filteredContracts.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className='text-sm text-muted-foreground'>
                      Select All
                    </span>
                  </div>
                )}
              </CardTitle>
              <CardDescription>
                {filteredContracts.length === contracts.length 
                  ? `${contracts.length} ${contracts.length === 1 ? 'contract' : 'contracts'} awaiting approval`
                  : `Showing ${filteredContracts.length} of ${contracts.length} contracts`}
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <Button 
                variant='outline' 
                size='sm'
                onClick={handleRetry}
                disabled={loading}
                className='hover:bg-orange-50 hover:border-orange-200'
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              
              {/* Bulk Actions */}
              {selectedContracts.length > 0 && (
                <div className='flex items-center gap-2'>
                  <span className='text-sm text-muted-foreground'>
                    {selectedContracts.length} selected
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='outline' size='sm'>
                        <MoreHorizontal className='mr-2 h-4 w-4' />
                        Bulk Actions
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('approve')}>
                        <CheckCircle className='mr-2 h-4 w-4' />
                        Approve Selected
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('reject')}>
                        <XCircle className='mr-2 h-4 w-4' />
                        Reject Selected
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkAction('send_to_legal')}>
                        <FileText className='mr-2 h-4 w-4' />
                        Send to Legal
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('send_to_hr')}>
                        <Users className='mr-2 h-4 w-4' />
                        Send to HR
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleBulkAction('request_changes')}>
                        <Edit className='mr-2 h-4 w-4' />
                        Request Changes
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setSelectedContracts([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              )}
              
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search contracts...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-64 pl-10'
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 space-y-4'>
              <div className='rounded-full bg-green-100 p-4'>
                <Clock className='h-12 w-12 text-green-600' />
              </div>
              <div className='text-center space-y-2'>
                <h3 className='text-lg font-semibold'>
                  {searchTerm ? 'No Matching Contracts' : 'No Pending Contracts'}
                </h3>
                <p className='text-muted-foreground max-w-md'>
                  {searchTerm ? (
                    <>
                      No contracts match your search criteria "<strong>{searchTerm}</strong>". 
                      Try adjusting your search or clear filters.
                    </>
                  ) : contracts.length === 0 ? (
                    <>
                      There are currently no contracts awaiting approval. 
                      All contracts have been reviewed and approved. Great work!
                    </>
                  ) : (
                    'Filters removed all results. Try adjusting your filters.'
                  )}
                </p>
              </div>
              <div className='flex gap-2'>
                {searchTerm && (
                  <Button 
                    variant='default' 
                    size='sm'
                    onClick={() => setSearchTerm('')}
                    className='bg-orange-600 hover:bg-orange-700'
                  >
                    <Search className='mr-2 h-4 w-4' />
                    Clear Search
                  </Button>
                )}
                <Button variant='outline' size='sm' asChild>
                  <Link href='/en/contracts'>
                    <Eye className='mr-2 h-4 w-4' />
                    View All Contracts
                  </Link>
                </Button>
                <Button 
                  variant='outline' 
                  size='sm'
                  onClick={handleRetry}
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Refresh
                </Button>
              </div>
              {!searchTerm && contracts.length === 0 && (
                <div className='mt-4 p-4 bg-green-50 border border-green-200 rounded-lg'>
                  <p className='text-sm text-green-800 text-center'>
                    ✅ All contracts are up to date. Check back later for new submissions.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredContracts.map(contract => (
                <div
                  key={contract.id}
                  className='rounded-lg border p-4 transition-shadow hover:shadow-md'
                >
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-3 flex-1'>
                      <Checkbox
                        checked={selectedContracts.includes(contract.id)}
                        onCheckedChange={(checked) => handleSelectContract(contract.id, checked as boolean)}
                      />
                      <div className='flex-1'>
                        <div className='mb-2 flex items-center gap-3'>
                          <h3 className='font-semibold'>
                            {contract.contract_number}
                          </h3>
                          <ContractStatusBadge 
                            status={contract.approval_status || contract.status as any} 
                            size="sm"
                          />
                        </div>
                        <p className='mb-1 text-sm text-muted-foreground'>
                          {contract.job_title} • {contract.contract_type}
                        </p>
                        <div className='flex items-center gap-4 text-xs text-muted-foreground'>
                          <span>
                            Client: {contract.first_party?.name_en || 'N/A'}
                          </span>
                          <span>
                            Employer: {contract.second_party?.name_en || 'N/A'}
                          </span>
                          <span>
                            Employee:{' '}
                            {contract.promoters?.name_en || contract.promoter?.name_en || 'N/A'}
                          </span>
                          <span>
                            Submitted:{' '}
                            {formatDate(
                              contract.submitted_for_review_at ||
                                contract.created_at
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant='outline' size='sm' asChild>
                        <Link href={`/en/contracts/${contract.id}`}>
                          <Eye className='mr-2 h-4 w-4' />
                          View
                        </Link>
                      </Button>
                      
                      {/* Action Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant='outline' size='sm'>
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem onClick={() => handleContractAction('approve', contract.id)}>
                            <CheckCircle className='mr-2 h-4 w-4' />
                            Approve Contract
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleContractAction('reject', contract.id)}>
                            <XCircle className='mr-2 h-4 w-4' />
                            Reject Contract
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleContractAction('send_to_legal', contract.id)}>
                            <FileText className='mr-2 h-4 w-4' />
                            Send to Legal
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleContractAction('send_to_hr', contract.id)}>
                            <Users className='mr-2 h-4 w-4' />
                            Send to HR
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleContractAction('request_changes', contract.id)}>
                            <Edit className='mr-2 h-4 w-4' />
                            Request Changes
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setActionDialog({ isOpen: false, action: '', title: '', description: '', requiresReason: false });
          setActionReason('');
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionDialog.title}</DialogTitle>
            <DialogDescription>{actionDialog.description}</DialogDescription>
          </DialogHeader>
          
          {actionDialog.requiresReason && (
            <div className='space-y-2'>
              <label className='text-sm font-medium'>
                {actionDialog.action === 'reject' ? 'Reason for rejection' : 
                 actionDialog.action === 'request_changes' ? 'Changes requested' : 'Reason'}
              </label>
              <Textarea
                placeholder={actionDialog.action === 'reject' ? 'Please provide a reason for rejecting this contract...' :
                           actionDialog.action === 'request_changes' ? 'Please describe what changes are needed...' :
                           'Please provide additional details...'}
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={3}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setActionDialog({ isOpen: false, action: '', title: '', description: '', requiresReason: false });
                setActionReason('');
              }}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={executeAction}
              disabled={actionLoading || (actionDialog.requiresReason && !actionReason.trim())}
            >
              {actionLoading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {actionDialog.action === 'approve' ? 'Approve' :
               actionDialog.action === 'reject' ? 'Reject' :
               actionDialog.action === 'request_changes' ? 'Request Changes' :
               actionDialog.action === 'send_to_legal' ? 'Send to Legal' :
               actionDialog.action === 'send_to_hr' ? 'Send to HR' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Wrap the entire page with error boundary
export default function PendingContractsPage() {
  return (
    <ContractsErrorBoundary>
      <PendingContractsPageContent />
    </ContractsErrorBoundary>
  );
}
