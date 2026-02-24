/**
 * Currency Service
 * Handles currency formatting, conversion, and exchange rate management
 */

import { createClient } from '@/lib/supabase/client';
import type {
  CurrencyCode,
  CurrencyDisplayOptions,
  ExchangeRate,
  ConversionResult,
} from '@/types/currency';
import { _CURRENCY_CONFIG, getCurrencyMetadata } from '@/types/currency';

class CurrencyService {
  private exchangeRatesCache: Map<string, ExchangeRate> = new Map();
  private cacheExpiry: number = 0;
  private readonly CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  /**
   * Format a currency amount with proper localization
   * @param amount - The amount to format
   * @param currency - The currency code
   * @param options - Display options
   * @returns Formatted currency string
   */
  format(
    amount: number,
    currency: CurrencyCode = 'USD',
    options: CurrencyDisplayOptions = {}
  ): string {
    const metadata = getCurrencyMetadata(currency);

    const {
      showSymbol = true,
      showCode = false,
      useGrouping = true,
      minimumFractionDigits = metadata.decimalPlaces,
      maximumFractionDigits = metadata.decimalPlaces,
    } = options;

    // Format the number
    const formattedNumber = new Intl.NumberFormat(metadata.locale, {
      minimumFractionDigits,
      maximumFractionDigits,
      useGrouping,
    }).format(amount);

    // Build the final string
    let result = '';

    if (showSymbol && metadata.symbolPosition === 'before') {
      result += `${metadata.symbol} `;
    }

    result += formattedNumber;

    if (showSymbol && metadata.symbolPosition === 'after') {
      result += ` ${metadata.symbol}`;
    }

    if (showCode) {
      result += ` ${currency}`;
    }

    return result.trim();
  }

  /**
   * Format with explicit currency code display
   * @param amount - The amount to format
   * @param currency - The currency code
   * @returns Formatted string with currency code
   */
  formatWithCode(amount: number, currency: CurrencyCode = 'USD'): string {
    return this.format(amount, currency, { showCode: true, showSymbol: false });
  }

  /**
   * Format amount in compact notation (e.g., 1.2K, 3.4M)
   * @param amount - The amount to format
   * @param currency - The currency code
   * @returns Compact formatted string
   */
  formatCompact(amount: number, currency: CurrencyCode = 'USD'): string {
    const metadata = getCurrencyMetadata(currency);
    const formatted = new Intl.NumberFormat(metadata.locale, {
      notation: 'compact',
      compactDisplay: 'short',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(amount);

    return `${metadata.symbol}${formatted}`;
  }

  /**
   * Get exchange rate between two currencies
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param date - Optional date for historical rates
   * @returns Exchange rate or null if not found
   */
  async getExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    date?: string
  ): Promise<number | null> {
    // If same currency, return 1
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    // Check cache first
    const cacheKey = `${fromCurrency}_${toCurrency}_${date || 'current'}`;
    const now = Date.now();

    if (this.cacheExpiry > now && this.exchangeRatesCache.has(cacheKey)) {
      const cached = this.exchangeRatesCache.get(cacheKey);
      return cached?.rate ?? null;
    }

    try {
      const supabase = createClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return null;
      }

      let query = supabase
        .from('exchange_rates')
        .select('*')
        .eq('from_currency', fromCurrency)
        .eq('to_currency', toCurrency)
        .eq('is_active', true)
        .order('effective_date', { ascending: false })
        .limit(1);

      if (date) {
        query = query.lte('effective_date', date);
      }

      const { data, error } = await query.single();

      if (error || !data) {
        console.error('Error fetching exchange rate:', error);
        return null;
      }

      // Cache the result
      this.exchangeRatesCache.set(cacheKey, data);
      this.cacheExpiry = now + this.CACHE_DURATION;

      return data.rate;
    } catch (error) {
      console.error('Error in getExchangeRate:', error);
      return null;
    }
  }

  /**
   * Convert amount from one currency to another
   * @param amount - The amount to convert
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param date - Optional date for historical conversion
   * @returns Converted amount or null if conversion fails
   */
  async convert(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    date?: string
  ): Promise<number | null> {
    // If same currency, return original amount
    if (fromCurrency === toCurrency) {
      return amount;
    }

    const rate = await this.getExchangeRate(fromCurrency, toCurrency, date);

    if (rate === null) {
      return null;
    }

    // Round to appropriate decimal places
    const targetMetadata = getCurrencyMetadata(toCurrency);
    const multiplier = Math.pow(10, targetMetadata.decimalPlaces);
    return Math.round(amount * rate * multiplier) / multiplier;
  }

