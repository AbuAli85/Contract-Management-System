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
import { Search, Download, RefreshCw, Filter, X } from 'lucide-react';
import type { OverallStatus } from './types';
import { Badge } from '@/components/ui/badge';

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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className='text-lg flex items-center gap-2'>
              <Filter className='h-5 w-5 text-primary' />
              Smart filters
            </CardTitle>
            <CardDescription>
              Refine the promoter roster by lifecycle stage, document health, or assignment.
            </CardDescription>
          </div>
          {hasFiltersApplied && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {Object.values({ 
                search: searchTerm ? 1 : 0,
                status: statusFilter !== 'all' ? 1 : 0,
                document: documentFilter !== 'all' ? 1 : 0,
                assignment: assignmentFilter !== 'all' ? 1 : 0 
              }).reduce((a, b) => a + b, 0)} active
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className='space-y-4'>
        <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)]'>
          <div className='space-y-2'>
            <Label htmlFor='promoter-search'>Search promoters</Label>
            <div className='relative'>
              <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
              <Input
                id='promoter-search'
                placeholder='Search by name, contact, ID...'
                className='pl-10 pr-10'
                value={searchTerm}
                onChange={event => onSearchChange(event.target.value)}
                aria-label='Search promoters by name, contact, or ID'
                aria-describedby='search-help'
              />
              {searchTerm && (
                <button
                  onClick={() => onSearchChange('')}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors'
                  aria-label='Clear search'
                >
                  <X className='h-4 w-4' />
                </button>
              )}
            </div>
            <p id='search-help' className='text-xs text-muted-foreground hidden sm:block'>
              Press <kbd className='px-1.5 py-0.5 text-xs font-semibold bg-muted border rounded'>Ctrl+K</kbd> for quick search
            </p>
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
          <div className='flex flex-wrap items-center gap-2'>
            {hasFiltersApplied && (
              <Button
                variant='outline'
                size="sm"
                onClick={onResetFilters}
                className="hover:bg-red-50 hover:border-red-200 hover:text-red-600"
                aria-label='Reset all filters to default values'
              >
                <X className='mr-2 h-4 w-4' />
                <span className='hidden sm:inline'>Clear Filters</span>
                <span className='sm:hidden'>Clear</span>
              </Button>
            )}
            <Button
              variant='outline'
              size="sm"
              className='flex items-center hover:bg-green-50 hover:border-green-200 hover:text-green-600'
              onClick={onExport}
              aria-label='Export current view to file'
            >
              <Download className='mr-2 h-4 w-4' aria-hidden='true' />
              <span className='hidden sm:inline'>Export</span>
              <span className='sm:hidden'>CSV</span>
            </Button>
            <Button
              onClick={onRefresh}
              variant='outline'
              size="sm"
              disabled={isFetching}
              className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
              aria-label={isFetching ? 'Syncing data' : 'Sync data with server'}
            >
              <RefreshCw
                className={cn(
                  'mr-2 h-4 w-4',
                  isFetching && 'animate-spin'
                )}
                aria-hidden='true'
              />
              <span className='hidden sm:inline'>{isFetching ? 'Syncing...' : 'Sync'}</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
