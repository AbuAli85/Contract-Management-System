// Notification day constants for different document types
// This file centralizes all notification day values used throughout the application

// Promoter document notification days
export const PROMOTER_NOTIFICATION_DAYS = {
  ID_EXPIRY: 100,        // Days before ID expiry to notify
  PASSPORT_EXPIRY: 210,  // Days before passport expiry to notify
} as const

// Company/Party document notification days (if different from promoters)
export const COMPANY_NOTIFICATION_DAYS = {
  CR_EXPIRY: 30,         // Days before CR expiry to notify (company documents)
  LICENSE_EXPIRY: 30,    // Days before license expiry to notify (company documents)
} as const

// Contract notification days
export const CONTRACT_NOTIFICATION_DAYS = {
  EXPIRY: 30,            // Days before contract expiry to notify
  RENEWAL: 60,           // Days before contract renewal to notify
} as const

// Default notification days for different document types
export const DEFAULT_NOTIFICATION_DAYS = {
  ...PROMOTER_NOTIFICATION_DAYS,
  ...COMPANY_NOTIFICATION_DAYS,
  ...CONTRACT_NOTIFICATION_DAYS,
} as const

// Helper function to get notification days for a specific document type
export function getNotificationDays(documentType: 'id' | 'passport' | 'cr' | 'license' | 'contract'): number {
  switch (documentType) {
    case 'id':
      return PROMOTER_NOTIFICATION_DAYS.ID_EXPIRY
    case 'passport':
      return PROMOTER_NOTIFICATION_DAYS.PASSPORT_EXPIRY
    case 'cr':
      return COMPANY_NOTIFICATION_DAYS.CR_EXPIRY
    case 'license':
      return COMPANY_NOTIFICATION_DAYS.LICENSE_EXPIRY
    case 'contract':
      return CONTRACT_NOTIFICATION_DAYS.EXPIRY
    default:
      return 30 // Fallback default
  }
} 