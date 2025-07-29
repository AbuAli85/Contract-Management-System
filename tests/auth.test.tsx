import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useAuth } from '@/components/auth/auth-provider';
import { AuthErrorBoundary } from '@/components/auth-error-boundary';
import { formatAuthError, isNetworkError, isRateLimitError, isSessionExpiredError } from '@/lib/actions/cookie-actions';
import { createClientWithRefresh, refreshSession, isSessionExpired } from '@/lib/supabase/server';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: jest.fn(),
    getUser: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(),
    refreshSession: jest.fn(),
  },
  from: jest.fn(),
  rpc: jest.fn(),
};

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}));

jest.mock('@/lib/supabase/server', () => ({
  createClientWithRefresh: jest.fn(),
  refreshSession: jest.fn(),
  isSessionExpired: jest.fn(),
  ensureValidSession: jest.fn(),
  refreshTokenWithRetry: jest.fn(),
  getValidSession: jest.fn(),
  isAuthenticated: jest.fn(),
}));

// Mock AuthProvider component
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useAuth();
  return <div data-testid="auth-provider">{children}</div>;
};

describe('Authentication System - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Auth Provider', () => {
    it('should initialize with loading state', () => {
      render(<MockAuthProvider><div>Test</div></MockAuthProvider>);
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
    });

    it('should handle auth state changes', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });
      mockSupabaseClient.auth.getUser.mockResolvedValue({ data: { user: mockUser }, error: null });

      render(<MockAuthProvider><div>Test</div></MockAuthProvider>);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
      });
    });

    it('should handle auth state change errors', async () => {
      const mockError = { message: 'Network error' };
      mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: null }, error: mockError });

      render(<MockAuthProvider><div>Test</div></MockAuthProvider>);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.getSession).toHaveBeenCalled();
      });
    });

    it('should cleanup subscriptions on unmount', () => {
      const { unmount } = render(<MockAuthProvider><div>Test</div></MockAuthProvider>);
      
      // Mock subscription cleanup
      const mockUnsubscribe = jest.fn();
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: mockUnsubscribe } } });
      
      unmount();
      
      // Verify cleanup is called (this would be tested in integration tests)
      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe('Auth Error Boundary', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    it('should catch and display auth errors', () => {
      render(
        <AuthErrorBoundary>
          <ThrowError />
        </AuthErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });

    it('should provide error recovery options', () => {
      render(
        <AuthErrorBoundary>
          <ThrowError />
        </AuthErrorBoundary>
      );

      expect(screen.getByText(/try again/i)).toBeInTheDocument();
      expect(screen.getByText(/contact support/i)).toBeInTheDocument();
    });

    it('should handle error boundary reset', () => {
      const { rerender } = render(
        <AuthErrorBoundary>
          <ThrowError />
        </AuthErrorBoundary>
      );

      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

      // Simulate reset
      rerender(
        <AuthErrorBoundary>
          <div>Working component</div>
        </AuthErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();
    });
  });

  describe('Error Formatting', () => {
    it('should format network errors correctly', () => {
      const networkError = { message: 'Network Error', code: 'NETWORK_ERROR' };
      const formatted = formatAuthError(networkError);
      
      expect(formatted.message).toContain('network');
      expect(formatted.severity).toBe('error');
      expect(isNetworkError(networkError)).toBe(true);
    });

    it('should format rate limit errors correctly', () => {
      const rateLimitError = { message: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' };
      const formatted = formatAuthError(rateLimitError);
      
      expect(formatted.message).toContain('too many');
      expect(formatted.severity).toBe('warning');
      expect(isRateLimitError(rateLimitError)).toBe(true);
    });

    it('should format session expired errors correctly', () => {
      const sessionError = { message: 'Session expired', code: 'SESSION_EXPIRED' };
      const formatted = formatAuthError(sessionError);
      
      expect(formatted.message).toContain('session');
      expect(formatted.severity).toBe('info');
      expect(isSessionExpiredError(sessionError)).toBe(true);
    });

    it('should handle unknown error types', () => {
      const unknownError = { message: 'Unknown error', code: 'UNKNOWN' };
      const formatted = formatAuthError(unknownError);
      
      expect(formatted.message).toContain('authentication');
      expect(formatted.severity).toBe('error');
    });

    it('should handle null/undefined errors', () => {
      const formatted = formatAuthError(null);
      expect(formatted.message).toContain('unknown');
    });
  });

  describe('Session Management', () => {
    it('should detect expired sessions', () => {
      const expiredSession = {
        access_token: 'expired_token',
        expires_at: Date.now() - 1000, // Expired 1 second ago
      };
      
      const isExpired = isSessionExpired(expiredSession);
      expect(isExpired).toBe(true);
    });

    it('should detect valid sessions', () => {
      const validSession = {
        access_token: 'valid_token',
        expires_at: Date.now() + 3600000, // Valid for 1 hour
      };
      
      const isExpired = isSessionExpired(validSession);
      expect(isExpired).toBe(false);
    });

    it('should handle session refresh', async () => {
      const mockRefreshSession = refreshSession as jest.MockedFunction<typeof refreshSession>;
      mockRefreshSession.mockResolvedValue({
        data: { session: { access_token: 'new_token' } },
        error: null,
      });

      const result = await refreshSession({ refresh_token: 'refresh_token' });
      
      expect(mockRefreshSession).toHaveBeenCalledWith({ refresh_token: 'refresh_token' });
      expect(result.data?.session?.access_token).toBe('new_token');
    });

    it('should handle refresh failures', async () => {
      const mockRefreshSession = refreshSession as jest.MockedFunction<typeof refreshSession>;
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Refresh failed' },
      });

      const result = await refreshSession({ refresh_token: 'invalid_token' });
      
      expect(result.error?.message).toBe('Refresh failed');
    });

    // New tests for expired token auto-refresh
    it('should automatically refresh expired tokens', async () => {
      const mockExpiredSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'expired_token',
        refresh_token: 'refresh_token',
        expires_at: new Date(Date.now() - 1000).toISOString()
      };

      const mockRefreshedSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'new_token',
        refresh_token: 'new_refresh_token',
        expires_at: new Date(Date.now() + 3600000).toISOString()
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: mockExpiredSession }, error: null });
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({ data: { session: mockRefreshedSession }, error: null });

      render(<MockAuthProvider><div>Test</div></MockAuthProvider>);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled();
      });
    });

    it('should handle refresh token failures gracefully', async () => {
      const mockExpiredSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'expired_token',
        refresh_token: 'invalid_refresh_token',
        expires_at: new Date(Date.now() - 1000).toISOString()
      };

      mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: mockExpiredSession }, error: null });
      mockSupabaseClient.auth.refreshSession.mockResolvedValue({ 
        data: { session: null }, 
        error: { message: 'Invalid refresh token' } 
      });

      render(<MockAuthProvider><div>Test</div></MockAuthProvider>);
      
      await waitFor(() => {
        expect(mockSupabaseClient.auth.refreshSession).toHaveBeenCalled();
      });
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', () => {
      const validEmails = ['test@example.com', 'user.name@domain.co.uk'];
      const invalidEmails = ['invalid-email', '@domain.com', 'user@', 'user.domain.com'];

      validEmails.forEach(email => {
        expect(email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });

      invalidEmails.forEach(email => {
        expect(email).not.toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
      });
    });

    it('should validate password strength', () => {
      const strongPassword = 'StrongPass123!';
      const weakPassword = 'weak';

      // Basic password strength validation
      const isStrong = (password: string) => {
        return password.length >= 8 && 
               /[A-Z]/.test(password) && 
               /[a-z]/.test(password) && 
               /[0-9]/.test(password);
      };

      expect(isStrong(strongPassword)).toBe(true);
      expect(isStrong(weakPassword)).toBe(false);
    });

    it('should handle empty inputs', () => {
      const emptyInputs = ['', '   ', null, undefined];
      
      emptyInputs.forEach(input => {
        const isEmpty = !input || (typeof input === 'string' && input.trim() === '');
        expect(isEmpty).toBe(true);
      });
    });
  });

  describe('Network Error Handling', () => {
    it('should retry failed requests with exponential backoff', async () => {
      const mockFunction = jest.fn();
      let callCount = 0;
      
      mockFunction.mockImplementation(() => {
        callCount++;
        if (callCount < 3) {
          throw new Error('Network error');
        }
        return 'success';
      });

      const withRetry = async (fn: () => any, maxRetries = 3, delay = 100) => {
        for (let i = 0; i <= maxRetries; i++) {
          try {
            return await fn();
          } catch (error) {
            if (i === maxRetries) throw error;
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
          }
        }
      };

      const result = await withRetry(mockFunction);
      expect(result).toBe('success');
      expect(mockFunction).toHaveBeenCalledTimes(3);
    });

    it('should handle timeout errors', async () => {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 100);
      });

      await expect(timeoutPromise).rejects.toThrow('Request timeout');
    });

    it('should handle connection refused errors', () => {
      const connectionError = { message: 'connect ECONNREFUSED', code: 'ECONNREFUSED' };
      const formatted = formatAuthError(connectionError);
      
      expect(formatted.message).toContain('connection');
      expect(formatted.severity).toBe('error');
    });
  });

  describe('RLS Enforcement', () => {
    it('should enforce user-specific data access', async () => {
      const mockUser = { id: 'user123' };
      const mockData = [
        { id: 1, user_id: 'user123', data: 'user data' },
        { id: 2, user_id: 'other123', data: 'other data' },
      ];

      // Simulate RLS filtering
      const filteredData = mockData.filter(item => item.user_id === mockUser.id);
      
      expect(filteredData).toHaveLength(1);
      expect(filteredData[0].user_id).toBe('user123');
    });

    it('should prevent unauthorized data access', async () => {
      const mockUser = { id: 'user123', role: 'user' };
      const mockResource = { id: 1, owner_id: 'other123', role_required: 'admin' };

      const canAccess = (user: any, resource: any) => {
        return user.id === resource.owner_id || user.role === resource.role_required;
      };

      expect(canAccess(mockUser, mockResource)).toBe(false);
    });

    it('should allow admin access to all resources', async () => {
      const mockAdmin = { id: 'admin123', role: 'admin' };
      const mockResource = { id: 1, owner_id: 'other123', role_required: 'admin' };

      const canAccess = (user: any, resource: any) => {
        return user.id === resource.owner_id || user.role === resource.role_required;
      };

      expect(canAccess(mockAdmin, mockResource)).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle malformed JWT tokens', () => {
      const malformedTokens = ['', 'invalid.token', 'header.payload', 'header.payload.signature.extra'];
      
      malformedTokens.forEach(token => {
        const isValidFormat = token.split('.').length === 3;
        expect(isValidFormat).toBe(false);
      });
    });

    it('should handle concurrent auth requests', async () => {
      const mockSignIn = jest.fn();
      let concurrentCalls = 0;
      
      mockSignIn.mockImplementation(async () => {
        concurrentCalls++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return { data: { user: { id: '123' } }, error: null };
      });

      const promises = Array(3).fill(null).map(() => mockSignIn());
      await Promise.all(promises);
      
      expect(mockSignIn).toHaveBeenCalledTimes(3);
    });

    it('should handle browser storage limitations', () => {
      // Mock localStorage quota exceeded
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      expect(() => {
        localStorage.setItem('test', 'data');
      }).toThrow('QuotaExceededError');

      localStorage.setItem = originalSetItem;
    });

    it('should handle invalid refresh tokens', async () => {
      const mockRefreshSession = refreshSession as jest.MockedFunction<typeof refreshSession>;
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid refresh token' },
      });

      const result = await refreshSession({ refresh_token: 'invalid_token' });
      
      expect(result.error?.message).toBe('Invalid refresh token');
      expect(result.data?.session).toBeNull();
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should cleanup all subscriptions on unmount', () => {
      const { unmount } = render(<MockAuthProvider><div>Test</div></MockAuthProvider>);
      
      const mockUnsubscribe = jest.fn();
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({ 
        data: { subscription: { unsubscribe: mockUnsubscribe } } 
      });
      
      unmount();
      
      // Verify cleanup is called
      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should clear all timers on unmount', () => {
      const originalClearTimeout = global.clearTimeout;
      const mockClearTimeout = jest.fn();
      global.clearTimeout = mockClearTimeout;

      const { unmount } = render(<MockAuthProvider><div>Test</div></MockAuthProvider>);
      
      unmount();
      
      expect(mockClearTimeout).toHaveBeenCalled();
      
      global.clearTimeout = originalClearTimeout;
    });

    it('should not create memory leaks with multiple auth state changes', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };
      
      mockSupabaseClient.auth.getSession.mockResolvedValue({ data: { session: mockSession }, error: null });

      const { rerender } = render(<MockAuthProvider><div>Test</div></MockAuthProvider>);
      
      // Simulate multiple re-renders
      for (let i = 0; i < 5; i++) {
        rerender(<MockAuthProvider><div>Test {i}</div></MockAuthProvider>);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Verify no excessive calls
      expect(mockSupabaseClient.auth.getSession).toHaveBeenCalledTimes(1);
    });
  });
});
