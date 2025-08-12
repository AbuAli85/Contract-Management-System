'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RotateCcw } from 'lucide-react';
import AuthGuard from './auth-guard';

// Error boundary specifically for the contract form
class ContractFormErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error; errorInfo?: React.ErrorInfo }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('ContractFormErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ContractForm Error Details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Card className='mx-auto max-w-2xl'>
          <CardContent className='p-8 text-center'>
            <AlertTriangle className='mx-auto h-12 w-12 text-red-500 mb-4' />
            <h2 className='text-xl font-bold text-red-600 mb-4'>
              Contract Form Error
            </h2>
            <p className='text-gray-600 mb-6'>
              The contract form encountered an error and couldn't render
              properly. This might be due to data loading issues or component
              conflicts.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className='mb-6 p-4 bg-red-50 border border-red-200 rounded text-left'>
                <h3 className='font-bold text-red-800 mb-2'>Error Details:</h3>
                <p className='text-sm text-red-700 mb-2'>
                  <strong>Message:</strong> {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className='text-xs text-red-600'>
                    <summary className='cursor-pointer'>Stack Trace</summary>
                    <pre className='mt-2 whitespace-pre-wrap'>
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className='flex justify-center gap-4'>
              <Button onClick={this.handleRetry} variant='default'>
                <RotateCcw className='mr-2 h-4 w-4' />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant='outline'
              >
                Reload Page
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Loading component
const ContractFormLoader = () => (
  <Card className='mx-auto max-w-4xl'>
    <CardContent className='p-8'>
      <div className='flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4'></div>
          <h3 className='text-lg font-semibold mb-2'>Loading Contract Form</h3>
          <p className='text-gray-600'>
            Please wait while we load the contract generation form...
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Dynamic import with maximum safety and auth context handling
const SafeUnifiedContractGeneratorForm = dynamic(
  () =>
    import('@/components/unified-contract-generator-form').catch(err => {
      console.error('Failed to load UnifiedContractGeneratorForm:', err);
      // Return a fallback component if import fails
      return {
        default: () => (
          <Card className='mx-auto max-w-2xl'>
            <CardContent className='p-8 text-center'>
              <AlertTriangle className='mx-auto h-12 w-12 text-red-500 mb-4' />
              <h2 className='text-xl font-bold text-red-600 mb-4'>
                Form Loading Failed
              </h2>
              <p className='text-gray-600 mb-6'>
                Unable to load the contract form. This might be due to
                authentication or network issues.
              </p>
              <div className='flex justify-center gap-4'>
                <Button onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
                <Button
                  variant='outline'
                  onClick={() => (window.location.href = '/login')}
                >
                  Go to Login
                </Button>
              </div>
            </CardContent>
          </Card>
        ),
      };
    }),
  {
    loading: ContractFormLoader,
    ssr: false,
  }
);

// Main wrapper component with auth guard
export default function ContractFormWrapper(props: any) {
  return (
    <AuthGuard requireAuth={false}>
      <ContractFormErrorBoundary>
        <Suspense fallback={<ContractFormLoader />}>
          <SafeUnifiedContractGeneratorForm {...props} />
        </Suspense>
      </ContractFormErrorBoundary>
    </AuthGuard>
  );
}
