'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';

interface CaptchaErrorHandlerProps {
  error: string;
  onRetry: () => void;
  onBypass?: () => void;
}

export default function CaptchaErrorHandler({
  error,
  onRetry,
  onBypass,
}: CaptchaErrorHandlerProps) {
  const [showBypass, setShowBypass] = useState(false);

  const isCaptchaError =
    error.toLowerCase().includes('captcha') ||
    error.toLowerCase().includes('verification') ||
    error.toLowerCase().includes('unexpected_failure');

  if (!isCaptchaError) {
    return null;
  }

  return (
    <Card className='w-full max-w-2xl mx-auto'>
      <CardHeader className='text-center'>
        <AlertTriangle className='h-12 w-12 text-yellow-500 mx-auto mb-4' />
        <CardTitle className='text-xl text-gray-900'>
          CAPTCHA Verification Error
        </CardTitle>
        <p className='text-sm text-gray-600'>
          Your Supabase project requires CAPTCHA verification
        </p>
      </CardHeader>

      <CardContent className='space-y-6'>
        {/* Error Details */}
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            <strong>Error:</strong> {error}
          </AlertDescription>
        </Alert>

        {/* Status Badge */}
        <div className='flex justify-center'>
          <Badge
            variant='outline'
            className='text-yellow-600 border-yellow-600'
          >
            <Shield className='mr-1 h-3 w-3' />
            CAPTCHA Required
          </Badge>
        </div>

        {/* Solutions */}
        <div className='space-y-4'>
          <h3 className='font-medium text-gray-900'>How to Fix This:</h3>

          <div className='grid gap-4 md:grid-cols-2'>
            {/* Option 1: Disable CAPTCHA */}
            <Card className='p-4'>
              <h4 className='font-medium text-gray-900 mb-2'>
                Option 1: Disable CAPTCHA (Recommended for Development)
              </h4>
              <ol className='text-sm text-gray-600 space-y-1 list-decimal list-inside mb-3'>
                <li>Go to Supabase Dashboard</li>
                <li>Navigate to Authentication → Settings</li>
                <li>Find "CAPTCHA" section</li>
                <li>Disable CAPTCHA verification</li>
              </ol>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  window.open('https://supabase.com/dashboard', '_blank')
                }
                className='w-full'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                Open Supabase Dashboard
              </Button>
            </Card>

            {/* Option 2: Configure CAPTCHA */}
            <Card className='p-4'>
              <h4 className='font-medium text-gray-900 mb-2'>
                Option 2: Configure CAPTCHA
              </h4>
              <ol className='text-sm text-gray-600 space-y-1 list-decimal list-inside mb-3'>
                <li>Get CAPTCHA keys from hCaptcha or Turnstile</li>
                <li>Configure in Supabase Dashboard</li>
                <li>Update your app with CAPTCHA keys</li>
              </ol>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  window.open(
                    'https://supabase.com/docs/guides/auth/captcha',
                    '_blank'
                  )
                }
                className='w-full'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                View Documentation
              </Button>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className='space-y-3'>
          <h3 className='font-medium text-gray-900'>Quick Actions:</h3>
          <div className='flex flex-wrap gap-2'>
            <Button onClick={onRetry} variant='outline' size='sm'>
              <RefreshCw className='mr-2 h-4 w-4' />
              Try Again
            </Button>

            <Button
              onClick={() =>
                window.open(
                  'https://supabase.com/dashboard/project/_/auth/settings',
                  '_blank'
                )
              }
              variant='outline'
              size='sm'
            >
              <ExternalLink className='mr-2 h-4 w-4' />
              Auth Settings
            </Button>

            <Button
              onClick={() =>
                window.open(
                  'https://supabase.com/docs/guides/auth/captcha',
                  '_blank'
                )
              }
              variant='outline'
              size='sm'
            >
              <ExternalLink className='mr-2 h-4 w-4' />
              CAPTCHA Guide
            </Button>
          </div>
        </div>

        {/* Development Bypass */}
        {onBypass && (
          <div className='border-t pt-4'>
            <div className='flex items-center justify-between'>
              <div>
                <h4 className='font-medium text-gray-900'>Development Mode</h4>
                <p className='text-sm text-gray-600'>
                  Skip CAPTCHA for development testing
                </p>
              </div>
              <Button
                onClick={() => setShowBypass(!showBypass)}
                variant='outline'
                size='sm'
              >
                {showBypass ? 'Hide' : 'Show'} Bypass
              </Button>
            </div>

            {showBypass && (
              <div className='mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md'>
                <p className='text-sm text-yellow-800 mb-2'>
                  <strong>Warning:</strong> This bypass is only for development.
                  Do not use in production.
                </p>
                <Button
                  onClick={onBypass}
                  size='sm'
                  className='bg-yellow-600 hover:bg-yellow-700'
                >
                  <CheckCircle className='mr-2 h-4 w-4' />
                  Bypass CAPTCHA (Dev Only)
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Environment Info */}
        <div className='text-xs text-gray-500 border-t pt-3'>
          <p>
            <strong>Environment:</strong> {process.env.NODE_ENV}
          </p>
          <p>
            <strong>Supabase URL:</strong>{' '}
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? 'Configured'
              : 'Not configured'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
