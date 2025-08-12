'use client';

import { SignupForm } from '@/auth/forms/signup-form';
import { OAuthButtons } from '@/auth/forms/oauth-buttons';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';

export default function SignupPage() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='w-full max-w-md space-y-8'>
        <Card>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-center text-2xl'>
              Create an account
            </CardTitle>
            <CardDescription className='text-center'>
              Enter your details to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <SignupForm />
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <span className='w-full border-t' />
                </div>
                <div className='relative flex justify-center text-xs uppercase'>
                  <span className='bg-background px-2 text-muted-foreground'>
                    Or continue with
                  </span>
                </div>
              </div>
              <OAuthButtons />
              <div className='text-center text-sm'>
                <span className='text-muted-foreground'>
                  Already have an account?{' '}
                </span>
                <Link
                  href='/auth/login'
                  className='text-primary hover:underline'
                >
                  Sign in
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
