/**
 * Enhanced Error Boundary Component
 * Advanced error handling with retry logic, error reporting, and fallback UI
 */

'use client';

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  componentName?: string;
  showDetails?: boolean;
  maxRetries?: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
  errorId: string;
}

export class EnhancedErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
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
    const { onError, componentName } = this.props;

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by boundary:', {
        component: componentName,
        error,
        errorInfo,
      });
    }

    // Call custom error handler
    onError?.(error, errorInfo);

    // Send to error reporting service (e.g., Sentry)
    this.reportError(error, errorInfo);

    this.setState({ errorInfo });
  }

  reportError = async (error: Error, errorInfo: ErrorInfo) => {
    const { componentName } = this.props;
    const { errorId } = this.state;

    // Prepare error data
    const errorData = {
      id: errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      component: componentName,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'N/A',
      url: typeof window !== 'undefined' ? window.location.href : 'N/A',
    };

    // Send to error reporting service
    try {
      // Example: Send to Sentry, LogRocket, or custom endpoint
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(errorData),
        });
      }
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  };

  handleReset = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    }
  };

  handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  handleReportIssue = () => {
    const { error, errorInfo, errorId } = this.state;
    const { componentName } = this.props;

    const issueBody = encodeURIComponent(`
**Error ID**: ${errorId}
**Component**: ${componentName || 'Unknown'}
**Error Message**: ${error?.message || 'No message'}

**Stack Trace**:
\`\`\`
${error?.stack || 'No stack trace'}
\`\`\`

**Component Stack**:
\`\`\`
${errorInfo?.componentStack || 'No component stack'}
\`\`\`

**Browser**: ${navigator.userAgent}
**URL**: ${window.location.href}
**Timestamp**: ${new Date().toISOString()}
    `);

    // Open GitHub issue or support ticket
    window.open(
      `https://github.com/yourusername/your-repo/issues/new?title=Error%20Report%20${errorId}&body=${issueBody}`,
      '_blank'
    );
  };

  render() {
    const { children, fallback, componentName, showDetails = false, maxRetries = 3 } = this.props;
    const { hasError, error, errorInfo, retryCount, errorId } = this.state;

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6">
          <Card className="max-w-2xl w-full border-destructive">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-xl">Something went wrong</CardTitle>
                  <CardDescription>
                    {componentName
                      ? `An error occurred in the ${componentName} component`
                      : 'An unexpected error has occurred'}
                  </CardDescription>
                </div>
                <Badge variant="destructive" className="ml-auto">
                  Error ID: {errorId.slice(-8)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Error Message */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-medium mb-1">Error Message:</p>
                <p className="text-sm text-muted-foreground font-mono">
                  {error?.message || 'Unknown error'}
                </p>
              </div>

              {/* Retry Information */}
              {retryCount > 0 && (
                <div className="text-sm text-muted-foreground">
                  Retry attempt: {retryCount} of {maxRetries}
                </div>
              )}

              {/* Error Details (Development Only or if showDetails is true) */}
              {(process.env.NODE_ENV === 'development' || showDetails) && (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                    Show technical details
                  </summary>
                  <div className="mt-3 space-y-3">
                    {/* Stack Trace */}
                    <div className="rounded-lg bg-slate-900 p-4 text-xs text-slate-100 overflow-auto max-h-60">
                      <p className="font-semibold mb-2 text-slate-300">Stack Trace:</p>
                      <pre className="whitespace-pre-wrap break-all">
                        {error?.stack || 'No stack trace available'}
                      </pre>
                    </div>

                    {/* Component Stack */}
                    {errorInfo?.componentStack && (
                      <div className="rounded-lg bg-slate-900 p-4 text-xs text-slate-100 overflow-auto max-h-60">
                        <p className="font-semibold mb-2 text-slate-300">Component Stack:</p>
                        <pre className="whitespace-pre-wrap">
                          {errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Helpful Tips */}
              <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-4">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  What you can do:
                </p>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Try refreshing the page</li>
                  <li>Clear your browser cache and cookies</li>
                  <li>Check your internet connection</li>
                  <li>Contact support if the problem persists</li>
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-wrap gap-2">
              {/* Retry Button */}
              {retryCount < maxRetries && (
                <Button onClick={this.handleReset} variant="default">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              )}

              {/* Go Home Button */}
              <Button onClick={this.handleGoHome} variant="outline">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>

              {/* Report Issue Button */}
              <Button onClick={this.handleReportIssue} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Report Issue
              </Button>

              {/* Copy Error ID */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(errorId);
                }}
                className="ml-auto"
              >
                Copy Error ID
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return children;
  }
}

/**
 * Functional wrapper for use with React hooks
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  return function WithErrorBoundaryWrapper(props: P) {
    return (
      <EnhancedErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </EnhancedErrorBoundary>
    );
  };
}

