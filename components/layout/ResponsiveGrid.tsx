'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface ResponsiveGridProps {
  children: React.ReactNode;
  className?: string;
  /** Grid columns at different breakpoints */
  cols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  /** Gap between grid items */
  gap?: number | string;
}

/**
 * Responsive Grid Component
 * 
 * Automatically adjusts columns based on viewport size
 * 
 * @example
 * ```tsx
 * <ResponsiveGrid
 *   cols={{ default: 1, sm: 2, lg: 3, xl: 4 }}
 *   gap={4}
 * >
 *   <MetricCard />
 *   <MetricCard />
 *   <MetricCard />
 * </ResponsiveGrid>
 * ```
 */
export function ResponsiveGrid({
  children,
  className,
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = 4,
}: ResponsiveGridProps) {
  const gridClasses = cn(
    'grid',
    cols.default && `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`,
    cols['2xl'] && `2xl:grid-cols-${cols['2xl']}`,
    typeof gap === 'number' ? `gap-${gap}` : gap,
    className
  );

  return <div className={gridClasses}>{children}</div>;
}

/**
 * Responsive Metrics Grid
 * Pre-configured for dashboard metrics cards
 */
export function MetricsGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid',
        'grid-cols-1',           // Mobile: 1 column
        'sm:grid-cols-2',        // Small: 2 columns
        'lg:grid-cols-3',        // Large: 3 columns
        'xl:grid-cols-4',        // XL: 4 columns
        'gap-4 sm:gap-6',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Responsive List/Grid Toggle
 * Switches between list and grid view
 */
export function ResponsiveListGrid({
  children,
  view = 'grid',
  className,
}: {
  children: React.ReactNode;
  view?: 'list' | 'grid';
  className?: string;
}) {
  if (view === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Responsive Container
 * Centers content with responsive padding
 */
export function ResponsiveContainer({
  children,
  className,
  maxWidth = '7xl',
}: {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        'px-4 sm:px-6 lg:px-8',
        `max-w-${maxWidth}`,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Responsive Columns
 * Side-by-side layout that stacks on mobile
 */
export function ResponsiveColumns({
  children,
  className,
  stackOnMobile = true,
  gap = 6,
}: {
  children: React.ReactNode;
  className?: string;
  stackOnMobile?: boolean;
  gap?: number;
}) {
  return (
    <div
      className={cn(
        'grid',
        stackOnMobile ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-2',
        `gap-${gap}`,
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Responsive Card Grid
 * Optimized for card layouts
 */
export function ResponsiveCardGrid({
  children,
  className,
  minCardWidth = '280px',
}: {
  children: React.ReactNode;
  className?: string;
  minCardWidth?: string;
}) {
  return (
    <div
      className={cn('grid gap-4 sm:gap-6', className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))`,
      }}
    >
      {children}
    </div>
  );
}

