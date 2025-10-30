/**
 * Utility functions for promoters data processing
 * 
 * Contains helper functions for date parsing, document health checks,
 * status calculations, and data transformations.
 */

import { differenceInDays, format, parseISO } from 'date-fns';

export interface DocumentHealth {
  status: 'valid' | 'expiring' | 'expired' | 'missing';
  daysRemaining: number | null;
  expiresOn: string | null;
  label: string;
}

export type OverallStatus = 'active' | 'needs_attention' | 'critical' | 'inactive';
export type DocumentStatus = 'valid' | 'expiring' | 'expired' | 'missing';

/**
 * Safely parse a date string
 */
export function parseDateSafe(value?: string | null): Date | null {
  if (!value) return null;
  
  try {
    const parsed = parseISO(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  } catch {
    return null;
  }
}

/**
 * Format a date for display
 */
export function formatDisplayDate(value?: string | null): string {
  const parsed = parseDateSafe(value);
  if (!parsed) return '—';
  
  try {
    return format(parsed, 'dd MMM yyyy');
  } catch {
    return '—';
  }
}

/**
 * Compute document health status based on expiry date and threshold
 */
export function computeDocumentHealth(
  value: string | null | undefined,
  threshold: number
): DocumentHealth {
  // Handle empty, null, or invalid values
  if (!value || value.trim() === '' || value === 'null' || value === 'undefined') {
    return {
      status: 'missing',
      daysRemaining: null,
      expiresOn: null,
      label: 'Not provided',
    };
  }

  const parsed = parseDateSafe(value);
  if (!parsed) {
    return {
      status: 'missing',
      daysRemaining: null,
      expiresOn: value,
      label: 'Invalid date',
    };
  }

  const days = differenceInDays(parsed, new Date());

  if (days < 0) {
    return {
      status: 'expired',
      daysRemaining: Math.abs(days),
      expiresOn: value,
      label: `Expired on ${formatDisplayDate(value)} (${Math.abs(days)} days ago)`,
    };
  }

  if (days <= threshold) {
    return {
      status: 'expiring',
      daysRemaining: days,
      expiresOn: value,
      label: `Expires in ${days} days`,
    };
  }

  return {
    status: 'valid',
    daysRemaining: days,
    expiresOn: value,
    label: `Valid until ${formatDisplayDate(value)}`,
  };
}

/**
 * Compute overall status based on promoter status and documents
 */
export function computeOverallStatus(
  status: string | null | undefined,
  idDoc: DocumentHealth,
  passportDoc: DocumentHealth
): OverallStatus {
  // Check if promoter is inactive based on status
  if (
    !status ||
    ['inactive', 'terminated', 'resigned', 'on_leave', 'suspended'].includes(status)
  ) {
    return 'inactive';
  }

  // Critical: Any document is expired
  if (idDoc.status === 'expired' || passportDoc.status === 'expired') {
    return 'critical';
  }

  // Needs attention: Missing documents or expiring soon
  if (
    idDoc.status === 'missing' ||
    passportDoc.status === 'missing' ||
    idDoc.status === 'expiring' ||
    passportDoc.status === 'expiring'
  ) {
    return 'needs_attention';
  }

  // All good
  return 'active';
}

/**
 * Get status badge variant based on overall status
 */
export function getStatusVariant(
  status: OverallStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants = {
    active: 'default' as const,
    needs_attention: 'secondary' as const,
    critical: 'destructive' as const,
    inactive: 'outline' as const,
  };

  return variants[status] || 'outline';
}

/**
 * Get document status badge variant
 */
export function getDocumentStatusVariant(
  status: DocumentStatus
): 'default' | 'secondary' | 'destructive' | 'outline' {
  const variants = {
    valid: 'default' as const,
    expiring: 'secondary' as const,
    expired: 'destructive' as const,
    missing: 'outline' as const,
  };

  return variants[status] || 'outline';
}

/**
 * Calculate days until expiry
 */
export function daysUntilExpiry(dateString: string | null | undefined): number | null {
  const date = parseDateSafe(dateString);
  if (!date) return null;

  return differenceInDays(date, new Date());
}

/**
 * Check if a date is expired
 */
export function isExpired(dateString: string | null | undefined): boolean {
  const days = daysUntilExpiry(dateString);
  return days !== null && days < 0;
}

/**
 * Check if a date is expiring soon (within threshold)
 */
export function isExpiringSoon(
  dateString: string | null | undefined,
  threshold: number
): boolean {
  const days = daysUntilExpiry(dateString);
  return days !== null && days >= 0 && days <= threshold;
}

/**
 * Get promoter display name (prefer English, fallback to Arabic)
 */
export function getPromoterDisplayName(
  nameEn?: string | null,
  nameAr?: string | null
): string {
  return nameEn || nameAr || 'Unnamed Promoter';
}

/**
 * Normalize status string for display
 */
export function normalizeStatus(status: string | null | undefined): string {
  if (!status) return 'Unknown';

  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Export promoters data to CSV
 */
export function exportToCSV(
  data: any[],
  filename: string = 'export.csv'
): void {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Build CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Escape commas and quotes
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    ),
  ].join('\n');

  // Create and trigger download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

