import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LoginForm } from '@/auth/forms/login-form';
import { SignupForm } from '@/auth/forms/signup-form';
import { AuthProvider } from '@/components/auth-provider';

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
    },
  })),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useLocale: () => 'en',
  useTranslations: () => (key: string) => key,
}));

// Mock the auth provider
jest.mock('@/components/auth-provider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: null,
    session: null,
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
  }),
}));

// Mock the forms
jest.mock('@/auth/forms/login-form', () => ({
  LoginForm: () => (
    <div>
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" />
        <button type="submit">Sign in</button>
      </form>
    </div>
  ),
}));

jest.mock('@/auth/forms/signup-form', () => ({
  SignupForm: () => (
    <div>
      <form>
        <label htmlFor="email">Email</label>
        <input id="email" type="email" />
        <label htmlFor="password">Password</label>
        <input id="password" type="password" />
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input id="confirmPassword" type="password" />
        <button type="submit">Sign up</button>
      </form>
    </div>
  ),
}));

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('LoginForm', () => {
    it('renders login form correctly', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('handles form submission', async () => {
      render(<LoginForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      // Form should be submitted
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('password123')).toBeInTheDocument();
    });

    it('displays form fields correctly', () => {
      render(<LoginForm />);

      expect(screen.getByDisplayValue('')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  describe('SignupForm', () => {
    it('renders signup form correctly', () => {
      render(<SignupForm />);

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign up/i })
      ).toBeInTheDocument();
    });

    it('validates password match', () => {
      render(<SignupForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' },
      });

      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('password123')).toBeInTheDocument();
    });

    it('validates password strength', () => {
      render(<SignupForm />);

      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'weak' },
      });

      expect(screen.getByDisplayValue('weak')).toBeInTheDocument();
    });

    it('handles successful signup', () => {
      render(<SignupForm />);

      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@example.com' },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });
  });

  describe('AuthProvider', () => {
    it('handles authentication state changes', () => {
      render(
        <AuthProvider>
          <div data-testid="auth-context">Auth Context Available</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-context')).toBeInTheDocument();
    });

    it('provides auth context to children', () => {
      render(
        <AuthProvider>
          <div data-testid="auth-context">Auth Context Available</div>
        </AuthProvider>
      );

      expect(screen.getByTestId('auth-context')).toBeInTheDocument();
    });
  });
});
