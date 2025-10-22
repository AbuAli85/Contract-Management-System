'use client';

import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { CurrencyCode } from '@/types/currency';
import { getSupportedCurrencies, getCurrencyName, getCurrencySymbol } from '@/types/currency';

interface CurrencySelectorProps {
  value: CurrencyCode;
  onChange: (currency: CurrencyCode) => void;
  disabled?: boolean;
  className?: string;
  showSymbol?: boolean;
}

/**
 * Currency selector dropdown component
 */
export function CurrencySelector({
  value,
  onChange,
  disabled = false,
  className = '',
  showSymbol = true,
}: CurrencySelectorProps) {
  const currencies = getSupportedCurrencies();

  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as CurrencyCode)}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select currency" />
      </SelectTrigger>
      <SelectContent>
        {currencies.map((currency) => (
          <SelectItem key={currency} value={currency}>
            <div className="flex items-center gap-2">
              {showSymbol && (
                <span className="font-semibold text-gray-700">
                  {getCurrencySymbol(currency)}
                </span>
              )}
              <span className="font-medium">{currency}</span>
              <span className="text-gray-500">- {getCurrencyName(currency)}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

