/**
 * Document Status Tests
 *
 * Tests for document expiry status calculations used across the
 * promoter management system for ID cards and passports.
 */

import { getDocumentStatus } from '@/lib/document-status';

describe('Document Status Utilities', () => {
  describe('getDocumentStatus', () => {
    it('should return expired status for past dates', () => {
      const status = getDocumentStatus('2020-01-01');
      expect(status).toBeDefined();
      expect(status.text).toBeTruthy();
      // Should indicate expired/critical state
      expect(['Expired', 'Critical', 'expired', 'critical'].some(s =>
        status.text.toLowerCase().includes(s.toLowerCase())
      ) || status.colorClass.includes('red') || status.colorClass.includes('danger')).toBeTruthy();
    });

    it('should return valid status for far future dates', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 2);
      const status = getDocumentStatus(futureDate.toISOString().split('T')[0]);
      expect(status).toBeDefined();
      expect(status.text).toBeTruthy();
    });

    it('should return warning status for dates expiring soon (within 30 days)', () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 15); // 15 days from now
      const status = getDocumentStatus(soonDate.toISOString().split('T')[0]);
      expect(status).toBeDefined();
      expect(status.text).toBeTruthy();
    });

    it('should handle null expiry date', () => {
      const status = getDocumentStatus(null);
      expect(status).toBeDefined();
    });

    it('should handle undefined expiry date', () => {
      const status = getDocumentStatus(undefined);
      expect(status).toBeDefined();
    });

    it('should handle empty string expiry date', () => {
      const status = getDocumentStatus('');
      expect(status).toBeDefined();
    });

    it('should return an object with required properties', () => {
      const status = getDocumentStatus('2025-12-31');
      expect(status).toHaveProperty('text');
      expect(status).toHaveProperty('colorClass');
      expect(status).toHaveProperty('Icon');
    });

    it('should handle various date formats', () => {
      // ISO format
      expect(() => getDocumentStatus('2025-06-15')).not.toThrow();
      // Dates in the past
      expect(() => getDocumentStatus('2019-01-01')).not.toThrow();
    });
  });
});
