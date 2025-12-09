'use client';

import { cn } from '@/lib/utils';
import {
  SEMANTIC_COLORS,
  type SemanticColor,
} from '@/lib/design-system/colors';

interface StatusBadgeProps {
  status: SemanticColor;
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: 'px-1.5 py-0.5 text-xs',
  md: 'px-2 py-1 text-sm',
  lg: 'px-3 py-1.5 text-base',
};

export function StatusBadge({
  status,
  children,
  className,
  size = 'md',
}: StatusBadgeProps) {
  const colors = SEMANTIC_COLORS[status];

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        colors.badge,
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

/**
 * Pre-configured status badges for common use cases
 */
export function DocumentStatusBadge({
  status,
  children,
  className,
  size = 'md',
}: {
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const statusMap: Record<string, SemanticColor> = {
    valid: 'success',
    expiring: 'warning',
    expired: 'critical',
    missing: 'neutral',
  };

  return (
    <StatusBadge status={statusMap[status]} className={className} size={size}>
      {children}
    </StatusBadge>
  );
}

export function OverallStatusBadge({
  status,
  children,
  className,
  size = 'md',
}: {
  status: 'active' | 'warning' | 'critical' | 'inactive';
  children: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const statusMap: Record<string, SemanticColor> = {
    active: 'success',
    warning: 'warning',
    critical: 'critical',
    inactive: 'neutral',
  };

  return (
    <StatusBadge status={statusMap[status]} className={className} size={size}>
      {children}
    </StatusBadge>
  );
}