  /**
   * Convert amount with detailed result including metadata
   * @param amount - The amount to convert
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param date - Optional date for historical conversion
   * @returns Conversion result with metadata
   */
  async convertWithDetails(
    amount: number,
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    date?: string
  ): Promise<ConversionResult | null> {
    const rate = await this.getExchangeRate(fromCurrency, toCurrency, date);

    if (rate === null) {
      return null;
    }

    const convertedAmount = await this.convert(
      amount,
      fromCurrency,
      toCurrency,
      date
    );

    if (convertedAmount === null) {
      return null;
    }

    const effectiveDate: string = date
      ? date
      : new Date().toISOString().split('T')[0] || '';

    return {
      originalAmount: amount,
      originalCurrency: fromCurrency,
      convertedAmount,
      convertedCurrency: toCurrency,
      rate,
      effectiveDate,
    };
  }

  /**
   * Get all exchange rates for a specific currency
   * @param baseCurrency - Base currency code
   * @returns Map of currency codes to exchange rates
   */
  async getAllRates(
    baseCurrency: CurrencyCode
  ): Promise<Map<CurrencyCode, number>> {
    const rates = new Map<CurrencyCode, number>();
    const currencies: CurrencyCode[] = [
      'USD',
      'OMR',
      'SAR',
      'AED',
      'EUR',
      'GBP',
    ];

    await Promise.all(
      currencies.map(async currency => {
        if (currency !== baseCurrency) {
          const rate = await this.getExchangeRate(baseCurrency, currency);
          if (rate !== null) {
            rates.set(currency, rate);
          }
        }
      })
    );

    return rates;
  }

  /**
   * Update exchange rate in the database
   * @param fromCurrency - Source currency
   * @param toCurrency - Target currency
   * @param rate - Exchange rate
   * @param source - Source of the rate (e.g., 'manual', 'api', 'central_bank')
   * @returns Success status
   */
  async updateExchangeRate(
    fromCurrency: CurrencyCode,
    toCurrency: CurrencyCode,
    rate: number,
    source: string = 'manual'
  ): Promise<boolean> {
    try {
      const supabase = createClient();
      if (!supabase) {
        console.error('Supabase client not available');
        return false;
      }
      const today = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('exchange_rates').upsert(
        {
          from_currency: fromCurrency,
          to_currency: toCurrency,
          rate,
          effective_date: today,
          source,
          is_active: true,
        },
        {
          onConflict: 'from_currency,to_currency,effective_date',
        }
      );

      if (error) {
        console.error('Error updating exchange rate:', error);
        return false;
      }

      // Clear cache
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error in updateExchangeRate:', error);
      return false;
    }
  }

  /**
   * Clear the exchange rates cache
   */
  clearCache(): void {
    this.exchangeRatesCache.clear();
    this.cacheExpiry = 0;
  }

  /**
   * Format amount with original currency in tooltip
   * @param amount - The amount to format
   * @param originalCurrency - Original currency
   * @param displayCurrency - Currency to display in
   * @returns Object with formatted text and tooltip
   */
  async formatWithConversion(
    amount: number,
    originalCurrency: CurrencyCode,
    displayCurrency: CurrencyCode
  ): Promise<{
    display: string;
    tooltip: string;
    converted: boolean;
  }> {
    if (originalCurrency === displayCurrency) {
      return {
        display: this.format(amount, originalCurrency),
        tooltip: '',
        converted: false,
      };
    }

    const convertedAmount = await this.convert(
      amount,
      originalCurrency,
      displayCurrency
    );

    if (convertedAmount === null) {
      // Fallback to original if conversion fails
      return {
        display: this.format(amount, originalCurrency),
        tooltip: 'Conversion rate not available',
        converted: false,
      };
    }

    return {
      display: this.format(convertedAmount, displayCurrency),
      tooltip: `Original: ${this.format(amount, originalCurrency)}`,
      converted: true,
    };
  }

  /**
   * Parse a currency string back to a number
   * @param currencyString - Formatted currency string
   * @param currency - Currency code to help with parsing
   * @returns Parsed number or null if parsing fails
   */
  parse(currencyString: string, currency: CurrencyCode = 'USD'): number | null {
    try {
      const metadata = getCurrencyMetadata(currency);

      // Remove currency symbol and code
      let cleaned = currencyString
        .replace(metadata.symbol, '')
        .replace(currency, '')
        .trim();

      // Remove thousand separators and replace decimal separator
      cleaned = cleaned
        .replace(new RegExp(`\\${metadata.thousandsSeparator}`, 'g'), '')
        .replace(metadata.decimalSeparator, '.');

      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : parsed;
    } catch (error) {
      console.error('Error parsing currency string:', error);
      return null;
    }
  }
}

// Export singleton instance
export const currencyService = new CurrencyService();

// Export class for testing
export default CurrencyService;
