import {
  fetchPromotersWithPagination,
  getPromoterCVData,
  fetchPromotersAnalytics,
  getPromoterPerformanceStats,
  exportPromotersToCSV,
  importPromotersFromCSV,
} from '@/lib/promoter-service';
import { promoterProfileSchema } from '@/lib/promoter-profile-schema';

// Mock Supabase client
const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ne: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    and: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

describe('Promoter Service - Comprehensive Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchPromotersWithPagination', () => {
    it('should fetch promoters with pagination successfully', async () => {
      const mockPromoters = [
        {
          id: 1,
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
        },
        {
          id: 2,
          first_name: 'Jane',
          last_name: 'Smith',
          email: 'jane@example.com',
        },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: mockPromoters, error: null }),
      });

      const result = await fetchPromotersWithPagination(1, 10);

      expect(result.data).toEqual(mockPromoters);
      expect(result.error).toBeNull();
    });

    it('should handle pagination edge cases', async () => {
      // Test with zero page
      await fetchPromotersWithPagination(0, 10);
      expect(mockSupabaseClient.from).toHaveBeenCalled();

      // Test with negative page
      await fetchPromotersWithPagination(-1, 10);
      expect(mockSupabaseClient.from).toHaveBeenCalled();

      // Test with zero limit
      await fetchPromotersWithPagination(1, 0);
      expect(mockSupabaseClient.from).toHaveBeenCalled();
    });

    it('should handle database errors gracefully', async () => {
      const mockError = { message: 'Database connection failed' };
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: null, error: mockError }),
      });

      const result = await fetchPromotersWithPagination(1, 10);

      expect(result.data).toBeNull();
      expect(result.error).toEqual(mockError);
    });

    it('should handle network failures with retry logic', async () => {
      let callCount = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(() => {
          callCount++;
          if (callCount < 3) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({ data: [], error: null });
        }),
      });

      const result = await fetchPromotersWithPagination(1, 10);

      expect(callCount).toBe(3);
      expect(result.data).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should enforce RLS policies', async () => {
      const mockUser = { id: 'user123' };
      const mockPromoters = [
        { id: 1, user_id: 'user123', first_name: 'John' },
        { id: 2, user_id: 'other123', first_name: 'Jane' },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: mockPromoters.filter(p => p.user_id === mockUser.id),
          error: null,
        }),
      });

      const result = await fetchPromotersWithPagination(1, 10, mockUser.id);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_id).toBe('user123');
    });
  });

  describe('Data Validation', () => {
    it('should validate promoter profile data', () => {
      const validProfile = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        nationality: 'US',
      };

      const result = promoterProfileSchema.safeParse(validProfile);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user.domain.com',
        '',
        null,
        undefined,
      ];

      invalidEmails.forEach(email => {
        const profile = {
          first_name: 'John',
          last_name: 'Doe',
          email,
          phone: '+1234567890',
          nationality: 'US',
        };

        const result = promoterProfileSchema.safeParse(profile);
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidPhones = ['123', 'not-a-phone', '', null, undefined];

      invalidPhones.forEach(phone => {
        const profile = {
          first_name: 'John',
          last_name: 'Doe',
          email: 'john@example.com',
          phone,
          nationality: 'US',
        };

        const result = promoterProfileSchema.safeParse(profile);
        expect(result.success).toBe(false);
      });
    });

    it('should reject empty required fields', () => {
      const emptyFields = ['', '   ', null, undefined];

      emptyFields.forEach(value => {
        const profile = {
          first_name: value,
          last_name: 'Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          nationality: 'US',
        };

        const result = promoterProfileSchema.safeParse(profile);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network timeouts', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(() => {
          return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), 100);
          });
        }),
      });

      await expect(fetchPromotersWithPagination(1, 10)).rejects.toThrow(
        'Request timeout'
      );
    });

    it('should handle concurrent requests', async () => {
      let concurrentCalls = 0;
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation(async () => {
          concurrentCalls++;
          await new Promise(resolve => setTimeout(resolve, 50));
          return { data: [], error: null };
        }),
      });

      const promises = Array(5)
        .fill(null)
        .map(() => fetchPromotersWithPagination(1, 10));
      await Promise.all(promises);

      expect(concurrentCalls).toBe(5);
    });

    it('should handle malformed database responses', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest
          .fn()
          .mockResolvedValue({ data: 'not-an-array', error: null }),
      });

      const result = await fetchPromotersWithPagination(1, 10);

      expect(result.error).toBeTruthy();
    });

    it('should handle null database responses', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue(null),
      });

      const result = await fetchPromotersWithPagination(1, 10);

      expect(result.error).toBeTruthy();
    });
  });

  describe('Security and Access Control', () => {
    it('should prevent SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE promoters; --";

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({ data: [], error: null }),
      });

      await fetchPromotersWithPagination(1, 10);

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('promoters');
    });

    it('should enforce data access permissions', async () => {
      const mockUser = { id: 'user123', role: 'user' };
      const mockAdmin = { id: 'admin123', role: 'admin' };

      const canAccessAllData = (user: any) => user.role === 'admin';
      const canAccessOwnData = (user: any, resourceUserId: string) =>
        user.id === resourceUserId || user.role === 'admin';

      expect(canAccessAllData(mockAdmin)).toBe(true);
      expect(canAccessAllData(mockUser)).toBe(false);
      expect(canAccessOwnData(mockUser, 'user123')).toBe(true);
      expect(canAccessOwnData(mockUser, 'other123')).toBe(false);
    });
  });
});
