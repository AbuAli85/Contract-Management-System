"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { format, parse, isValid } from "date-fns"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DatePickerWithManualInputProps {
  date: Date | undefined
  setDate?: (date: Date | undefined) => void
  onDateChange?: (date: Date | undefined) => void
  dateFormat?: string
  placeholder?: string
  disabled?: boolean | ((date: Date) => boolean)
}

// Safe date formatting function
const safeFormat = (date: Date, formatString: string): string => {
  try {
    if (!date || !isValid(date)) return ""
    return format(date, formatString)
  } catch (error) {
    console.warn('Safe format failed:', error)
    return ""
  }
}

// Safe date parsing function
const safeParse = (value: string, formatString: string): Date | null => {
  try {
    if (!value || !value.trim()) return null
    
    const parsed = parse(value, formatString, new Date())
    
    // Additional validation to ensure we have a valid Date object
    if (!(parsed instanceof Date) || isNaN(parsed.getTime())) {
      console.warn('Invalid date parsed:', parsed)
      return null
    }
    
    return isValid(parsed) ? parsed : null
  } catch (error) {
    console.warn('Safe parse failed:', error)
    return null
  }
}

export function DatePickerWithManualInput({
  date,
  setDate,
  onDateChange,
  dateFormat = "dd-MM-yyyy",
  placeholder,
  disabled,
}: DatePickerWithManualInputProps) {
  const [inputValue, setInputValue] = useState<string>("")
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const mountedRef = useRef(true)
  const setDateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Determine which callback to use
  const dateChangeCallback = onDateChange || setDate

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (setDateTimeoutRef.current) {
        clearTimeout(setDateTimeoutRef.current)
      }
    }
  }, [])

  // Safe state update function with timeout to prevent blocking
  const safeSetDate = (newDate: Date | undefined) => {
    // Clear any existing timeout
    if (setDateTimeoutRef.current) {
      clearTimeout(setDateTimeoutRef.current)
    }

    // Use setTimeout to defer the call and prevent blocking
    setDateTimeoutRef.current = setTimeout(() => {
      try {
        // Check if component is still mounted
        if (!mountedRef.current) {
          console.warn('Component unmounted, skipping setDate call')
          return
        }

        // Additional validation before calling setDate
        if (newDate !== undefined && newDate !== null) {
          // Check if it's a valid Date object
          if (!(newDate instanceof Date) || isNaN(newDate.getTime())) {
            console.warn('Invalid date object provided to safeSetDate:', newDate)
            return
          }
        }
        
        // Call the appropriate callback function
        if (dateChangeCallback) {
          dateChangeCallback(newDate)
        }
      } catch (error) {
        console.error('Error setting date:', error)
        // Don't re-throw the error, just log it
      }
    }, 10) // Small delay to debounce rapid calls
  }

  // Safe input value update function
  const safeSetInputValue = (value: string) => {
    try {
      setInputValue(value || "")
    } catch (error) {
      console.error('Error setting input value:', error)
    }
  }

  useEffect(() => {
    try {
      const formattedDate = safeFormat(date, dateFormat)
      safeSetInputValue(formattedDate)
    } catch (error) {
      console.error('Error in useEffect:', error)
      safeSetInputValue("")
    }
  }, [date, dateFormat])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const value = e.target.value || ""
      safeSetInputValue(value)
      
      // Handle empty input
      if (!value.trim()) {
        safeSetDate(undefined)
        return
      }
      
      // Try to parse the date
      const parsedDate = safeParse(value, dateFormat)
      if (parsedDate && parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
        // Only update if the formatted result matches the input
        const formattedValue = safeFormat(parsedDate, dateFormat)
        if (formattedValue === value) {
          safeSetDate(parsedDate)
        }
      }
    } catch (error) {
      console.error('Error in handleInputChange:', error)
      // Just update the input value, don't change the date
      safeSetInputValue(e.target.value || "")
    }
  }

  const handleInputBlur = () => {
    try {
      // Handle empty input
      if (!inputValue || !inputValue.trim()) {
        safeSetDate(undefined)
        return
      }

      // Try to parse the date
      const parsedDate = safeParse(inputValue, dateFormat)
      
      if (parsedDate && parsedDate instanceof Date && !isNaN(parsedDate.getTime())) {
        // Format the date to ensure consistency
        const correctlyFormatted = safeFormat(parsedDate, dateFormat)
        safeSetInputValue(correctlyFormatted)
        safeSetDate(parsedDate)
      } else {
        // Invalid date input - revert to last valid date or clear
        if (date && isValid(date)) {
          const fallbackFormatted = safeFormat(date, dateFormat)
          safeSetInputValue(fallbackFormatted)
        } else {
          safeSetInputValue("")
          safeSetDate(undefined)
        }
      }
    } catch (error) {
      console.error('Error in handleInputBlur:', error)
      // Ultimate fallback: clear everything
      safeSetInputValue("")
      safeSetDate(undefined)
    }
  }

  const handleDateSelect = (selectedDate: Date | undefined) => {
    try {
      safeSetDate(selectedDate)
      
      if (selectedDate && isValid(selectedDate)) {
        const formattedDate = safeFormat(selectedDate, dateFormat)
        safeSetInputValue(formattedDate)
      } else {
        safeSetInputValue("")
      }
      
      setIsCalendarOpen(false)
      
      // Safe focus
      try {
        inputRef.current?.focus()
      } catch (focusError) {
        console.warn('Focus failed:', focusError)
      }
    } catch (error) {
      console.error('Error in handleDateSelect:', error)
      // Fallback: clear everything
      safeSetInputValue("")
      safeSetDate(undefined)
      setIsCalendarOpen(false)
    }
  }

  const isDateDisabled = typeof disabled === "function" ? disabled : () => !!disabled

  return (
    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
      <div className="flex items-center gap-x-2">
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder || dateFormat.toUpperCase()}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="w-full"
          disabled={typeof disabled === "boolean" ? disabled : false}
        />
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn("w-auto shrink-0 p-2", !date && "text-muted-foreground")}
            disabled={typeof disabled === "boolean" ? disabled : false}
            aria-label="Open calendar"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
      </div>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          disabled={isDateDisabled}
        />
      </PopoverContent>
    </Popover>
  )
}

export default DatePickerWithManualInput;
