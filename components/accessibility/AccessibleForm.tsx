'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export interface AccessibleFormFieldProps {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Accessible Form Field
 * 
 * Wraps form inputs with proper labels, error messages, and ARIA attributes
 * 
 * @example
 * ```tsx
 * <AccessibleFormField
 *   id="email"
 *   label="Email Address"
 *   required
 *   error={errors.email}
 *   hint="We'll never share your email"
 * >
 *   <Input type="email" {...register('email')} />
 * </AccessibleFormField>
 * ```
 */
export function AccessibleFormField({
  id,
  label,
  required = false,
  error,
  hint,
  children,
  className,
}: AccessibleFormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className={cn(error && 'text-red-600')}>
        {label}
        {required && (
          <span className="text-red-600 ms-1" aria-label="required">
            *
          </span>
        )}
      </Label>

      {hint && !error && (
        <p id={hintId} className="text-sm text-gray-500">
          {hint}
        </p>
      )}

      <div
        aria-describedby={cn(
          error && errorId,
          hint && !error && hintId
        )}
      >
        {React.cloneElement(children as React.ReactElement, {
          id,
          'aria-invalid': error ? "true" : "false",
          'aria-required': required ? "true" : "false",
          'aria-describedby': error ? errorId : hint ? hintId : undefined,
        })}
      </div>

      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600"
          role="alert"
          aria-live="polite"
        >
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Accessible Radio Group
 */
export function AccessibleRadioGroup({
  legend,
  required,
  error,
  children,
  className,
}: {
  legend: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <fieldset className={cn('space-y-3', className)}>
      <legend className={cn('text-sm font-medium', error && 'text-red-600')}>
        {legend}
        {required && (
          <span className="text-red-600 ms-1" aria-label="required">
            *
          </span>
        )}
      </legend>

      <div role="radiogroup" className="space-y-2">
        {children}
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
    </fieldset>
  );
}

/**
 * Accessible Checkbox with proper labeling
 */
export function AccessibleCheckbox({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  className,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label={label}
      />
      <Label
        htmlFor={id}
        className={cn('text-sm', disabled && 'opacity-50 cursor-not-allowed')}
      >
        {label}
      </Label>
    </div>
  );
}

