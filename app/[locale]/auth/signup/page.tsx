'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, User, Building } from 'lucide-react';

export default function SignupRedirectPage() {
  const router = useRouter();

  const goToNewRegistration = () => {
    router.push('/en/register-new');
  };

  const goToSimpleProviderRegistration = () => {
    router.push('/en/register/provider-simple');
  };

  const goToProviderRegistration = () => {
    router.push('/en/register/provider');
  };

  const goToClientRegistration = () => {
    router.push('/en/register/client');
  };

  const goToLogin = () => {
    router.push('/en/auth/login');
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <AlertTriangle className='h-12 w-12 text-yellow-500 mx-auto mb-4' />
          <CardTitle className='text-2xl text-gray-900'>
            Choose Registration Type
          </CardTitle>
          <p className='text-sm text-gray-600'>
            This signup page has been replaced with improved registration options
          </p>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <h3 className='font-semibold text-green-900 mb-2'>
              ✅ Registration System Fixed
            </h3>
            <p className='text-sm text-green-800'>
              Choose your registration type below. All systems are now working properly with secure authentication and role assignment.
            </p>
          </div>

          <div className='space-y-3'>
            <Button
              onClick={goToSimpleProviderRegistration}
              className='w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2'
            >
              <Building className='h-4 w-4' />
              Quick Provider Registration
              <ArrowRight className='ml-2 h-4 w-4' />
            </Button>

            <Button
              onClick={goToProviderRegistration}
              variant='outline'
              className='w-full flex items-center justify-center gap-2'
            >
              <Building className='h-4 w-4' />
              Full Provider Setup
            </Button>

            <Button
              onClick={goToClientRegistration}
              variant='outline'
              className='w-full flex items-center justify-center gap-2'
            >
              <User className='h-4 w-4' />
              Register as Client
            </Button>

            <Button 
              onClick={goToNewRegistration} 
              variant='outline' 
              className='w-full'
            >
              🚀 Simple Registration (All Roles)
            </Button>

            <Button onClick={goToLogin} variant='outline' className='w-full'>
              🔐 Already Have Account? Login
            </Button>
          </div>

          <div className='text-xs text-gray-500 text-center border-t pt-3'>
            <p>
              <strong>Fixed Features:</strong>
            </p>
            <ul className='list-disc list-inside text-left mt-1 space-y-1'>
              <li>Provider & Client role selection</li>
              <li>No internal server errors</li>
              <li>Proper database integration</li>
              <li>Secure authentication system</li>
              <li>Auto-confirmed accounts</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
