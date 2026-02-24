'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  Filter,
  X,
  Calendar as CalendarIcon,
  Save,
  Bookmark,
  Trash2,
  Plus,
  Search,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

interface AdvancedFilter {
  id: string;
  field: string;
  operator:
    | 'equals'
    | 'contains'
    | 'startsWith'
    | 'endsWith'
    | 'greaterThan'
    | 'lessThan'
    | 'between'
    | 'in';
  value: string | string[] | DateRange;
}

interface SavedFilterPreset {
  id: string;
  name: string;
  description?: string;
  filters: AdvancedFilter[];
  createdAt: string;
}

interface PromotersAdvancedFiltersProps {
  onApply: (filters: AdvancedFilter[]) => void;
  onClear: () => void;
  activeFilters: AdvancedFilter[];
  className?: string;
}

const FILTER_FIELDS = [
  { value: 'name', label: 'Name', type: 'text' },
  { value: 'email', label: 'Email', type: 'text' },
  { value: 'phone', label: 'Phone', type: 'text' },
  { value: 'job_title', label: 'Job Title', type: 'text' },
  { value: 'nationality', label: 'Nationality', type: 'text' },
  {
    value: 'status',
    label: 'Status',
    type: 'select',
    options: ['active', 'inactive', 'critical', 'warning'],
  },
  { value: 'created_at', label: 'Created Date', type: 'date' },
  { value: 'id_expiry', label: 'ID Expiry Date', type: 'date' },
  { value: 'passport_expiry', label: 'Passport Expiry Date', type: 'date' },
  { value: 'company', label: 'Company', type: 'text' },
  {
    value: 'assignment',
    label: 'Assignment Status',
    type: 'select',
    options: ['assigned', 'unassigned'],
  },
];

