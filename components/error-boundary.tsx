'use client';

import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className='border-red-200 bg-red-50'>
          <CardContent className='p-6'>
            <div className='flex items-start gap-3'>
              <AlertTriangle className='h-5 w-5 text-red-600 mt-0.5 flex-shrink-0' />
              <div className='flex-1'>
                <h3 className='font-semibold text-red-800 mb-2'>
                  Something went wrong
                </h3>
                <p className='text-red-700 mb-4'>
                  An unexpected error occurred while loading this content.
                  Please try again.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.error && (
                  <details className='mb-4'>
                    <summary className='cursor-pointer text-sm text-red-600 font-medium'>
                      Error Details (Development)
                    </summary>
                    <pre className='mt-2 text-xs text-red-600 bg-red-100 p-2 rounded overflow-auto'>
                      {this.state.error.message}
                    </pre>
                  </details>
                )}
                <Button
                  onClick={this.handleRetry}
                  variant='outline'
                  size='sm'
                  className='flex items-center gap-2'
                >
                  <RefreshCw className='h-4 w-4' />
                  Try Again
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
