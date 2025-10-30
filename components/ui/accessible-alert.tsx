/**
 * Accessible Alert Component
 * 
 * Enhanced alert component with ARIA attributes and screen reader support
 */

'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        destructive:
          'border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive',
        success:
          'border-green-500/50 text-green-700 dark:text-green-400 [&>svg]:text-green-700 dark:[&>svg]:text-green-400',
        warning:
          'border-yellow-500/50 text-yellow-700 dark:text-yellow-400 [&>svg]:text-yellow-700 dark:[&>svg]:text-yellow-400',
        info:
          'border-blue-500/50 text-blue-700 dark:text-blue-400 [&>svg]:text-blue-700 dark:[&>svg]:text-blue-400',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface AccessibleAlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Whether the alert is a live region that should announce changes
   */
  live?: boolean;
  /**
   * How assertive the live region should be
   */
  liveMode?: 'polite' | 'assertive' | 'off';
  /**
   * Whether to show an icon based on variant
   */
  showIcon?: boolean;
  /**
   * Custom icon to display
   */
  icon?: React.ReactNode;
}

const AccessibleAlert = React.forwardRef<HTMLDivElement, AccessibleAlertProps>(
  (
    {
      className,
      variant = 'default',
      live = false,
      liveMode = 'polite',
      showIcon = true,
      icon,
      children,
      ...props
    },
    ref
  ) => {
    // Select appropriate icon based on variant
    const Icon = React.useMemo(() => {
      if (icon) return null;
      if (!showIcon) return null;

      switch (variant) {
        case 'destructive':
          return <XCircle className='h-4 w-4' aria-hidden='true' />;
        case 'success':
          return <CheckCircle className='h-4 w-4' aria-hidden='true' />;
        case 'warning':
          return <AlertCircle className='h-4 w-4' aria-hidden='true' />;
        case 'info':
          return <Info className='h-4 w-4' aria-hidden='true' />;
        default:
          return <Info className='h-4 w-4' aria-hidden='true' />;
      }
    }, [variant, showIcon, icon]);

    // Build ARIA props conditionally to satisfy linter
    const ariaProps: Record<string, string> = {
      role: variant === 'destructive' ? 'alert' : 'status',
    };
    
    if (live) {
      ariaProps['aria-live'] = liveMode;
      ariaProps['aria-atomic'] = 'true';
    }

    return (
      <div
        ref={ref}
        {...ariaProps}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {icon || Icon}
        <div>{children}</div>
      </div>
    );
  }
);

AccessibleAlert.displayName = 'AccessibleAlert';

const AccessibleAlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn('mb-1 font-medium leading-none tracking-tight', className)}
    {...props}
  />
));
AccessibleAlertTitle.displayName = 'AccessibleAlertTitle';

const AccessibleAlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('text-sm [&_p]:leading-relaxed', className)}
    {...props}
  />
));
AccessibleAlertDescription.displayName = 'AccessibleAlertDescription';

export { AccessibleAlert, AccessibleAlertTitle, AccessibleAlertDescription };

