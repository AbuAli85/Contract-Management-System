'use client';

import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export interface TrendData {
  value: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable' | 'unknown';
  previousValue?: number;
}

interface TrendIndicatorProps {
  trend: TrendData | null;
  comparisonPeriod?: string; // e.g., "from last week", "vs yesterday"
  className?: string | undefined;
  variant?: 'default' | 'compact' | 'detailed';
  showIcon?: boolean;
  showPercent?: boolean;
  showValue?: boolean;
  invertColors?: boolean; // For metrics where down is good (e.g., critical alerts)
}

/**
 * Trend Indicator Component
 * 
 * Displays metric trends with arrows and percentage changes
 * 
 * Features:
 * - Up/Down/Stable indicators
 * - Color coding (green=good, red=bad)
 * - Percentage change display
 * - Tooltips with detailed info
 * - Multiple display variants
 * 
 * @example
 * ```tsx
 * <TrendIndicator
 *   trend={trendData}
 *   comparisonPeriod="from last week"
 *   variant="detailed"
 * />
 * ```
 */
export function TrendIndicator({
  trend,
  comparisonPeriod = 'from last week',
  className,
  variant = 'default',
  showIcon = true,
  showPercent = true,
  showValue = false,
  invertColors = false,
}: TrendIndicatorProps) {
  // If no trend data, show nothing
  if (!trend || trend.trend === 'unknown') {
    return null;
  }

  const { change, changePercent, trend: direction, previousValue } = trend;

  // Determine colors (can be inverted for metrics where decrease is good)
  const isPositive = invertColors ? direction === 'down' : direction === 'up';
  const isNegative = invertColors ? direction === 'up' : direction === 'down';
  const isStable = direction === 'stable';

  // Get appropriate icon
  const Icon = direction === 'up' 
    ? TrendingUp 
    : direction === 'down' 
    ? TrendingDown 
    : Minus;

  // Color classes
  const colorClass = cn(
    isPositive && 'text-green-600',
    isNegative && 'text-red-600',
    isStable && 'text-gray-500'
  );

  const bgClass = cn(
    isPositive && 'bg-green-50 border-green-200',
    isNegative && 'bg-red-50 border-red-200',
    isStable && 'bg-gray-50 border-gray-200'
  );

  // Format change value with sign
  const formatChange = () => {
    const sign = change > 0 ? '+' : '';
    return `${sign}${change}`;
  };

  // Format percentage with sign
  const formatPercent = () => {
    const sign = changePercent > 0 ? '+' : '';
    return `${sign}${changePercent}%`;
  };

  // Compact variant (just icon and percentage)
  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn('flex items-center gap-1', colorClass, className)}>
              {showIcon && <Icon className="h-3.5 w-3.5" />}
              {showPercent && (
                <span className="text-xs font-semibold">{formatPercent()}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-medium">
                {direction === 'up' ? 'Increased' : direction === 'down' ? 'Decreased' : 'Stable'}
              </p>
              <p>Change: {formatChange()} ({formatPercent()})</p>
              <p className="text-muted-foreground">{comparisonPeriod}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Detailed variant (badge with icon, value, and percentage)
  if (variant === 'detailed') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all',
              bgClass,
              colorClass,
              className
            )}>
              {showIcon && <Icon className="h-3.5 w-3.5" />}
              {showValue && <span>{formatChange()}</span>}
              {showPercent && <span className="font-bold">{formatPercent()}</span>}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-xs space-y-1">
              <p className="font-medium">
                {direction === 'up' ? '📈 Increasing' : direction === 'down' ? '📉 Decreasing' : '➡️ Stable'}
              </p>
              <p>Current: {trend.value}</p>
              {previousValue !== undefined && (
                <p>Previous: {previousValue}</p>
              )}
              <p>Change: {formatChange()} ({formatPercent()})</p>
              <p className="text-muted-foreground pt-1 border-t">{comparisonPeriod}</p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default variant (icon and percentage)
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn('flex items-center gap-1.5', colorClass, className)}>
            {showIcon && <Icon className="h-4 w-4" />}
            {showPercent && (
              <span className="text-sm font-medium">{formatPercent()}</span>
            )}
            {showValue && (
              <span className="text-xs text-muted-foreground">
                ({formatChange()})
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p>{formatPercent()} {comparisonPeriod}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Inline trend display for metric cards
 */
interface MetricTrendProps {
  current: number;
  previous: number;
  label?: string;
  invertColors?: boolean;
  className?: string | undefined;
}

export function MetricTrend({
  current,
  previous,
  label = 'from last week',
  invertColors = false,
  className,
}: MetricTrendProps) {
  const change = current - previous;
  const changePercent = previous === 0 
    ? (current > 0 ? 100 : 0)
    : Math.round((change / previous) * 100);

  const trend: 'up' | 'down' | 'stable' =
    Math.abs(changePercent) < 1 ? 'stable' : change > 0 ? 'up' : 'down';

  const trendData: TrendData = {
    value: current,
    change,
    changePercent,
    trend,
    previousValue: previous,
  };

  return (
    <TrendIndicator
      trend={trendData}
      comparisonPeriod={label}
      variant="compact"
      invertColors={invertColors}
      className={className}
    />
  );
}

