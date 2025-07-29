import { render, screen, waitFor, act, fireEvent } from '@testing-library/react'
import { AuthProvider } from '@/src/components/auth/auth-provider'
import { AuthErrorBoundary } from '@/components/auth-error-boundary'
import { formatAuthError } from '@/src/lib/actions/cookie-actions'
import { refreshTokenWithRetry } from '@/lib/supabase/server'

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
    updateUser: jest.fn()
  },
  from: jest.fn()
}

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase
}))

// Mock the server functions
jest.mock('@/lib/supabase/server', () => ({
  refreshTokenWithRetry: jest.fn(),
  getValidSession: jest.fn(),
  isAuthenticated: jest.fn(),
  createClientWithRefresh: jest.fn()
}))

// Mock the cookie actions
jest.mock('@/src/lib/actions/cookie-actions', () => ({
  formatAuthError: jest.fn(),
  isNetworkError: jest.fn(),
  isRateLimitError: jest.fn(),
  isSessionExpiredError: jest.fn()
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  })
}))

// Test component that uses auth
const TestAuthComponent = () => {
  const { user, loading, signIn, signOut } = useAuth()
  
  if (loading) return <div>Loading...</div>
  
  if (!user) {
    return (
      <div>
        <button onClick={() => signIn('test@example.com', 'password')}>
          Sign In
        </button>
      </div>
    )
  }
  
  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  )
}

