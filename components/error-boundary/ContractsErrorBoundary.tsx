'use client';

import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

export class ContractsErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌ Contracts Error Boundary caught an error:', {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    this.setState({
      errorInfo,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external error tracking service (e.g., Sentry)
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { extra: errorInfo });
    // }
  }

  handleReset = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="container mx-auto py-6 space-y-4">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Something Went Wrong</AlertTitle>
            <AlertDescription className="space-y-3">
              <p className="font-medium">
                An unexpected error occurred while loading this page.
              </p>
              <div className="text-sm space-y-2">
                <p className="text-muted-foreground">Error details:</p>
                <div className="bg-destructive/10 p-3 rounded-md">
                  <p className="font-mono text-xs break-all">
                    {this.state.error?.message || 'Unknown error'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  onClick={this.handleReset}
                  variant="default"
                  size="sm"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/en/dashboard">
                    <Home className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
              {this.state.retryCount > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Retry attempts: {this.state.retryCount}
                </p>
              )}
            </AlertDescription>
          </Alert>

          <Card>
            <CardContent className="py-12">
              <div className="text-center text-muted-foreground">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <h3 className="text-lg font-semibold mb-2">
                  Error Loading Contracts
                </h3>
                <p className="text-sm mb-4">
                  If this problem persists, please contact support.
                </p>
                {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-xs font-medium mb-2">
                      Developer Info (Development Only)
                    </summary>
                    <pre className="text-xs bg-muted p-4 rounded-md overflow-auto max-h-96">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
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

