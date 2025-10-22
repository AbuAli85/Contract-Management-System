'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Bug, Wifi, WifiOff } from 'lucide-react';
import Link from 'next/link';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
  retryCount: number;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  maxRetries?: number;
}

export class PartiesErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Parties Error Boundary caught an error:', error, errorInfo);
    
    this.setState({ error, errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      // Example: Sentry.captureException(error, { extra: errorInfo });
      console.error('Production error - consider logging to external service:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({ 
        hasError: false, 
        retryCount: prevState.retryCount + 1 
      }));
    } else {
      // Reset retry count after max retries reached
      this.setState({ retryCount: 0 });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  getErrorMessage = (error: Error): { title: string; message: string; canRetry: boolean } => {
    const errorMessage = error.message.toLowerCase();
    
    // Network/connection errors
    if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
      return {
        title: 'Request Timeout',
        message: 'The server took too long to respond. This might be due to network issues or server load.',
        canRetry: true,
      };
    }
    
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return {
        title: 'Network Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        canRetry: true,
      };
    }
    
    // Authentication errors
    if (errorMessage.includes('unauthorized') || errorMessage.includes('401')) {
      return {
        title: 'Authentication Required',
        message: 'Your session has expired. Please log in again to continue.',
        canRetry: false,
      };
    }
    
    // Server errors
    if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
      return {
        title: 'Server Error',
        message: 'The server encountered an error while processing your request. Please try again later.',
        canRetry: true,
      };
    }
    
    // Database errors
    if (errorMessage.includes('database') || errorMessage.includes('failed to fetch parties')) {
      return {
        title: 'Database Error',
        message: 'Unable to retrieve parties data from the database. Please try again.',
        canRetry: true,
      };
    }
    
    // React/Component errors
    if (errorMessage.includes('component') || errorMessage.includes('render')) {
      return {
        title: 'Component Error',
        message: 'There was an error rendering the parties page. Please refresh the page.',
        canRetry: true,
      };
    }
    
    // Default error
    return {
      title: 'Application Error',
      message: error.message || 'Something went wrong with the parties page',
      canRetry: true,
    };
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback } = this.props;
      const { error, retryCount } = this.state;
      const errorInfo = this.getErrorMessage(error);
      const { maxRetries = 3 } = this.props;

      // Use custom fallback if provided
      if (Fallback) {
        return <Fallback error={error} retry={this.handleRetry} />;
      }

      return (
        <div className='flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
          <Card className='w-full max-w-2xl border-red-200 dark:border-red-800'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='rounded-full bg-red-100 p-3 dark:bg-red-900'>
                  <AlertTriangle className='h-6 w-6 text-red-600 dark:text-red-300' />
                </div>
                <div>
                  <CardTitle className='text-red-900 dark:text-red-100'>
                    {errorInfo.title}
                  </CardTitle>
                  <CardDescription className='text-red-700 dark:text-red-300'>
                    {errorInfo.message}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {/* Retry information */}
              {retryCount > 0 && (
                <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
                  <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                    <RefreshCw className='mr-2 inline h-4 w-4' />
                    Retry attempt {retryCount} of {maxRetries}
                  </p>
                </div>
              )}

              {/* Technical details in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-900'>
                  <details className='text-sm'>
                    <summary className='cursor-pointer font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                      <Bug className='h-4 w-4' />
                      Technical Details
                    </summary>
                    <div className='mt-2 space-y-2'>
                      <div>
                        <strong>Error:</strong> {error.message}
                      </div>
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className='mt-1 text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32'>
                          {this.state.errorInfo?.componentStack}
                        </pre>
                      </div>
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className='mt-1 text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32'>
                          {error.stack}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* Action buttons */}
              <div className='flex flex-wrap gap-2'>
                {errorInfo.canRetry && retryCount < maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    className='flex-1 min-w-[120px]'
                  >
                    <RefreshCw className='mr-2 h-4 w-4' />
                    Try Again ({maxRetries - retryCount} left)
                  </Button>
                )}
                
                <Button variant='outline' onClick={this.handleReload}>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Reload Page
                </Button>
                
                <Button variant='outline' asChild>
                  <Link href='/en/dashboard'>
                    <Home className='mr-2 h-4 w-4' />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>

              {/* Network status indicator */}
              <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                {typeof navigator !== 'undefined' && navigator.onLine ? (
                  <>
                    <Wifi className='h-4 w-4 text-green-500' />
                    Online
                  </>
                ) : (
                  <>
                    <WifiOff className='h-4 w-4 text-red-500' />
                    Offline - Check your internet connection
                  </>
                )}
              </div>

              {/* Help text */}
              <div className='text-xs text-gray-500 dark:text-gray-400'>
                If this problem persists, please contact support with the error details above.
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Generic ErrorBoundary component (alias for PartiesErrorBoundary)
interface GenericErrorBoundaryProps extends ErrorBoundaryProps {
  componentName?: string;
}