const OPERATORS = {
  text: [
    { value: 'equals', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
  ],
  date: [
    { value: 'equals', label: 'On Date' },
    { value: 'greaterThan', label: 'After' },
    { value: 'lessThan', label: 'Before' },
    { value: 'between', label: 'Between' },
  ],
  select: [
    { value: 'equals', label: 'Equals' },
    { value: 'in', label: 'In (Multiple)' },
  ],
};

export function PromotersAdvancedFilters({
  onApply,
  onClear,
  activeFilters,
  className,
}: PromotersAdvancedFiltersProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilter[]>(activeFilters);
  const [savedPresets, setSavedPresets] = useState<SavedFilterPreset[]>([]);

  const addFilter = useCallback(() => {
    setFilters(prev => [
      ...prev,
      {
        id: `filter-${Date.now()}`,
        field: 'name',
        operator: 'contains',
        value: '',
      },
    ]);
  }, []);

  const removeFilter = useCallback((id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  }, []);

  const updateFilter = useCallback(
    (id: string, updates: Partial<AdvancedFilter>) => {
      setFilters(prev =>
        prev.map(f => (f.id === id ? { ...f, ...updates } : f))
      );
    },
    []
  );

  const handleApply = useCallback(() => {
    onApply(filters);
    setIsOpen(false);
    toast({
      title: 'Filters Applied',
      description: `${filters.length} filter${filters.length !== 1 ? 's' : ''} applied`,
    });
  }, [filters, onApply, toast]);

  const handleClear = useCallback(() => {
    setFilters([]);
    onClear();
    toast({
      title: 'Filters Cleared',
      description: 'All filters have been removed',
    });
  }, [onClear, toast]);

  const savePreset = useCallback(() => {
    if (filters.length === 0) {
      toast({
        title: 'No Filters',
        description: 'Add at least one filter before saving',
        variant: 'destructive',
      });
      return;
    }

    const preset: SavedFilterPreset = {
      id: `preset-${Date.now()}`,
      name: `Preset ${savedPresets.length + 1}`,
      filters,
      createdAt: new Date().toISOString(),
    };

    setSavedPresets(prev => [...prev, preset]);
    toast({
      title: 'Preset Saved',
      description: 'Filter preset has been saved',
    });
  }, [filters, savedPresets.length, toast]);

  const loadPreset = useCallback(
    (preset: SavedFilterPreset) => {
      setFilters(preset.filters);
      toast({
        title: 'Preset Loaded',
        description: `Loaded "${preset.name}"`,
      });
    },
    [toast]
  );

  const deletePreset = useCallback(
    (id: string) => {
      setSavedPresets(prev => prev.filter(p => p.id !== id));
      toast({
        title: 'Preset Deleted',
        description: 'Filter preset has been deleted',
      });
    },
    [toast]
  );

  const activeCount = activeFilters.length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant='outline'
            className={cn('gap-2', className)}
            aria-label={`Advanced filters${activeCount > 0 ? ` (${activeCount} active)` : ''}`}
          >
            <Filter className='h-4 w-4' />
            Advanced Filters
            {activeCount > 0 && (
              <Badge variant='secondary' className='ml-1'>
                {activeCount}
              </Badge>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle className='text-2xl font-bold flex items-center gap-2'>
              <Filter className='h-6 w-6' />
              Advanced Filters
            </DialogTitle>
            <DialogDescription>
              Create complex filter combinations with multiple criteria
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-6 py-4'>
            {/* Saved Presets */}
            {savedPresets.length > 0 && (
              <div className='space-y-2'>
                <Label className='text-base font-semibold'>Saved Presets</Label>
                <div className='flex flex-wrap gap-2'>
                  {savedPresets.map(preset => (
                    <Badge
                      key={preset.id}
                      variant='outline'
                      className='gap-2 cursor-pointer hover:bg-primary/10'
                      onClick={() => loadPreset(preset)}
                    >
                      <Bookmark className='h-3 w-3' />
                      {preset.name}
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          deletePreset(preset.id);
                        }}
                        className='ml-1 hover:text-destructive'
                      >
                        <X className='h-3 w-3' />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Active Filters */}
            <div className='space-y-3'>
              <div className='flex items-center justify-between'>
                <Label className='text-base font-semibold'>
                  Filter Criteria ({filters.length})
                </Label>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={addFilter}
                    className='gap-2'
                  >
                    <Plus className='h-4 w-4' />
                    Add Filter
                  </Button>
                  {filters.length > 0 && (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={savePreset}
                      className='gap-2'
                    >
                      <Save className='h-4 w-4' />
                      Save Preset
                    </Button>
                  )}
                </div>
              </div>

              {filters.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  <Filter className='h-12 w-12 mx-auto mb-3 opacity-50' />
                  <p>No filters added yet</p>
                  <p className='text-sm'>
                    Click "Add Filter" to create your first filter
                  </p>
                </div>
              ) : (
                <div className='space-y-3'>
                  {filters.map((filter, index) => {
                    const fieldConfig = FILTER_FIELDS.find(
                      f => f.value === filter.field
                    );
                    const fieldType = fieldConfig?.type || 'text';
                    const operators =
                      OPERATORS[fieldType as keyof typeof OPERATORS] ||
                      OPERATORS.text;

                    return (
                      <div
                        key={filter.id}
                        className='p-4 border rounded-lg space-y-3 bg-slate-50/50 dark:bg-slate-800/50'
                      >
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium text-muted-foreground'>
                            Filter {index + 1}
                          </span>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => removeFilter(filter.id)}
                            className='h-6 w-6 p-0'
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>

                        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                          {/* Field Selection */}
                          <div className='space-y-2'>
                            <Label>Field</Label>
                            <Select
                              value={filter.field}
                              onValueChange={value =>
                                updateFilter(filter.id, {
                                  field: value,
                                  operator: 'contains',
                                  value: '',
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FILTER_FIELDS.map(field => (
                                  <SelectItem
                                    key={field.value}
                                    value={field.value}
                                  >
                                    {field.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Operator Selection */}
                          <div className='space-y-2'>
                            <Label>Operator</Label>
                            <Select
                              value={filter.operator}
                              onValueChange={(value: any) =>
                                updateFilter(filter.id, { operator: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {operators.map(op => (
                                  <SelectItem key={op.value} value={op.value}>
                                    {op.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Value Input */}
                          <div className='space-y-2'>
                            <Label>Value</Label>
                            {fieldType === 'date' ? (
                              filter.operator === 'between' ? (
                                <div className='space-y-2'>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant='outline'
                                        className={cn(
                                          'w-full justify-start text-left font-normal',
                                          !(filter.value as DateRange)?.from &&
                                            'text-muted-foreground'
                                        )}
                                      >
                                        <CalendarIcon className='mr-2 h-4 w-4' />
                                        {(filter.value as DateRange)?.from
                                          ? format(
                                              (filter.value as DateRange).from!,
                                              'PPP'
                                            )
                                          : 'From date'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className='w-auto p-0'>
                                      {/* Calendar component - implement with date picker library */}
                                      <div className='p-4'>
                                        <Input
                                          type='date'
                                          value={
                                            (filter.value as DateRange)?.from
                                              ? format(
                                                  (filter.value as DateRange)
                                                    .from!,
                                                  'yyyy-MM-dd'
                                                )
                                              : ''
                                          }
                                          onChange={e =>
                                            updateFilter(filter.id, {
                                              value: {
                                                ...(filter.value as DateRange),
                                                from: e.target.value
                                                  ? new Date(e.target.value)
                                                  : undefined,
                                              },
                                            })
                                          }
                                        />
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button
                                        variant='outline'
                                        className={cn(
                                          'w-full justify-start text-left font-normal',
                                          !(filter.value as DateRange)?.to &&
                                            'text-muted-foreground'
                                        )}
                                      >
                                        <CalendarIcon className='mr-2 h-4 w-4' />
                                        {(filter.value as DateRange)?.to
                                          ? format(
                                              (filter.value as DateRange).to!,
                                              'PPP'
                                            )
                                          : 'To date'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className='w-auto p-0'>
                                      <Calendar
                                        mode='single'
                                        selected={
                                          (filter.value as DateRange)?.to
                                        }
                                        onSelect={date =>
                                          updateFilter(filter.id, {
                                            value: {
                                              ...(filter.value as DateRange),
                                              to: date,
                                            },
                                          })
                                        }
                                      />
                                    </PopoverContent>
                                  </Popover>
                                </div>
                              ) : (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant='outline'
                                      className={cn(
                                        'w-full justify-start text-left font-normal',
                                        !filter.value && 'text-muted-foreground'
                                      )}
                                    >
                                      <CalendarIcon className='mr-2 h-4 w-4' />
                                      {filter.value
                                        ? format(filter.value as Date, 'PPP')
                                        : 'Select date'}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className='w-auto p-0'>
                                    <Calendar
                                      mode='single'
                                      selected={filter.value as Date}
                                      onSelect={date =>
                                        updateFilter(filter.id, { value: date })
                                      }
                                    />
                                  </PopoverContent>
                                </Popover>
                              )
                            ) : fieldType === 'select' &&
                              filter.operator === 'in' ? (
                              <Input
                                placeholder='Comma-separated values'
                                value={
                                  Array.isArray(filter.value)
                                    ? filter.value.join(', ')
                                    : ''
                                }
                                onChange={e =>
                                  updateFilter(filter.id, {
                                    value: e.target.value
                                      .split(',')
                                      .map(v => v.trim()),
                                  })
                                }
                              />
                            ) : (
                              <Input
                                placeholder='Enter value'
                                value={
                                  typeof filter.value === 'string'
                                    ? filter.value
                                    : ''
                                }
                                onChange={e =>
                                  updateFilter(filter.id, {
                                    value: e.target.value,
                                  })
                                }
                              />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={handleClear}
              disabled={filters.length === 0}
            >
              Clear All
            </Button>
            <Button variant='outline' onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={filters.length === 0}>
              <Search className='mr-2 h-4 w-4' />
              Apply Filters ({filters.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Active Filters Display */}
      {activeCount > 0 && (
        <div className='flex flex-wrap gap-2 mt-2'>
          {activeFilters.map(filter => {
            const fieldConfig = FILTER_FIELDS.find(
              f => f.value === filter.field
            );
            return (
              <Badge key={filter.id} variant='secondary' className='gap-1'>
                {fieldConfig?.label}:{' '}
                {typeof filter.value === 'string' ? filter.value : 'Set'}
                <button
                  onClick={() => removeFilter(filter.id)}
                  className='ml-1 hover:text-destructive'
                >
                  <X className='h-3 w-3' />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </>
  );
}
