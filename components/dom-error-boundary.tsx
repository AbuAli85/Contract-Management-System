'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class DOMErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // In production, you could send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    const errorReport = {
      errorId,
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Copy error report to clipboard
    navigator.clipboard
      .writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please send this to support.');
      })
      .catch(() => {
        // Fallback: open email client
        const subject = encodeURIComponent(`Error Report - ${errorId}`);
        const body = encodeURIComponent(JSON.stringify(errorReport, null, 2));
        window.open(
          `mailto:support@example.com?subject=${subject}&body=${body}`
        );
      });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen bg-background flex items-center justify-center p-4'>
          <Card className='w-full max-w-2xl'>
            <CardHeader className='text-center'>
              <div className='mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4'>
                <AlertTriangle className='w-8 h-8 text-destructive' />
              </div>
              <CardTitle className='text-2xl font-bold text-destructive'>
                Something went wrong
              </CardTitle>
              <CardDescription>
                We encountered an unexpected error. Our team has been notified.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className='bg-muted p-4 rounded-lg'>
                  <h4 className='font-semibold mb-2'>
                    Error Details (Development)
                  </h4>
                  <pre className='text-sm text-muted-foreground overflow-auto'>
                    {this.state.error.message}
                  </pre>
                  {this.state.errorInfo?.componentStack && (
                    <details className='mt-2'>
                      <summary className='cursor-pointer text-sm font-medium'>
                        Component Stack
                      </summary>
                      <pre className='text-xs text-muted-foreground mt-2 overflow-auto'>
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                <Button
                  onClick={this.handleRetry}
                  variant='default'
                  className='flex-1 sm:flex-none'
                >
                  <RefreshCw className='w-4 h-4 mr-2' />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  variant='outline'
                  className='flex-1 sm:flex-none'
                >
                  <Home className='w-4 h-4 mr-2' />
                  Go Home
                </Button>
                <Button
                  onClick={this.handleReportError}
                  variant='outline'
                  className='flex-1 sm:flex-none'
                >
                  <Mail className='w-4 h-4 mr-2' />
                  Report Error
                </Button>
              </div>

              <div className='text-center text-sm text-muted-foreground'>
                <p>Error ID: {this.state.errorId}</p>
                <p>If this problem persists, please contact support.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook for functional components to catch errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setError(event.error);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      setError(new Error(event.reason));
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener(
        'unhandledrejection',
        handleUnhandledRejection
      );
    };
  }, []);

  return error;
}