export class ErrorBoundary extends React.Component<GenericErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: GenericErrorBoundaryProps) {
    super(props);
    this.state = { 
      hasError: false, 
      retryCount: 0 
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { 
      hasError: true, 
      error 
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { componentName } = this.props;
    console.error(`${componentName || 'Component'} Error Boundary caught an error:`, error, errorInfo);
    
    this.setState({ error, errorInfo });
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (process.env.NODE_ENV === 'production') {
      console.error('Production error - consider logging to external service:', {
        component: componentName || 'Unknown',
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({ 
        hasError: false, 
        retryCount: prevState.retryCount + 1 
      }));
    } else {
      // Reset retry count after max retries reached
      this.setState({ retryCount: 0 });
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const { fallback: Fallback, componentName } = this.props;
      const { error, retryCount } = this.state;
      const { maxRetries = 3 } = this.props;

      // Use custom fallback if provided
      if (Fallback) {
        return <Fallback error={error} retry={this.handleRetry} />;
      }

      return (
        <div className='flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950'>
          <Card className='w-full max-w-2xl border-red-200 dark:border-red-800'>
            <CardHeader>
              <div className='flex items-center gap-3'>
                <div className='rounded-full bg-red-100 p-3 dark:bg-red-900'>
                  <AlertTriangle className='h-6 w-6 text-red-600 dark:text-red-300' />
                </div>
                <div>
                  <CardTitle className='text-red-900 dark:text-red-100'>
                    {componentName || 'Application'} Error
                  </CardTitle>
                  <CardDescription className='text-red-700 dark:text-red-300'>
                    Something went wrong in this component
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-lg bg-red-50 p-4 dark:bg-red-900/20'>
                <p className='text-sm text-red-800 dark:text-red-200'>
                  {error.message || 'An unexpected error occurred'}
                </p>
              </div>

              {/* Retry information */}
              {retryCount > 0 && (
                <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
                  <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                    <RefreshCw className='mr-2 inline h-4 w-4' />
                    Retry attempt {retryCount} of {maxRetries}
                  </p>
                </div>
              )}

              {/* Technical details in development */}
              {process.env.NODE_ENV === 'development' && (
                <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-900'>
                  <details className='text-sm'>
                    <summary className='cursor-pointer font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2'>
                      <Bug className='h-4 w-4' />
                      Technical Details
                    </summary>
                    <div className='mt-2 space-y-2'>
                      <div>
                        <strong>Error:</strong> {error.message}
                      </div>
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className='mt-1 text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32'>
                          {this.state.errorInfo?.componentStack}
                        </pre>
                      </div>
                      <div>
                        <strong>Stack Trace:</strong>
                        <pre className='mt-1 text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-32'>
                          {error.stack}
                        </pre>
                      </div>
                    </div>
                  </details>
                </div>
              )}

              {/* Action buttons */}
              <div className='flex flex-wrap gap-2'>
                {retryCount < maxRetries && (
                  <Button
                    onClick={this.handleRetry}
                    className='flex-1 min-w-[120px]'
                  >
                    <RefreshCw className='mr-2 h-4 w-4' />
                    Try Again ({maxRetries - retryCount} left)
                  </Button>
                )}
                
                <Button variant='outline' onClick={this.handleReload}>
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Reload Page
                </Button>
                
                <Button variant='outline' asChild>
                  <Link href='/en/dashboard'>
                    <Home className='mr-2 h-4 w-4' />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withPartiesErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <PartiesErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </PartiesErrorBoundary>
    );
  };
}

// Hook for error boundary state
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
}