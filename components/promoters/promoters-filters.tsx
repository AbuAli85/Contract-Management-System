'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Search, Download, RefreshCw, Filter, X, Settings, BookmarkPlus, History, Zap } from 'lucide-react';
import type { OverallStatus } from './types';
import { Badge } from '@/components/ui/badge';
import { PromotersAdvancedSearch } from './promoters-advanced-search';

interface SearchCriteria {
  field: string;
  operator: string;
  value: string;
}

interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: {
    statusFilter: OverallStatus | 'all';
    documentFilter: 'all' | 'expired' | 'expiring' | 'missing';
    assignmentFilter: 'all' | 'assigned' | 'unassigned';
    searchTerm?: string;
  };
  isDefault?: boolean;
}

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

// Default filter presets
const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'all-active',
    name: '🟢 All Active',
    description: 'Show all operational promoters',
    filters: {
      statusFilter: 'active',
      documentFilter: 'all',
      assignmentFilter: 'all',
    },
    isDefault: true,
  },
  {
    id: 'critical-attention',
    name: '🔴 Needs Attention',
    description: 'Critical issues requiring immediate action',
    filters: {
      statusFilter: 'critical',
      documentFilter: 'all',
      assignmentFilter: 'all',
    },
    isDefault: true,
  },
  {
    id: 'document-expiring',
    name: '📄 Documents Expiring',
    description: 'Promoters with expiring documents',
    filters: {
      statusFilter: 'all',
      documentFilter: 'expiring',
      assignmentFilter: 'all',
    },
    isDefault: true,
  },
  {
    id: 'unassigned',
    name: '👤 Unassigned',
    description: 'Promoters without assignments',
    filters: {
      statusFilter: 'all',
      documentFilter: 'all',
      assignmentFilter: 'unassigned',
    },
    isDefault: true,
  },
  {
    id: 'document-expired',
    name: '⚠️ Expired Documents',
    description: 'Promoters with expired documents',
    filters: {
      statusFilter: 'all',
      documentFilter: 'expired',
      assignmentFilter: 'all',
    },
    isDefault: true,
  },
];

