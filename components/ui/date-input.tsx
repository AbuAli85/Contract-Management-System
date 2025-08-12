'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import {
  convertDDMMYYYYToYYYYMMDD,
  convertYYYYMMDDToDDMMYYYY,
} from '@/lib/date-utils';

interface DateInputProps {
  id?: string;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function DateInput({
  id,
  label,
  value,
  onChange,
  placeholder = 'DD/MM/YYYY',
  required = false,
  disabled = false,
  className,
}: DateInputProps) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [inputValue, setInputValue] = useState('');

  // Convert ISO date to DD/MM/YYYY format
  const formatDateForDisplay = (dateString: string): string => {
    if (!dateString) return '';
    return convertYYYYMMDDToDDMMYYYY(dateString);
  };

  // Convert DD/MM/YYYY to ISO date
  const parseDateFromDisplay = (dateString: string): string => {
    if (!dateString) return '';
    return convertDDMMYYYYToYYYYMMDD(dateString);
  };

  // Initialize date and input value
  useEffect(() => {
    if (value) {
      const dateObj = new Date(value);
      if (!isNaN(dateObj.getTime())) {
        setDate(dateObj);
        setInputValue(formatDateForDisplay(value));
      }
    } else {
      setDate(undefined);
      setInputValue('');
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;
    setInputValue(inputVal);

    // Allow partial input (e.g., "25/12" while typing)
    if (inputVal.length === 10) {
      const isoDate = parseDateFromDisplay(inputVal);
      if (isoDate) {
        onChange(isoDate);
      }
    }
  };

  const handleCalendarSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    if (selectedDate) {
      const isoDate = selectedDate.toISOString().split('T')[0];
      onChange(isoDate);
      setInputValue(formatDateForDisplay(isoDate));
    }
  };

  const handleInputBlur = () => {
    if (inputValue) {
      const isoDate = parseDateFromDisplay(inputValue);
      if (isoDate) {
        onChange(isoDate);
        setInputValue(formatDateForDisplay(isoDate));
      } else {
        // Invalid date, revert to original
        setInputValue(formatDateForDisplay(value));
      }
    }
  };

  return (
    <div className='space-y-2'>
      {label && (
        <Label htmlFor={id} className='text-sm font-medium'>
          {label}
        </Label>
      )}
      <div className='flex gap-2'>
        <Input
          id={id}
          type='text'
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={cn('flex-1', className)}
        />
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn('w-[40px] p-0', !date && 'text-muted-foreground')}
              disabled={disabled}
            >
              <Calendar className='h-4 w-4' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='end'>
            <CalendarComponent
              mode='single'
              selected={date}
              onSelect={handleCalendarSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
