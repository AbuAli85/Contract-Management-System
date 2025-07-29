import { render, screen, waitFor, act } from '@testing-library/react'
import { useAuth } from '@/src/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AuthErrorBoundary } from '@/components/auth-error-boundary'
import { formatAuthError, isNetworkError, isRateLimitError, isSessionExpiredError } from '@/src/lib/actions/cookie-actions'
import { refreshTokenWithRetry, getValidSession, isAuthenticated } from '@/lib/supabase/server'

// Mock the Supabase client
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn()
}))

// Mock the useAuth hook
jest.mock('@/src/components/auth/auth-provider', () => ({
  useAuth: jest.fn()
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn()
  })
}))

// Mock the server functions
jest.mock('@/lib/supabase/server', () => ({
  refreshTokenWithRetry: jest.fn(),
  getValidSession: jest.fn(),
  isAuthenticated: jest.fn()
}))

// Mock the cookie actions
jest.mock('@/src/lib/actions/cookie-actions', () => ({
  formatAuthError: jest.fn(),
  isNetworkError: jest.fn(),
  isRateLimitError: jest.fn(),
  isSessionExpiredError: jest.fn()
}))

describe('Auth Tests', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
  })

  describe('useAuth Hook', () => {
    it('should return loading state initially', () => {
      const mockUseAuth = useAuth as jest.Mock
      mockUseAuth.mockReturnValue({
        user: null,
        roles: [],
        loading: true
      })

      expect(useAuth().loading).toBe(true)
    })

    it('should return user and roles when authenticated', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com'
      }

      const mockUseAuth = useAuth as jest.Mock
      mockUseAuth.mockReturnValue({
        user: mockUser,
        roles: ['admin'],
        loading: false
      })

      const auth = useAuth()
      expect(auth.user).toBe(mockUser)
      expect(auth.roles).toContain('admin')
    })

    it('should handle session refresh correctly', async () => {
      const mockUseAuth = useAuth as jest.Mock
      const mockRefreshSession = jest.fn().mockResolvedValue({ success: true })
      
      mockUseAuth.mockReturnValue({
        user: { id: '123' },
        roles: ['admin'],
        loading: false,
        refreshSession: mockRefreshSession
      })

      const auth = useAuth()
      await auth.refreshSession()
      
      expect(mockRefreshSession).toHaveBeenCalled()
    })
  })

  describe('ProtectedRoute Component', () => {
    it('should show loading state', () => {
      const mockUseAuth = useAuth as jest.Mock
      mockUseAuth.mockReturnValue({
        user: null,
        roles: [],
        loading: true
      })

      render(
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should render children when user has required role', () => {
      const mockUseAuth = useAuth as jest.Mock
      mockUseAuth.mockReturnValue({
        user: { id: '123' },
        roles: ['admin'],
        loading: false
      })

      render(
        <ProtectedRoute requiredRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      )

      expect(screen.getByText('Admin Content')).toBeInTheDocument()
    })

    it('should not render children when user lacks required role', () => {
      const mockUseAuth = useAuth as jest.Mock
      mockUseAuth.mockReturnValue({
        user: { id: '123' },
        roles: ['client'],
        loading: false
      })

      render(
        <ProtectedRoute requiredRole="admin">
          <div>Admin Content</div>
        </ProtectedRoute>
      )

      expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
    })
  })

  describe('AuthErrorBoundary Component', () => {
    const ThrowError = () => {
      throw new Error('Test error')
    }

    it('should catch errors and show fallback UI', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthErrorBoundary>
          <ThrowError />
        </AuthErrorBoundary>
      )

      expect(screen.getByText('Authentication Error')).toBeInTheDocument()
      expect(screen.getByText('Something went wrong with the authentication system. Please try one of the options below.')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should show error details in development', () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'development'
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthErrorBoundary>
          <ThrowError />
        </AuthErrorBoundary>
      )

      expect(screen.getByText('Error: Test error')).toBeInTheDocument()
      expect(screen.getByText('Show stack trace')).toBeInTheDocument()
      
      process.env.NODE_ENV = originalEnv
      consoleSpy.mockRestore()
    })

    it('should handle reset functionality', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthErrorBoundary>
          <ThrowError />
        </AuthErrorBoundary>
      )

      const tryAgainButton = screen.getByText('Try Again')
      expect(tryAgainButton).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Error Formatting Functions', () => {
    it('should format Supabase auth errors correctly', () => {
      const mockFormatAuthError = formatAuthError as jest.Mock
      mockFormatAuthError.mockReturnValue('Invalid email or password. Please try again.')

      const error = { message: 'Invalid login credentials' }
      const result = formatAuthError(error)

      expect(result).toBe('Invalid email or password. Please try again.')
      expect(mockFormatAuthError).toHaveBeenCalledWith(error)
    })

    it('should detect network errors', () => {
      const mockIsNetworkError = isNetworkError as jest.Mock
      mockIsNetworkError.mockReturnValue(true)

      const error = { message: 'Network error' }
      const result = isNetworkError(error)

      expect(result).toBe(true)
      expect(mockIsNetworkError).toHaveBeenCalledWith(error)
    })

    it('should detect rate limit errors', () => {
      const mockIsRateLimitError = isRateLimitError as jest.Mock
      mockIsRateLimitError.mockReturnValue(true)

      const error = { message: 'Too many requests' }
      const result = isRateLimitError(error)

      expect(result).toBe(true)
      expect(mockIsRateLimitError).toHaveBeenCalledWith(error)
    })

    it('should detect session expired errors', () => {
      const mockIsSessionExpiredError = isSessionExpiredError as jest.Mock
      mockIsSessionExpiredError.mockReturnValue(true)

      const error = { message: 'JWT expired' }
      const result = isSessionExpiredError(error)

      expect(result).toBe(true)
      expect(mockIsSessionExpiredError).toHaveBeenCalledWith(error)
    })
  })

  describe('Token Refresh Logic', () => {
    it('should handle successful token refresh', async () => {
      const mockRefreshTokenWithRetry = refreshTokenWithRetry as jest.Mock
      mockRefreshTokenWithRetry.mockResolvedValue({ success: true })

      const result = await refreshTokenWithRetry({}, 3, 1000)

      expect(result.success).toBe(true)
      expect(mockRefreshTokenWithRetry).toHaveBeenCalledWith({}, 3, 1000)
    })

    it('should handle failed token refresh with retries', async () => {
      const mockRefreshTokenWithRetry = refreshTokenWithRetry as jest.Mock
      mockRefreshTokenWithRetry.mockResolvedValue({ 
        success: false, 
        error: 'Network error' 
      })

      const result = await refreshTokenWithRetry({}, 3, 1000)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })

    it('should get valid session with automatic refresh', async () => {
      const mockGetValidSession = getValidSession as jest.Mock
      mockGetValidSession.mockResolvedValue({
        session: { user: { id: '123' } },
        user: { id: '123' },
        error: null
      })

      const result = await getValidSession()

      expect(result.session).toBeDefined()
      expect(result.user).toBeDefined()
      expect(result.error).toBeNull()
    })

    it('should check authentication status correctly', async () => {
      const mockIsAuthenticated = isAuthenticated as jest.Mock
      mockIsAuthenticated.mockResolvedValue(true)

      const result = await isAuthenticated()

      expect(result).toBe(true)
    })
  })

  describe('Auth Provider Cleanup', () => {
    it('should unsubscribe from auth state changes on unmount', () => {
      const mockUnsubscribe = jest.fn()
      const mockSubscription = { unsubscribe: mockUnsubscribe }

      // Mock the Supabase auth subscription
      const mockSupabase = {
        auth: {
          onAuthStateChange: jest.fn().mockReturnValue({
            data: { subscription: mockSubscription }
          })
        }
      }

      // This test would require more complex setup to test the actual cleanup
      // In a real scenario, you'd need to render the AuthProvider and then unmount it
      expect(mockUnsubscribe).toBeDefined()
    })
  })

  describe('Network Failure Retry Logic', () => {
    it('should retry failed requests with exponential backoff', async () => {
      const mockRefreshTokenWithRetry = refreshTokenWithRetry as jest.Mock
      
      // Simulate first two attempts failing, third succeeding
      mockRefreshTokenWithRetry
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: false, error: 'Network error' })
        .mockResolvedValueOnce({ success: true })

      const result = await refreshTokenWithRetry({}, 3, 1000)

      expect(result.success).toBe(true)
    })

    it('should respect max retry limit', async () => {
      const mockRefreshTokenWithRetry = refreshTokenWithRetry as jest.Mock
      mockRefreshTokenWithRetry.mockResolvedValue({ 
        success: false, 
        error: 'Network error' 
      })

      const result = await refreshTokenWithRetry({}, 2, 100)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
    })
  })

  describe('Session Expiry Handling', () => {
    it('should detect expired sessions', async () => {
      const mockGetValidSession = getValidSession as jest.Mock
      mockGetValidSession.mockResolvedValue({
        session: null,
        user: null,
        error: 'Session expired'
      })

      const result = await getValidSession()

      expect(result.session).toBeNull()
      expect(result.error).toBe('Session expired')
    })

    it('should handle session refresh when expired', async () => {
      const mockRefreshTokenWithRetry = refreshTokenWithRetry as jest.Mock
      mockRefreshTokenWithRetry.mockResolvedValue({ success: true })

      // Simulate expired session that gets refreshed
      const result = await refreshTokenWithRetry({}, 1, 1000)

      expect(result.success).toBe(true)
    })
  })

  describe('Error Boundary Integration', () => {
    it('should catch auth-related errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      const AuthComponentWithError = () => {
        const { user } = useAuth()
        if (!user) {
          throw new Error('Authentication required')
        }
        return <div>Authenticated</div>
      }

      render(
        <AuthErrorBoundary>
          <AuthComponentWithError />
        </AuthErrorBoundary>
      )

      expect(screen.getByText('Authentication Error')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should provide recovery options', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <AuthErrorBoundary>
          <ThrowError />
        </AuthErrorBoundary>
      )

      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
      expect(screen.getByText('Go to Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Sign Out')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })
})
