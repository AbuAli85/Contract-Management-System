'use client';

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
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
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the
 * component tree that crashed.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
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

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('Error Boundary caught an error:', {
      error: error.toString(),
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

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
    
    // Reload the page to reset the app state
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
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
                    Oops! Something went wrong
                  </CardTitle>
                  <CardDescription className='text-red-700 dark:text-red-300'>
                    We encountered an unexpected error while loading this page
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='rounded-md bg-red-50 p-4 dark:bg-red-950'>
                <p className='text-sm font-semibold text-red-900 dark:text-red-100'>
                  Error Details:
                </p>
                <p className='mt-2 text-sm text-red-800 dark:text-red-200'>
                  {this.state.error?.toString()}
                </p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className='mt-4'>
                    <summary className='cursor-pointer text-sm font-medium text-red-900 dark:text-red-100'>
                      Component Stack Trace
                    </summary>
                    <pre className='mt-2 max-h-64 overflow-auto rounded bg-red-100 p-2 text-xs text-red-900 dark:bg-red-900 dark:text-red-100'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>

              <div className='space-y-2'>
                <p className='text-sm text-slate-600 dark:text-slate-400'>
                  What you can do:
                </p>
                <ul className='list-inside list-disc space-y-1 text-sm text-slate-600 dark:text-slate-400'>
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Check your internet connection</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>

              <div className='flex flex-wrap gap-3 pt-4'>
                <Button
                  onClick={this.handleReset}
                  className='bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Reload Page
                </Button>
                <Button variant='outline' onClick={this.handleGoHome}>
                  <Home className='mr-2 h-4 w-4' />
                  Go to Home
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

/**
 * Hook-based Error Boundary wrapper for functional components
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
