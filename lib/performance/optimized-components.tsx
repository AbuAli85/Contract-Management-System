/**
 * Performance Optimized Components
 * 
 * Memoized versions of common components to prevent unnecessary re-renders
 */

'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Optimized Metric Card
 * Prevents re-render when props haven't changed
 */
export const MetricCard = React.memo(function MetricCard({
  title,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  className,
}: {
  title: string;
  value: string | number;
  change?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  return (
    <div className={cn('bg-white rounded-lg shadow p-6 space-y-2', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {Icon && <Icon className="h-5 w-5 text-gray-400" />}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className={cn('text-sm font-medium', trendColors[trend])}>
            {change}
          </p>
        )}
      </div>
    </div>
  );
});

/**
 * Optimized Data Table Row
 * Only re-renders when its own data changes
 */
export const DataTableRow = React.memo(function DataTableRow({
  data,
  columns,
  onAction,
}: {
  data: Record<string, any>;
  columns: Array<{ key: string; render?: (value: any, row: any) => React.ReactNode }>;
  onAction?: (row: Record<string, any>) => void;
}) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {columns.map((column) => (
        <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
          {column.render ? column.render(data[column.key], data) : data[column.key]}
        </td>
      ))}
      {onAction && (
        <td className="px-6 py-4 whitespace-nowrap text-sm">
          <button
            onClick={() => onAction(data)}
            className="text-blue-600 hover:text-blue-800"
          >
            Action
          </button>
        </td>
      )}
    </tr>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function
  return JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data);
});

/**
 * Optimized List Item
 * Prevents re-render of entire list when one item changes
 */
export const ListItem = React.memo(function ListItem({
  id,
  title,
  subtitle,
  icon: Icon,
  onClick,
  isSelected = false,
}: {
  id: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onClick?: (id: string) => void;
  isSelected?: boolean;
}) {
  return (
    <div
      onClick={() => onClick?.(id)}
      className={cn(
        'flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors',
        isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
      )}
    >
      {Icon && <Icon className="h-5 w-5 text-gray-400" />}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
});

/**
 * Optimized Chart Component
 * Heavy charts should be wrapped with React.memo
 */
export const OptimizedChart = React.memo(function OptimizedChart({
  data,
  type,
  options,
}: {
  data: any;
  type: string;
  options?: any;
}) {
  // Chart implementation would go here
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <p className="text-sm text-gray-500">
        Chart: {type} ({data?.length || 0} data points)
      </p>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if data actually changed
  return prevProps.data === nextProps.data && prevProps.type === nextProps.type;
});

/**
 * Virtualized Long List
 * For rendering large lists efficiently
 */
export function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 60,
  containerHeight = 400,
  className,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  className?: string;
}) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight)
  );

  const visibleItems = items.slice(visibleStart, visibleEnd);
  const offsetY = visibleStart * itemHeight;

  return (
    <div
      className={cn('overflow-y-auto', className)}
      style={{ height: containerHeight }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) =>
            renderItem(item, visibleStart + index)
          )}
        </div>
      </div>
    </div>
  );
}