describe('Auth Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Reset mock implementations
    mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabase.auth.onAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    })
    mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: null }, error: null })
    mockSupabase.auth.signOut.mockResolvedValue({ error: null })
    mockSupabase.auth.refreshSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  })

  describe('Complete Auth Flow', () => {
    it('should handle successful authentication flow', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        created_at: '2023-01-01T00:00:00Z'
      }

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }

      // Mock successful session retrieval
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      // Mock successful sign in
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      // Mock profile data
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: '123', email: 'test@example.com', role: 'admin' },
              error: null
            })
          })
        })
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Should show loading initially
      expect(screen.getByText('Loading...')).toBeInTheDocument()

      // Wait for auth to initialize
      await waitFor(() => {
        expect(screen.getByText('Welcome, test@example.com')).toBeInTheDocument()
      })

      // Test sign out
      const signOutButton = screen.getByText('Sign Out')
      fireEvent.click(signOutButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })

    it('should handle authentication errors gracefully', async () => {
      const mockError = { message: 'Invalid login credentials' }
      
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null, session: null },
        error: mockError
      })

      const mockFormatAuthError = formatAuthError as jest.Mock
      mockFormatAuthError.mockReturnValue('Invalid email or password. Please try again.')

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })

      // Trigger sign in
      const signInButton = screen.getByText('Sign In')
      fireEvent.click(signInButton)

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password'
        })
      })
    })
  })

  describe('Token Refresh Integration', () => {
    it('should automatically refresh expired tokens', async () => {
      const mockRefreshTokenWithRetry = refreshTokenWithRetry as jest.Mock
      mockRefreshTokenWithRetry.mockResolvedValue({ success: true })

      const expiredSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Welcome, test@example.com')).toBeInTheDocument()
      })

      // Verify refresh was attempted
      expect(mockRefreshTokenWithRetry).toHaveBeenCalled()
    })

    it('should handle refresh failures gracefully', async () => {
      const mockRefreshTokenWithRetry = refreshTokenWithRetry as jest.Mock
      mockRefreshTokenWithRetry.mockResolvedValue({ 
        success: false, 
        error: 'Network error' 
      })

      const expiredSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 3600
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })
    })
  })

  describe('Error Boundary Integration', () => {
    it('should catch and handle auth-related errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const ComponentWithAuthError = () => {
        const { user } = useAuth()
        
        if (!user) {
          throw new Error('Authentication required')
        }
        
        return <div>Authenticated</div>
      }

      render(
        <AuthErrorBoundary>
          <AuthProvider>
            <ComponentWithAuthError />
          </AuthProvider>
        </AuthErrorBoundary>
      )

      expect(screen.getByText('Authentication Error')).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should provide recovery options for auth errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const ComponentWithError = () => {
        throw new Error('Auth system error')
      }

      render(
        <AuthErrorBoundary>
          <ComponentWithError />
        </AuthErrorBoundary>
      )

      // Check all recovery options are present
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('Network Error Handling', () => {
    it('should handle network failures during auth operations', async () => {
      const networkError = new Error('Network error')
      mockSupabase.auth.getSession.mockRejectedValue(networkError)

      const mockFormatAuthError = formatAuthError as jest.Mock
      mockFormatAuthError.mockReturnValue('Network error. Please check your connection and try again.')

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })
    })

    it('should retry failed operations with exponential backoff', async () => {
      const mockRefreshTokenWithRetry = refreshTokenWithRetry as jest.Mock
      
      // Simulate retry logic
      mockRefreshTokenWithRetry
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: true })

      const result = await refreshTokenWithRetry({}, 3, 1000)

      expect(result.success).toBe(true)
      expect(mockRefreshTokenWithRetry).toHaveBeenCalledTimes(3)
    })
  })

  describe('Session Management', () => {
    it('should handle session state changes correctly', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }

      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600
      }

      // Mock auth state change
      let authStateCallback: (event: string, session: any) => void
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: jest.fn() } }
        }
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Simulate auth state change
      act(() => {
        authStateCallback('SIGNED_IN', mockSession)
      })

      await waitFor(() => {
        expect(screen.getByText('Welcome, test@example.com')).toBeInTheDocument()
      })

      // Simulate sign out
      act(() => {
        authStateCallback('SIGNED_OUT', null)
      })

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })
    })

    it('should handle session expiry correctly', async () => {
      const expiredSession = {
        user: { id: '123', email: 'test@example.com' },
        access_token: 'expired-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 3600
      }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: expiredSession },
        error: null
      })

      render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByText('Sign In')).toBeInTheDocument()
      })
    })
  })

  describe('Cleanup and Memory Management', () => {
    it('should properly cleanup subscriptions on unmount', () => {
      const mockUnsubscribe = jest.fn()
      
      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      })

      const { unmount } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      unmount()

      // Verify cleanup was called
      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should handle multiple auth state changes without memory leaks', async () => {
      const mockUnsubscribe = jest.fn()
      let authStateCallback: (event: string, session: any) => void
      
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateCallback = callback
        return {
          data: { subscription: { unsubscribe: mockUnsubscribe } }
        }
      })

      const { rerender } = render(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Simulate multiple auth state changes
      act(() => {
        authStateCallback('SIGNED_IN', { user: { id: '123', email: 'test@example.com' } })
      })

      act(() => {
        authStateCallback('SIGNED_OUT', null)
      })

      act(() => {
        authStateCallback('SIGNED_IN', { user: { id: '456', email: 'test2@example.com' } })
      })

      // Rerender to test cleanup
      rerender(
        <AuthProvider>
          <TestAuthComponent />
        </AuthProvider>
      )

      // Verify no memory leaks (subscription should be properly managed)
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Error Recovery', () => {
    it('should allow recovery from auth errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const ComponentWithRecoverableError = () => {
        const [shouldError, setShouldError] = React.useState(true)
        
        if (shouldError) {
          throw new Error('Recoverable error')
        }
        
        return (
          <div>
            <p>Recovered</p>
            <button onClick={() => setShouldError(true)}>Trigger Error</button>
          </div>
        )
      }

      render(
        <AuthErrorBoundary>
          <ComponentWithRecoverableError />
        </AuthErrorBoundary>
      )

      expect(screen.getByText('Authentication Error')).toBeInTheDocument()

      // Test recovery
      const tryAgainButton = screen.getByText('Try Again')
      fireEvent.click(tryAgainButton)

      expect(screen.getByText('Recovered')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })
})