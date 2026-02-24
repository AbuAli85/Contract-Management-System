'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import _Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      if (!supabase) {
        setError('Failed to initialize database connection');
        return;
      }
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : ''}/reset-password`,
        }
      );

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (err: any) {
      setError(
        err?.message || 'An unexpected error occurred. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className='w-full max-w-md px-4 py-12 sm:px-6 lg:px-8'>
        <Card className='border-0 shadow-xl'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-center text-2xl'>
              Check your email
            </CardTitle>
            <CardDescription className='text-center'>
              We've sent a password reset link to {email}
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert>
              <AlertDescription>
                If you don't see the email, check your spam folder. The link
                will expire in 1 hour.
              </AlertDescription>
            </Alert>

            <div className='space-y-2'>
              <Button
                variant='outline'
                className='w-full'
                onClick={() => router.push('/login')}
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='w-full max-w-md px-4 py-12 sm:px-6 lg:px-8'>
      {/* Logo and Title */}
      <div className='mb-8 text-center'>
        <div className='mb-4 flex items-center justify-center'>
          <Mail className='h-12 w-12 text-blue-600' />
        </div>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
          Forgot Password
        </h1>
        <p className='mt-2 text-gray-600 dark:text-gray-400'>
          Enter your email to reset your password
        </p>
      </div>

      {/* Forgot Password Card */}
      <Card className='border-0 shadow-xl'>
        <CardHeader className='space-y-1'>
          <CardTitle className='text-center text-2xl'>Reset password</CardTitle>
          <CardDescription className='text-center'>
            Enter your email address and we'll send you a link to reset your
            password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='Enter your email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <Button type='submit' className='w-full' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Send reset link
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
