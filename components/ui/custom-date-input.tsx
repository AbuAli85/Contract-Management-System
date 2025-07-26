"use client"

import React, { useState, useEffect } from 'react'
import { Input } from './input'
import { Calendar } from 'lucide-react'
import { format, parse, isValid } from 'date-fns'

interface CustomDateInputProps {
  value?: Date | null
  onChange: (date: Date | null) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  label?: string
}

export function CustomDateInput({
  value,
  onChange,
  placeholder = "dd/mm/yyyy",
  disabled = false,
  className = "",
  label
}: CustomDateInputProps) {
  const [displayValue, setDisplayValue] = useState("")
  const [isValidDate, setIsValidDate] = useState(true)

  // Update display value when value prop changes
  useEffect(() => {
    if (value && isValid(value)) {
      setDisplayValue(format(value, 'dd/MM/yyyy'))
      setIsValidDate(true)
    } else {
      setDisplayValue("")
      setIsValidDate(true)
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    setDisplayValue(inputValue)

    // Allow empty input
    if (!inputValue.trim()) {
      onChange(null)
      setIsValidDate(true)
      return
    }

    // Parse dd/mm/yyyy format
    const parsedDate = parse(inputValue, 'dd/MM/yyyy', new Date())
    
    if (isValid(parsedDate)) {
      onChange(parsedDate)
      setIsValidDate(true)
    } else {
      // Try parsing with different separators
      const altParsedDate = parse(inputValue.replace(/[\/\-]/g, '/'), 'dd/MM/yyyy', new Date())
      if (isValid(altParsedDate)) {
        onChange(altParsedDate)
        setIsValidDate(true)
        setDisplayValue(format(altParsedDate, 'dd/MM/yyyy'))
      } else {
        setIsValidDate(false)
        onChange(null)
      }
    }
  }

  const handleBlur = () => {
    if (displayValue && !isValidDate) {
      setDisplayValue("")
      setIsValidDate(true)
    }
  }

  return (
    <div className="relative">
      <Input
        type="text"
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
        className={`${className} ${!isValidDate ? 'border-red-500 focus:border-red-500' : ''}`}
      />
      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
      {!isValidDate && (
        <p className="text-xs text-red-500 mt-1">Please enter a valid date in dd/mm/yyyy format</p>
      )}
    </div>
  )
} 