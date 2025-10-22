'use client';

import React, { useEffect, useState } from 'react';
import type { CurrencyCode } from '@/types/currency';
import { currencyService } from '@/lib/services/currency.service';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface CurrencyDisplayProps {
  amount: number;
  currency: CurrencyCode;
  displayCurrency?: CurrencyCode;
  showTooltip?: boolean;
  compact?: boolean;
  showCode?: boolean;
  className?: string;
}

/**
 * Component to display currency amounts with automatic conversion
 * Shows original currency in tooltip when converted
 */
export function CurrencyDisplay({
  amount,
  currency,
  displayCurrency,
  showTooltip = true,
  compact = false,
  showCode = false,
  className = '',
}: CurrencyDisplayProps) {
  const [displayText, setDisplayText] = useState<string>('');
  const [tooltipText, setTooltipText] = useState<string>('');
  const [isConverted, setIsConverted] = useState(false);

  useEffect(() => {
    async function formatAmount() {
      const targetCurrency = displayCurrency || currency;

      if (compact) {
        if (currency === targetCurrency) {
          setDisplayText(currencyService.formatCompact(amount, currency));
          setTooltipText('');
          setIsConverted(false);
        } else {
          const converted = await currencyService.convert(
            amount,
            currency,
            targetCurrency
          );
          if (converted !== null) {
            setDisplayText(currencyService.formatCompact(converted, targetCurrency));
            setTooltipText(`Original: ${currencyService.format(amount, currency)}`);
            setIsConverted(true);
          } else {
            setDisplayText(currencyService.formatCompact(amount, currency));
            setTooltipText('Conversion rate not available');
            setIsConverted(false);
          }
        }
      } else {
        const result = await currencyService.formatWithConversion(
          amount,
          currency,
          targetCurrency
        );
        setDisplayText(
          showCode
            ? currencyService.formatWithCode(
                result.converted ? (await currencyService.convert(amount, currency, targetCurrency) ?? amount) : amount,
                targetCurrency
              )
            : result.display
        );
        setTooltipText(result.tooltip);
        setIsConverted(result.converted);
      }
    }

    formatAmount();
  }, [amount, currency, displayCurrency, compact, showCode]);

  if (!showTooltip || !isConverted || !tooltipText) {
    return <span className={className}>{displayText}</span>;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={`${className} cursor-help border-b border-dashed border-gray-400`}>
            {displayText}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface CurrencyAmountProps {
  value: number;
  currency?: CurrencyCode;
  className?: string;
}

/**
 * Simple currency display without conversion
 */
export function CurrencyAmount({
  value,
  currency = 'USD',
  className = '',
}: CurrencyAmountProps) {
  const formatted = currencyService.format(value, currency);
  return <span className={className}>{formatted}</span>;
}

