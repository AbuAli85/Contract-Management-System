/**
 * Currency Types and Interfaces
 * Provides type definitions for currency handling across the application
 */

// Supported currency codes
export type CurrencyCode = 'USD' | 'OMR' | 'SAR' | 'AED' | 'EUR' | 'GBP';

// Exchange rate record from database
export interface ExchangeRate {
  id: string;
  from_currency: CurrencyCode;
  to_currency: CurrencyCode;
  rate: number;
  effective_date: string;
  updated_at: string;
  created_at: string;
  source: string;
  is_active: boolean;
}

// Currency metadata for display purposes
export interface CurrencyMetadata {
  code: CurrencyCode;
  name: string;
  symbol: string;
  symbolPosition: 'before' | 'after';
  decimalPlaces: number;
  thousandsSeparator: string;
  decimalSeparator: string;
  locale: string;
}

// Currency display options
export interface CurrencyDisplayOptions {
  showSymbol?: boolean;
  showCode?: boolean;
  useGrouping?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

// Money type to ensure amounts are always paired with currency
export interface Money {
  amount: number;
  currency: CurrencyCode;
}

// Conversion result with metadata
export interface ConversionResult {
  originalAmount: number;
  originalCurrency: CurrencyCode;
  convertedAmount: number;
  convertedCurrency: CurrencyCode;
  rate: number;
  effectiveDate: string;
}

// Currency configuration map
export const CURRENCY_CONFIG: Record<CurrencyCode, CurrencyMetadata> = {
  USD: {
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'en-US',
  },
  OMR: {
    code: 'OMR',
    name: 'Omani Rial',
    symbol: 'ر.ع.',
    symbolPosition: 'before',
    decimalPlaces: 3,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'ar-OM',
  },
  SAR: {
    code: 'SAR',
    name: 'Saudi Riyal',
    symbol: 'ر.س',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'ar-SA',
  },
  AED: {
    code: 'AED',
    name: 'UAE Dirham',
    symbol: 'د.إ',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'ar-AE',
  },
  EUR: {
    code: 'EUR',
    name: 'Euro',
    symbol: '€',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'de-DE',
  },
  GBP: {
    code: 'GBP',
    name: 'British Pound',
    symbol: '£',
    symbolPosition: 'before',
    decimalPlaces: 2,
    thousandsSeparator: ',',
    decimalSeparator: '.',
    locale: 'en-GB',
  },
};

// Helper to check if a string is a valid currency code
export function isValidCurrencyCode(code: string): code is CurrencyCode {
  return ['USD', 'OMR', 'SAR', 'AED', 'EUR', 'GBP'].includes(code);
}

// Helper to get currency symbol
export function getCurrencySymbol(code: CurrencyCode): string {
  return CURRENCY_CONFIG[code].symbol;
}

// Helper to get currency name
export function getCurrencyName(code: CurrencyCode): string {
  return CURRENCY_CONFIG[code].name;
}

// Helper to get all supported currencies
export function getSupportedCurrencies(): CurrencyCode[] {
  return Object.keys(CURRENCY_CONFIG) as CurrencyCode[];
}

// Helper to get currency metadata
export function getCurrencyMetadata(code: CurrencyCode): CurrencyMetadata {
  return CURRENCY_CONFIG[code];
}

