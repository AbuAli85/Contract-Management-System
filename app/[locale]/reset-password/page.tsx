'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Loader2, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we have the required tokens
  useEffect(() => {
    const accessToken = searchParams?.get('access_token');
    const refreshToken = searchParams?.get('refresh_token');

    if (!accessToken || !refreshToken) {
      setError(
        'Invalid or missing reset link. Please request a new password reset.'
      );
    }
  }, [searchParams]);

  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate passwords
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      if (!supabase) {
        setError('Failed to initialize database connection');
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
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
      <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800'>
        <div className='w-full max-w-md'>
          <Card className='border-0 shadow-xl'>
            <CardHeader className='space-y-1'>
              <div className='mb-4 flex items-center justify-center'>
                <CheckCircle className='h-12 w-12 text-green-600' />
              </div>
              <CardTitle className='text-center text-2xl'>
                Password updated!
              </CardTitle>
              <CardDescription className='text-center'>
                Your password has been successfully updated
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Alert>
                <AlertDescription>
                  You can now sign in with your new password.
                </AlertDescription>
              </Alert>

              <Button className='w-full' onClick={() => router.push('/login')}>
                Sign in
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 dark:from-gray-900 dark:to-gray-800'>
      <div className='w-full max-w-md'>
        {/* Logo and Title */}
        <div className='mb-8 text-center'>
          <div className='mb-4 flex items-center justify-center'>
            <Lock className='h-12 w-12 text-blue-600' />
          </div>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            Reset Password
          </h1>
          <p className='mt-2 text-gray-600 dark:text-gray-400'>
            Enter your new password
          </p>
        </div>

        {/* Reset Password Card */}
        <Card className='border-0 shadow-xl'>
          <CardHeader className='space-y-1'>
            <CardTitle className='text-center text-2xl'>
              Set new password
            </CardTitle>
            <CardDescription className='text-center'>
              Choose a strong password for your account
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
                <Label htmlFor='password'>New Password</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='password'
                    type={showPassword ? 'text' : 'password'}
                    placeholder='Enter your new password'
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className='pl-10 pr-10'
                    required
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
                <p className='text-xs text-gray-500'>
                  Must be at least 8 characters with uppercase, lowercase, and
                  number
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='confirmPassword'>Confirm Password</Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder='Confirm your new password'
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className='pl-10 pr-10'
                    required
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>

              <Button type='submit' className='w-full' disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Updating password...
                  </>
                ) : (
                  'Update password'
                )}
              </Button>

              <div className='text-center text-sm text-gray-600 dark:text-gray-400'>
                Remember your password?{' '}
                <Link
                  href='/login'
                  className='font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400'
                >
                  Sign in
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className='mt-8 text-center text-sm text-gray-500 dark:text-gray-400'>
          <p>© 2024 Contract Management System. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic';
