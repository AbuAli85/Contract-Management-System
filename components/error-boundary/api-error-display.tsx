'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Wifi,
  WifiOff,
  Clock,
  Shield,
  Database,
  Server,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

export interface ApiError {
  message: string;
  status?: number;
  details?: any;
  code?: string;
  isTimeout?: boolean;
  isNetworkError?: boolean;
  isAuthError?: boolean;
  isServerError?: boolean;
  isPermissionError?: boolean;
  isDatabaseError?: boolean;
}

export interface ApiErrorDisplayProps {
  error: ApiError | Error | any;
  title?: string;
  description?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  retryCount?: number;
  showTechnicalDetails?: boolean;
  className?: string;
}

/**
 * Comprehensive API Error Display Component
 * 
 * Displays user-friendly error messages with contextual icons and actions
 */
export function ApiErrorDisplay({
  error,
  title,
  description,
  onRetry,
  isRetrying = false,
  retryCount = 0,
  showTechnicalDetails = process.env.NODE_ENV === 'development',
  className = '',
}: ApiErrorDisplayProps) {
  // Analyze error and determine display properties
  const errorInfo = analyzeError(error);

  return (
    <div className={`flex min-h-[400px] items-center justify-center px-4 ${className}`}>
      <Card className='w-full max-w-2xl border-red-200 dark:border-red-800'>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <div className='rounded-full bg-red-100 p-3 dark:bg-red-900'>
              {errorInfo.icon}
            </div>
            <div>
              <CardTitle className='text-red-900 dark:text-red-100'>
                {title || errorInfo.title}
              </CardTitle>
              <CardDescription className='text-red-700 dark:text-red-300'>
                {description || errorInfo.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Error Message */}
          <div className='rounded-lg bg-red-50 p-4 dark:bg-red-900/20'>
            <p className='text-sm text-red-800 dark:text-red-200'>
              {errorInfo.userMessage}
            </p>
          </div>

          {/* Retry Information */}
          {retryCount > 0 && (
            <div className='rounded-lg bg-yellow-50 p-3 dark:bg-yellow-900/20'>
              <p className='text-sm text-yellow-800 dark:text-yellow-200'>
                <Clock className='mr-2 inline h-4 w-4' />
                {retryCount} automatic {retryCount === 1 ? 'retry' : 'retries'} attempted
              </p>
            </div>
          )}

          {/* Recommendations */}
          {errorInfo.recommendations.length > 0 && (
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20'>
              <h4 className='mb-2 font-medium text-blue-900 dark:text-blue-100'>
                What you can try:
              </h4>
              <ul className='space-y-1 text-sm text-blue-800 dark:text-blue-200'>
                {errorInfo.recommendations.map((recommendation, index) => (
                  <li key={index} className='flex items-start gap-2'>
                    <span className='mt-0.5'>•</span>
                    <span>{recommendation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical Details (Development Only) */}
          {showTechnicalDetails && error && (
            <div className='rounded-lg bg-gray-50 p-4 dark:bg-gray-900'>
              <details className='text-sm'>
                <summary className='cursor-pointer font-medium text-gray-700 dark:text-gray-300'>
                  Technical Details
                </summary>
                <pre className='mt-2 overflow-x-auto text-xs text-gray-600 dark:text-gray-400'>
                  {JSON.stringify(
                    {
                      message: error.message || error.toString(),
                      status: error.status,
                      code: error.code,
                      details: error.details,
                      stack: error.stack?.split('\n').slice(0, 5).join('\n'),
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  )}
                </pre>
              </details>
            </div>
          )}

          {/* Action Buttons */}
          <div className='flex flex-wrap gap-2'>
            {errorInfo.canRetry && onRetry && (
              <Button
                onClick={onRetry}
                disabled={isRetrying}
                className='flex-1 min-w-[120px]'
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className='mr-2 h-4 w-4' />
                    Try Again
                  </>
                )}
              </Button>
            )}

            <Button variant='outline' onClick={() => window.location.reload()}>
              <RefreshCw className='mr-2 h-4 w-4' />
              Reload Page
            </Button>

            <Button variant='outline' asChild>
              <Link href='/en/dashboard'>
                <Home className='mr-2 h-4 w-4' />
                Back to Dashboard
              </Link>
            </Button>
          </div>

          {/* Network Status Indicator */}
          <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
            {typeof navigator !== 'undefined' && navigator.onLine ? (
              <>
                <Wifi className='h-4 w-4 text-green-500' />
                Online
              </>
            ) : (
              <>
                <WifiOff className='h-4 w-4 text-red-500' />
                Offline - Check your internet connection
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Analyzes an error and returns display properties
 */
function analyzeError(error: any): {
  icon: React.ReactNode;
  title: string;
  description: string;
  userMessage: string;
  recommendations: string[];
  canRetry: boolean;
} {
  const errorMessage = error?.message || error?.toString() || 'Unknown error';
  const errorStatus = error?.status;

  // Network/Timeout Errors
  if (error?.isTimeout || errorMessage.includes('timeout') || errorMessage.includes('AbortError')) {
    return {
      icon: <Clock className='h-6 w-6 text-red-600 dark:text-red-300' />,
      title: 'Request Timeout',
      description: 'The server took too long to respond',
      userMessage: 'The request timed out. This might be due to network issues or server load.',
      recommendations: [
        'Check your internet connection',
        'Try again in a few moments',
        'Contact support if the issue persists',
      ],
      canRetry: true,
    };
  }

  // Network Errors
  if (error?.isNetworkError || errorMessage.includes('fetch') || errorMessage.includes('network')) {
    return {
      icon: <WifiOff className='h-6 w-6 text-red-600 dark:text-red-300' />,
      title: 'Network Error',
      description: 'Unable to connect to the server',
      userMessage: 'Could not connect to the server. Please check your internet connection.',
      recommendations: [
        'Check your internet connection',
        'Make sure you\'re not using a VPN that might be blocking the connection',
        'Try refreshing the page',
      ],
      canRetry: true,
    };
  }

  // Authentication Errors
  if (error?.isAuthError || errorStatus === 401 || errorMessage.includes('Unauthorized') || errorMessage.includes('401')) {
    return {
      icon: <Shield className='h-6 w-6 text-red-600 dark:text-red-300' />,
      title: 'Authentication Required',
      description: 'Your session has expired or you need to log in',
      userMessage: 'Your session has expired. Please log in again to continue.',
      recommendations: [
        'Log in again',
        'Clear your browser cache and cookies',
        'Contact support if you continue to have issues',
      ],
      canRetry: false,
    };
  }

  // Permission Errors
  if (error?.isPermissionError || errorStatus === 403 || errorMessage.includes('Forbidden') || errorMessage.includes('permission')) {
    return {
      icon: <Shield className='h-6 w-6 text-red-600 dark:text-red-300' />,
      title: 'Access Denied',
      description: 'You don\'t have permission to access this resource',
      userMessage: 'You don\'t have the necessary permissions to access this resource.',
      recommendations: [
        'Contact your administrator to request access',
        'Make sure you\'re logged in with the correct account',
        'Check if your account has the required permissions',
      ],
      canRetry: false,
    };
  }

  // Database Errors
  if (error?.isDatabaseError || errorMessage.includes('database') || errorMessage.includes('relation') || errorMessage.includes('table')) {
    return {
      icon: <Database className='h-6 w-6 text-red-600 dark:text-red-300' />,
      title: 'Database Error',
      description: 'Unable to access the database',
      userMessage: 'There was a problem accessing the database. This may be a temporary issue.',
      recommendations: [
        'Try again in a few moments',
        'Contact support if the issue persists',
        'Check if there are any scheduled maintenance windows',
      ],
      canRetry: true,
    };
  }

  // Server Errors
  if (error?.isServerError || errorStatus === 500 || errorMessage.includes('500') || errorMessage.includes('Internal server error')) {
    return {
      icon: <Server className='h-6 w-6 text-red-600 dark:text-red-300' />,
      title: 'Server Error',
      description: 'The server encountered an error',
      userMessage: 'The server encountered an error while processing your request. Please try again later.',
      recommendations: [
        'Wait a few moments and try again',
        'Check the status page for any ongoing issues',
        'Contact support if the problem persists',
      ],
      canRetry: true,
    };
  }

  // Default/Unknown Error
  return {
    icon: <XCircle className='h-6 w-6 text-red-600 dark:text-red-300' />,
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred',
    userMessage: errorMessage,
    recommendations: [
      'Try refreshing the page',
      'Clear your browser cache',
      'Contact support if the issue persists',
    ],
    canRetry: true,
  };
}

