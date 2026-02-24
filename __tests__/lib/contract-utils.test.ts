/**
 * Contract Utilities Tests
 *
 * Tests for contract status management, date calculations,
 * contract number generation, and contract validation.
 */

// Contract status types
type ContractStatus = 'draft' | 'pending' | 'active' | 'completed' | 'cancelled' | 'expired';

// Utility functions to test
function getContractStatusLabel(status: ContractStatus, locale: 'en' | 'ar' = 'en'): string {
  const labels: Record<ContractStatus, { en: string; ar: string }> = {
    draft: { en: 'Draft', ar: 'مسودة' },
    pending: { en: 'Pending', ar: 'قيد الانتظار' },
    active: { en: 'Active', ar: 'نشط' },
    completed: { en: 'Completed', ar: 'مكتمل' },
    cancelled: { en: 'Cancelled', ar: 'ملغي' },
    expired: { en: 'Expired', ar: 'منتهي الصلاحية' },
  };
  return labels[status]?.[locale] || status;
}

function isContractExpired(endDate: string | null): boolean {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
}

function isContractActive(status: ContractStatus, startDate: string, endDate: string): boolean {
  if (status !== 'active') return false;
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);
  return now >= start && now <= end;
}

function calculateContractDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function generateContractNumber(prefix: string, sequence: number): string {
  return `${prefix}-${String(sequence).padStart(6, '0')}`;
}

function validateContractDates(startDate: string, endDate: string): { valid: boolean; error?: string } {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) {
    return { valid: false, error: 'Invalid start date' };
  }
  if (isNaN(end.getTime())) {
    return { valid: false, error: 'Invalid end date' };
  }
  if (end <= start) {
    return { valid: false, error: 'End date must be after start date' };
  }
  return { valid: true };
}

describe('Contract Utilities', () => {
  describe('getContractStatusLabel', () => {
    it('should return correct English labels for all statuses', () => {
      expect(getContractStatusLabel('draft', 'en')).toBe('Draft');
      expect(getContractStatusLabel('pending', 'en')).toBe('Pending');
      expect(getContractStatusLabel('active', 'en')).toBe('Active');
      expect(getContractStatusLabel('completed', 'en')).toBe('Completed');
      expect(getContractStatusLabel('cancelled', 'en')).toBe('Cancelled');
      expect(getContractStatusLabel('expired', 'en')).toBe('Expired');
    });

    it('should return correct Arabic labels for all statuses', () => {
      expect(getContractStatusLabel('draft', 'ar')).toBe('مسودة');
      expect(getContractStatusLabel('pending', 'ar')).toBe('قيد الانتظار');
      expect(getContractStatusLabel('active', 'ar')).toBe('نشط');
      expect(getContractStatusLabel('completed', 'ar')).toBe('مكتمل');
      expect(getContractStatusLabel('cancelled', 'ar')).toBe('ملغي');
      expect(getContractStatusLabel('expired', 'ar')).toBe('منتهي الصلاحية');
    });

    it('should default to English when no locale specified', () => {
      expect(getContractStatusLabel('active')).toBe('Active');
    });
  });

  describe('isContractExpired', () => {
    it('should return true for past end dates', () => {
      expect(isContractExpired('2020-01-01')).toBe(true);
      expect(isContractExpired('2023-06-15')).toBe(true);
    });

    it('should return false for future end dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      expect(isContractExpired(futureDate.toISOString().split('T')[0])).toBe(false);
    });

    it('should return false for null end date', () => {
      expect(isContractExpired(null)).toBe(false);
    });
  });

  describe('calculateContractDuration', () => {
    it('should calculate duration in days correctly', () => {
      expect(calculateContractDuration('2024-01-01', '2024-01-31')).toBe(30);
      expect(calculateContractDuration('2024-01-01', '2024-12-31')).toBe(365);
    });

    it('should handle single day contracts', () => {
      expect(calculateContractDuration('2024-01-01', '2024-01-02')).toBe(1);
    });

    it('should handle one year contracts', () => {
      const duration = calculateContractDuration('2024-01-01', '2025-01-01');
      expect(duration).toBeGreaterThanOrEqual(365);
      expect(duration).toBeLessThanOrEqual(366);
    });
  });

  describe('generateContractNumber', () => {
    it('should generate contract numbers with correct format', () => {
      expect(generateContractNumber('CTR', 1)).toBe('CTR-000001');
      expect(generateContractNumber('CTR', 100)).toBe('CTR-000100');
      expect(generateContractNumber('CTR', 999999)).toBe('CTR-999999');
    });

    it('should pad sequence numbers with leading zeros', () => {
      expect(generateContractNumber('EMP', 5)).toBe('EMP-000005');
      expect(generateContractNumber('EMP', 50)).toBe('EMP-000050');
      expect(generateContractNumber('EMP', 500)).toBe('EMP-000500');
    });

    it('should handle different prefixes', () => {
      expect(generateContractNumber('WORK', 1)).toBe('WORK-000001');
      expect(generateContractNumber('SERVICE', 42)).toBe('SERVICE-000042');
    });
  });

  describe('validateContractDates', () => {
    it('should validate correct date ranges', () => {
      const result = validateContractDates('2024-01-01', '2024-12-31');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject end date before start date', () => {
      const result = validateContractDates('2024-12-31', '2024-01-01');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('End date must be after start date');
    });

    it('should reject equal start and end dates', () => {
      const result = validateContractDates('2024-06-15', '2024-06-15');
      expect(result.valid).toBe(false);
    });

    it('should reject invalid date strings', () => {
      const result1 = validateContractDates('not-a-date', '2024-12-31');
      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('Invalid start date');

      const result2 = validateContractDates('2024-01-01', 'not-a-date');
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('Invalid end date');
    });
  });

  describe('isContractActive', () => {
    it('should return true for active contracts within date range', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = isContractActive(
        'active',
        yesterday.toISOString().split('T')[0],
        tomorrow.toISOString().split('T')[0]
      );
      expect(result).toBe(true);
    });

    it('should return false for non-active status', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      expect(isContractActive('draft', yesterday.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0])).toBe(false);
      expect(isContractActive('pending', yesterday.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0])).toBe(false);
      expect(isContractActive('completed', yesterday.toISOString().split('T')[0], tomorrow.toISOString().split('T')[0])).toBe(false);
    });

    it('should return false for expired active contracts', () => {
      const result = isContractActive('active', '2020-01-01', '2020-12-31');
      expect(result).toBe(false);
    });
  });
});
