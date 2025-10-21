'use client';

import React, { useState } from 'react';
import type { ErrorInfo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Mail,
  ChevronDown,
  ChevronUp,
  Copy,
  CheckCircle,
} from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo | null;
  resetError: () => void;
  section?: string | undefined;
  errorCount?: number | undefined;
}

export function ErrorFallback({
  error,
  errorInfo,
  resetError,
  section,
  errorCount,
}: ErrorFallbackProps) {
  const sectionName = section || 'Application';
  const count = errorCount || 1;
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const errorDetails = {
    message: error.message,
    name: error.name,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    section: sectionName,
    timestamp: new Date().toISOString(),
    url: typeof window !== 'undefined' ? window.location.href : 'N/A',
  };

  const handleCopyError = async () => {
    const errorText = `
Error Report
============
Section: ${section}
Time: ${errorDetails.timestamp}
URL: ${errorDetails.url}

Error: ${error.name}
Message: ${error.message}

Stack Trace:
${error.stack || 'Not available'}

Component Stack:
${errorInfo?.componentStack || 'Not available'}
    `.trim();

    try {
      await navigator.clipboard.writeText(errorText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy error details:', err);
    }
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent(`Error in ${sectionName} - ${error.name}`);
    const body = encodeURIComponent(`
I encountered an error in the ${sectionName} section:

Error: ${error.name}
Message: ${error.message}
Time: ${errorDetails.timestamp}
URL: ${errorDetails.url}

Please help resolve this issue.

[Add any additional context here]
    `.trim());

    window.location.href = `mailto:support@example.com?subject=${subject}&body=${body}`;
  };

  const getErrorGuidance = () => {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: 'Network Connection Issue',
        description: 'Unable to connect to the server. This might be a temporary network issue.',
        suggestions: [
          'Check your internet connection',
          'Try refreshing the page',
          'Check if the server is online',
          'Try again in a few moments',
        ],
      };
    }

    if (message.includes('permission') || message.includes('403')) {
      return {
        title: 'Permission Denied',
        description: 'You don\'t have permission to access this resource.',
        suggestions: [
          'Make sure you\'re logged in',
          'Contact an administrator for access',
          'Check if your session has expired',
          'Try logging out and back in',
        ],
      };
    }

    if (message.includes('not found') || message.includes('404')) {
      return {
        title: 'Resource Not Found',
        description: 'The requested resource could not be found.',
        suggestions: [
          'Check if the URL is correct',
          'The resource may have been moved or deleted',
          'Return to the home page',
          'Contact support if you believe this is an error',
        ],
      };
    }

    if (message.includes('timeout')) {
      return {
        title: 'Request Timeout',
        description: 'The operation took too long to complete.',
        suggestions: [
          'Try refreshing the page',
          'Check your internet connection',
          'The server might be experiencing high load',
          'Try again in a few moments',
        ],
      };
    }

    if (message.includes('invalid') || message.includes('validation')) {
      return {
        title: 'Invalid Data',
        description: 'The data provided was invalid or incomplete.',
        suggestions: [
          'Check all required fields are filled',
          'Verify the data format is correct',
          'Try refreshing and entering data again',
          'Contact support if the issue persists',
        ],
      };
    }

    // Default guidance
    return {
      title: 'Unexpected Error',
      description: 'An unexpected error occurred while processing your request.',
      suggestions: [
        'Try refreshing the page',
        'Clear your browser cache and cookies',
        'Try again in a few moments',
        'Contact support if the problem persists',
      ],
    };
  };

  const guidance = getErrorGuidance();

  return (
    <div className="flex min-h-[400px] items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-destructive/50 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle className="text-xl">{guidance.title}</CardTitle>
                <CardDescription className="mt-1">
                  {guidance.description}
                </CardDescription>
              </div>
            </div>
            {count > 1 && (
              <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                Error #{count}
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Error Message */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Details</AlertTitle>
            <AlertDescription>
              <code className="text-sm">{error.message}</code>
            </AlertDescription>
          </Alert>

          {/* Suggested Actions */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">What you can try:</h4>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              {guidance.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="mt-0.5 text-primary">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={resetError} className="flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = '/')}
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
            <Button
              variant="outline"
              onClick={handleContactSupport}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Contact Support
            </Button>
            <Button
              variant="ghost"
              onClick={handleCopyError}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Error
                </>
              )}
            </Button>
          </div>

          {/* Technical Details (Collapsible) */}
          <div className="border-t pt-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex w-full items-center justify-between text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Technical Details</span>
              {showDetails ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {showDetails && (
              <div className="mt-3 space-y-2 rounded-lg bg-muted p-3 text-xs font-mono">
                <div>
                  <span className="font-semibold">Section:</span> {sectionName}
                </div>
                <div>
                  <span className="font-semibold">Error Type:</span> {error.name}
                </div>
                <div>
                  <span className="font-semibold">Time:</span>{' '}
                  {new Date(errorDetails.timestamp).toLocaleString()}
                </div>
                {error.stack && (
                  <div className="mt-2">
                    <span className="font-semibold">Stack Trace:</span>
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-background p-2 text-xs">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div className="mt-2">
                    <span className="font-semibold">Component Stack:</span>
                    <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-background p-2 text-xs">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            If this error persists, please contact support with the error details above.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

