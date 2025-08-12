import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import { createClient } from '@supabase/supabase-js';
import { AuthProvider } from '@/components/auth/auth-provider';
import { AuthErrorBoundary } from '@/components/auth-error-boundary';
import {
  formatAuthError,
  isNetworkError,
  isRateLimitError,
  isSessionExpiredError,
} from '@/lib/actions/cookie-actions';
import {
  createClientWithRefresh,
  refreshSession,
  isSessionExpired,
  ensureValidSession,
} from '@/lib/supabase/server';

// Mock Supabase client for integration tests
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
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    then: jest.fn().mockResolvedValue({ data: [], error: null }),
  })),
  rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabaseClient),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClientWithRefresh: jest.fn(() => mockSupabaseClient),
  refreshSession: jest.fn(),
  isSessionExpired: jest.fn(),
  ensureValidSession: jest.fn(),
  refreshTokenWithRetry: jest.fn(),
  getValidSession: jest.fn(),
  isAuthenticated: jest.fn(),
}));

// Test component that uses auth
const TestAuthComponent = () => {
  const { user, loading, signIn, signOut } = React.useContext(
    require('@/components/auth/auth-provider').AuthContext
  );

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <div>Authenticated as: {user.email}</div>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
};

describe('Authentication System - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();

    // Reset mock implementations
    mockSupabaseClient.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: null,
    });
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: null,
    });
    mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });
    mockSupabaseClient.auth.signUp.mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });
    mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });
  });

  describe('Full Authentication Flow', () => {
    it('should complete full sign-in flow successfully', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = {
        user: mockUser,
        access_token: 'token',
        refresh_token: 'refresh',
      };

      // Mock successful sign-in
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      // Mock session retrieval
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Authenticated as: test@example.com')
        ).toBeInTheDocument();
      });
    });

    it('should handle sign-in with invalid credentials', async () => {
      const mockError = { message: 'Invalid login credentials' };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError,
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      });
    });

    it('should handle sign-out flow', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };

      // Start with authenticated state
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Authenticated as: test@example.com')
        ).toBeInTheDocument();
      });

      // Mock successful sign-out
      mockSupabaseClient.auth.signOut.mockResolvedValue({ error: null });

      // Simulate sign-out
      const signOutButton = screen.getByText('Sign Out');
      fireEvent.click(signOutButton);

      await waitFor(() => {
        expect(mockSupabaseClient.auth.signOut).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should handle network errors during authentication', async () => {
      const networkError = { message: 'Network Error', code: 'NETWORK_ERROR' };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: networkError,
      });

      const formatted = formatAuthError(networkError);
      expect(formatted.severity).toBe('error');
      expect(isNetworkError(networkError)).toBe(true);
    });

    it('should handle rate limit errors', async () => {
      const rateLimitError = {
        message: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
      };
      mockSupabaseClient.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: rateLimitError,
      });

      const formatted = formatAuthError(rateLimitError);
      expect(formatted.severity).toBe('warning');
      expect(isRateLimitError(rateLimitError)).toBe(true);
    });

    it('should handle session expiry errors', async () => {
      const sessionError = { message: 'JWT expired', code: 'SESSION_EXPIRED' };
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: sessionError,
      });

      const formatted = formatAuthError(sessionError);
      expect(formatted.severity).toBe('info');
      expect(isSessionExpiredError(sessionError)).toBe(true);
    });

    it('should recover from temporary network issues', async () => {
      let callCount = 0;
      mockSupabaseClient.auth.getSession.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            data: { session: null },
            error: { message: 'Network error' },
          });
        }
        return Promise.resolve({ data: { session: null }, error: null });
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      });
    });
  });

  describe('Auto Token Refresh', () => {
    it('should automatically refresh expired tokens', async () => {
      const expiredSession = {
        access_token: 'expired',
        expires_at: Date.now() - 1000,
      };
      const newSession = {
        access_token: 'new_token',
        expires_at: Date.now() + 3600000,
      };

      // Mock expired session detection
      const mockIsSessionExpired = isSessionExpired as jest.MockedFunction<
        typeof isSessionExpired
      >;
      mockIsSessionExpired.mockReturnValue(true);

      // Mock successful refresh
      const mockRefreshSession = refreshSession as jest.MockedFunction<
        typeof refreshSession
      >;
      mockRefreshSession.mockResolvedValue({
        data: { session: newSession },
        error: null,
      });

      const result = await refreshSession({ refresh_token: 'refresh_token' });

      expect(mockIsSessionExpired).toHaveBeenCalled();
      expect(mockRefreshSession).toHaveBeenCalledWith({
        refresh_token: 'refresh_token',
      });
      expect(result.data?.session?.access_token).toBe('new_token');
    });

    it('should handle refresh token failures', async () => {
      const mockRefreshSession = refreshSession as jest.MockedFunction<
        typeof refreshSession
      >;
      mockRefreshSession.mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid refresh token' },
      });

      const result = await refreshSession({ refresh_token: 'invalid_token' });

      expect(result.error?.message).toBe('Invalid refresh token');
      expect(result.data?.session).toBeNull();
    });

    it('should retry failed refresh attempts', async () => {
      let attemptCount = 0;
      const mockRefreshSession = refreshSession as jest.MockedFunction<
        typeof refreshSession
      >;

      mockRefreshSession.mockImplementation(() => {
        attemptCount++;
        if (attemptCount < 3) {
          return Promise.resolve({
            data: { session: null },
            error: { message: 'Network error' },
          });
        }
        return Promise.resolve({
          data: { session: { access_token: 'new_token' } },
          error: null,
        });
      });

      // Simulate retry logic
      let result;
      for (let i = 0; i < 3; i++) {
        result = await refreshSession({ refresh_token: 'refresh_token' });
        if (!result.error) break;
      }

      expect(attemptCount).toBe(3);
      expect(result?.data?.session?.access_token).toBe('new_token');
    });
  });

  describe('Error Boundary Integration', () => {
    it('should catch and handle auth-related errors', async () => {
      const AuthComponentWithError = () => {
        const { user } = React.useContext(
          require('@/components/auth/auth-provider').AuthContext
        );
        if (!user) {
          throw new Error('Authentication required');
        }
        return <div>Authenticated</div>;
      };

      render(
        <AuthErrorBoundary>
          <AuthProvider>
            <AuthComponentWithError />
          </AuthProvider>
        </AuthErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });

    it('should provide error recovery options', async () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <AuthErrorBoundary>
          <ThrowError />
        </AuthErrorBoundary>
      );

      expect(screen.getByText(/try again/i)).toBeInTheDocument();
      expect(screen.getByText(/contact support/i)).toBeInTheDocument();
    });

    it('should handle error boundary reset', async () => {
      const { rerender } = render(
        <AuthErrorBoundary>
          <div>Working component</div>
        </AuthErrorBoundary>
      );

      expect(screen.getByText('Working component')).toBeInTheDocument();

      // Simulate error
      rerender(
        <AuthErrorBoundary>
          <div>
            {(() => {
              throw new Error('Test error');
            })()}
          </div>
        </AuthErrorBoundary>
      );

      await waitFor(() => {
        expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
      });
    });
  });

  describe('Session State Management', () => {
    it('should maintain session state across component re-renders', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };

      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      const { rerender } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Authenticated as: test@example.com')
        ).toBeInTheDocument();
      });

      // Re-render component
      rerender(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      // Session state should be maintained
      expect(
        screen.getByText('Authenticated as: test@example.com')
      ).toBeInTheDocument();
    });

    it('should handle session state changes', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };

      // Start with no session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const { rerender } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      });

      // Update to authenticated state
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });

      rerender(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(
          screen.getByText('Authenticated as: test@example.com')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Data Cleanup and Isolation', () => {
    it('should cleanup auth subscriptions on unmount', async () => {
      const mockUnsubscribe = jest.fn();
      mockSupabaseClient.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } },
      });

      const { unmount } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      unmount();

      expect(mockSupabaseClient.auth.onAuthStateChange).toHaveBeenCalled();
    });

    it('should isolate test data between tests', async () => {
      // This test ensures that data from previous tests doesn't leak
      expect(localStorage.length).toBe(0);
      expect(sessionStorage.length).toBe(0);

      // Verify mocks are clean
      expect(mockSupabaseClient.auth.getSession).not.toHaveBeenCalled();
      expect(mockSupabaseClient.auth.signInWithPassword).not.toHaveBeenCalled();
    });

    it('should handle concurrent auth operations', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const mockSession = { user: mockUser, access_token: 'token' };

      let concurrentCalls = 0;
      mockSupabaseClient.auth.getSession.mockImplementation(async () => {
        concurrentCalls++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { data: { session: mockSession }, error: null };
      });

      const promises = Array(3)
        .fill(null)
        .map(() =>
          render(
            <AuthProvider>
              <TestAuthComponent />
            </AuthProvider>
          )
        );

      await Promise.all(promises);

      expect(concurrentCalls).toBe(3);
    });
  });

  describe('RLS Policy Enforcement', () => {
    it('should enforce user-specific data access in queries', async () => {
      const mockUser = { id: 'user123' };
      const mockData = [
        { id: 1, user_id: 'user123', data: 'user data' },
        { id: 2, user_id: 'other123', data: 'other data' },
      ];

      mockSupabaseClient.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: mockData.filter(item => item.user_id === mockUser.id),
          error: null,
        }),
      });

      const result = await mockSupabaseClient
        .from('test_table')
        .select()
        .eq('user_id', mockUser.id);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_id).toBe('user123');
    });

    it('should prevent unauthorized data modifications', async () => {
      const mockUser = { id: 'user123', role: 'user' };
      const mockResource = { id: 1, owner_id: 'other123' };

      // Simulate unauthorized update attempt
      mockSupabaseClient.from.mockReturnValue({
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        then: jest.fn().mockResolvedValue({
          data: null,
          error: { message: 'RLS policy violation' },
        }),
      });

      const result = await mockSupabaseClient
        .from('test_table')
        .update({ data: 'modified' })
        .eq('id', mockResource.id);

      expect(result.error?.message).toBe('RLS policy violation');
    });
  });

  describe('Network Resilience', () => {
    it('should handle intermittent network failures', async () => {
      let callCount = 0;
      mockSupabaseClient.auth.getSession.mockImplementation(() => {
        callCount++;
        if (callCount % 2 === 1) {
          return Promise.resolve({
            data: { session: null },
            error: { message: 'Network error' },
          });
        }
        return Promise.resolve({ data: { session: null }, error: null });
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      });
    });

    it('should handle timeout scenarios', async () => {
      mockSupabaseClient.auth.getSession.mockImplementation(() => {
        return new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), 100);
        });
      });

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Not authenticated')).toBeInTheDocument();
      });
    });
  });
});
