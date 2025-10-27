'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface NavigationBadge {
  value: number;
  type: 'info' | 'warning' | 'error' | 'success';
  tooltip: string;
  ariaLabel?: string;
}

export interface NavigationItemProps {
  label: string;
  href: string;
  icon: LucideIcon;
  isActive?: boolean;
  badge?: NavigationBadge;
  onClick?: () => void;
  className?: string;
}

const badgeStyles = {
  info: 'bg-blue-500 hover:bg-blue-600 text-white',
  warning: 'bg-orange-500 hover:bg-orange-600 text-white',
  error: 'bg-red-500 hover:bg-red-600 text-white',
  success: 'bg-green-500 hover:bg-green-600 text-white',
};

export function NavigationItem({
  label,
  href,
  icon: Icon,
  isActive = false,
  badge,
  onClick,
  className,
}: NavigationItemProps) {
  return (
    <TooltipProvider delayDuration={300}>
      <Link
        href={href}
        onClick={onClick}
        className={cn(
          'flex items-center justify-between p-2 rounded-lg transition-all',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-accent text-accent-foreground font-medium'
            : 'text-muted-foreground',
          className
        )}
      >
        <div className="flex items-center space-x-3">
          <Icon className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm">{label}</span>
        </div>

        {badge && badge.value > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                className={cn(
                  'px-2 py-0.5 text-xs font-semibold transition-colors',
                  badgeStyles[badge.type]
                )}
                aria-label={badge.ariaLabel || badge.tooltip}
              >
                {badge.value}
              </Badge>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="max-w-xs"
              sideOffset={5}
            >
              <p className="text-sm font-medium">{badge.tooltip}</p>
            </TooltipContent>
          </Tooltip>
        )}
      </Link>
    </TooltipProvider>
  );
}

// Variant for collapsed sidebar (icon only)
export function NavigationItemIconOnly({
  label,
  href,
  icon: Icon,
  isActive = false,
  badge,
  onClick,
  className,
}: NavigationItemProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            onClick={onClick}
            className={cn(
              'relative flex items-center justify-center p-2 rounded-lg transition-all',
              'hover:bg-accent hover:text-accent-foreground',
              isActive
                ? 'bg-accent text-accent-foreground'
                : 'text-muted-foreground',
              className
            )}
            aria-label={label}
          >
            <Icon className="h-5 w-5" />
            {badge && badge.value > 0 && (
              <span
                className={cn(
                  'absolute -top-1 -right-1 flex items-center justify-center',
                  'w-5 h-5 text-xs font-bold rounded-full',
                  badgeStyles[badge.type]
                )}
                aria-label={badge.ariaLabel || badge.tooltip}
              >
                {badge.value > 99 ? '99+' : badge.value}
              </span>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="right" className="flex flex-col gap-1">
          <p className="font-medium">{label}</p>
          {badge && badge.value > 0 && (
            <p className="text-xs text-muted-foreground">{badge.tooltip}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Section header component
export function NavigationSection({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      <h3 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

