'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Building, Loader2, Trash2 } from 'lucide-react';

interface PromoterFilterSectionProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  filterCompany: string;
  setFilterCompany: (value: string) => void;
  filterDocument: string;
  setFilterDocument: (value: string) => void;
  employers?: Array<{ id: string; name_en?: string; name_ar?: string }>;
  employersLoading?: boolean;
  uniqueCompanies?: Array<{ id: string; name: string }>;
  selectedPromoters?: string[];
  bulkActionLoading?: boolean;
  onBulkCompanyAssign?: () => void;
  onBulkDelete?: () => void;
  showBulkActions?: boolean;
}

export default function PromoterFilterSection({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterCompany,
  setFilterCompany,
  filterDocument,
  setFilterDocument,
  employers = [],
  employersLoading = false,
  uniqueCompanies = [],
  selectedPromoters = [],
  bulkActionLoading = false,
  onBulkCompanyAssign,
  onBulkDelete,
  showBulkActions = false,
}: PromoterFilterSectionProps) {
  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterCompany('all');
    setFilterDocument('all');
  };

  const hasActiveFilters =
    filterStatus !== 'all' ||
    filterCompany !== 'all' ||
    filterDocument !== 'all' ||
    searchTerm;

  return (
    <Card className='mb-6'>
      <CardContent className='pt-4'>
        <div className='space-y-4'>
          {/* Search Bar */}
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
            <div className='flex-1'>
              <Input
                placeholder='Search by name, ID, passport, or company...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='w-full'
              />
            </div>

            {showBulkActions && selectedPromoters.length > 0 && (
              <div className='flex gap-2'>
                {onBulkCompanyAssign && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={onBulkCompanyAssign}
                    disabled={bulkActionLoading}
                  >
                    <Building className='mr-2 h-4 w-4' />
                    Assign Company ({selectedPromoters.length})
                  </Button>
                )}
                {onBulkDelete && (
                  <Button
                    variant='destructive'
                    size='sm'
                    onClick={onBulkDelete}
                    disabled={bulkActionLoading}
                  >
                    {bulkActionLoading ? (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    ) : (
                      <Trash2 className='mr-2 h-4 w-4' />
                    )}
                    Delete Selected ({selectedPromoters.length})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Filter Options */}
          <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
            {/* Status Filter */}
            <div>
              <label className='text-sm font-medium mb-2 block'>Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className='w-full px-3 py-2 border border-input rounded-md bg-background'
                aria-label='Filter by status'
              >
                <option value='all'>All Status</option>
                <option value='active'>Active</option>
                <option value='warning'>Warning</option>
                <option value='critical'>Critical</option>
                <option value='inactive'>Inactive</option>
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <label className='text-sm font-medium mb-2 block'>Company</label>
              <select
                value={filterCompany}
                onChange={e => setFilterCompany(e.target.value)}
                className='w-full px-3 py-2 border border-input rounded-md bg-background'
                disabled={employersLoading}
                aria-label='Filter by company'
              >
                <option value='all'>
                  {employersLoading ? 'Loading companies...' : 'All Companies'}
                </option>
                {uniqueCompanies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Document Filter */}
            <div>
              <label className='text-sm font-medium mb-2 block'>
                Document Status
              </label>
              <select
                value={filterDocument}
                onChange={e => setFilterDocument(e.target.value)}
                className='w-full px-3 py-2 border border-input rounded-md bg-background'
                aria-label='Filter by document status'
              >
                <option value='all'>All Documents</option>
                <optgroup label='ID Card'>
                  <option value='id_valid'>ID - Valid</option>
                  <option value='id_expiring'>ID - Expiring</option>
                  <option value='id_expired'>ID - Expired</option>
                  <option value='id_missing'>ID - Missing</option>
                </optgroup>
                <optgroup label='Passport'>
                  <option value='passport_valid'>Passport - Valid</option>
                  <option value='passport_expiring'>Passport - Expiring</option>
                  <option value='passport_expired'>Passport - Expired</option>
                  <option value='passport_missing'>Passport - Missing</option>
                </optgroup>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className='flex flex-wrap gap-2'>
              {searchTerm && (
                <Badge variant='secondary' className='gap-1'>
                  Search: {searchTerm}
                  <button
                    onClick={() => setSearchTerm('')}
                    className='ml-1 hover:text-destructive'
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant='secondary' className='gap-1'>
                  Status: {filterStatus}
                  <button
                    onClick={() => setFilterStatus('all')}
                    className='ml-1 hover:text-destructive'
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filterCompany !== 'all' && (
                <Badge variant='secondary' className='gap-1'>
                  Company:{' '}
                  {(() => {
                    const employer = employers.find(
                      e => e.id === filterCompany
                    );
                    return employer
                      ? employer.name_en || employer.name_ar || employer.id
                      : filterCompany;
                  })()}
                  <button
                    onClick={() => setFilterCompany('all')}
                    className='ml-1 hover:text-destructive'
                  >
                    ×
                  </button>
                </Badge>
              )}
              {filterDocument !== 'all' && (
                <Badge variant='secondary' className='gap-1'>
                  Document: {filterDocument.replace('_', ' ')}
                  <button
                    onClick={() => setFilterDocument('all')}
                    className='ml-1 hover:text-destructive'
                  >
                    ×
                  </button>
                </Badge>
              )}
              <Button variant='outline' size='sm' onClick={clearAllFilters}>
                Clear All Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
