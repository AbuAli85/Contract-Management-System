/**
 * Document Compliance Monitoring System - Types and Utilities
 * Shared types and utility functions for client and server
 */

export interface DocumentAlert {
  promoterId: string;
  promoterName: string;
  promoterEmail: string | null;
  documentType: 'id_card' | 'passport';
  expiryDate: string;
  daysUntilExpiry: number;
  severity: 'critical' | 'urgent' | 'warning';
  status: 'expired' | 'expiring_7days' | 'expiring_30days';
}

export interface ComplianceReport {
  timestamp: string;
  summary: {
    total: number;
    compliant: number;
    expired: number;
    expiring7days: number;
    expiring30days: number;
    complianceRate: number;
  };
  alerts: {
    critical: DocumentAlert[]; // Expired
    urgent: DocumentAlert[]; // Expiring within 7 days
    warning: DocumentAlert[]; // Expiring within 30 days
  };
  byDocumentType: {
    idCards: {
      expired: number;
      expiring: number;
      valid: number;
    };
    passports: {
      expired: number;
      expiring: number;
      valid: number;
    };
  };
}

/**
 * Format document type for display
 */
export function formatDocumentType(type: 'id_card' | 'passport'): string {
  return type === 'id_card' ? 'ID Card' : 'Passport';
}

/**
 * Get severity color for UI
 */
export function getSeverityColor(
  severity: 'critical' | 'urgent' | 'warning'
): string {
  switch (severity) {
    case 'critical':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'urgent':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  }
}
