'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home, ArrowLeft, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Page Error:', error);
    
    // You can send this to your error reporting service here
    // Example: Sentry.captureException(error);
  }, [error]);

  const handleRetry = () => {
    reset();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleReportError = () => {
    const errorReport = {
      message: error.message,
      stack: error.stack,
      digest: error.digest,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    // Copy error report to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please send this to support.');
      })
      .catch(() => {
        // Fallback: open email client
        const subject = encodeURIComponent(`Page Error Report - ${error.digest || 'unknown'}`);
        const body = encodeURIComponent(JSON.stringify(errorReport, null, 2));
        window.open(`mailto:support@example.com?subject=${subject}&body=${body}`);
      });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-destructive" />
          </div>
          <CardTitle className="text-3xl font-bold text-destructive mb-2">
            Oops! Something went wrong
          </CardTitle>
          <CardDescription className="text-lg">
            We encountered an unexpected error while loading this page.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-muted p-4 rounded-lg border">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Bug className="w-4 h-4" />
                Error Details (Development)
              </h4>
              <div className="space-y-2 text-sm">
                <p><strong>Message:</strong> {error.message}</p>
                {error.digest && (
                  <p><strong>Error ID:</strong> {error.digest}</p>
                )}
                {error.stack && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-medium hover:text-foreground">
                      Stack Trace
                    </summary>
                    <pre className="text-xs text-muted-foreground mt-2 overflow-auto bg-background p-3 rounded border">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button onClick={handleRetry} variant="default" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button onClick={handleGoBack} variant="outline" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button onClick={handleGoHome} variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
            <Button onClick={handleReportError} variant="outline" className="w-full">
              <Bug className="w-4 h-4 mr-2" />
              Report Error
            </Button>
          </div>

          {/* Help Information */}
          <div className="text-center space-y-2 text-sm text-muted-foreground">
            {error.digest && (
              <p>Error ID: <code className="bg-muted px-2 py-1 rounded text-xs">{error.digest}</code></p>
            )}
            <p>If this problem persists, please contact our support team.</p>
            <p>We're here to help you get back on track.</p>
          </div>

          {/* Quick Links */}
          <div className="border-t pt-4">
            <h5 className="text-sm font-medium text-center mb-3">Quick Navigation</h5>
            <div className="flex flex-wrap justify-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/dashboard'}>
                Dashboard
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/contracts'}>
                Contracts
              </Button>
              <Button variant="ghost" size="sm" onClick={() => window.location.href = '/profile'}>
                Profile
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
