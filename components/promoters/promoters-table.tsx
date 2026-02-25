'use client';

import { useRef, useMemo } from 'react';
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
import {
  Users,
  Plus,
  RefreshCw,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  ArrowRight,
} from 'lucide-react';
import { PromotersTableRow } from './promoters-table-row';
import { PromotersGridView } from './promoters-grid-view';
import { PromotersCardsView } from './promoters-cards-view';
import { DocumentStatusLegend } from './document-status-legend';
import { EnhancedPromotersCardsViewWithPartyEdit } from './enhanced-promoter-card-with-party-edit';
import { EmptyState, EmptySearchState } from '@/components/ui/empty-state';
import { PaginationControls } from '@/components/ui/pagination-controls';
import {
  ColumnCustomization,
  useColumnCustomization,
  type ColumnConfig,
} from './column-customization';
import type {
  DocumentStatus,
  OverallStatus,
  SortField,
  SortOrder,
  DocumentHealth,
  DashboardPromoter,
  PaginationInfo,
} from './types';

// Default column configuration
const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'checkbox', label: 'Select', visible: true, order: 0, required: true },
  { id: 'name', label: 'Team Member', visible: true, order: 1, required: true },
  {
    id: 'documents',
    label: 'Documentation',
    visible: true,
    order: 2,
    required: false,
  },
  {
    id: 'assignment',
    label: 'Assignment',
    visible: true,
    order: 3,
    required: false,
  },
  {
    id: 'contact',
    label: 'Contact Info',
    visible: true,
    order: 4,
    required: false,
  },
  { id: 'created', label: 'Joined', visible: true, order: 5, required: false },
  { id: 'status', label: 'Status', visible: true, order: 6, required: false },
  { id: 'actions', label: 'Actions', visible: true, order: 7, required: true },
];

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
  onEditPromoter?: (promoter: DashboardPromoter) => void;
  onAddPromoter?: () => void;
  onResetFilters: () => void;
  onPageChange: (page: number) => void;
  onPartyAssignmentUpdate?: (
    promoterId: string,
    partyId: string | null
  ) => void;
  enableEnhancedPartyManagement?: boolean;
  onInlineUpdate?: (
    promoterId: string,
    field: string,
    value: string
  ) => Promise<void>;
  enableInlineEdit?: boolean;
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
  onPartyAssignmentUpdate,
  enableEnhancedPartyManagement = false,
  onInlineUpdate,
  enableInlineEdit = false,
}: PromotersTableProps) {
  const pathname = usePathname();
  const locale = pathname?.match(/^\/([a-z]{2})\//)?.[1] ?? 'en';
  const parentRef = useRef<HTMLDivElement>(null);

  // Column customization
  const { columns, visibleColumns, setColumns, resetColumns, isColumnVisible } =
    useColumnCustomization(DEFAULT_COLUMNS);

  // Accessibility: Announce table updates
  const tableLabel = useMemo(() => {
    return `Promoters table with ${promoters.length} ${promoters.length === 1 ? 'promoter' : 'promoters'}. ${selectedPromoters.size > 0 ? `${selectedPromoters.size} selected.` : ''}`;
  }, [promoters.length, selectedPromoters.size]);

  return (
    <Card className='shadow-xl border-0 bg-gradient-to-br from-white via-slate-50/50 to-white dark:from-slate-900 dark:via-slate-800/50 dark:to-slate-900'>
      <CardHeader className='flex flex-col gap-4 border-b border-slate-200/60 bg-gradient-to-r from-indigo-50 via-blue-50 to-slate-50 py-4 px-4 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 dark:border-slate-700/60 sm:py-6 sm:px-6 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-2 flex-1 min-w-0'>
          <div className='flex items-center gap-2 sm:gap-3'>
            <div className='p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg flex-shrink-0'>
              <Users className='h-5 w-5 sm:h-6 sm:w-6 text-white' />
            </div>
            <div className='min-w-0 flex-1'>
              <CardTitle className='text-xl sm:text-2xl md:text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 bg-clip-text text-transparent dark:from-white dark:to-slate-300 truncate'>
                Promoter Roster
              </CardTitle>
              <CardDescription className='mt-1 text-sm sm:text-base flex flex-wrap items-center gap-1 sm:gap-2'>
                <span className='font-bold text-indigo-600 dark:text-indigo-400 text-base sm:text-lg'>
                  {promoters.length}
                </span>
                <span className='text-slate-600 dark:text-slate-400'>
                  active members
                </span>
                {pagination && (
                  <span className='inline-block px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full whitespace-nowrap'>
                    {pagination.total.toLocaleString()} total
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
        </div>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 md:ml-4'>
          {isFetching && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant='outline'
                    className='gap-2 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 border-amber-200/80 shadow-sm w-fit'
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
              onViewModeChange(
                value as 'table' | 'grid' | 'cards' | 'analytics'
              )
            }
            className='w-full sm:w-auto'
          >
            <TabsList className='grid w-full grid-cols-4 bg-white/90 dark:bg-slate-800/90 shadow-lg border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-sm h-9 sm:h-10'>
              <TabsTrigger
                value='table'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3'
              >
                Table
              </TabsTrigger>
              <TabsTrigger
                value='grid'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3'
              >
                Grid
              </TabsTrigger>
              <TabsTrigger
                value='cards'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3'
              >
                Cards
              </TabsTrigger>
              <TabsTrigger
                value='analytics'
                className='data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-md font-medium transition-all duration-200 text-xs sm:text-sm px-2 sm:px-3'
                aria-label='Analytics view with charts and insights'
              >
                Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Column Customization - Only show in table view */}
          {viewMode === 'table' && (
            <ColumnCustomization
              columns={columns}
              onColumnChange={setColumns}
              onReset={resetColumns}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className='p-0' aria-label={tableLabel}>
        {promoters.length === 0 ? (
          hasFiltersApplied ? (
            <EmptySearchState
              searchTerm='your filters'
              onClearSearch={onResetFilters}
            />
          ) : (
            <EmptyState
              icon={Users}
              title='No promoters yet'
              description='Start building your team by adding your first promoter. Track their documents, performance, and assignments all in one place.'
              action={{
                label: 'Add Your First Promoter',
                onClick: onAddPromoter,
              }}
              secondaryAction={{
                label: 'Import CSV',
                href: `/${locale}/manage-promoters/import`,
              }}
              quickTips={[
                'Add individual promoters with the form above',
                'Import multiple promoters from a CSV file',
                'Track document expiry dates and compliance',
                'Assign promoters to companies and contracts',
                'Monitor workforce availability and status',
              ]}
              iconClassName='text-blue-500'
              showSuggestions={true}
            />
          )
        ) : (
          <div className='relative'>
            {/* Table View */}
            {viewMode === 'table' && (
              <>
                {/* Document Status Legend */}
                <div className='px-6 pt-4 pb-2'>
                  <DocumentStatusLegend compact />
                </div>
                <ScrollArea
                  className='h-[calc(100vh-380px)] min-h-[400px] max-h-[800px] animate-in fade-in duration-300 touch-pan-x'
                  ref={parentRef}
                  data-view-mode='table'
                >
                  <div className='min-w-full sm:min-w-[800px] md:min-w-[1000px] lg:min-w-[1200px] xl:min-w-[1400px]'>
                    <Table className='table-fixed border-collapse'>
                      <TableHeader className='sticky top-0 z-10 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-800 backdrop-blur-md shadow-lg border-b-2 border-slate-200/80 dark:border-slate-700/80'>
                        <TableRow className='hover:bg-transparent border-0'>
                          {isColumnVisible('checkbox') && (
                            <TableHead className='w-[50px] text-center py-4'>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Checkbox
                                      checked={
                                        selectedPromoters.size ===
                                        promoters.length
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
                          )}
                          {isColumnVisible('name') && (
                            <TableHead
                              className='min-w-[220px] w-[240px] cursor-pointer hover:bg-indigo-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 rounded-lg font-bold text-slate-700 dark:text-slate-200 py-4'
                              onClick={() => onSort('name')}
                            >
                              <div className='flex items-center gap-2 group/header px-2'>
                                <Users className='h-4 w-4 text-indigo-500 flex-shrink-0' />
                                <span className='text-sm whitespace-nowrap'>
                                  Team Member
                                </span>
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
                          )}
                          {isColumnVisible('documents') && (
                            <TableHead
                              className='min-w-[240px] w-[260px] cursor-pointer hover:bg-indigo-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 rounded-lg font-bold text-slate-700 dark:text-slate-200 py-4'
                              onClick={() => onSort('documents')}
                            >
                              <div className='flex items-center gap-2 group/header px-2'>
                                <Badge className='bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200 p-0.5 flex-shrink-0'>
                                  <Plus className='h-3 w-3' />
                                </Badge>
                                <span className='text-sm whitespace-nowrap'>
                                  Documentation
                                </span>
                                {sortField === 'documents' ? (
                                  sortOrder === 'asc' ? (
                                    <SortAsc className='h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0' />
                                  ) : (
                                    <SortDesc className='h-4 w-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0' />
                                  )
                                ) : (
                                  <div className='h-4 w-4 opacity-0 group-hover/header:opacity-60 transition-opacity flex-shrink-0'>
                                    <SortAsc className='h-4 w-4 text-slate-400' />
                                  </div>
                                )}
                              </div>
                            </TableHead>
                          )}
                          {isColumnVisible('assignment') && (
                            <TableHead className='min-w-[160px] w-[180px] font-bold text-slate-700 dark:text-slate-200 py-4'>
                              <div className='flex items-center gap-2 px-2 flex-wrap'>
                                <Badge className='bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 p-0.5 flex-shrink-0'>
                                  <Plus className='h-3 w-3' />
                                </Badge>
                                <span className='text-sm whitespace-nowrap'>
                                  Assignment
                                </span>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <span className='ml-1 text-xs text-muted-foreground cursor-help whitespace-nowrap'>
                                        (filterable)
                                      </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className='text-xs'>
                                        You can filter promoters by assignment
                                        status
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            </TableHead>
                          )}
                          {isColumnVisible('contact') && (
                            <TableHead className='min-w-[180px] w-[200px] font-bold text-slate-700 dark:text-slate-200 py-4'>
                              <div className='flex items-center gap-2 px-2'>
                                <Badge className='bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200 p-0.5 flex-shrink-0'>
                                  <Plus className='h-3 w-3' />
                                </Badge>
                                <span className='text-sm whitespace-nowrap'>
                                  Contact Info
                                </span>
                              </div>
                            </TableHead>
                          )}
                          {isColumnVisible('created') && (
                            <TableHead
                              className='min-w-[130px] w-[150px] cursor-pointer hover:bg-indigo-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 rounded-lg font-bold text-slate-700 dark:text-slate-200 py-4'
                              onClick={() => onSort('created')}
                            >
                              <div className='flex items-center gap-2 group/header px-2'>
                                <Badge className='bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200 p-0.5 flex-shrink-0'>
                                  <Plus className='h-3 w-3' />
                                </Badge>
                                <span className='text-sm whitespace-nowrap'>
                                  Joined
                                </span>
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
                          )}
                          {isColumnVisible('status') && (
                            <TableHead
                              className='min-w-[130px] w-[150px] cursor-pointer hover:bg-indigo-50/80 dark:hover:bg-slate-700/50 transition-all duration-200 rounded-lg font-bold text-slate-700 dark:text-slate-200 py-4'
                              onClick={() => onSort('status')}
                            >
                              <div className='flex items-center gap-2 group/header px-2'>
                                <Badge className='bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200 p-0.5 flex-shrink-0'>
                                  <Plus className='h-3 w-3' />
                                </Badge>
                                <span className='text-sm whitespace-nowrap'>
                                  Status
                                </span>
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
                          )}
                          {isColumnVisible('actions') && (
                            <TableHead className='min-w-[110px] w-[130px] text-right font-bold text-slate-700 dark:text-slate-200 py-4'>
                              <div className='flex items-center justify-end gap-2 px-2'>
                                <span className='text-sm whitespace-nowrap'>
                                  Actions
                                </span>
                                <MoreHorizontal className='h-4 w-4 text-slate-400 flex-shrink-0' />
                              </div>
                            </TableHead>
                          )}
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
                            onEdit={
                              onEditPromoter
                                ? () => onEditPromoter(promoter)
                                : undefined
                            }
                            isColumnVisible={isColumnVisible}
                            onInlineUpdate={onInlineUpdate}
                            enableInlineEdit={enableInlineEdit}
                          />
                        ))}
                        {isFetching && promoters.length > 0 && (
                          <TableRow>
                            <TableCell
                              colSpan={visibleColumns.length}
                              className='text-center py-8'
                            >
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
                  <ScrollBar orientation='horizontal' />
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
              </>
            )}

            {/* Grid View */}
            {viewMode === 'grid' && (
              <>
                {/* Document Status Legend */}
                <div className='px-6 pt-4 pb-2'>
                  <DocumentStatusLegend compact />
                </div>
                <ScrollArea className='h-[calc(100vh-380px)] min-h-[400px] max-h-[800px] animate-in fade-in duration-300'>
                  <PromotersGridView
                    promoters={promoters}
                    selectedPromoters={selectedPromoters}
                    onSelectPromoter={onSelectPromoter}
                    onViewPromoter={onViewPromoter}
                    onEditPromoter={onEditPromoter || (() => {})}
                  />
                  {isFetching && promoters.length > 0 && (
                    <div className='flex items-center justify-center gap-2 text-muted-foreground py-4 border-t'>
                      <RefreshCw className='h-4 w-4 animate-spin' />
                      <span className='text-sm'>Updating data...</span>
                    </div>
                  )}
                </ScrollArea>
              </>
            )}

            {/* Cards View */}
            {viewMode === 'cards' && (
              <>
                {/* Document Status Legend */}
                <div className='px-6 pt-4 pb-2'>
                  <DocumentStatusLegend compact />
                </div>
                <ScrollArea className='h-[calc(100vh-380px)] min-h-[400px] max-h-[800px] animate-in fade-in duration-300'>
                  {enableEnhancedPartyManagement ? (
                    <EnhancedPromotersCardsViewWithPartyEdit
                      promoters={promoters}
                      selectedPromoters={selectedPromoters}
                      onSelectPromoter={onSelectPromoter}
                      onViewPromoter={onViewPromoter}
                      onEditPromoter={onEditPromoter || (() => {})}
                      {...(onPartyAssignmentUpdate && {
                        onPartyAssignmentUpdate,
                      })}
                    />
                  ) : (
                    <PromotersCardsView
                      promoters={promoters}
                      selectedPromoters={selectedPromoters}
                      onSelectPromoter={onSelectPromoter}
                      onViewPromoter={onViewPromoter}
                      onEditPromoter={onEditPromoter || (() => {})}
                    />
                  )}
                  {isFetching && promoters.length > 0 && (
                    <div className='flex items-center justify-center gap-2 text-muted-foreground py-4 border-t'>
                      <RefreshCw className='h-4 w-4 animate-spin' />
                      <span className='text-sm'>Updating data...</span>
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>
        )}
      </CardContent>

      {/* Pagination Controls */}
      {pagination && pagination.totalPages > 1 && (
        <CardContent className='border-t border-slate-200/60 dark:border-slate-700/60 bg-gradient-to-r from-slate-50/50 via-white to-slate-50/50 dark:from-slate-800/50 dark:via-slate-900 dark:to-slate-800/50 py-4 px-4 sm:py-6 sm:px-6'>
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
