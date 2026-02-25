'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  FileText,
  Calendar,
  Building2,
  MapPin,
  DollarSign,
  Download,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isPast, isFuture } from 'date-fns';

interface Contract {
  id: string;
  contract_number: string;
  title: string;
  description: string | null;
  type: string;
  contract_type: string;
  status: string;
  start_date: string;
  end_date: string;
  basic_salary: number | null;
  total_value: number | null;
  currency: string | null;
  products_en: string | null;
  location_en: string | null;
  pdf_url: string | null;
  is_current: boolean;
  employer?: {
    id: string;
    name_en: string | null;
    name_ar: string | null;
    logo_url: string | null;
  } | null;
  client?: {
    id: string;
    name_en: string | null;
    name_ar: string | null;
    logo_url: string | null;
  } | null;
}

interface ContractStats {
  total: number;
  active: number;
  expired: number;
  current: Contract | null;
}

function ContractItem({ contract }: { contract: Contract }) {
  const [expanded, setExpanded] = useState(false);

  const startDate = new Date(contract.start_date);
  const endDate = new Date(contract.end_date);
  const today = new Date();
  const isActive = startDate <= today && endDate >= today;
  const isExpired = endDate < today;
  const isUpcoming = startDate > today;
  const daysLeft = differenceInDays(endDate, today);

  const getStatusBadge = () => {
    if (contract.is_current) {
      return <Badge className='bg-blue-500'>Current</Badge>;
    }
    if (isActive) {
      return <Badge className='bg-green-500'>Active</Badge>;
    }
    if (isExpired) {
      return <Badge variant='secondary'>Expired</Badge>;
    }
    if (isUpcoming) {
      return <Badge className='bg-amber-500'>Upcoming</Badge>;
    }
    return <Badge>{contract.status}</Badge>;
  };

  return (
    <div
      className={cn(
        'border rounded-xl overflow-hidden transition-all',
        contract.is_current && 'border-blue-300 dark:border-blue-700',
        isExpired && 'opacity-75'
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'p-4',
          contract.is_current && 'bg-blue-50 dark:bg-blue-900/20',
          isExpired && 'bg-gray-50 dark:bg-gray-900'
        )}
      >
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1'>
            <div className='flex items-center gap-2 mb-1'>
              <FileText className='h-4 w-4 text-gray-500' />
              <span className='text-sm text-gray-500'>
                {contract.contract_number}
              </span>
              {getStatusBadge()}
            </div>
            <h4 className='font-semibold text-lg'>{contract.title}</h4>
            {contract.employer?.name_en && (
              <p className='text-sm text-gray-600 flex items-center gap-1 mt-1'>
                <Building2 className='h-3 w-3' />
                {contract.employer.name_en}
              </p>
            )}
          </div>

          <div className='text-right'>
            {contract.basic_salary && (
              <p className='font-bold text-lg text-green-600'>
                {contract.currency || 'OMR'}{' '}
                {contract.basic_salary.toLocaleString()}
              </p>
            )}
            {isActive && daysLeft <= 30 && (
              <p className='text-xs text-amber-600 flex items-center gap-1 justify-end'>
                <Clock className='h-3 w-3' />
                {daysLeft} days left
              </p>
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className='flex flex-wrap gap-4 mt-3 text-sm text-gray-500'>
          <span className='flex items-center gap-1'>
            <Calendar className='h-3 w-3' />
            {format(startDate, 'MMM d, yyyy')} -{' '}
            {format(endDate, 'MMM d, yyyy')}
          </span>
          {contract.location_en && (
            <span className='flex items-center gap-1'>
              <MapPin className='h-3 w-3' />
              {contract.location_en}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className='p-4 border-t bg-white dark:bg-gray-950 space-y-4'>
          {contract.description && (
            <div>
              <h5 className='text-sm font-medium text-gray-500 mb-1'>
                Description
              </h5>
              <p className='text-sm'>{contract.description}</p>
            </div>
          )}

          {contract.products_en && (
            <div>
              <h5 className='text-sm font-medium text-gray-500 mb-1'>
                Products/Services
              </h5>
              <p className='text-sm'>{contract.products_en}</p>
            </div>
          )}

          {contract.client && (
            <div>
              <h5 className='text-sm font-medium text-gray-500 mb-1'>Client</h5>
              <p className='text-sm'>{contract.client.name_en}</p>
            </div>
          )}

          <div className='grid grid-cols-2 gap-4'>
            <div>
              <h5 className='text-sm font-medium text-gray-500 mb-1'>
                Contract Type
              </h5>
              <p className='text-sm capitalize'>
                {contract.contract_type || contract.type}
              </p>
            </div>
            {contract.total_value && (
              <div>
                <h5 className='text-sm font-medium text-gray-500 mb-1'>
                  Total Value
                </h5>
                <p className='text-sm'>
                  {contract.currency || 'OMR'}{' '}
                  {contract.total_value.toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {contract.pdf_url && (
            <Button
              variant='outline'
              size='sm'
              className='w-full'
              onClick={() => window.open(contract.pdf_url!, '_blank')}
            >
              <Download className='h-4 w-4 mr-2' />
              Download Contract PDF
            </Button>
          )}
        </div>
      )}

      {/* Expand/Collapse */}
      <button
        onClick={() => setExpanded(!expanded)}
        className='w-full px-4 py-2 text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-900 flex items-center justify-center gap-1 border-t'
      >
        {expanded ? (
          <>
            <ChevronUp className='h-4 w-4' />
            Show less
          </>
        ) : (
          <>
            <ChevronDown className='h-4 w-4' />
            View details
          </>
        )}
      </button>
    </div>
  );
}

export function ContractsCard() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [stats, setStats] = useState<ContractStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await fetch('/api/employee/my-contracts');
      const data = await response.json();

      if (!response.ok) {
        if (response.status !== 404) {
          throw new Error(data.error);
        }
        return;
      }

      setContracts(data.contracts || []);
      setStats(data.stats || null);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const filteredContracts = contracts.filter(contract => {
    const endDate = new Date(contract.end_date);
    const startDate = new Date(contract.start_date);
    const today = new Date();

    if (filter === 'active') {
      return startDate <= today && endDate >= today;
    }
    if (filter === 'expired') {
      return endDate < today;
    }
    return true;
  });

  if (loading) {
    return (
      <Card className='border-0 shadow-lg'>
        <CardContent className='flex items-center justify-center py-12'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='border-0 shadow-lg'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-xl flex items-center gap-2'>
            <FileText className='h-5 w-5 text-indigo-600' />
            My Contracts
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Stats */}
        {stats && (
          <div className='grid grid-cols-3 gap-3'>
            <button
              onClick={() => setFilter(filter === 'all' ? 'all' : 'all')}
              className={cn(
                'p-3 rounded-lg text-center transition-all',
                filter === 'all'
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 ring-2 ring-indigo-400'
                  : 'bg-gray-100 dark:bg-gray-900 hover:bg-gray-200'
              )}
            >
              <p className='text-2xl font-bold text-indigo-600'>
                {stats.total}
              </p>
              <p className='text-xs text-gray-500'>Total</p>
            </button>
            <button
              onClick={() => setFilter(filter === 'active' ? 'all' : 'active')}
              className={cn(
                'p-3 rounded-lg text-center transition-all',
                filter === 'active'
                  ? 'bg-green-100 dark:bg-green-900/30 ring-2 ring-green-400'
                  : 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100'
              )}
            >
              <p className='text-2xl font-bold text-green-600'>
                {stats.active}
              </p>
              <p className='text-xs text-gray-500'>Active</p>
            </button>
            <button
              onClick={() =>
                setFilter(filter === 'expired' ? 'all' : 'expired')
              }
              className={cn(
                'p-3 rounded-lg text-center transition-all',
                filter === 'expired'
                  ? 'bg-gray-200 dark:bg-gray-700 ring-2 ring-gray-400'
                  : 'bg-gray-50 dark:bg-gray-900/20 hover:bg-gray-100'
              )}
            >
              <p className='text-2xl font-bold text-gray-600'>
                {stats.expired}
              </p>
              <p className='text-xs text-gray-500'>Expired</p>
            </button>
          </div>
        )}

        {/* Current Contract Highlight */}
        {stats?.current && (
          <div className='p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800'>
            <div className='flex items-center gap-2 mb-2'>
              <CheckCircle2 className='h-5 w-5 text-blue-600' />
              <span className='font-medium text-blue-700 dark:text-blue-400'>
                Current Assignment
              </span>
            </div>
            <p className='text-lg font-semibold'>{stats.current.title}</p>
            {stats.current.employer?.name_en && (
              <p className='text-sm text-gray-600'>
                {stats.current.employer.name_en}
              </p>
            )}
          </div>
        )}

        {/* Contract List */}
        <div className='space-y-4 max-h-[500px] overflow-y-auto pr-1'>
          {filteredContracts.length === 0 ? (
            <div className='text-center py-8 text-gray-500'>
              <FileText className='h-12 w-12 mx-auto mb-2 opacity-30' />
              <p>No contracts found</p>
            </div>
          ) : (
            filteredContracts.map(contract => (
              <ContractItem key={contract.id} contract={contract} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
