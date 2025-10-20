'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Search, Download, RefreshCw } from 'lucide-react';
import type { OverallStatus } from './types';

interface PromotersFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: OverallStatus | 'all';
  onStatusFilterChange: (value: OverallStatus | 'all') => void;
  documentFilter: 'all' | 'expired' | 'expiring' | 'missing';
  onDocumentFilterChange: (
    value: 'all' | 'expired' | 'expiring' | 'missing'
  ) => void;
  assignmentFilter: 'all' | 'assigned' | 'unassigned';
  onAssignmentFilterChange: (value: 'all' | 'assigned' | 'unassigned') => void;
  hasFiltersApplied: boolean;
  onResetFilters: () => void;
  onExport: () => void;
  onRefresh: () => void;
  isFetching: boolean;
}

export function PromotersFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  documentFilter,
  onDocumentFilterChange,
  assignmentFilter,
  onAssignmentFilterChange,
  hasFiltersApplied,
  onResetFilters,
  onExport,
  onRefresh,
  isFetching,
}: PromotersFiltersProps) {
  return (
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
                onChange={event => onSearchChange(event.target.value)}
                aria-label='Search promoters by name, contact, or role'
                aria-describedby='search-help'
              />
            </div>
          </div>
          <div className='grid gap-4 sm:grid-cols-3'>
            <div className='space-y-2'>
              <Label>Lifecycle</Label>
              <Select
                value={statusFilter}
                onValueChange={value =>
                  onStatusFilterChange(value as OverallStatus | 'all')
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
                  onDocumentFilterChange(
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
                  onAssignmentFilterChange(
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
              onClick={onResetFilters}
              disabled={!hasFiltersApplied}
              aria-label='Reset all filters to default values'
            >
              Reset filters
            </Button>
            <Button
              variant='outline'
              className='flex items-center'
              onClick={onExport}
              aria-label='Export current view to CSV file'
            >
              <Download className='mr-2 h-4 w-4' aria-hidden='true' />
              Export view
            </Button>
            <Button
              onClick={onRefresh}
              variant='outline'
              disabled={isFetching}
              aria-label={isFetching ? 'Syncing data' : 'Sync data with server'}
            >
              <RefreshCw
                className={cn(
                  'mr-2 h-4 w-4',
                  isFetching && 'animate-spin text-muted-foreground'
                )}
                aria-hidden='true'
              />
              Sync
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
