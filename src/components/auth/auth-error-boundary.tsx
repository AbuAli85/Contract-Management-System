'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, RefreshCw, Home, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthContext as useAuth } from '@/components/auth-provider';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isRetrying: boolean;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 AuthErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log error to external service (e.g., Sentry)
    this.logErrorToService(error, errorInfo);
  }

  private logErrorToService = (error: Error, errorInfo: ErrorInfo) => {
    // TODO: Integrate with error reporting service like Sentry
    console.error('Error logged to service:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });
  };

  private handleRetry = async () => {
    this.setState({ isRetrying: true });

    try {
      // Clear the error state
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
      });

      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      this.setState({
        hasError: true,
        error: retryError as Error,
      });
    } finally {
      this.setState({ isRetrying: false });
    }
  };

  private handleGoHome = () => {
    window.location.href = `/${window.location.pathname.startsWith('/ar/') ? 'ar' : 'en'}/dashboard`;
  };

  private handleSignOut = async () => {
    try {
      // Import auth provider dynamically to avoid circular dependencies
      const { useAuthContext } = await import('@/components/auth-provider');
      // Note: This won't work in class components, but we'll handle it in the functional wrapper
      window.location.href = `/${window.location.pathname.startsWith('/ar/') ? 'ar' : 'en'}/logout`;
    } catch (error) {
      console.error('Sign out failed:', error);
      window.location.href = `/${window.location.pathname.startsWith('/ar/') ? 'ar' : 'en'}/logout`;
    }
  };

  private handleContactSupport = () => {
    // Open support contact form or email
    const supportEmail = 'support@contractmanagement.com';
    const subject = encodeURIComponent('Authentication Error Report');
    const body = encodeURIComponent(
      `Error Details:\n` +
        `- Message: ${this.state.error?.message || 'Unknown'}\n` +
        `- Stack: ${this.state.error?.stack || 'No stack trace'}\n` +
        `- Component Stack: ${
          this.state.errorInfo?.componentStack || 'No component stack'
        }\n` +
        `- URL: ${window.location.href}\n` +
        `- User Agent: ${navigator.userAgent}\n` +
        `- Timestamp: ${new Date().toISOString()}\n`
    );

    window.open(`mailto:${supportEmail}?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='flex min-h-screen items-center justify-center bg-gray-50 p-4'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100'>
                <AlertTriangle className='h-6 w-6 text-red-600' />
              </div>
              <CardTitle className='text-xl font-semibold text-gray-900'>
                Authentication Error
              </CardTitle>
              <CardDescription className='text-gray-600'>
                Something went wrong with the authentication system. We're here
                to help you get back on track.
              </CardDescription>
            </CardHeader>

            <CardContent className='space-y-4'>
              {/* Error Details (collapsible for debugging) */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Alert variant='destructive'>
                  <AlertDescription className='text-sm'>
                    <details className='cursor-pointer'>
                      <summary className='font-medium'>
                        Error Details (Development)
                      </summary>
                      <div className='mt-2 text-xs'>
                        <p>
                          <strong>Message:</strong> {this.state.error.message}
                        </p>
                        <p>
                          <strong>Stack:</strong>
                        </p>
                        <pre className='mt-1 whitespace-pre-wrap rounded bg-gray-100 p-2 text-xs'>
                          {this.state.error.stack}
                        </pre>
                        {this.state.errorInfo && (
                          <>
                            <p>
                              <strong>Component Stack:</strong>
                            </p>
                            <pre className='mt-1 whitespace-pre-wrap rounded bg-gray-100 p-2 text-xs'>
                              {this.state.errorInfo.componentStack}
                            </pre>
                          </>
                        )}
                      </div>
                    </details>
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className='space-y-3'>
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying}
                  className='w-full'
                >
                  {this.state.isRetrying ? (
                    <>
                      <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RefreshCw className='mr-2 h-4 w-4' />
                      Try Again
                    </>
                  )}
                </Button>

                <div className='grid grid-cols-2 gap-3'>
                  <Button
                    variant='outline'
                    onClick={this.handleGoHome}
                    className='w-full'
                  >
                    <Home className='mr-2 h-4 w-4' />
                    Go Home
                  </Button>

                  <Button
                    variant='outline'
                    onClick={this.handleSignOut}
                    className='w-full'
                  >
                    <LogOut className='mr-2 h-4 w-4' />
                    Sign Out
                  </Button>
                </div>

                <Button
                  variant='ghost'
                  onClick={this.handleContactSupport}
                  className='w-full text-sm'
                >
                  Contact Support
                </Button>
              </div>

              {/* Additional Help */}
              <div className='text-center text-xs text-gray-500'>
                <p>
                  If this problem persists, please contact our support team.
                </p>
                <p className='mt-1'>
                  Error ID: {this.state.error?.name || 'UNKNOWN'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper component for easier usage with hooks
interface AuthErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function AuthErrorBoundaryWrapper({
  children,
  fallback,
  onError,
}: AuthErrorBoundaryWrapperProps) {
  const router = useRouter();
  const { signOut } = useAuth();

  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Custom error handling logic
    if (onError) {
      onError(error, errorInfo);
    }

    // Check if it's an authentication-related error
    const isAuthError =
      error.message.includes('auth') ||
      error.message.includes('session') ||
      error.message.includes('token') ||
      error.message.includes('unauthorized');

    if (isAuthError) {
      // Redirect to login page for auth errors
      setTimeout(() => {
        router.push(
          `/${typeof window !== 'undefined' && navigator.language?.startsWith('ar') ? 'ar' : 'en'}/login`
        );
      }, 2000);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push(
        `/${typeof window !== 'undefined' && navigator.language?.startsWith('ar') ? 'ar' : 'en'}/login`
      );
    } catch (error) {
      console.error('Sign out failed:', error);
      router.push(
        `/${typeof window !== 'undefined' && navigator.language?.startsWith('ar') ? 'ar' : 'en'}/login`
      );
    }
  };

  return (
    <AuthErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </AuthErrorBoundary>
  );
}

// Higher-order component for wrapping components with error boundary
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <AuthErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AuthErrorBoundary>
    );
  };
}

// Hook for manual error boundary control
export function useAuthErrorBoundary() {
  const [hasError, setHasError] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setHasError(false);
    setError(null);
  }, []);

  const handleError = React.useCallback((error: Error) => {
    setHasError(true);
    setError(error);
  }, []);

  return {
    hasError,
    error,
    resetError,
    handleError,
  };
}
