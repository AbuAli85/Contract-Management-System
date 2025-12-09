'use client';

import React from 'react';
import type { CurrencyCode } from '@/types/currency';
import { getCurrencyName, getCurrencySymbol } from '@/types/currency';
import { Info } from 'lucide-react';

interface CurrencyIndicatorProps {
  currency: CurrencyCode;
  className?: string;
  showIcon?: boolean;
}

/**
 * Indicator banner to show which currency is being displayed
 * Displays message like "All amounts in USD" or "Showing amounts in Omani Rial"
 */
export function CurrencyIndicator({
  currency,
  className = '',
  showIcon = true,
}: CurrencyIndicatorProps) {
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-md bg-blue-50 px-3 py-1.5 text-sm text-blue-700 border border-blue-200 ${className}`}
    >
      {showIcon && <Info className='h-4 w-4' />}
      <span>
        All amounts in{' '}
        <strong>
          {getCurrencySymbol(currency)} {currency}
        </strong>{' '}
        ({getCurrencyName(currency)})
      </span>
    </div>
  );
}

interface CurrencyBadgeProps {
  currency: CurrencyCode;
  className?: string;
}

/**
 * Small badge to show currency code
 */
export function CurrencyBadge({
  currency,
  className = '',
}: CurrencyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-800 ${className}`}
    >
      {getCurrencySymbol(currency)} {currency}
    </span>
  );
}
