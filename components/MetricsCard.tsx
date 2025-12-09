'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  tooltip?: string;
  isLoading?: boolean;
  className?: string;
}

/**
 * Reusable metrics card component with tooltip support
 * Used across dashboard and contracts pages for consistent display
 */
export function MetricsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tooltip,
  isLoading = false,
  className = '',
}: MetricsCardProps) {
  return (
    <Card className={className}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <div className='flex items-center gap-2'>
          <CardTitle className='text-sm font-medium'>{title}</CardTitle>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className='h-3 w-3 text-muted-foreground cursor-help' />
                </TooltipTrigger>
                <TooltipContent>
                  <p className='max-w-xs'>{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {Icon && <Icon className='h-4 w-4 text-muted-foreground' />}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='h-8 w-16 bg-muted animate-pulse rounded' />
        ) : (
          <>
            <div className='text-2xl font-bold'>{value}</div>
            {subtitle && (
              <p className='text-xs text-muted-foreground mt-1'>{subtitle}</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Scope badge to show whether metrics are system-wide or user-specific
 */
interface ScopeBadgeProps {
  scope: 'system-wide' | 'user-specific';
  scopeLabel?: string;
}

export function ScopeBadge({ scope, scopeLabel }: ScopeBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className='inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/50 rounded-md text-xs font-medium cursor-help'>
            <span>{scope === 'system-wide' ? '🌐' : '👤'}</span>
            <span>
              {scope === 'system-wide' ? 'All Contracts' : 'Your Contracts'}
            </span>
            <Info className='h-3 w-3 opacity-50' />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className='max-w-xs'>
            {scopeLabel ||
              (scope === 'system-wide'
                ? 'Showing all contracts in the system (admin view)'
                : 'Showing only contracts you created or have access to')}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
