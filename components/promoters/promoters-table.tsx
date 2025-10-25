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
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users, Plus, RefreshCw, SortAsc, SortDesc, MoreHorizontal, ArrowRight } from 'lucide-react';
import { PromotersTableRow } from './promoters-table-row';
import { PromotersGridView } from './promoters-grid-view';
import { PromotersCardsView } from './promoters-cards-view';
import { EmptyState, EmptySearchState } from '@/components/ui/empty-state';
import { PaginationControls } from '@/components/ui/pagination-controls';
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
  viewMode: 'table' | 'grid' | 'cards' | 'analytics';
  pagination: PaginationInfo | undefined;
  isFetching: boolean;
  hasFiltersApplied: boolean;
  onSelectAll: () => void;
  onSelectPromoter: (promoterId: string) => void;
  onSort: (field: SortField) => void;
  onViewModeChange: (mode: 'table' | 'grid' | 'cards' | 'analytics') => void;
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
    <Card className='shadow-xl border-0 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900'>
      <CardHeader className='flex flex-col gap-4 border-b border-slate-200/60 bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 py-6 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-700/60 sm:flex-row sm:items-center sm:justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-3'>
            <div className='p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg'>
              <Users className='h-6 w-6 text-white' />
            </div>
            <div>
              <CardTitle className='text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-300'>
                Promoter Roster
              </CardTitle>
              <CardDescription className='mt-1 text-base'>
                <span className='font-bold text-indigo-600 dark:text-indigo-400 text-lg'>
                  {promoters.length}
                </span>{' '}
                <span className='text-slate-600 dark:text-slate-400'>
                  active members
                </span>
                {pagination && (
                  <span className='ml-3 px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full'>
                    {pagination.total.toLocaleString()} total workforce
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4'>
          {isFetching && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant='outline'
                    className='gap-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200/80 shadow-sm'
                  >
                    <RefreshCw className='h-3.5 w-3.5 animate-spin' />
                    <span className='font-medium'>Syncing</span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className='text-xs font-medium'>
                    Updating latest promoter information...
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Tabs
            value={viewMode}
            onValueChange={value =>
              onViewModeChange(value as 'table' | 'grid' | 'cards' | 'analytics')
            }
            className='ml-auto'
          >
            <TabsList className='grid w-full grid-cols-4 bg-white/90 dark:bg-slate-800/90 shadow-lg border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm'>
              <TabsTrigger
                value='table'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all duration-200'
              >
                Table
              </TabsTrigger>
              <TabsTrigger
                value='grid'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all duration-200'
              >
                Grid
              </TabsTrigger>
              <TabsTrigger
                value='cards'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all duration-200'
              >
                Cards
              </TabsTrigger>
              <TabsTrigger
                value='analytics'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all duration-200'
                aria-label="Analytics view with charts and insights"
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className='p-0'>
        {promoters.length === 0 ? (
          hasFiltersApplied ? (
            <EmptySearchState
              searchTerm="your filters"
              onClearSearch={onResetFilters}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No promoters yet"
              description="Start building your team by adding your first promoter. Track their documents, performance, and assignments all in one place."
              action={{
                label: 'Add Your First Promoter',
                onClick: onAddPromoter,
              }}
              secondaryAction={{
                label: 'Learn More',
                href: '/help',
              }}
              iconClassName="text-blue-500"
            />
          )
        ) : (
          <div className='relative'>
            {/* Table View */}
            {viewMode === 'table' && (
              <ScrollArea className='h-[calc(100vh-400px)] min-h-[500px] max-h-[700px] animate-in fade-in duration-300 touch-pan-x' ref={parentRef}>
                <div className='min-w-[1300px]'>
                  <Table>
                    <TableHeader className='sticky top-0 z-10 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 backdrop-blur-md shadow-sm border-b-2 border-slate-200/80 dark:border-slate-700/80'>
                    <TableRow className='hover:bg-transparent border-0'>
                      <TableHead className='w-[50px] text-center py-4'>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Checkbox
                                checked={
                                  selectedPromoters.size === promoters.length
                                }
                                onCheckedChange={onSelectAll}
                                className='border-slate-300 dark:border-slate-600 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600'
                              />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className='text-xs font-medium'>
                                Select all visible promoters
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableHead>
                      <TableHead
                        className='min-w-[200px] w-[220px] cursor-pointer hover:bg-indigo-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 rounded-lg font-bold text-slate-700 dark:text-slate-200 py-4'
                        onClick={() => onSort('name')}
                      >
                        <div className='flex items-center gap-2 group/header px-2'>
                          <Users className='h-4 w-4 text-indigo-500' />
                          <span className='text-sm'>Team Member</span>
                          {sortField === 'name' ? (
                            sortOrder === 'asc' ? (
                              <SortAsc className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                            ) : (
                              <SortDesc className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                            )
                          ) : (
                            <div className='h-4 w-4 opacity-0 group-hover/header:opacity-60 transition-opacity'>
                              <SortAsc className='h-4 w-4 text-slate-400' />
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className='min-w-[180px] w-[200px] cursor-pointer hover:bg-indigo-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 rounded-lg font-bold text-slate-700 dark:text-slate-200 py-4'
                        onClick={() => onSort('documents')}
                      >
                        <div className='flex items-center gap-2 group/header px-2'>
                          <Badge className='bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 p-0.5'>
                            <Plus className='h-3 w-3' />
                          </Badge>
                          <span className='text-sm'>Documentation</span>
                          {sortField === 'documents' ? (
                            sortOrder === 'asc' ? (
                              <SortAsc className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                            ) : (
                              <SortDesc className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                            )
                          ) : (
                            <div className='h-4 w-4 opacity-0 group-hover/header:opacity-60 transition-opacity'>
                              <SortAsc className='h-4 w-4 text-slate-400' />
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className='min-w-[140px] w-[160px] font-bold text-slate-700 dark:text-slate-200 py-4'>
                        <div className='flex items-center gap-2 px-2'>
                          <Badge className='bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 p-0.5'>
                            <Plus className='h-3 w-3' />
                          </Badge>
                          <span className='text-sm'>Assignment</span>
                        </div>
                      </TableHead>
                      <TableHead className='min-w-[160px] w-[180px] font-bold text-slate-700 dark:text-slate-200 py-4'>
                        <div className='flex items-center gap-2 px-2'>
                          <Badge className='bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 p-0.5'>
                            <Plus className='h-3 w-3' />
                          </Badge>
                          <span className='text-sm'>Contact Info</span>
                        </div>
                      </TableHead>
                      <TableHead
                        className='min-w-[120px] w-[140px] cursor-pointer hover:bg-indigo-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 rounded-lg font-bold text-slate-700 dark:text-slate-200 py-4'
                        onClick={() => onSort('created')}
                      >
                        <div className='flex items-center gap-2 group/header px-2'>
                          <Badge className='bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 p-0.5'>
                            <Plus className='h-3 w-3' />
                          </Badge>
                          <span className='text-sm'>Joined</span>
                          {sortField === 'created' ? (
                            sortOrder === 'asc' ? (
                              <SortAsc className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                            ) : (
                              <SortDesc className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                            )
                          ) : (
                            <div className='h-4 w-4 opacity-0 group-hover/header:opacity-60 transition-opacity'>
                              <SortAsc className='h-4 w-4 text-slate-400' />
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead
                        className='min-w-[120px] w-[140px] cursor-pointer hover:bg-indigo-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 rounded-lg font-bold text-slate-700 dark:text-slate-200 py-4'
                        onClick={() => onSort('status')}
                      >
                        <div className='flex items-center gap-2 group/header px-2'>
                          <Badge className='bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200 p-0.5'>
                            <Plus className='h-3 w-3' />
                          </Badge>
                          <span className='text-sm'>Status</span>
                          {sortField === 'status' ? (
                            sortOrder === 'asc' ? (
                              <SortAsc className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                            ) : (
                              <SortDesc className='h-4 w-4 text-indigo-600 dark:text-indigo-400' />
                            )
                          ) : (
                            <div className='h-4 w-4 opacity-0 group-hover/header:opacity-60 transition-opacity'>
                              <SortAsc className='h-4 w-4 text-slate-400' />
                            </div>
                          )}
                        </div>
                      </TableHead>
                      <TableHead className='min-w-[100px] w-[120px] text-right font-bold text-slate-700 dark:text-slate-200 py-4'>
                        <div className='flex items-center justify-end gap-2 px-2'>
                          <span className='text-sm'>Actions</span>
                          <MoreHorizontal className='h-4 w-4 text-slate-400' />
                        </div>
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
                </div>
                <ScrollBar orientation="horizontal" />
                {/* Horizontal Scroll Hint - Only show when content overflows */}
                {promoters.length > 0 && (
                  <div className='pointer-events-none absolute bottom-3 right-3 z-20 opacity-70 transition-opacity duration-500 hover:opacity-90'>
                    <div className='flex items-center gap-1 rounded-full bg-gradient-to-r from-slate-800/95 to-slate-700/95 px-3 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-sm dark:from-slate-200/95 dark:to-slate-300/95 dark:text-slate-900'>
                      <ArrowRight className='h-3 w-3' />
                      <span>Scroll horizontally</span>
                    </div>
                  </div>
                )}
              </ScrollArea>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <ScrollArea className='h-[520px] animate-in fade-in duration-300'>
                <PromotersGridView
                  promoters={promoters}
                  selectedPromoters={selectedPromoters}
                  onSelectPromoter={onSelectPromoter}
                  onViewPromoter={onViewPromoter}
                  onEditPromoter={onEditPromoter}
                />
                {isFetching && promoters.length > 0 && (
                  <div className='flex items-center justify-center gap-2 text-muted-foreground py-4 border-t'>
                    <RefreshCw className='h-4 w-4 animate-spin' />
                    <span>Updating data...</span>
                  </div>
                )}
              </ScrollArea>
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <ScrollArea className='h-[520px] animate-in fade-in duration-300'>
                <PromotersCardsView
                  promoters={promoters}
                  selectedPromoters={selectedPromoters}
                  onSelectPromoter={onSelectPromoter}
                  onViewPromoter={onViewPromoter}
                  onEditPromoter={onEditPromoter}
                />
                {isFetching && promoters.length > 0 && (
                  <div className='flex items-center justify-center gap-2 text-muted-foreground py-4 border-t'>
                    <RefreshCw className='h-4 w-4 animate-spin' />
                    <span>Updating data...</span>
                  </div>
                )}
              </ScrollArea>
            )}
          </div>
        )}
      </CardContent>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <CardContent className='border-t border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/50 pt-6 pb-6 px-6'>
          <PaginationControls
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            pageSize={pagination.limit}
            totalItems={pagination.total}
            onPageChange={onPageChange}
          />
        </CardContent>
      )}
    </Card>
  );
}
