'use client';

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorFallback } from '@/components/errors/error-fallback';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | undefined;
  onError?: ((error: Error, errorInfo: ErrorInfo) => void) | undefined;
  resetKeys?: Array<string | number> | undefined;
  section?: string | undefined;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors in child components and displays a fallback UI
 * instead of crashing the entire application.
 * 
 * Usage:
 * ```tsx
 * <ErrorBoundary section="Contracts">
 *   <ContractsPage />
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
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🔴 Error Boundary caught an error:', error, errorInfo);
    }

    // Update state with error details
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }));

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external monitoring service
    this.logErrorToService(error, errorInfo);
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error boundary when resetKeys change
    if (
      this.props.resetKeys &&
      prevProps.resetKeys &&
      this.props.resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.reset();
    }
  }

  private logErrorToService(error: Error, errorInfo: ErrorInfo) {
    try {
      // Log to your monitoring service (e.g., Sentry)
      // For now, we'll use console in a structured way
      const errorData = {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        section: this.props.section || 'Unknown',
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : 'SSR',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'SSR',
      };

      console.error('📊 Error Boundary - Structured Error:', errorData);

      // TODO: Send to external monitoring service
      // Example: Sentry.captureException(error, { extra: errorData });
    } catch (loggingError) {
      console.error('Failed to log error to monitoring service:', loggingError);
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use default fallback component
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetError={this.reset}
          section={this.props.section}
          errorCount={this.state.errorCount}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based wrapper for Error Boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode | undefined;
    section?: string | undefined;
    onError?: ((error: Error, errorInfo: ErrorInfo) => void) | undefined;
  }
) {
  const WrappedComponent = (props: P) => {
    return (
      <ErrorBoundary
        fallback={options?.fallback}
        section={options?.section}
        onError={options?.onError}
      >
        <Component {...props} />
      </ErrorBoundary>
    );
  };

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || 'Component'})`;

  return WrappedComponent;
}

