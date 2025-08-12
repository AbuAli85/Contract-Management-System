'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  variant?: 'default' | 'destructive';
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const baseClasses =
      'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70';
    const variantClasses = {
      default: '',
      destructive: 'text-destructive',
    };

    return (
      <label
        ref={ref}
        className={cn(baseClasses, variantClasses[variant], className)}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';

export { Label };
