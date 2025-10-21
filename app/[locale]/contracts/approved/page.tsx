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
import { CheckCircle, Search, Filter, Download, Eye, ShieldAlert, Mail } from 'lucide-react';
import Link from 'next/link';
import { usePermissions } from '@/hooks/use-permissions';

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
}

export default function ApprovedContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Check permissions
  const permissions = usePermissions();
  const hasPermission = permissions.can('contract:read:own') || permissions.isAdmin;

  useEffect(() => {
    // Log permission check for debugging
    console.log('📋 Approved Contracts - Permission Check:', {
      hasPermission,
      isAdmin: permissions.isAdmin,
      isLoading: permissions.isLoading,
      timestamp: new Date().toISOString()
    });

    if (!permissions.isLoading && hasPermission) {
      fetchApprovedContracts();
    } else if (!permissions.isLoading && !hasPermission) {
      setLoading(false);
      setPermissionError(true);
      console.warn('⚠️ Insufficient permissions for approved contracts:', {
        required: 'contract:read:own or admin role',
        hasPermission,
        isAdmin: permissions.isAdmin
      });
    }
  }, [permissions.isLoading, hasPermission, permissions.isAdmin]);

  const fetchApprovedContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      setPermissionError(false);
      
      const response = await fetch('/api/contracts?status=active');
      const data = await response.json();

      if (response.status === 403) {
        // Permission denied
        setPermissionError(true);
        setError('Insufficient permissions to view approved contracts');
        console.error('❌ Permission denied for approved contracts:', data);
      } else if (response.status === 401) {
        // Not authenticated
        setError('Please log in to view approved contracts');
        console.error('❌ Authentication required for approved contracts');
      } else if (data.success) {
        setContracts(data.contracts || []);
        console.log('✅ Loaded approved contracts:', data.contracts?.length || 0);
      } else {
        setError(data.error || 'Failed to fetch approved contracts');
        console.error('❌ Error fetching approved contracts:', data);
      }
    } catch (err) {
      setError('Failed to fetch approved contracts');
      console.error('❌ Exception fetching approved contracts:', err);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className='container mx-auto py-6'>
        <div className='flex h-64 items-center justify-center'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900'></div>
          <span className='ml-2'>Loading approved contracts...</span>
        </div>
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
        <Card>
          <CardContent className='flex h-32 flex-col items-center justify-center'>
            <div className='mb-2 text-red-600'>{error}</div>
            <Button onClick={fetchApprovedContracts} variant='outline'>
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Approved Contracts</CardTitle>
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
            <div className='flex h-32 flex-col items-center justify-center'>
              <CheckCircle className='mb-2 h-8 w-8 text-green-500' />
              <p className='text-muted-foreground'>
                No approved contracts found
              </p>
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
                          Employee: {contract.promoter?.name_en || 'N/A'}
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
