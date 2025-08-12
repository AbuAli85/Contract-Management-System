/**
 * Utility functions for formatting data
 * Enhanced with strict typing and comprehensive error handling
 */

// Type definitions for better type safety
export interface CurrencyFormatOptions {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export interface DateFormatOptions {
  locale?: string;
  dateStyle?: 'full' | 'long' | 'medium' | 'short';
  timeStyle?: 'full' | 'long' | 'medium' | 'short';
}

export interface DurationFormatOptions {
  includeWeeks?: boolean;
  includeMonths?: boolean;
  includeYears?: boolean;
  shortFormat?: boolean;
}

export interface FormatResult {
  value: string;
  error?: string;
  isValid: boolean;
}

// Constants for better maintainability
const DEFAULT_CURRENCY = 'USD';
const DEFAULT_LOCALE = 'en-US';
const DEFAULT_DATE_STYLE = 'medium';
const DEFAULT_TIME_STYLE = 'short';

/**
 * Formats currency with enhanced type safety and error handling
 */
export const formatCurrency = (
  amount?: number | null,
  options?: CurrencyFormatOptions
): FormatResult => {
  try {
    if (amount == null || isNaN(amount)) {
      return { value: 'N/A', isValid: false };
    }

    const {
      currency = DEFAULT_CURRENCY,
      locale = DEFAULT_LOCALE,
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
    } = options || {};

    const formatted = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);

    return { value: formatted, isValid: true };
  } catch (error) {
    return {
      value: 'N/A',
      error: `Currency formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isValid: false,
    };
  }
};

/**
 * Formats date with enhanced type safety and error handling
 */
export const formatDate = (
  dateString?: string | null,
  options?: DateFormatOptions
): FormatResult => {
  try {
    if (!dateString) {
      return { value: 'N/A', isValid: false };
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return {
        value: 'N/A',
        error: 'Invalid date string provided',
        isValid: false,
      };
    }

    const { locale = DEFAULT_LOCALE, dateStyle = DEFAULT_DATE_STYLE } =
      options || {};

    const formatted = date.toLocaleDateString(locale, { dateStyle });
    return { value: formatted, isValid: true };
  } catch (error) {
    return {
      value: 'N/A',
      error: `Date formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isValid: false,
    };
  }
};

/**
 * Formats date and time with enhanced type safety and error handling
 */
export const formatDateTime = (
  dateString?: string | null,
  options?: DateFormatOptions
): FormatResult => {
  try {
    if (!dateString) {
      return { value: 'N/A', isValid: false };
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
      return {
        value: 'N/A',
        error: 'Invalid date string provided',
        isValid: false,
      };
    }

    const {
      locale = DEFAULT_LOCALE,
      dateStyle = DEFAULT_DATE_STYLE,
      timeStyle = DEFAULT_TIME_STYLE,
    } = options || {};

    const formatted = date.toLocaleString(locale, { dateStyle, timeStyle });
    return { value: formatted, isValid: true };
  } catch (error) {
    return {
      value: 'N/A',
      error: `DateTime formatting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isValid: false,
    };
  }
};

/**
 * Calculates duration between two dates with enhanced type safety and error handling
 */
export const calculateDuration = (
  startDate?: string | null,
  endDate?: string | null,
  options?: DurationFormatOptions
): FormatResult => {
  try {
    if (!startDate || !endDate) {
      return { value: 'N/A', isValid: false };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return {
        value: 'N/A',
        error: 'Invalid date string provided',
        isValid: false,
      };
    }

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const {
      shortFormat = false,
      includeWeeks = true,
      includeMonths = true,
      includeYears = true,
    } = options || {};

    let result: string;

    if (diffDays < 7) {
      result = shortFormat
        ? `${diffDays}d`
        : `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffDays < 30 && includeWeeks) {
      const weeks = Math.floor(diffDays / 7);
      const remainingDays = diffDays % 7;
      if (shortFormat) {
        result =
          remainingDays > 0 ? `${weeks}w ${remainingDays}d` : `${weeks}w`;
      } else {
        result =
          remainingDays > 0
            ? `${weeks} week${weeks !== 1 ? 's' : ''}, ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`
            : `${weeks} week${weeks !== 1 ? 's' : ''}`;
      }
    } else if (diffDays < 365 && includeMonths) {
      const months = Math.round(diffDays / 30);
      if (shortFormat) {
        result = `${months}m`;
      } else {
        result = `${months} month${months !== 1 ? 's' : ''}`;
      }
    } else if (includeYears) {
      const years = Math.round(diffDays / 365);
      if (shortFormat) {
        result = `${years}y`;
      } else {
        result = `${years} year${years !== 1 ? 's' : ''}`;
      }
    } else {
      result = shortFormat
        ? `${diffDays}d`
        : `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    }

    return { value: result, isValid: true };
  } catch (error) {
    return {
      value: 'N/A',
      error: `Duration calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isValid: false,
    };
  }
};

/**
 * Copies text to clipboard with enhanced error handling and type safety
 */
export const copyToClipboard = async (text: string): Promise<FormatResult> => {
  try {
    // Validate input
    if (typeof text !== 'string' || text.trim().length === 0) {
      return {
        value: '',
        error: 'Invalid text provided for clipboard copy',
        isValid: false,
      };
    }

    // Only execute in browser environment
    if (typeof window === 'undefined') {
      return {
        value: '',
        error: 'Clipboard API not available in server environment',
        isValid: false,
      };
    }

    // Check if clipboard API is available
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return { value: 'Copied to clipboard', isValid: true };
    } else {
      // Fallback for environments where clipboard API is not available
      console.warn(
        'Copy to clipboard is not supported in this browser/environment'
      );
      return {
        value: '',
        error: 'Clipboard API not supported in this browser',
        isValid: false,
      };
    }
  } catch (error) {
    console.error('Failed to copy text: ', error);
    return {
      value: '',
      error: `Clipboard copy failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      isValid: false,
    };
  }
};

// Legacy functions for backward compatibility
export const formatCurrencyLegacy = (
  amount?: number,
  currency?: string | null
): string => {
  const result = formatCurrency(amount, { currency: currency || undefined });
  return result.value;
};

export const formatDateLegacy = (dateString?: string | null): string => {
  const result = formatDate(dateString);
  return result.value;
};

export const formatDateTimeLegacy = (dateString?: string | null): string => {
  const result = formatDateTime(dateString);
  return result.value;
};

export const calculateDurationLegacy = (
  startDate?: string | null,
  endDate?: string | null
): string => {
  const result = calculateDuration(startDate, endDate);
  return result.value;
};
