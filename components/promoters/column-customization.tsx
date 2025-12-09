'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Settings, GripVertical, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  required?: boolean; // Can't be hidden
}

interface ColumnCustomizationProps {
  columns: ColumnConfig[];
  onColumnChange: (columns: ColumnConfig[]) => void;
  onReset: () => void;
}

const STORAGE_KEY = 'promoters-table-columns';

/**
 * Column Customization Component
 *
 * Allows users to:
 * - Show/hide columns
 * - Reorder columns with drag and drop
 * - Reset to default configuration
 * - Persist preferences in localStorage
 */
export function ColumnCustomization({
  columns,
  onColumnChange,
  onReset,
}: ColumnCustomizationProps) {
  const [localColumns, setLocalColumns] = useState<ColumnConfig[]>(columns);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Sync with parent columns
  useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const visibleCount = localColumns.filter(col => col.visible).length;
  const hiddenCount = localColumns.length - visibleCount;

  const handleToggleColumn = (columnId: string) => {
    const updatedColumns = localColumns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    );
    setLocalColumns(updatedColumns);
    onColumnChange(updatedColumns);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newColumns = [...localColumns];
    const draggedColumn = newColumns[draggedIndex];
    newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, draggedColumn);

    // Update order property
    const reorderedColumns = newColumns.map((col, idx) => ({
      ...col,
      order: idx,
    }));

    setLocalColumns(reorderedColumns);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    // Save to parent and localStorage
    onColumnChange(localColumns);
  };

  const handleReset = () => {
    onReset();
    setIsOpen(false);
  };

  const handleShowAll = () => {
    const updatedColumns = localColumns.map(col => ({
      ...col,
      visible: true,
    }));
    setLocalColumns(updatedColumns);
    onColumnChange(updatedColumns);
  };

  const handleHideAll = () => {
    const updatedColumns = localColumns.map(col => ({
      ...col,
      visible: col.required ? true : false, // Keep required columns visible
    }));
    setLocalColumns(updatedColumns);
    onColumnChange(updatedColumns);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='gap-2'
          aria-label='Customize columns'
        >
          <Settings className='h-4 w-4' />
          <span className='hidden sm:inline'>Columns</span>
          {hiddenCount > 0 && (
            <Badge variant='secondary' className='ml-1 px-1.5 py-0 text-xs'>
              {hiddenCount} hidden
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>Customize Table Columns</DialogTitle>
          <DialogDescription>
            Show, hide, or reorder columns. Drag to reorder. Changes are saved
            automatically.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Quick Actions */}
          <div className='flex items-center justify-between gap-2 pb-2 border-b'>
            <div className='flex items-center gap-2'>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleShowAll}
                className='h-8 text-xs'
              >
                <Eye className='h-3 w-3 mr-1' />
                Show All
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleHideAll}
                className='h-8 text-xs'
              >
                <EyeOff className='h-3 w-3 mr-1' />
                Hide All
              </Button>
            </div>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleReset}
              className='h-8 text-xs text-muted-foreground hover:text-foreground'
            >
              <RotateCcw className='h-3 w-3 mr-1' />
              Reset
            </Button>
          </div>

          {/* Column List */}
          <div className='space-y-1 max-h-[400px] overflow-y-auto'>
            {localColumns.map((column, index) => (
              <div
                key={column.id}
                draggable={!column.required}
                onDragStart={() => handleDragStart(index)}
                onDragOver={e => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border bg-card transition-all',
                  'hover:bg-accent hover:border-primary/50',
                  draggedIndex === index && 'opacity-50 border-primary',
                  !column.required && 'cursor-move'
                )}
              >
                {/* Drag Handle */}
                {!column.required ? (
                  <GripVertical className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                ) : (
                  <div className='w-4' /> // Spacer for required columns
                )}

                {/* Checkbox */}
                <Checkbox
                  checked={column.visible}
                  onCheckedChange={() => handleToggleColumn(column.id)}
                  disabled={column.required}
                  className='flex-shrink-0'
                />

                {/* Column Label */}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <span
                      className={cn(
                        'text-sm font-medium truncate',
                        !column.visible && 'text-muted-foreground line-through'
                      )}
                    >
                      {column.label}
                    </span>
                    {column.required && (
                      <Badge variant='outline' className='text-xs px-1.5 py-0'>
                        Required
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Visibility Icon */}
                {column.visible ? (
                  <Eye className='h-4 w-4 text-green-600 flex-shrink-0' />
                ) : (
                  <EyeOff className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                )}
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className='pt-2 border-t'>
            <div className='flex items-center justify-between text-sm text-muted-foreground'>
              <span>
                {visibleCount} of {localColumns.length} columns visible
              </span>
              <span className='text-xs'>Drag to reorder</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => setIsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage column customization state
 */
export function useColumnCustomization(defaultColumns: ColumnConfig[]) {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => {
    // Try to load from localStorage
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const savedColumns = JSON.parse(saved) as ColumnConfig[];
          // Merge with default columns to handle schema changes
          return defaultColumns.map(defaultCol => {
            const savedCol = savedColumns.find(s => s.id === defaultCol.id);
            return savedCol ? { ...defaultCol, ...savedCol } : defaultCol;
          });
        }
      } catch (error) {
        console.warn('Failed to load column preferences:', error);
      }
    }
    return defaultColumns;
  });

  const handleColumnChange = (newColumns: ColumnConfig[]) => {
    setColumns(newColumns);
    // Save to localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newColumns));
      } catch (error) {
        console.warn('Failed to save column preferences:', error);
      }
    }
  };

  const handleReset = () => {
    setColumns(defaultColumns);
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const getVisibleColumns = () => columns.filter(col => col.visible);

  const isColumnVisible = (columnId: string) => {
    const column = columns.find(col => col.id === columnId);
    return column?.visible ?? true;
  };

  return {
    columns,
    visibleColumns: getVisibleColumns(),
    setColumns: handleColumnChange,
    resetColumns: handleReset,
    isColumnVisible,
  };
}
