'use client';

import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, ExternalLink, Shield } from 'lucide-react';

interface LoginErrorHandlerProps {
  error: string;
  onRetry?: () => void;
  onContactSupport?: () => void;
}

export function LoginErrorHandler({ error, onRetry, onContactSupport }: LoginErrorHandlerProps) {
  const getErrorType = (errorMessage: string) => {
    const message = errorMessage.toLowerCase();
    
    if (message.includes('captcha') || message.includes('verification')) {
      return 'captcha';
    }
    if (message.includes('invalid') || message.includes('credentials')) {
      return 'credentials';
    }
    if (message.includes('pending') || message.includes('approval')) {
      return 'pending';
    }
    if (message.includes('deactivated') || message.includes('inactive')) {
      return 'inactive';
    }
    if (message.includes('connection') || message.includes('network')) {
      return 'connection';
    }
    if (message.includes('database') || message.includes('server')) {
      return 'server';
    }
    return 'generic';
  };

  const errorType = getErrorType(error);

  const getErrorContent = () => {
    switch (errorType) {
      case 'captcha':
        return {
          title: 'CAPTCHA Verification Required',
          description: 'Your Supabase project has CAPTCHA enabled. This needs to be disabled for the application to work properly.',
          icon: <Shield className='h-5 w-5' />,
          actions: [
            {
              label: 'View Supabase Dashboard',
              action: () => window.open('https://supabase.com/dashboard', '_blank'),
              variant: 'default' as const,
            },
            {
              label: 'Retry Login',
              action: onRetry,
              variant: 'outline' as const,
            },
          ],
          steps: [
            'Go to Supabase Dashboard',
            'Navigate to Authentication → Settings',
            'Find the CAPTCHA section',
            'Disable CAPTCHA verification',
            'Save changes and retry login',
          ],
        };

      case 'credentials':
        return {
          title: 'Invalid Credentials',
          description: 'The email or password you entered is incorrect. Please check your credentials and try again.',
          icon: <AlertCircle className='h-5 w-5' />,
          actions: [
            {
              label: 'Try Again',
              action: onRetry,
              variant: 'default' as const,
            },
          ],
          steps: [
            'Double-check your email address',
            'Verify your password is correct',
            'Make sure Caps Lock is not enabled',
            'Try using the test accounts if available',
          ],
        };

      case 'pending':
        return {
          title: 'Account Pending Approval',
          description: 'Your account is currently under review and awaiting approval from an administrator.',
          icon: <AlertCircle className='h-5 w-5' />,
          actions: [
            {
              label: 'Contact Administrator',
              action: onContactSupport,
              variant: 'default' as const,
            },
          ],
          steps: [
            'Your account has been created successfully',
            'It is currently pending administrative approval',
            'You will be notified once your account is approved',
            'Contact your administrator if you need immediate access',
          ],
        };

      case 'inactive':
        return {
          title: 'Account Deactivated',
          description: 'Your account has been deactivated. Please contact an administrator to restore access.',
          icon: <AlertCircle className='h-5 w-5' />,
          actions: [
            {
              label: 'Contact Administrator',
              action: onContactSupport,
              variant: 'default' as const,
            },
          ],
          steps: [
            'Your account has been temporarily or permanently deactivated',
            'This may be due to policy violations or administrative action',
            'Contact your administrator to understand the reason',
            'Request account reactivation if appropriate',
          ],
        };

      case 'connection':
        return {
          title: 'Connection Error',
          description: 'Unable to connect to the authentication service. Please check your internet connection.',
          icon: <AlertCircle className='h-5 w-5' />,
          actions: [
            {
              label: 'Retry',
              action: onRetry,
              variant: 'default' as const,
            },
          ],
          steps: [
            'Check your internet connection',
            'Try refreshing the page',
            'Clear your browser cache',
            'Contact support if the problem persists',
          ],
        };

      case 'server':
        return {
          title: 'Server Error',
          description: 'There is a temporary issue with our servers. Please try again in a few moments.',
          icon: <AlertCircle className='h-5 w-5' />,
          actions: [
            {
              label: 'Retry',
              action: onRetry,
              variant: 'default' as const,
            },
            {
              label: 'Contact Support',
              action: onContactSupport,
              variant: 'outline' as const,
            },
          ],
          steps: [
            'Our servers are experiencing temporary issues',
            'This is usually resolved within a few minutes',
            'Try again in a moment',
            'Contact support if the issue persists',
          ],
        };

      default:
        return {
          title: 'Login Error',
          description: 'An unexpected error occurred during login. Please try again.',
          icon: <AlertCircle className='h-5 w-5' />,
          actions: [
            {
              label: 'Retry',
              action: onRetry,
              variant: 'default' as const,
            },
            {
              label: 'Contact Support',
              action: onContactSupport,
              variant: 'outline' as const,
            },
          ],
          steps: [
            'An unexpected error has occurred',
            'Try refreshing the page and logging in again',
            'Clear your browser cache and cookies',
            'Contact support if the problem continues',
          ],
        };
    }
  };

  const content = getErrorContent();

  return (
    <div className='min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-lg shadow-xl border-0'>
        <CardHeader className='text-center space-y-4'>
          <div className='flex items-center justify-center gap-2'>
            {content.icon}
            <CardTitle className='text-xl text-red-600'>{content.title}</CardTitle>
          </div>
          <p className='text-gray-600'>{content.description}</p>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Error Details */}
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription className='font-mono text-sm'>
              {error}
            </AlertDescription>
          </Alert>

          {/* Steps */}
          <div className='space-y-3'>
            <h3 className='font-semibold text-gray-900'>What to do next:</h3>
            <ol className='list-decimal list-inside space-y-2 text-sm text-gray-600'>
              {content.steps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ol>
          </div>

          {/* Actions */}
          <div className='flex flex-col gap-2'>
            {content.actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant}
                onClick={action.action}
                className='w-full'
              >
                {action.label}
                {action.label.includes('Dashboard') && <ExternalLink className='ml-2 h-4 w-4' />}
                {action.label.includes('Retry') && <RefreshCw className='ml-2 h-4 w-4' />}
              </Button>
            ))}
          </div>

          {/* Additional Help */}
          <div className='text-center text-sm text-gray-500 pt-4 border-t'>
            <p>
              Need more help?{' '}
              <Button
                variant='link'
                className='p-0 h-auto text-blue-600 hover:text-blue-800'
                onClick={onContactSupport}
              >
                Contact Support
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
