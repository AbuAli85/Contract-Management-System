import React from 'react';
import type { FieldError } from 'react-hook-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldWithValidationProps {
  label: string;
  name: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: FieldError | undefined;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  isValid?: boolean;
  className?: string;
}

export function SelectFieldWithValidation({
  label,
  name,
  placeholder = 'Select an option',
  disabled = false,
  required = false,
  error,
  value,
  onChange,
  options,
  isValid = false,
  className,
}: SelectFieldWithValidationProps) {
  const hasValue = value !== '' && value !== null && value !== undefined;
  const showSuccess = hasValue && !error && isValid;

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={name} className='flex items-center gap-1'>
        {label}
        {required && <span className='text-red-500'>*</span>}
      </Label>
      <div className='relative'>
        <Select value={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger
            id={name}
            className={cn(
              'pr-10',
              error && 'border-red-500 focus:ring-red-500',
              showSuccess && 'border-green-500 focus:ring-green-500'
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${name}-error` : undefined}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* Validation icon */}
        <div className='absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none'>
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
