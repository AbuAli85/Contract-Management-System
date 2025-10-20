'use client';

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 *
 * @example
 * ```tsx
 * <ErrorBoundary componentName="Promoters Page">
 *   <PromotersView />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error:', error, errorInfo);
      // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
      // logErrorToService(error, errorInfo);
    }

    // Call custom error handler if provided (only works from client components)
    if (typeof this.props.onError === 'function') {
      try {
        this.props.onError(error, errorInfo);
      } catch (e) {
        console.error('Error in onError handler:', e);
      }
    }

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
          <Card className='max-w-2xl w-full'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='rounded-full bg-red-100 p-3'>
                  <AlertTriangle className='h-6 w-6 text-red-600' />
                </div>
                <div>
                  <CardTitle className='text-2xl text-red-600'>
                    Something went wrong
                  </CardTitle>
                  <CardDescription>
                    {this.props.componentName || 'This page'} encountered an
                    unexpected error
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className='space-y-4'>
              {/* Error Message */}
              <Alert variant='destructive'>
                <AlertDescription>
                  <strong>Error:</strong>{' '}
                  {this.state.error?.message || 'Unknown error occurred'}
                </AlertDescription>
              </Alert>

              {/* Error Details (Development Only) */}
              {process.env.NODE_ENV === 'development' &&
                this.state.errorInfo && (
                  <details className='text-sm'>
                    <summary className='cursor-pointer font-semibold text-gray-700 hover:text-gray-900'>
                      Technical Details (Development)
                    </summary>
                    <pre className='mt-2 overflow-auto rounded-lg bg-gray-100 p-4 text-xs'>
                      {this.state.error?.stack}
                      {'\n\n'}
                      Component Stack:
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}

              {/* Troubleshooting Tips */}
              <div className='rounded-lg bg-blue-50 p-4'>
                <h3 className='font-semibold text-blue-900 mb-2'>
                  What you can try:
                </h3>
                <ul className='space-y-1 text-sm text-blue-800'>
                  <li>• Refresh the page to try again</li>
                  <li>• Clear your browser cache and cookies</li>
                  <li>• Try logging out and back in</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className='flex flex-wrap gap-3'>
                <Button onClick={this.handleReset} variant='default'>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Try Again
                </Button>

                <Button onClick={this.handleReload} variant='outline'>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Reload Page
                </Button>

                <Button onClick={this.handleGoHome} variant='outline'>
                  <Home className='mr-2 h-4 w-4' />
                  Go to Home
                </Button>
              </div>

              {/* Support Info */}
              <div className='text-xs text-gray-500 pt-4 border-t'>
                <p>
                  <strong>Error ID:</strong> {Date.now().toString(36)}
                </p>
                <p>
                  <strong>Time:</strong> {new Date().toISOString()}
                </p>
                {process.env.NODE_ENV === 'development' && (
                  <p className='mt-2 text-amber-600'>
                    ⚠️ Development mode: Full error details shown above
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple Error Fallback Component
 * Can be used as a custom fallback prop
 */
export function SimpleErrorFallback({
  error,
  resetErrorAction,
}: {
  error?: Error;
  resetErrorAction?: () => void;
}) {
  return (
    <div className='flex flex-col items-center justify-center p-8 space-y-4'>
      <AlertTriangle className='h-12 w-12 text-red-500' />
      <h2 className='text-xl font-semibold text-gray-900'>
        Oops! Something went wrong
      </h2>
      <p className='text-gray-600 text-center max-w-md'>
        {error?.message || 'An unexpected error occurred. Please try again.'}
      </p>
      {resetErrorAction && (
        <Button onClick={resetErrorAction} variant='default'>
          <RefreshCw className='mr-2 h-4 w-4' />
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Hook to use error boundary imperatively
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const showError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { showError, resetError };
}
