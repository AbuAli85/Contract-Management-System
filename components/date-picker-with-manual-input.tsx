'use client';

import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { format, parse, isValid } from 'date-fns';
import { CalendarIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface DatePickerWithManualInputProps {
  date: Date | undefined;
  setDate?: (date: Date | undefined) => void;
  onDateChange?: (date: Date | undefined) => void;
  dateFormat?: string;
  placeholder?: string;
  disabled?: boolean | ((date: Date) => boolean);
}

// Safe date formatting function
const safeFormat = (date: Date | undefined, formatString: string): string => {
  try {
    if (!date || !isValid(date)) return '';
    return format(date, formatString);
  } catch (error) {
    return '';
  }
};

// Safe date parsing function that accepts multiple common formats
const safeParse = (value: string, preferredFormat: string): Date | null => {
  try {
    if (!value || !value.trim()) return null;

    const trimmed = value.trim();
    const candidates = [
      preferredFormat,
      'dd/MM/yyyy',
      'yyyy-MM-dd',
      'd-M-yyyy',
      'd/M/yyyy',
      'dd.MM.yyyy',
      'MM/dd/yyyy', // Moved to end to deprioritize
    ];

    for (const fmt of candidates) {
      try {
        const parsed = parse(trimmed, fmt, new Date());
        if (
          parsed instanceof Date &&
          !isNaN(parsed.getTime()) &&
          isValid(parsed)
        ) {
          return parsed;
        }
      } catch {
        // try next format
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

export function DatePickerWithManualInput({
  date,
  setDate,
  onDateChange,
  dateFormat = 'dd-MM-yyyy',
  placeholder,
  disabled,
}: DatePickerWithManualInputProps) {
  const [inputValue, setInputValue] = useState<string>('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const mountedRef = useRef(true);
  const setDateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Determine which callback to use
  const dateChangeCallback = onDateChange || setDate;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (setDateTimeoutRef.current) {
        clearTimeout(setDateTimeoutRef.current);
      }
    };
  }, []);

  // Safe state update function with timeout to prevent blocking
  const safeSetDate = (newDate: Date | undefined) => {
    // Clear any existing timeout
    if (setDateTimeoutRef.current) {
      clearTimeout(setDateTimeoutRef.current);
    }

    // Use setTimeout to defer the call and prevent blocking
    setDateTimeoutRef.current = setTimeout(() => {
      try {
        // Check if component is still mounted
        if (!mountedRef.current) {
          return;
        }

        // Additional validation before calling setDate
        if (newDate !== undefined && newDate !== null) {
          // Check if it's a valid Date object
          if (!(newDate instanceof Date) || isNaN(newDate.getTime())) {
            return;
          }
        }

        // Call the appropriate callback function
        if (dateChangeCallback) {
          dateChangeCallback(newDate);
        }
      } catch (error) {
        // Don't re-throw the error, just log it
      }
    }, 10); // Small delay to debounce rapid calls
  };

  // Safe input value update function
  const safeSetInputValue = (value: string) => {
    try {
      setInputValue(value || '');
    } catch (error) {
    }
  };

  useEffect(() => {
    try {
      const formattedDate = safeFormat(date, dateFormat);
      safeSetInputValue(formattedDate);
    } catch (error) {
      safeSetInputValue('');
    }
  }, [date, dateFormat]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || '';
      safeSetInputValue(value);

      // Handle empty input
      if (!value.trim()) {
        safeSetDate(undefined);
        return;
      }

      // Only attempt to parse/normalize when a full date is typed
      const isComplete = (() => {
        const v = value.trim();
        const patterns = [
          /^\d{2}-\d{2}-\d{4}$/, // dd-MM-yyyy
          /^\d{2}\/\d{2}\/\d{4}$/, // dd/MM/yyyy
          /^\d{4}-\d{2}-\d{2}$/, // yyyy-MM-dd
          /^\d{2}\.\d{2}\.\d{4}$/, // dd.MM.yyyy
          /^\d{2}\/\d{2}\/\d{4}$/, // MM/dd/yyyy (same shape as dd/MM/yyyy)
        ];
        return patterns.some(p => p.test(v));
      })();

      if (!isComplete) {
        // Defer parsing until full date is present to avoid years like 0002
        return;
      }

      // Additional validation: reject years that are clearly invalid
      if (value.includes('000')) {
        return; // Don't parse dates with "000" years
      }

      const parsedDate = safeParse(value, dateFormat);
      if (
        parsedDate &&
        parsedDate instanceof Date &&
        !isNaN(parsedDate.getTime())
      ) {
        const normalized = safeFormat(parsedDate, dateFormat);
        safeSetInputValue(normalized);
        safeSetDate(parsedDate);
      }
    } catch (error) {
      // Just update the input value, don't change the date
      safeSetInputValue(e.target.value || '');
    }
  };

  const handleInputBlur = () => {
    try {
      // Handle empty input
      if (!inputValue || !inputValue.trim()) {
        safeSetDate(undefined);
        return;
      }

      // Try to parse the date
      const parsedDate = safeParse(inputValue, dateFormat);

      if (
        parsedDate &&
        parsedDate instanceof Date &&
        !isNaN(parsedDate.getTime())
      ) {
        // Format the date to ensure consistency
        const correctlyFormatted = safeFormat(parsedDate, dateFormat);
        safeSetInputValue(correctlyFormatted);
        safeSetDate(parsedDate);
      } else {
        // Invalid date input - revert to last valid date or clear
        if (date && isValid(date)) {
          const fallbackFormatted = safeFormat(date, dateFormat);
          safeSetInputValue(fallbackFormatted);
        } else {
          safeSetInputValue('');
          safeSetDate(undefined);
        }
      }
    } catch (error) {
      // Ultimate fallback: clear everything
      safeSetInputValue('');
      safeSetDate(undefined);
    }
  };

  const handleDateSelect = (selectedDate: Date | undefined) => {
    try {
      safeSetDate(selectedDate);

      if (selectedDate && isValid(selectedDate)) {
        const formattedDate = safeFormat(selectedDate, dateFormat);
        safeSetInputValue(formattedDate);
      } else {
        safeSetInputValue('');
      }

      setIsCalendarOpen(false);

      // Safe focus
      try {
        inputRef.current?.focus();
      } catch (focusError) {
      }
    } catch (error) {
      // Fallback: clear everything
      safeSetInputValue('');
      safeSetDate(undefined);
      setIsCalendarOpen(false);
    }
  };

  const isDateDisabled =
    typeof disabled === 'function' ? disabled : () => !!disabled;

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <div className='flex items-center gap-x-2'>
        <Input
          ref={inputRef}
          type='text'
          placeholder={placeholder || dateFormat.toUpperCase()}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className='w-full'
          inputMode='numeric'
          maxLength={10}
          disabled={typeof disabled === 'boolean' ? disabled : false}
        />
        <PopoverTrigger asChild>
          <Button
            variant={'outline'}
            className={cn(
              'w-auto shrink-0 p-2',
              !date && 'text-muted-foreground'
            )}
            disabled={typeof disabled === 'boolean' ? disabled : false}
            aria-label='Open calendar'
          >
            <CalendarIcon className='h-4 w-4' />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          disabled={isDateDisabled}
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePickerWithManualInput;