// Memoized search input to prevent re-renders
const SearchInput = React.memo(({ 
  searchTerm, 
  onSearchChange 
}: { 
  searchTerm: string; 
  onSearchChange: (value: string) => void; 
}) => {
  const [localValue, setLocalValue] = useState(searchTerm);
  
  // Update local value when searchTerm prop changes (external updates only)
  useEffect(() => {
    setLocalValue(searchTerm);
  }, [searchTerm]);
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    onSearchChange(newValue);
  }, [onSearchChange]);
  
  const handleClear = useCallback(() => {
    setLocalValue('');
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <div className='space-y-3'>
      <Label htmlFor='promoter-search' className="text-sm font-medium">Search promoters</Label>
      <div className='relative'>
        <Search className='pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground' />
        <Input
          id='promoter-search'
          placeholder='Search by name, contact, ID...'
          className='pl-10 pr-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500'
          value={localValue}
          onChange={handleChange}
          aria-label='Search promoters by name, contact, or ID'
          aria-describedby='search-help'
          autoComplete="off"
          spellCheck="false"
          style={{ transition: 'none' }} // Remove all CSS transitions that could cause flickering
        />
        <button
          onClick={handleClear}
          className={`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground ${
            localValue ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          style={{ transition: 'opacity 0.15s ease' }} // Only transition opacity
          aria-label='Clear search'
          tabIndex={localValue ? 0 : -1}
        >
          <X className='h-4 w-4' />
        </button>
      </div>
      <p id='search-help' className='text-xs text-muted-foreground'>
        Press <kbd className='px-1.5 py-0.5 text-xs font-semibold bg-muted border rounded'>Ctrl+K</kbd> for focus • <kbd className='px-1.5 py-0.5 text-xs font-semibold bg-muted border rounded'>Esc</kbd> to clear
      </p>
    </div>
  );
});

SearchInput.displayName = 'SearchInput';

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
  const [advancedSearchCriteria, setAdvancedSearchCriteria] = useState<SearchCriteria[]>([]);
  const [filterPresets, setFilterPresets] = useState<FilterPreset[]>(DEFAULT_PRESETS);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Add to recent searches when search term changes (removed recentSearches dependency to prevent re-renders)
  useEffect(() => {
    if (searchTerm.trim()) {
      const timer = setTimeout(() => {
        setRecentSearches(prev => {
          // Only add if not already in the list
          if (!prev.includes(searchTerm.trim())) {
            return [searchTerm.trim(), ...prev.slice(0, 4)];
          }
          return prev;
        });
      }, 1000); // Only add to recent searches after user stops typing for 1 second
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchTerm]); // Removed recentSearches dependency to prevent re-renders during typing

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K for quick search focus
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('promoter-search') as HTMLInputElement;
        searchInput?.focus();
      }
      
  // Escape to clear search
  if (e.key === 'Escape' && searchTerm) {
    onSearchChange('');
  }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm, onSearchChange]);

  const handleAdvancedSearch = useCallback((criteria: SearchCriteria[]) => {
    setAdvancedSearchCriteria(criteria);
    // Convert advanced search criteria to search terms (simplified implementation)
    const searchTerms = criteria.map(c => c.value).join(' ');
    onSearchChange(searchTerms);
  }, [onSearchChange]);

  const handleClearAdvancedSearch = useCallback(() => {
    setAdvancedSearchCriteria([]);
  }, []);

  const applyPreset = useCallback((preset: FilterPreset) => {
    const { filters } = preset;
    onStatusFilterChange(filters.statusFilter);
    onDocumentFilterChange(filters.documentFilter);
    onAssignmentFilterChange(filters.assignmentFilter);
    if (filters.searchTerm) {
      onSearchChange(filters.searchTerm);
    }
  }, [onStatusFilterChange, onDocumentFilterChange, onAssignmentFilterChange, onSearchChange]);

  const saveCurrentAsPreset = useCallback(() => {
    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: `Custom Filter ${filterPresets.filter(p => !p.isDefault).length + 1}`,
      description: 'Custom saved filter',
      filters: {
        statusFilter,
        documentFilter,
        assignmentFilter,
        ...(searchTerm && { searchTerm }),
      },
    };
    setFilterPresets(prev => [...prev, newPreset]);
  }, [statusFilter, documentFilter, assignmentFilter, searchTerm, filterPresets]);

  return (
    <Card className="sticky top-16 z-40 shadow-lg">
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
      <CardContent className='space-y-6'>
        {/* Quick Filter Presets */}
        <div className='space-y-3'>
          <div className='flex items-center justify-between'>
            <Label className='text-sm font-medium text-slate-700 dark:text-slate-300'>
              <Zap className='inline h-4 w-4 mr-1.5' />
              Quick Filters
            </Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    className="h-7 px-2 text-xs"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    {showAdvancedOptions ? 'Less' : 'More'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle advanced filter options</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className='flex flex-wrap gap-2'>
            {filterPresets.slice(0, showAdvancedOptions ? undefined : 5).map((preset) => (
              <TooltipProvider key={preset.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "h-8 px-3 text-xs font-medium transition-all duration-200 hover:scale-105",
                        "bg-gradient-to-r hover:shadow-md",
                        preset.id === 'all-active' && "from-emerald-50 to-green-50 border-emerald-200 text-emerald-700 hover:from-emerald-100 hover:to-green-100",
                        preset.id === 'critical-attention' && "from-red-50 to-rose-50 border-red-200 text-red-700 hover:from-red-100 hover:to-rose-100",
                        preset.id === 'document-expiring' && "from-amber-50 to-orange-50 border-amber-200 text-amber-700 hover:from-amber-100 hover:to-orange-100",
                        preset.id === 'unassigned' && "from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100",
                        preset.id === 'document-expired' && "from-purple-50 to-violet-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-violet-100"
                      )}
                    >
                      {preset.name}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">{preset.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
            
            {showAdvancedOptions && hasFiltersApplied && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveCurrentAsPreset}
                      className="h-8 px-3 text-xs border-dashed hover:border-solid hover:bg-slate-50"
                    >
                      <BookmarkPlus className="h-3 w-3 mr-1" />
                      Save Current
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Save current filters as a preset</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <div className='grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_minmax(0,2fr)]'>
          <SearchInput searchTerm={searchTerm} onSearchChange={onSearchChange} />
          
          {/* Recent searches - Only show when advanced options are enabled */}
          {recentSearches.length > 0 && showAdvancedOptions && (
            <div className='space-y-2'>
              <Label className='text-xs text-muted-foreground flex items-center gap-1'>
                <History className='h-3 w-3' />
                Recent searches
              </Label>
              <div className='flex flex-wrap gap-1'>
                {recentSearches.map((search, index) => (
                  <Button
                    key={`${search}-${index}`}
                    variant="ghost"
                    size="sm"
                    onClick={() => onSearchChange(search)}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {search}
                  </Button>
                ))}
              </div>
            </div>
          )}
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
          <div className='flex flex-col gap-3'>
            {/* Advanced Search Integration */}
            {showAdvancedOptions && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Advanced Search</Label>
                <PromotersAdvancedSearch
                  onSearch={handleAdvancedSearch}
                  onClear={handleClearAdvancedSearch}
                  activeCriteria={advancedSearchCriteria}
                />
                {advancedSearchCriteria.length > 0 && (
                  <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-200 dark:border-blue-800">
                    <strong>Active advanced filters:</strong> {advancedSearchCriteria.length} criteria applied
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className='flex flex-wrap items-center gap-2'>
              {(hasFiltersApplied || advancedSearchCriteria.length > 0) && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='outline'
                        size="sm"
                        onClick={() => {
                          onResetFilters();
                          handleClearAdvancedSearch();
                        }}
                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all duration-200"
                        aria-label='Reset all filters to default values'
                      >
                        <X className='mr-2 h-4 w-4' />
                        <span className='hidden sm:inline'>Clear All Filters</span>
                        <span className='sm:hidden'>Clear</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset all filters and search criteria</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='outline'
                      size="sm"
                      className='flex items-center hover:bg-green-50 hover:border-green-200 hover:text-green-600 transition-all duration-200'
                      onClick={onExport}
                      aria-label='Export current filtered results to CSV file'
                    >
                      <Download className='mr-2 h-4 w-4' aria-hidden='true' />
                      <span className='hidden sm:inline'>Export Results</span>
                      <span className='sm:hidden'>CSV</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Export filtered promoters to CSV</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onRefresh}
                      variant='outline'
                      size="sm"
                      disabled={isFetching}
                      className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-all duration-200 disabled:opacity-50"
                      aria-label={isFetching ? 'Syncing data with server' : 'Refresh promoter data from server'}
                    >
                      <RefreshCw
                        className={cn(
                          'mr-2 h-4 w-4',
                          isFetching && 'animate-spin'
                        )}
                        aria-hidden='true'
                      />
                      <span className='hidden sm:inline'>{isFetching ? 'Syncing...' : 'Refresh Data'}</span>
                      <span className='sm:hidden'>{isFetching ? '...' : 'Sync'}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Refresh promoter data from server</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
        
        {/* Filter Summary */}
        {(hasFiltersApplied || advancedSearchCriteria.length > 0 || searchTerm) && (
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Filter className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">Active Filters Summary</p>
                <div className="flex flex-wrap gap-1 text-xs">
                  {searchTerm && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                      Search: "{searchTerm}"
                    </Badge>
                  )}
                  {statusFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      Status: {statusFilter}
                    </Badge>
                  )}
                  {documentFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-800 dark:text-amber-100">
                      Documents: {documentFilter}
                    </Badge>
                  )}
                  {assignmentFilter !== 'all' && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100">
                      Assignment: {assignmentFilter}
                    </Badge>
                  )}
                  {advancedSearchCriteria.length > 0 && (
                    <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 dark:bg-indigo-800 dark:text-indigo-100">
                      Advanced: {advancedSearchCriteria.length} criteria
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
