/**
 * Date Utilities Tests
 *
 * Tests for date formatting, parsing, and document expiry
 * notification calculations used throughout the system.
 */

// Date utility functions
function formatDate(date: string | Date | null | undefined, locale: 'en' | 'ar' = 'en'): string {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return null;
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function isDateInPast(date: string | null): boolean {
  if (!date) return false;
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  return d < new Date();
}

function isDateInFuture(date: string | null): boolean {
  if (!date) return false;
  const d = new Date(date);
  if (isNaN(d.getTime())) return false;
  return d > new Date();
}

function addDaysToDate(date: string, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function getNotificationStatus(
  expiryDate: string | null,
  warningDays: number = 30,
  criticalDays: number = 7
): 'valid' | 'warning' | 'critical' | 'expired' | 'unknown' {
  if (!expiryDate) return 'unknown';
  const days = getDaysUntilExpiry(expiryDate);
  if (days === null) return 'unknown';
  if (days < 0) return 'expired';
  if (days <= criticalDays) return 'critical';
  if (days <= warningDays) return 'warning';
  return 'valid';
}

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format valid dates', () => {
      const result = formatDate('2024-06-15');
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });

    it('should return empty string for null', () => {
      expect(formatDate(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDate('not-a-date')).toBe('');
    });

    it('should handle Date objects', () => {
      const date = new Date('2024-06-15');
      const result = formatDate(date);
      expect(result).toBeTruthy();
    });
  });

  describe('getDaysUntilExpiry', () => {
    it('should return negative days for past dates', () => {
      const days = getDaysUntilExpiry('2020-01-01');
      expect(days).not.toBeNull();
      expect(days!).toBeLessThan(0);
    });

    it('should return positive days for future dates', () => {
      const futureDate = addDaysToDate(new Date().toISOString().split('T')[0], 30);
      const days = getDaysUntilExpiry(futureDate);
      expect(days).not.toBeNull();
      expect(days!).toBeGreaterThan(0);
    });

    it('should return null for null input', () => {
      expect(getDaysUntilExpiry(null)).toBeNull();
    });

    it('should return null for invalid date', () => {
      expect(getDaysUntilExpiry('invalid')).toBeNull();
    });

    it('should return approximately correct days', () => {
      const futureDate = addDaysToDate(new Date().toISOString().split('T')[0], 30);
      const days = getDaysUntilExpiry(futureDate);
      expect(days).toBeGreaterThanOrEqual(29);
      expect(days).toBeLessThanOrEqual(31);
    });
  });

  describe('isDateInPast', () => {
    it('should return true for past dates', () => {
      expect(isDateInPast('2020-01-01')).toBe(true);
      expect(isDateInPast('2019-12-31')).toBe(true);
    });

    it('should return false for future dates', () => {
      const futureDate = addDaysToDate(new Date().toISOString().split('T')[0], 365);
      expect(isDateInPast(futureDate)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isDateInPast(null)).toBe(false);
    });
  });

  describe('isDateInFuture', () => {
    it('should return true for future dates', () => {
      const futureDate = addDaysToDate(new Date().toISOString().split('T')[0], 365);
      expect(isDateInFuture(futureDate)).toBe(true);
    });

    it('should return false for past dates', () => {
      expect(isDateInFuture('2020-01-01')).toBe(false);
    });

    it('should return false for null', () => {
      expect(isDateInFuture(null)).toBe(false);
    });
  });

  describe('addDaysToDate', () => {
    it('should add days correctly', () => {
      const result = addDaysToDate('2024-01-01', 30);
      expect(result).toBe('2024-01-31');
    });

    it('should handle month boundaries', () => {
      const result = addDaysToDate('2024-01-31', 1);
      expect(result).toBe('2024-02-01');
    });

    it('should handle year boundaries', () => {
      const result = addDaysToDate('2024-12-31', 1);
      expect(result).toBe('2025-01-01');
    });

    it('should handle negative days (subtract)', () => {
      const result = addDaysToDate('2024-02-01', -1);
      expect(result).toBe('2024-01-31');
    });
  });

  describe('getNotificationStatus', () => {
    it('should return expired for past dates', () => {
      expect(getNotificationStatus('2020-01-01')).toBe('expired');
    });

    it('should return critical for dates within 7 days', () => {
      const criticalDate = addDaysToDate(new Date().toISOString().split('T')[0], 5);
      expect(getNotificationStatus(criticalDate)).toBe('critical');
    });

    it('should return warning for dates within 30 days', () => {
      const warningDate = addDaysToDate(new Date().toISOString().split('T')[0], 20);
      expect(getNotificationStatus(warningDate)).toBe('warning');
    });

    it('should return valid for dates beyond 30 days', () => {
      const validDate = addDaysToDate(new Date().toISOString().split('T')[0], 60);
      expect(getNotificationStatus(validDate)).toBe('valid');
    });

    it('should return unknown for null', () => {
      expect(getNotificationStatus(null)).toBe('unknown');
    });

    it('should use custom thresholds', () => {
      const date15Days = addDaysToDate(new Date().toISOString().split('T')[0], 15);
      // With default thresholds (30 warning, 7 critical), 15 days = warning
      expect(getNotificationStatus(date15Days, 30, 7)).toBe('warning');
      // With custom thresholds (10 warning, 5 critical), 15 days = valid
      expect(getNotificationStatus(date15Days, 10, 5)).toBe('valid');
    });
  });
});
