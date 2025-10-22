'use client';

import { useState, useEffect } from 'react';
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
import { Clock, Search, Filter, Eye, AlertTriangle, ShieldAlert, Mail } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/use-permissions';

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
  promoters: { name_en: string }[] | null;
}

export default function PendingContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSlowLoadingMessage, setShowSlowLoadingMessage] = useState(false);
  
  // Check permissions
  const permissions = usePermissions();
  const hasPermission = permissions.can('contract:read:own') || permissions.isAdmin || false;

  useEffect(() => {
    // Log permission check for debugging
    console.log('📋 Pending Contracts - Permission Check:', {
      hasPermission,
      isAdmin: permissions.isAdmin,
      isLoading: permissions.isLoading,
      timestamp: new Date().toISOString()
    });

    if (!permissions.isLoading && hasPermission) {
      fetchPendingContracts();
    } else if (!permissions.isLoading && !hasPermission) {
      setLoading(false);
      setPermissionError(true);
      console.warn('⚠️ Insufficient permissions for pending contracts:', {
        required: 'contract:read:own or admin role',
        hasPermission,
        isAdmin: permissions.isAdmin
      });
    }
  }, [permissions.isLoading, hasPermission, permissions.isAdmin]);

  const fetchPendingContracts = async () => {
    // ✅ FIX: Add AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Request timeout - aborting after 10 seconds');
      controller.abort();
    }, 10000); // 10 second timeout

    // Show "taking longer than expected" message after 3 seconds
    const slowLoadingTimeoutId = setTimeout(() => {
      setShowSlowLoadingMessage(true);
    }, 3000);

    const startTime = Date.now();
    
    try {
      setLoading(true);
      setError(null);
      setPermissionError(false);
      setShowSlowLoadingMessage(false);
      
      console.log('🔍 Pending Contracts Debug:', {
        timestamp: new Date().toISOString(),
        endpoint: '/api/contracts?status=pending',
        timeout: '10 seconds'
      });
      
      const response = await fetch('/api/contracts?status=pending', {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      clearTimeout(slowLoadingTimeoutId);
      const queryTime = Date.now() - startTime;
      console.log(`⏱️ API Response time: ${queryTime}ms`);
      
      const data = await response.json();

      if (response.status === 403) {
        // Permission denied
        setPermissionError(true);
        setError('Insufficient permissions to view pending contracts');
        console.error('❌ Permission denied for pending contracts:', data);
      } else if (response.status === 401) {
        // Not authenticated
        setError('Please log in to view pending contracts');
        console.error('❌ Authentication required for pending contracts');
      } else if (response.ok && data.success) {
        setContracts(data.contracts || []);
        console.log('✅ Loaded pending contracts:', {
          count: data.contracts?.length || 0,
          queryTime: `${queryTime}ms`,
          sampleIds: (data.contracts || []).slice(0, 3).map((c: any) => c.id),
          totalPending: data.pendingContracts,
          timestamp: new Date().toISOString()
        });
      } else {
        setError(data.error || 'Failed to fetch pending contracts');
        console.error('❌ Error fetching pending contracts:', {
          status: response.status,
          data,
          queryTime: `${queryTime}ms`
        });
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      clearTimeout(slowLoadingTimeoutId);
      const queryTime = Date.now() - startTime;
      
      if (err.name === 'AbortError') {
        setError('Request timeout - the server took too long to respond. Please try again.');
        console.error('❌ Request timeout after 10 seconds:', {
          queryTime: `${queryTime}ms`,
          timestamp: new Date().toISOString()
        });
      } else {
        setError('Failed to fetch pending contracts. Please check your connection and try again.');
        console.error('❌ Exception fetching pending contracts:', {
          error: err,
          message: err.message,
          queryTime: `${queryTime}ms`,
          timestamp: new Date().toISOString()
        });
      }
    } finally {
      clearTimeout(timeoutId);
      clearTimeout(slowLoadingTimeoutId);
      setLoading(false);
      setShowSlowLoadingMessage(false);
    }
  };

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
        return 'Signature';
      default:
        return status;
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

  if (loading) {
    return (
      <div className='container mx-auto py-6'>
        <div className='flex h-64 flex-col items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900'></div>
          <span className='ml-2 mt-3 text-base font-medium'>Loading pending contracts...</span>
          {showSlowLoadingMessage && (
            <p className='mt-2 text-sm text-muted-foreground'>
              This is taking longer than expected. Please wait...
            </p>
          )}
        </div>
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
            <p>{error}</p>
            <div className='flex gap-2 mt-3'>
              <Button onClick={fetchPendingContracts} variant='outline' size='sm'>
                <Clock className='mr-2 h-4 w-4' />
                Retry
              </Button>
              <Button variant='outline' size='sm' asChild>
                <Link href='/en/contracts'>
                  <Eye className='mr-2 h-4 w-4' />
                  View All Contracts
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Pending Contracts</CardTitle>
              <CardDescription>
                {filteredContracts.length} of {contracts.length} contracts
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400' />
                <Input
                  placeholder='Search contracts...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='w-64 pl-10'
                />
              </div>
              <Button variant='outline' size='sm'>
                <Filter className='mr-2 h-4 w-4' />
                Filter
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredContracts.length === 0 ? (
            <div className='flex h-48 flex-col items-center justify-center'>
              <div className='rounded-full bg-green-100 p-4 mb-4'>
                <Clock className='h-8 w-8 text-green-600' />
              </div>
              <h3 className='text-lg font-semibold mb-2'>No Pending Contracts</h3>
              <p className='text-muted-foreground mb-4 text-center max-w-md'>
                {searchTerm ? 
                  'No contracts match your search criteria. Try adjusting your search.' :
                  'All contracts have been reviewed and approved. Great work!'
                }
              </p>
              {!searchTerm && (
                <Button variant='outline' size='sm' asChild>
                  <Link href='/en/contracts'>
                    <Eye className='mr-2 h-4 w-4' />
                    View All Contracts
                  </Link>
                </Button>
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
                          className={getStatusColor(
                            contract.approval_status || contract.status
                          )}
                        >
                          {getStatusLabel(
                            contract.approval_status || contract.status
                          )}
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
                          Employee:{' '}
                          {contract.promoters && contract.promoters.length > 0
                            ? contract.promoters[0]?.name_en || 'N/A'
                            : 'N/A'}
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
                    <div className='flex items-center gap-2'>
                      <Button variant='outline' size='sm' asChild>
                        <Link href={`/en/contracts/${contract.id}`}>
                          <Eye className='mr-2 h-4 w-4' />
                          View
                        </Link>
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
