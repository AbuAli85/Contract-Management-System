/**
 * Enhanced Utility Functions for Critical Path Optimization
 * Part of Critical Path Optimization Guide implementation
 */

// Currency formatting with caching
const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(
  amount: number,
  currency: string = 'SAR'
): string {
  if (!currencyFormatters.has(currency)) {
    currencyFormatters.set(
      currency,
      new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  }

  const formatter = currencyFormatters.get(currency)!;
  return formatter.format(amount);
}

// Date formatting with caching
const dateFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatDate(
  dateInput: string | Date,
  format: 'short' | 'medium' | 'long' = 'medium'
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }

  const formatKey = `${format}-${Intl.DateTimeFormat().resolvedOptions().locale}`;

  if (!dateFormatters.has(formatKey)) {
    let options: Intl.DateTimeFormatOptions;

    switch (format) {
      case 'short':
        options = { month: 'short', day: 'numeric', year: 'numeric' };
        break;
      case 'long':
        options = {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        };
        break;
      case 'medium':
      default:
        options = { year: 'numeric', month: 'short', day: 'numeric' };
        break;
    }

    dateFormatters.set(formatKey, new Intl.DateTimeFormat('en-US', options));
  }

  const formatter = dateFormatters.get(formatKey)!;
  return formatter.format(date);
}

// Time formatting
export function formatTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;

  if (isNaN(date.getTime())) {
    return 'Invalid Time';
  }

  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// Relative time formatting (e.g., "2 hours ago")
export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2628000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count !== 0) {
      return rtf.format(-count, interval.label as Intl.RelativeTimeFormatUnit);
    }
  }

  return 'Just now';
}

// Number formatting
export function formatNumber(
  num: number,
  options: {
    style?: 'decimal' | 'percent';
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    style = 'decimal',
    minimumFractionDigits = 0,
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat('en-US', {
    style,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);
}

// File size formatting
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// Duration formatting
export function formatDuration(
  startDate: string | Date,
  endDate: string | Date
): string {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  const diffInMs = end.getTime() - start.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays < 1) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''}`;
  }

  if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays !== 1 ? 's' : ''}`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''}`;
  }

  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''}`;
}

// Contract status formatting
export function formatContractStatus(status: string): {
  label: string;
  variant: 'default' | 'secondary' | 'outline' | 'destructive';
  color: string;
} {
  const statusMap: Record<
    string,
    { label: string; variant: any; color: string }
  > = {
    draft: { label: 'Draft', variant: 'secondary', color: 'gray' },
    pending_approval: {
      label: 'Pending Approval',
      variant: 'secondary',
      color: 'yellow',
    },
    approved: { label: 'Approved', variant: 'outline', color: 'blue' },
    active: { label: 'Active', variant: 'default', color: 'green' },
    completed: { label: 'Completed', variant: 'outline', color: 'purple' },
    cancelled: { label: 'Cancelled', variant: 'destructive', color: 'red' },
    expired: { label: 'Expired', variant: 'destructive', color: 'orange' },
  };

  return (
    statusMap[status] || { label: status, variant: 'secondary', color: 'gray' }
  );
}

// Text truncation with ellipsis
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

// Debounce function for search optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

// Throttle function for scroll optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      func(...args);
    }
  };
}

// Performance monitoring
export function measurePerformance<T>(operation: () => T, label: string): T {
  const start = performance.now();
  const result = operation();
  const end = performance.now();

  console.log(`⚡ ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// Async performance monitoring
export async function measureAsyncPerformance<T>(
  operation: () => Promise<T>,
  label: string
): Promise<T> {
  const start = performance.now();
  const result = await operation();
  const end = performance.now();

  console.log(`⚡ ${label}: ${(end - start).toFixed(2)}ms`);
  return result;
}

// Local storage with compression (for large data)
export function setCompressedStorage(key: string, data: any): boolean {
  try {
    const jsonString = JSON.stringify(data);
    localStorage.setItem(key, jsonString);
    return true;
  } catch (error) {
    console.warn(`Failed to store ${key}:`, error);
    return false;
  }
}

export function getCompressedStorage<T>(key: string): T | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    return JSON.parse(stored) as T;
  } catch (error) {
    console.warn(`Failed to retrieve ${key}:`, error);
    return null;
  }
}

// Clipboard operations with fallback
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// URL utilities
export function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v.toString()));
      } else {
        searchParams.set(key, value.toString());
      }
    }
  });

  return searchParams.toString();
}

// Error handling utility
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return 'An unknown error occurred';
}

// Generic class name utility (enhanced version of existing cn function)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
