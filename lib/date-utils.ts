/**
 * Date utility functions for consistent date formatting across the application
 */

/**
 * Format date for display in DD/MM/YYYY format
 */
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Format date for HTML date input (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  return date.toISOString().split('T')[0];
};

/**
 * Format date for database storage (ISO string)
 */
export const formatDateForDatabase = (dateString: string): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  return date.toISOString();
};

/**
 * Parse date from DD/MM/YYYY format
 */
export const parseDateFromDDMMYYYY = (dateString: string): Date | null => {
  if (!dateString) return null;

  // Handle DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);

    // Create date in local timezone to avoid timezone shifts
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }

  // Fallback to standard date parsing
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Validate date string
 */
export const isValidDate = (dateString: string): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Get current date in DD/MM/YYYY format
 */
export const getCurrentDateDDMMYYYY = (): string => {
  return new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Get date difference in days
 */
export const getDaysDifference = (date1: string, date2: string): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Check if date is expired
 */
export const isDateExpired = (dateString: string): boolean => {
  if (!dateString) return false;
  const expiryDate = new Date(dateString);
  const currentDate = new Date();
  return expiryDate < currentDate;
};

/**
 * Convert DD/MM/YYYY to YYYY-MM-DD format without timezone issues
 */
export const convertDDMMYYYYToYYYYMMDD = (dateString: string): string => {
  if (!dateString) return '';

  // Handle DD/MM/YYYY format
  const parts = dateString.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
      return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    }
  }

  return dateString;
};

/**
 * Convert YYYY-MM-DD to DD/MM/YYYY format
 */
export const convertYYYYMMDDToDDMMYYYY = (dateString: string): string => {
  if (!dateString) return '';

  // Handle YYYY-MM-DD format
  const parts = dateString.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);

    if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
      return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
    }
  }

  return dateString;
};

/**
 * Get days until expiry
 */
export const getDaysUntilExpiry = (dateString: string): number => {
  if (!dateString) return -1;
  const expiryDate = new Date(dateString);
  const currentDate = new Date();
  const diffTime = expiryDate.getTime() - currentDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};
