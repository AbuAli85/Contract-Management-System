'use client';

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users, Plus, RefreshCw, SortAsc, SortDesc } from 'lucide-react';
import { PromotersTableRow } from './promoters-table-row';
import type {
  DocumentStatus,
  OverallStatus,
  SortField,
  SortOrder,
  DocumentHealth,
  DashboardPromoter,
  PaginationInfo,
} from './types';

interface PromotersTableProps {
  promoters: DashboardPromoter[];
  selectedPromoters: Set<string>;
  sortField: SortField;
  sortOrder: SortOrder;
  viewMode: 'table' | 'grid' | 'cards';
  pagination: PaginationInfo | undefined;
  isFetching: boolean;
  hasFiltersApplied: boolean;
  onSelectAll: () => void;
  onSelectPromoter: (promoterId: string) => void;
  onSort: (field: SortField) => void;
  onViewModeChange: (mode: 'table' | 'grid' | 'cards') => void;
  onViewPromoter: (promoter: DashboardPromoter) => void;
  onEditPromoter: (promoter: DashboardPromoter) => void;
  onAddPromoter: () => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
}

export function PromotersTable({
  promoters,
  selectedPromoters,
  sortField,
  sortOrder,
  viewMode,
  pagination,
  isFetching,
  hasFiltersApplied,
  onSelectAll,
  onSelectPromoter,
  onSort,
  onViewModeChange,
  onViewPromoter,
  onEditPromoter,
  onAddPromoter,
  onResetFilters,
  onPageChange,
}: PromotersTableProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  return (
    <Card className='overflow-hidden shadow-lg'>
      <CardHeader className='flex flex-col gap-3 border-b bg-gradient-to-r from-slate-50 to-slate-100 py-4 dark:from-slate-950 dark:to-slate-900 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <CardTitle className='text-2xl font-bold'>Promoter roster</CardTitle>
          <CardDescription className='mt-1'>
            <span className='font-semibold text-foreground'>
              {promoters.length}
            </span>{' '}
            records visible
          </CardDescription>
        </div>
        <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
          {isFetching && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant='outline'
                    className='gap-2 bg-amber-50 text-amber-700 border-amber-200'
                  >
                    <RefreshCw className='h-3 w-3 animate-spin' />
                    Refreshing data
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs'>
                    Syncing latest promoter information...
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Tabs
            value={viewMode}
            onValueChange={value =>
              onViewModeChange(value as 'table' | 'grid' | 'cards')
            }
            className='ml-auto'
          >
            <TabsList className='grid w-full grid-cols-3 bg-white/80 dark:bg-slate-800/80'>
              <TabsTrigger
                value='table'
                className='data-[state=active]:bg-blue-500 data-[state=active]:text-white'
              >
                Table
              </TabsTrigger>
              <TabsTrigger
                value='grid'
                className='data-[state=active]:bg-blue-500 data-[state=active]:text-white'
              >
                Grid
              </TabsTrigger>
              <TabsTrigger
                value='cards'
                className='data-[state=active]:bg-blue-500 data-[state=active]:text-white'
              >
                Cards
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        {promoters.length === 0 ? (
          <div className='flex flex-col items-center justify-center space-y-4 py-16 text-center'>
            <div className='rounded-full bg-muted p-6'>
              <Users className='h-12 w-12 text-muted-foreground' />
            </div>
            <div className='space-y-2'>
              <h3 className='text-xl font-semibold tracking-tight'>
                {hasFiltersApplied
                  ? 'No promoters match your filters'
                  : 'No promoters yet'}
              </h3>
              <p className='max-w-sm text-sm text-muted-foreground'>
                {hasFiltersApplied
                  ? "Try adjusting your filters or search terms to find what you're looking for."
                  : 'Get started by adding your first promoter to the system.'}
              </p>
            </div>
            <div className='flex gap-3'>
              {hasFiltersApplied && (
                <Button onClick={onResetFilters} variant='outline'>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Clear Filters
                </Button>
              )}
              <Button onClick={onAddPromoter} size='lg'>
                <Plus className='mr-2 h-5 w-5' />
                Add Your First Promoter
              </Button>
            </div>
          </div>
        ) : (
          <ScrollArea className='h-[520px]' ref={parentRef}>
            <Table>
              <TableHeader className='sticky top-0 z-10 bg-background/95 backdrop-blur'>
                <TableRow className='border-b-2 hover:bg-transparent'>
                  <TableHead className='w-[50px] text-center'>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Checkbox
                            checked={
                              selectedPromoters.size === promoters.length
                            }
                            onCheckedChange={onSelectAll}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className='text-xs'>
                            Select all visible promoters
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableHead>
                  <TableHead
                    className='w-[220px] cursor-pointer hover:bg-muted/80 transition-colors font-semibold'
                    onClick={() => onSort('name')}
                  >
                    <div className='flex items-center gap-2 group/header'>
                      <span>Promoter</span>
                      {sortField === 'name' ? (
                        sortOrder === 'asc' ? (
                          <SortAsc className='h-4 w-4 text-blue-500' />
                        ) : (
                          <SortDesc className='h-4 w-4 text-blue-500' />
                        )
                      ) : (
                        <div className='h-4 w-4 opacity-0 group-hover/header:opacity-30'>
                          <SortAsc className='h-4 w-4' />
                        </div>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className='w-[200px] cursor-pointer hover:bg-muted/80 transition-colors font-semibold'
                    onClick={() => onSort('documents')}
                  >
                    <div className='flex items-center gap-2 group/header'>
                      <span>Documents</span>
                      {sortField === 'documents' ? (
                        sortOrder === 'asc' ? (
                          <SortAsc className='h-4 w-4 text-blue-500' />
                        ) : (
                          <SortDesc className='h-4 w-4 text-blue-500' />
                        )
                      ) : (
                        <div className='h-4 w-4 opacity-0 group-hover/header:opacity-30'>
                          <SortAsc className='h-4 w-4' />
                        </div>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className='font-semibold'>Assignment</TableHead>
                  <TableHead className='font-semibold'>Contacts</TableHead>
                  <TableHead
                    className='cursor-pointer hover:bg-muted/80 transition-colors font-semibold'
                    onClick={() => onSort('created')}
                  >
                    <div className='flex items-center gap-2 group/header'>
                      <span>Created</span>
                      {sortField === 'created' ? (
                        sortOrder === 'asc' ? (
                          <SortAsc className='h-4 w-4 text-blue-500' />
                        ) : (
                          <SortDesc className='h-4 w-4 text-blue-500' />
                        )
                      ) : (
                        <div className='h-4 w-4 opacity-0 group-hover/header:opacity-30'>
                          <SortAsc className='h-4 w-4' />
                        </div>
                      )}
                    </div>
                  </TableHead>
                  <TableHead
                    className='cursor-pointer hover:bg-muted/80 transition-colors font-semibold'
                    onClick={() => onSort('status')}
                  >
                    <div className='flex items-center gap-2 group/header'>
                      <span>Status</span>
                      {sortField === 'status' ? (
                        sortOrder === 'asc' ? (
                          <SortAsc className='h-4 w-4 text-blue-500' />
                        ) : (
                          <SortDesc className='h-4 w-4 text-blue-500' />
                        )
                      ) : (
                        <div className='h-4 w-4 opacity-0 group-hover/header:opacity-30'>
                          <SortAsc className='h-4 w-4' />
                        </div>
                      )}
                    </div>
                  </TableHead>
                  <TableHead className='text-right font-semibold'>
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promoters.map(promoter => (
                  <PromotersTableRow
                    key={promoter.id}
                    promoter={promoter}
                    isSelected={selectedPromoters.has(promoter.id)}
                    onSelect={() => onSelectPromoter(promoter.id)}
                    onView={() => onViewPromoter(promoter)}
                    onEdit={() => onEditPromoter(promoter)}
                  />
                ))}
                {isFetching && promoters.length > 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className='text-center py-8'>
                      <div className='flex items-center justify-center gap-2 text-muted-foreground'>
                        <RefreshCw className='h-4 w-4 animate-spin' />
                        <span>Updating data...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <CardContent className='border-t pt-4'>
          <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
            <div className='text-sm text-muted-foreground'>
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)}{' '}
              of {pagination.total} promoters
            </div>

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => onPageChange(1)}
                disabled={!pagination.hasPrev || isFetching}
              >
                First
              </Button>

              <Button
                variant='outline'
                size='sm'
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={!pagination.hasPrev || isFetching}
              >
                Previous
              </Button>

              <div className='flex items-center gap-2 px-2'>
                <span className='text-sm'>
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>

              <Button
                variant='outline'
                size='sm'
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={!pagination.hasNext || isFetching}
              >
                Next
              </Button>

              <Button
                variant='outline'
                size='sm'
                onClick={() => onPageChange(pagination.totalPages)}
                disabled={!pagination.hasNext || isFetching}
              >
                Last
              </Button>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
