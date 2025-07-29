import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { LoginForm } from '@/auth/forms/login-form'
import { SignupForm } from '@/auth/forms/signup-form'
import { AuthProvider } from '@/src/components/auth/simple-auth-provider'
import { createClient } from '@/lib/supabase/client'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } }
      }))
    }
  }))
}))

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn()
  })
}))

const mockSupabase = createClient() as any

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('LoginForm', () => {
    it('renders login form correctly', () => {
      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      )

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
    })

    it('handles form submission', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: { id: '123', email: 'test@example.com' } },
        error: null
      })

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      )

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      })
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        })
      })
    })

    it('displays error message on login failure', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid credentials' }
      })

      render(
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      )

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'wrongpassword' }
      })
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument()
      })
    })
  })

  describe('SignupForm', () => {
    it('renders signup form correctly', () => {
      render(
        <AuthProvider>
          <SignupForm />
        </AuthProvider>
      )

      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument()
    })

    it('validates password match', async () => {
      render(
        <AuthProvider>
          <SignupForm />
        </AuthProvider>
      )

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' }
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'differentpassword' }
      })
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
      })
    })

    it('validates password strength', async () => {
      render(
        <AuthProvider>
          <SignupForm />
        </AuthProvider>
      )

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' }
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: '123' }
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: '123' }
      })
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters long/i)).toBeInTheDocument()
      })
    })

    it('handles successful signup', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: { id: '123', email: 'john@example.com' } },
        error: null
      })

      render(
        <AuthProvider>
          <SignupForm />
        </AuthProvider>
      )

      fireEvent.change(screen.getByLabelText(/full name/i), {
        target: { value: 'John Doe' }
      })
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'john@example.com' }
      })
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'password123' }
      })
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' }
      })
      fireEvent.click(screen.getByRole('button', { name: /create account/i }))

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: 'john@example.com',
          password: 'password123',
          options: {
            data: {
              full_name: 'John Doe',
              role: 'user',
              status: 'pending'
            }
          }
        })
      })
    })
  })

  describe('AuthProvider', () => {
    it('provides authentication context', () => {
      render(
        <AuthProvider>
          <div data-testid="auth-context">Auth Context Available</div>
        </AuthProvider>
      )

      expect(screen.getByTestId('auth-context')).toBeInTheDocument()
    })

    it('handles authentication state changes', async () => {
      const mockUser = { id: '123', email: 'test@example.com' }
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: { user: mockUser } }
      })

      render(
        <AuthProvider>
          <div data-testid="auth-context">Auth Context Available</div>
        </AuthProvider>
      )

      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalled()
      })
    })
  })
}) 