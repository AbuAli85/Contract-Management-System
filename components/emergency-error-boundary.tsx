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
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

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
  retryCount: number;
}

export class EmergencyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isRetrying: false,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      '🚨 Emergency Error Boundary caught error:',
      error,
      errorInfo
    );

    this.setState({
      error,
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = async () => {
    if (this.state.retryCount >= 3) {
      console.warn('Maximum retry attempts reached');
      return;
    }

    this.setState({ isRetrying: true });

    try {
      // Clear any cached state that might be causing issues
      if (typeof window !== 'undefined') {
        // Clear localStorage auth data
        Object.keys(localStorage).forEach(key => {
          if (key.includes('auth') || key.includes('supabase')) {
            try {
              localStorage.removeItem(key);
            } catch (e) {
              console.warn('Failed to clear localStorage key:', key);
            }
          }
        });
      }

      // Wait a moment before retrying
      await new Promise(resolve => setTimeout(resolve, 1000));

      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: this.state.retryCount + 1,
      });
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
    if (typeof window !== 'undefined') {
      window.location.href = `/${window.location.pathname.startsWith('/ar/') ? 'ar' : 'en'}/dashboard`;
    }
  };

  private handleRefreshPage = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'Unknown error';
      const isAuthError =
        errorMessage.toLowerCase().includes('auth') ||
        errorMessage.toLowerCase().includes('session') ||
        errorMessage.toLowerCase().includes('token') ||
        (errorMessage.toLowerCase().includes('undefined') &&
          errorMessage.includes('length'));

      return (
        <div className='min-h-screen bg-background flex items-center justify-center p-4'>
          <Card className='w-full max-w-md'>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center'>
                <AlertTriangle className='h-6 w-6 text-destructive' />
              </div>
              <CardTitle className='text-xl'>
                {isAuthError ? 'Authentication Error' : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {isAuthError
                  ? 'There was a problem with the authentication system'
                  : 'An unexpected error occurred in the application'}
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription className='text-sm'>
                  <strong>Error:</strong> {errorMessage}
                </AlertDescription>
              </Alert>

              <div className='space-y-2'>
                <Button
                  onClick={this.handleRetry}
                  disabled={this.state.isRetrying || this.state.retryCount >= 3}
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
                      {this.state.retryCount >= 3
                        ? 'Max retries reached'
                        : `Retry (${this.state.retryCount}/3)`}
                    </>
                  )}
                </Button>

                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={this.handleRefreshPage}
                    className='flex-1'
                  >
                    Refresh Page
                  </Button>
                  <Button
                    variant='outline'
                    onClick={this.handleGoHome}
                    className='flex-1'
                  >
                    <Home className='mr-2 h-4 w-4' />
                    Go Home
                  </Button>
                </div>
              </div>

              {/* Debug info for development */}
              {process.env.NODE_ENV === 'development' &&
                this.state.errorInfo && (
                  <details className='text-xs bg-muted p-2 rounded'>
                    <summary className='cursor-pointer font-medium'>
                      Debug Info
                    </summary>
                    <pre className='mt-2 whitespace-pre-wrap overflow-auto max-h-32'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

              <div className='text-center text-xs text-muted-foreground'>
                <p>If this problem persists, try:</p>
                <ul className='list-disc list-inside mt-1 space-y-1'>
                  <li>Clearing your browser cache</li>
                  <li>Logging out and back in</li>
                  <li>Using an incognito/private window</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Functional wrapper for easier usage with hooks
interface EmergencyErrorBoundaryWrapperProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

export function EmergencyErrorBoundaryWrapper({
  children,
  fallback,
  onError,
}: EmergencyErrorBoundaryWrapperProps) {
  const handleError = (error: Error, errorInfo: ErrorInfo) => {
    // Custom error handling logic
    if (onError) {
      onError(error, errorInfo);
    }

    // Log to console for debugging
    console.error('🚨 Emergency Error Boundary - Error:', error);
    console.error('🚨 Emergency Error Boundary - Error Info:', errorInfo);

    // Check if it's an authentication-related error
    const isAuthError =
      error.message.includes('auth') ||
      error.message.includes('session') ||
      error.message.includes('token') ||
      error.message.includes('unauthorized') ||
      (error.message.includes('undefined') && error.message.includes('length'));

    if (isAuthError) {
      // Clear any problematic auth state
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('supabase.auth.token');
          sessionStorage.clear();
        } catch (e) {
          console.warn('Failed to clear auth storage:', e);
        }
      }
    }
  };

  return (
    <EmergencyErrorBoundary fallback={fallback} onError={handleError}>
      {children}
    </EmergencyErrorBoundary>
  );
}

// Higher-order component for wrapping components with error boundary
export function withEmergencyErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: P) {
    return (
      <EmergencyErrorBoundaryWrapper fallback={fallback}>
        <Component {...props} />
      </EmergencyErrorBoundaryWrapper>
    );
  };
}
