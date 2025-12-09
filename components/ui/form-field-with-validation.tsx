import React from 'react';
import type { FieldError } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldWithValidationProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: FieldError | undefined;
  value: string | number;
  onChange: (value: any) => void;
  onBlur?: () => void;
  isValid?: boolean;
  className?: string;
}

export function FormFieldWithValidation({
  label,
  name,
  type = 'text',
  placeholder,
  disabled = false,
  required = false,
  error,
  value,
  onChange,
  onBlur,
  isValid = false,
  className,
}: FormFieldWithValidationProps) {
  const hasValue =
    value !== '' && value !== 0 && value !== null && value !== undefined;
  const showSuccess = hasValue && !error && isValid;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className='flex items-center gap-1'>
        {label}
        {required && <span className='text-red-500'>*</span>}
      </Label>
      <div className='relative'>
        <Input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={e =>
            onChange(
              type === 'number'
                ? parseFloat(e.target.value) || 0
                : e.target.value
            )
          }
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            'pr-10',
            error && 'border-red-500 focus-visible:ring-red-500',
            showSuccess && 'border-green-500 focus-visible:ring-green-500'
          )}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${name}-error` : undefined}
        />
        {/* Validation icon */}
        <div className='absolute right-3 top-1/2 -translate-y-1/2'>
          {error && (
            <AlertCircle className='h-4 w-4 text-red-500' aria-hidden='true' />
          )}
          {showSuccess && (
            <CheckCircle2
              className='h-4 w-4 text-green-500'
              aria-hidden='true'
            />
          )}
        </div>
      </div>
      {/* Error message */}
      {error && (
        <p
          id={`${name}-error`}
          className='text-sm text-red-500 flex items-center gap-1'
        >
          <AlertCircle className='h-3 w-3' aria-hidden='true' />
          {error.message}
        </p>
      )}
    </div>
  );
}
