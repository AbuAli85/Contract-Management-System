'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { CheckCircle, Search, Filter, Download, Eye, ShieldAlert, Mail, RefreshCw, AlertTriangle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/use-permissions';
import { ContractsCardSkeleton } from '@/components/contracts/ContractsSkeleton';

interface Contract {
  id: string;
  contract_number: string;
  job_title: string;
  contract_type: string;
  status: string;
  created_at: string;
  approved_at: string;
  first_party: { name_en: string } | null;
  second_party: { name_en: string } | null;
  promoter: { name_en: string } | null;
  promoters: { name_en: string } | null;
}

export default function ApprovedContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const fetchAttemptedRef = useRef(false);
  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Check permissions
  const permissions = usePermissions();
  const hasPermission = permissions.can('contract:read:own') || permissions.isAdmin;

  // ✅ FIX: Use useCallback to memoize the fetch function
  const fetchApprovedContracts = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (fetchAttemptedRef.current) {
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
    
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Request timeout - aborting after 10 seconds');
      controller.abort();
    }, 10000); // 10 second timeout

    // Show "taking longer than expected" message after 3 seconds
    const slowLoadingTimeoutId = setTimeout(() => {
      if (mountedRef.current) {
        setShowSlowLoadingMessage(true);
      }
    }, 3000);

    const startTime = Date.now();
    
    try {
      setLoading(true);
      setError(null);
      setPermissionError(false);
      setShowSlowLoadingMessage(false);
      
      console.log('🔍 Approved Contracts Debug:', {
        timestamp: new Date().toISOString(),
        endpoint: '/api/contracts?status=active',
        timeout: '10 seconds',
        retryCount
      });
      
      const response = await fetch('/api/contracts?status=active', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });
      
      clearTimeout(timeoutId);
      clearTimeout(slowLoadingTimeoutId);
      const queryTime = Date.now() - startTime;
      console.log(`⏱️ API Response time: ${queryTime}ms`);
      
      const data = await response.json();

      if (!mountedRef.current) return;

      if (response.status === 403) {
        setPermissionError(true);
        setError('Insufficient permissions to view approved contracts');
        console.error('❌ Permission denied for approved contracts:', data);
      } else if (response.status === 401) {
        setError('Please log in to view approved contracts');
        console.error('❌ Authentication required for approved contracts');
      } else if (response.status === 504) {
        setError('Server timeout - the request took too long. Please try again.');
        console.error('❌ Server timeout for approved contracts:', {
          status: response.status,
          data,
          queryTime: `${queryTime}ms`
        });
      } else if (response.ok && data.success !== false) {
        const contractsList = data.contracts || [];
        setContracts(contractsList);
        setError(null);
        
        console.log('✅ Loaded approved contracts:', {
          count: contractsList.length,
          queryTime: `${queryTime}ms`,
          sampleIds: contractsList.slice(0, 3).map((c: any) => c.id),
          totalActive: data.activeContracts,
          requestId: data.requestId,
          timestamp: new Date().toISOString()
        });
        
        if (contractsList.length === 0) {
          console.log('ℹ️ No approved contracts found - this is normal, not an error');
        }
      } else {
        setError(data.error || data.message || 'Failed to fetch approved contracts');
        console.error('❌ Error fetching approved contracts:', {
          status: response.status,
          data,
          queryTime: `${queryTime}ms`
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      clearTimeout(slowLoadingTimeoutId);
      const queryTime = Date.now() - startTime;
      
      if (!mountedRef.current) return;
      
      if (err.name === 'AbortError') {
        setError('Request timeout - the server took too long to respond. Please try again.');
        console.error('❌ Request timeout after 10 seconds:', {
          queryTime: `${queryTime}ms`,
          timestamp: new Date().toISOString()
        });
      } else {
        setError(`Network error: ${err.message || 'Please check your connection and try again.'}`);
        console.error('❌ Exception fetching approved contracts:', {
          error: err,
          message: err.message,
          name: err.name,
          queryTime: `${queryTime}ms`,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(slowLoadingTimeoutId);
      if (mountedRef.current) {
        setLoading(false);
        setShowSlowLoadingMessage(false);
      }
      fetchAttemptedRef.current = false;
      abortControllerRef.current = null;
    }
  }, [retryCount]);

  // ✅ FIX: Simplified useEffect with proper dependencies
  useEffect(() => {
    mountedRef.current = true;
    
    console.log('📋 Approved Contracts - Permission Check:', {
      hasPermission,
      isAdmin: permissions.isAdmin,
      isLoading: permissions.isLoading,
      timestamp: new Date().toISOString()
    });

    // ✅ FIX: Add timeout to prevent infinite loading if permissions never load
    const permissionTimeout = setTimeout(() => {
      if (permissions.isLoading) {
        console.warn('⚠️ Permissions taking too long to load, proceeding with fetch anyway...');
        fetchApprovedContracts();
      }
    }, 5000); // 5 second timeout for permissions

    if (!permissions.isLoading) {
      clearTimeout(permissionTimeout);
      
      if (hasPermission) {
        fetchApprovedContracts();
      } else {
        setLoading(false);
        setPermissionError(true);
        console.warn('⚠️ Insufficient permissions for approved contracts:', {
          required: 'contract:read:own or admin role',
          hasPermission,
          isAdmin: permissions.isAdmin
        });
      }
    }

    return () => {
      mountedRef.current = false;
      clearTimeout(permissionTimeout);
    };
  }, [permissions.isLoading, hasPermission, permissions.isAdmin, fetchApprovedContracts]);

  // ✅ FIX: Add manual retry function
  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    fetchApprovedContracts();
  }, [fetchApprovedContracts]);

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
        .includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Show permission error with helpful message
  if (permissionError && !loading) {
    return (
      <div className='container mx-auto space-y-6 py-6'>
        <div className='flex items-center gap-3'>
          <CheckCircle className='h-8 w-8 text-green-600' />
          <div>
            <h1 className='text-3xl font-bold'>Approved Contracts</h1>
            <p className='text-muted-foreground'>
              View all approved and active contracts
            </p>
          </div>
        </div>

        <Alert variant='destructive'>
          <ShieldAlert className='h-4 w-4' />
          <AlertTitle>Insufficient Permissions</AlertTitle>
          <AlertDescription className='space-y-3'>
            <p>
              You don't have permission to view approved contracts. This page requires one of the following:
            </p>
            <ul className='list-disc list-inside space-y-1 ml-2'>
              <li><strong>Permission:</strong> <code className='bg-muted px-1.5 py-0.5 rounded'>contract:read:own</code></li>
              <li><strong>OR Admin Role:</strong> System administrator access</li>
            </ul>
            <div className='flex gap-2 mt-4'>
              <Button variant='outline' asChild>
                <Link href='/en/dashboard'>
                  <CheckCircle className='mr-2 h-4 w-4' />
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
  if (loading) {
    return (
      <div className='container mx-auto py-6 space-y-4'>
        <div className='flex items-center gap-3 mb-6'>
          <CheckCircle className='h-8 w-8 text-green-600' />
          <div>
            <h1 className='text-3xl font-bold'>Approved Contracts</h1>
            <p className='text-muted-foreground'>
              View all approved and active contracts
            </p>
          </div>
        </div>
        
        {showSlowLoadingMessage ? (
          <Card>
            <CardContent className='py-12'>
              <div className='flex flex-col items-center justify-center space-y-4'>
                <Loader2 className='h-12 w-12 animate-spin text-green-600' />
                <div className='text-center space-y-2'>
                  <p className='text-base font-medium'>Loading approved contracts...</p>
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
                    className='mt-4 bg-green-600 hover:bg-green-700'
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
        <CheckCircle className='h-8 w-8 text-green-600' />
        <div>
          <h1 className='text-3xl font-bold'>Approved Contracts</h1>
          <p className='text-muted-foreground'>
            View all approved and active contracts
          </p>
        </div>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertTitle>Failed to Load Approved Contracts</AlertTitle>
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
                className='bg-green-600 hover:bg-green-700'
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
                  <CheckCircle className='mr-2 h-4 w-4' />
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
                Approved Contracts
                {contracts.length > 0 && (
                  <Badge variant='secondary' className='ml-2 bg-green-100 text-green-800'>
                    {contracts.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {filteredContracts.length === contracts.length 
                  ? `${contracts.length} ${contracts.length === 1 ? 'contract' : 'contracts'} approved and active`
                  : `Showing ${filteredContracts.length} of ${contracts.length} contracts`}
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <Button 
                variant='outline' 
                size='sm'
                onClick={handleRetry}
                disabled={loading}
                className='hover:bg-green-50 hover:border-green-200'
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
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
                <CheckCircle className='h-12 w-12 text-green-600' />
              </div>
              <div className='text-center space-y-2'>
                <h3 className='text-lg font-semibold'>
                  {searchTerm ? 'No Matching Contracts' : 'No Approved Contracts'}
                </h3>
                <p className='text-muted-foreground max-w-md'>
                  {searchTerm ? (
                    <>
                      No contracts match your search criteria "<strong>{searchTerm}</strong>". 
                      Try adjusting your search or clear filters.
                    </>
                  ) : contracts.length === 0 ? (
                    <>
                      There are currently no approved contracts. 
                      Contracts with "Active" status will appear here once approved.
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
                    className='bg-green-600 hover:bg-green-700'
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
                <div className='mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg'>
                  <p className='text-sm text-blue-800 text-center'>
                    ℹ️ Active contracts are those that have been approved and are currently in effect.
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
                    <div className='flex-1'>
                      <div className='mb-2 flex items-center gap-3'>
                        <h3 className='font-semibold'>
                          {contract.contract_number}
                        </h3>
                        <Badge
                          variant='secondary'
                          className='bg-green-100 text-green-800'
                        >
                          Approved
                        </Badge>
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
                          Employee: {contract.promoters?.name_en || contract.promoter?.name_en || 'N/A'}
                        </span>
                        <span>
                          Approved:{' '}
                          {formatDate(
                            contract.approved_at || contract.created_at
                          )}
                        </span>
                      </div>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button variant='outline' size='sm' asChild>
                        <Link href={`/en/contracts/${contract.id}`}>
                          <Eye className='mr-2 h-4 w-4' />
                          View
                        </Link>
                      </Button>
                      <Button variant='outline' size='sm'>
                        <Download className='mr-2 h-4 w-4' />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
