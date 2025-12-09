'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, ButtonProps } from '@/components/ui/button';

export interface AccessibleButtonProps extends ButtonProps {
  /** Accessible label for screen readers */
  ariaLabel: string;
  /** Optional icon */
  icon?: LucideIcon;
  /** Loading state */
  isLoading?: boolean;
  /** Success state (shows checkmark) */
  isSuccess?: boolean;
  /** Keyboard shortcut hint */
  kbd?: string;
}

/**
 * Accessible Button Component
 *
 * Provides proper ARIA labels, keyboard navigation, and visual feedback
 *
 * @example
 * ```tsx
 * <AccessibleButton
 *   ariaLabel="Save contract"
 *   icon={Save}
 *   onClick={handleSave}
 *   kbd="⌘S"
 * >
 *   Save
 * </AccessibleButton>
 * ```
 */
export function AccessibleButton({
  ariaLabel,
  icon: Icon,
  children,
  isLoading = false,
  isSuccess = false,
  kbd,
  className,
  disabled,
  ...props
}: AccessibleButtonProps) {
  return (
    <Button
      aria-label={ariaLabel}
      disabled={disabled || isLoading || isSuccess}
      aria-disabled={disabled || isLoading || isSuccess}
      aria-busy={isLoading}
      className={cn(
        'relative',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        'transition-all duration-200',
        className
      )}
      {...props}
    >
      {Icon && !isLoading && !isSuccess && (
        <Icon className='h-4 w-4 me-2' aria-hidden='true' />
      )}

      {isLoading && (
        <span
          className='inline-block h-4 w-4 me-2 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]'
          role='status'
          aria-label='Loading'
        />
      )}

      {isSuccess && (
        <svg
          className='h-4 w-4 me-2'
          fill='none'
          viewBox='0 0 24 24'
          stroke='currentColor'
          aria-hidden='true'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M5 13l4 4L19 7'
          />
        </svg>
      )}

      <span>{children}</span>

      {kbd && !isLoading && !isSuccess && (
        <kbd
          className='ms-2 px-1.5 py-0.5 text-xs font-mono rounded bg-black/10 dark:bg-white/10'
          aria-label={`Keyboard shortcut: ${kbd}`}
        >
          {kbd}
        </kbd>
      )}
    </Button>
  );
}

/**
 * Icon-only accessible button
 */
export function AccessibleIconButton({
  ariaLabel,
  icon: Icon,
  className,
  ...props
}: Omit<AccessibleButtonProps, 'children'> & { icon: LucideIcon }) {
  return (
    <Button
      aria-label={ariaLabel}
      className={cn(
        'p-2',
        'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
        className
      )}
      {...props}
    >
      <Icon className='h-4 w-4' aria-hidden='true' />
      <span className='sr-only'>{ariaLabel}</span>
    </Button>
  );
}
