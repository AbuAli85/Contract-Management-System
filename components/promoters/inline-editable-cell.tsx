'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Check, X, Edit2, Loader2 } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InlineEditableCellProps {
  value: string | null;
  fieldName: string;
  fieldLabel: string;
  onSave: (value: string) => Promise<void>;
  placeholder?: string;
  type?: 'text' | 'email' | 'tel';
  className?: string;
  displayClassName?: string;
  editable?: boolean;
  validator?: (value: string) => boolean | string;
}

/**
 * Inline Editable Cell Component
 * 
 * Allows quick editing of table cells with:
 * - Click to edit mode
 * - Save/Cancel actions
 * - Keyboard shortcuts (Enter=save, Esc=cancel)
 * - Loading state during save
 * - Validation feedback
 * - Optimistic updates
 */
export function InlineEditableCell({
  value,
  fieldName,
  fieldLabel,
  onSave,
  placeholder = '—',
  type = 'text',
  className = '',
  displayClassName = '',
  editable = true,
  validator,
}: InlineEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Reset edit value when value prop changes
  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleEdit = () => {
    if (!editable) return;
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditValue(value || '');
    setError(null);
  };

  const handleSave = async () => {
    // Validation
    if (validator) {
      const validationResult = validator(editValue);
      if (validationResult !== true) {
        setError(typeof validationResult === 'string' ? validationResult : 'Invalid value');
        return;
      }
    }

    // Don't save if value hasn't changed
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
      // Keep in edit mode on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  if (!editable) {
    return (
      <div className={cn('text-sm', displayClassName)}>
        {value || placeholder}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className={cn('flex items-center gap-1', className)}>
        <div className='flex-1 min-w-0'>
          <Input
            ref={inputRef}
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cn(
              'h-8 text-sm',
              error && 'border-red-500 focus-visible:ring-red-500'
            )}
            placeholder={placeholder}
            disabled={isSaving}
            aria-label={`Edit ${fieldLabel}`}
          />
          {error && (
            <p className='text-xs text-red-600 mt-1'>{error}</p>
          )}
        </div>
        <div className='flex items-center gap-1 flex-shrink-0'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-7 w-7 text-green-600 hover:bg-green-50 hover:text-green-700'
                  onClick={handleSave}
                  disabled={isSaving}
                  aria-label='Save changes'
                >
                  {isSaving ? (
                    <Loader2 className='h-3.5 w-3.5 animate-spin' />
                  ) : (
                    <Check className='h-3.5 w-3.5' />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Save (Enter)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  variant='ghost'
                  className='h-7 w-7 text-red-600 hover:bg-red-50 hover:text-red-700'
                  onClick={handleCancel}
                  disabled={isSaving}
                  aria-label='Cancel editing'
                >
                  <X className='h-3.5 w-3.5' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className='text-xs'>Cancel (Esc)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleEdit}
            className={cn(
              'group/edit flex items-center gap-2 text-sm text-left w-full rounded-md px-2 py-1 transition-all',
              'hover:bg-accent hover:shadow-sm cursor-pointer',
              displayClassName
            )}
            aria-label={`Edit ${fieldLabel}: ${value || placeholder}`}
          >
            <span className='flex-1 min-w-0 truncate'>
              {value || <span className='text-muted-foreground'>{placeholder}</span>}
            </span>
            <Edit2 className='h-3 w-3 text-muted-foreground opacity-0 group-hover/edit:opacity-100 transition-opacity flex-shrink-0' />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className='text-xs'>Click to edit {fieldLabel}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Validators for common field types
 */
export const validators = {
  email: (value: string) => {
    if (!value) return true; // Allow empty
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || 'Invalid email format';
  },
  
  phone: (value: string) => {
    if (!value) return true; // Allow empty
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(value) || 'Invalid phone format';
  },
  
  required: (value: string) => {
    return value.trim().length > 0 || 'This field is required';
  },
  
  minLength: (min: number) => (value: string) => {
    if (!value) return true; // Allow empty
    return value.length >= min || `Minimum ${min} characters required`;
  },
  
  maxLength: (max: number) => (value: string) => {
    return value.length <= max || `Maximum ${max} characters allowed`;
  },
};

