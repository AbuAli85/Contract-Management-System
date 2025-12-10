'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class PromotersErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to error reporting service
    console.error('PromotersErrorBoundary caught an error:', error, errorInfo);
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

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className='max-w-2xl mx-auto mt-8 border-2 border-red-200 bg-red-50/50 dark:bg-red-900/10'>
          <CardHeader>
            <div className='flex items-center gap-3'>
              <div className='p-3 rounded-full bg-red-100 dark:bg-red-900/30'>
                <AlertTriangle className='h-6 w-6 text-red-600 dark:text-red-400' />
              </div>
              <div>
                <CardTitle className='text-xl text-red-900 dark:text-red-100'>
                  Something went wrong
                </CardTitle>
                <p className='text-sm text-red-700 dark:text-red-300 mt-1'>
                  An error occurred while loading the Promoter Intelligence Hub
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className='space-y-4'>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className='p-4 bg-red-100 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800'>
                <p className='text-xs font-mono text-red-800 dark:text-red-200 break-all'>
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className='mt-2'>
                    <summary className='text-xs text-red-700 dark:text-red-300 cursor-pointer'>
                      Stack Trace
                    </summary>
                    <pre className='text-xs mt-2 text-red-800 dark:text-red-200 overflow-auto'>
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}
            <div className='flex gap-3'>
              <Button onClick={this.handleReset} variant='default'>
                <RefreshCw className='mr-2 h-4 w-4' />
                Try Again
              </Button>
              <ErrorBoundaryActions />
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

function ErrorBoundaryActions() {
  const router = useRouter();

  return (
    <>
      <Button
        variant='outline'
        onClick={() => {
          window.location.reload();
        }}
      >
        Reload Page
      </Button>
      <Button
        variant='outline'
        onClick={() => {
          router.push('/dashboard');
        }}
      >
        <Home className='mr-2 h-4 w-4' />
        Go to Dashboard
      </Button>
    </>
  );
}

