'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface CaptchaBypassProps {
  onBypass: () => void;
  onCancel: () => void;
}

export default function CaptchaBypass({
  onBypass,
  onCancel,
}: CaptchaBypassProps) {
  const [confirmed, setConfirmed] = useState(false);

  const handleBypass = () => {
    if (confirmed) {
      onBypass();
    }
  };

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='text-center'>
        <AlertTriangle className='h-12 w-12 text-yellow-500 mx-auto mb-4' />
        <CardTitle className='text-xl text-gray-900'>
          CAPTCHA Verification Required
        </CardTitle>
        <p className='text-sm text-gray-600'>
          Your Supabase project has CAPTCHA verification enabled
        </p>
      </CardHeader>

      <CardContent className='space-y-4'>
        <Alert>
          <Shield className='h-4 w-4' />
          <AlertDescription>
            <strong>Development Mode:</strong> CAPTCHA verification is enabled
            in your Supabase project. This is a security feature that requires
            human verification.
          </AlertDescription>
        </Alert>

        <div className='space-y-3'>
          <h3 className='font-medium text-gray-900'>To fix this issue:</h3>
          <ol className='text-sm text-gray-600 space-y-2 list-decimal list-inside'>
            <li>Go to your Supabase Dashboard</li>
            <li>Navigate to Authentication → Settings</li>
            <li>Find the CAPTCHA section</li>
            <li>Disable CAPTCHA for development</li>
            <li>Or configure CAPTCHA with proper keys</li>
          </ol>
        </div>

        <div className='space-y-3'>
          <h3 className='font-medium text-gray-900'>Quick Fix Options:</h3>
          <div className='space-y-2'>
            <Button
              variant='outline'
              className='w-full'
              onClick={() =>
                window.open('https://supabase.com/dashboard', '_blank')
              }
            >
              Open Supabase Dashboard
            </Button>
            <Button
              variant='outline'
              className='w-full'
              onClick={() =>
                window.open(
                  'https://supabase.com/docs/guides/auth/captcha',
                  '_blank'
                )
              }
            >
              View CAPTCHA Documentation
            </Button>
          </div>
        </div>

        <div className='border-t pt-4'>
          <div className='flex items-center space-x-2 mb-3'>
            <input
              type='checkbox'
              id='confirm-bypass'
              checked={confirmed}
              onChange={e => setConfirmed(e.target.checked)}
              className='rounded border-gray-300'
            />
            <label htmlFor='confirm-bypass' className='text-sm text-gray-600'>
              I understand this is for development purposes only
            </label>
          </div>

          <div className='flex space-x-2'>
            <Button variant='outline' onClick={onCancel} className='flex-1'>
              Cancel
            </Button>
            <Button
              onClick={handleBypass}
              disabled={!confirmed}
              className='flex-1'
            >
              <CheckCircle className='mr-2 h-4 w-4' />
              Continue (Dev Mode)
            </Button>
          </div>
        </div>

        <div className='text-xs text-gray-500 text-center'>
          <p>
            <strong>Note:</strong> This bypass is only for development. In
            production, proper CAPTCHA configuration is required.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
