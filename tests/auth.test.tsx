import { render, screen } from '@testing-library/react'
import { useAuth } from '@/src/components/auth/auth-provider'
import { ProtectedRoute } from '@/components/ProtectedRoute'

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
})
