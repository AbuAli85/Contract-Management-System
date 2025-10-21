'use client';

import React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  RefreshCw,
  Wifi,
  Lock,
  FileQuestion,
  Clock,
  Database,
  AlertCircle,
  Shield,
  Server,
} from 'lucide-react';

/**
 * Specific Error Components
 * 
 * These components provide user-friendly, actionable error messages
 * for specific error scenarios.
 */

export interface BaseErrorProps {
  message?: string | undefined;
  onRetry?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
  showRetry?: boolean | undefined;
}

export function NetworkError({ message, onRetry, showRetry = true }: BaseErrorProps) {
  return (
    <Alert variant="destructive" className="border-orange-500/50">
      <Wifi className="h-4 w-4" />
      <AlertTitle>Network Connection Issue</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          {message || 'Unable to connect to the server. Please check your internet connection.'}
        </p>
        <div className="space-y-1.5 text-sm mb-3">
          <p className="font-medium">What you can do:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Check your internet connection</li>
            <li>Verify the server is online</li>
            <li>Try again in a few moments</li>
          </ul>
        </div>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm" className="mt-2">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Connection
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function PermissionError({ message, onRetry }: BaseErrorProps) {
  return (
    <Alert variant="destructive" className="border-red-500/50">
      <Lock className="h-4 w-4" />
      <AlertTitle>Permission Denied</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          {message || 'You don\'t have permission to access this resource.'}
        </p>
        <div className="space-y-1.5 text-sm mb-3">
          <p className="font-medium">What you can do:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Make sure you're logged in</li>
            <li>Contact an administrator for access</li>
            <li>Check if your session has expired</li>
          </ul>
        </div>
        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          )}
          <Button onClick={() => window.location.href = '/login'} variant="outline" size="sm">
            Go to Login
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

export function NotFoundError({ message, resourceType = 'Resource' }: BaseErrorProps & { resourceType?: string }) {
  return (
    <Alert variant="destructive" className="border-yellow-500/50">
      <FileQuestion className="h-4 w-4" />
      <AlertTitle>{resourceType} Not Found</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          {message || `The ${resourceType.toLowerCase()} you're looking for could not be found.`}
        </p>
        <div className="space-y-1.5 text-sm mb-3">
          <p className="font-medium">Possible reasons:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>The {resourceType.toLowerCase()} may have been moved or deleted</li>
            <li>The URL might be incorrect</li>
            <li>You might not have permission to view it</li>
          </ul>
        </div>
        <Button onClick={() => window.history.back()} variant="outline" size="sm">
          Go Back
        </Button>
      </AlertDescription>
    </Alert>
  );
}

export function TimeoutError({ message, onRetry, showRetry = true }: BaseErrorProps) {
  return (
    <Alert variant="destructive" className="border-amber-500/50">
      <Clock className="h-4 w-4" />
      <AlertTitle>Request Timeout</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          {message || 'The operation took too long to complete.'}
        </p>
        <div className="space-y-1.5 text-sm mb-3">
          <p className="font-medium">What you can do:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Check your internet connection speed</li>
            <li>The server might be experiencing high load</li>
            <li>Try again in a few moments</li>
          </ul>
        </div>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function ValidationError({ message, errors }: BaseErrorProps & { errors?: string[] }) {
  return (
    <Alert variant="destructive" className="border-purple-500/50">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Validation Error</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          {message || 'The data provided is invalid or incomplete.'}
        </p>
        {errors && errors.length > 0 && (
          <div className="space-y-1.5 text-sm mb-3">
            <p className="font-medium">Please fix the following:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <p className="text-sm text-muted-foreground mt-2">
          Please correct the highlighted fields and try again.
        </p>
      </AlertDescription>
    </Alert>
  );
}

export function DatabaseError({ message, onRetry, showRetry = true }: BaseErrorProps) {
  return (
    <Alert variant="destructive" className="border-red-600/50">
      <Database className="h-4 w-4" />
      <AlertTitle>Database Error</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          {message || 'A database error occurred while processing your request.'}
        </p>
        <div className="space-y-1.5 text-sm mb-3">
          <p className="font-medium">What you can do:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Try refreshing the page</li>
            <li>Contact support if the issue persists</li>
            <li>The issue might be temporary</li>
          </ul>
        </div>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function ServerError({ message, onRetry, showRetry = true }: BaseErrorProps) {
  return (
    <Alert variant="destructive" className="border-red-700/50">
      <Server className="h-4 w-4" />
      <AlertTitle>Server Error</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          {message || 'The server encountered an error while processing your request.'}
        </p>
        <div className="space-y-1.5 text-sm mb-3">
          <p className="font-medium">What you can do:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Try refreshing the page</li>
            <li>Wait a few moments and try again</li>
            <li>Contact support if the problem persists</li>
          </ul>
        </div>
        {showRetry && onRetry && (
          <Button onClick={onRetry} variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function RateLimitError({ message, retryAfter }: BaseErrorProps & { retryAfter?: number }) {
  return (
    <Alert variant="destructive" className="border-orange-600/50">
      <Shield className="h-4 w-4" />
      <AlertTitle>Rate Limit Exceeded</AlertTitle>
      <AlertDescription>
        <p className="mb-3">
          {message || 'You\'ve made too many requests. Please slow down.'}
        </p>
        {retryAfter && (
          <p className="text-sm font-medium mb-3">
            Please wait {Math.ceil(retryAfter / 60)} minute(s) before trying again.
          </p>
        )}
        <div className="space-y-1.5 text-sm">
          <p className="font-medium">What you can do:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Wait a few moments before trying again</li>
            <li>Avoid making rapid repeated requests</li>
            <li>Contact support if you need higher limits</li>
          </ul>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Generic Error Component
 * Automatically selects the appropriate error type based on error code/message
 * 
 * @note onRetry and onCancel are client-side callbacks, not server actions
 */
export function AutoError({
  error,
  onRetry,
  onCancel,
  showRetry = true,
}: {
  error: Error | { message: string; code?: string | number };
  onRetry?: (() => void) | undefined;
  onCancel?: (() => void) | undefined;
  showRetry?: boolean | undefined;
}) {
  const errorMessage = error.message || 'An error occurred';
  const errorCode = 'code' in error ? error.code : undefined;

  // Network errors
  if (
    errorMessage.toLowerCase().includes('network') ||
    errorMessage.toLowerCase().includes('fetch') ||
    errorMessage.toLowerCase().includes('connection')
  ) {
    return <NetworkError message={errorMessage} onRetry={onRetry} showRetry={showRetry} />;
  }

  // Permission errors
  if (
    errorMessage.toLowerCase().includes('permission') ||
    errorMessage.toLowerCase().includes('forbidden') ||
    errorCode === 403 ||
    errorCode === '403'
  ) {
    return <PermissionError message={errorMessage} onRetry={onRetry} />;
  }

  // Not found errors
  if (
    errorMessage.toLowerCase().includes('not found') ||
    errorCode === 404 ||
    errorCode === '404'
  ) {
    return <NotFoundError message={errorMessage} />;
  }

  // Timeout errors
  if (
    errorMessage.toLowerCase().includes('timeout') ||
    errorMessage.toLowerCase().includes('timed out')
  ) {
    return <TimeoutError message={errorMessage} onRetry={onRetry} showRetry={showRetry} />;
  }

  // Validation errors
  if (
    errorMessage.toLowerCase().includes('validation') ||
    errorMessage.toLowerCase().includes('invalid') ||
    errorCode === 400 ||
    errorCode === '400'
  ) {
    return <ValidationError message={errorMessage} />;
  }

  // Database errors
  if (errorMessage.toLowerCase().includes('database') || errorMessage.toLowerCase().includes('db')) {
    return <DatabaseError message={errorMessage} onRetry={onRetry} showRetry={showRetry} />;
  }

  // Rate limit errors
  if (
    errorMessage.toLowerCase().includes('rate limit') ||
    errorMessage.toLowerCase().includes('too many') ||
    errorCode === 429 ||
    errorCode === '429'
  ) {
    return <RateLimitError message={errorMessage} />;
  }

  // Server errors
  if (
    errorMessage.toLowerCase().includes('server') ||
    (typeof errorCode === 'number' && errorCode >= 500) ||
    (typeof errorCode === 'string' && parseInt(errorCode) >= 500)
  ) {
    return <ServerError message={errorMessage} onRetry={onRetry} showRetry={showRetry} />;
  }

  // Default: Server error
  return <ServerError message={errorMessage} onRetry={onRetry} showRetry={showRetry} />;
}

