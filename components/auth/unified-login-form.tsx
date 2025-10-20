'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import CaptchaHandler from './captcha-handler';
import CaptchaErrorHandler from './captcha-error-handler';

interface LoginFormData {
  email: string;
  password: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
}

export default function UnifiedLoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const captchaRef = useRef<any>(null);
  const router = useRouter();

  const supabase = createClient();

  // Check if Supabase client is available
  if (!supabase) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-center text-red-600'>
              Configuration Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Supabase client is not properly configured. Please check your
                environment variables.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!formData.password.trim()) {
      return 'Password is required';
    }
    if (formData.password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    return null;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setCaptchaError('');

    try {
      console.log('🔐 Unified Login - Starting login process...');
      console.log('🔐 Unified Login - Email:', formData.email);

      // Step 1: Try authentication with CAPTCHA if needed
      let authOptions: any = {
        email: formData.email.trim(),
        password: formData.password,
      };

      // Add CAPTCHA token if available
      if (captchaToken) {
        authOptions.options = {
          captchaToken: captchaToken,
        };
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword(authOptions);

      if (authError) {
        console.error('🔐 Unified Login - Auth error:', authError);

        // Check if it's a CAPTCHA error
        if (
          authError.message.includes('captcha') ||
          authError.message.includes('verification')
        ) {
          setShowCaptcha(true);
          setError('Please complete the CAPTCHA verification');
          return;
        }

        setError(`Login failed: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        setError('Login failed: No user data returned');
        return;
      }

      console.log('🔐 Unified Login - Auth successful:', authData.user.id);

      // Step 2: Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, full_name, role, status')
        .eq('id', authData.user.id)
        .single();

      if (profileError) {
        console.warn('🔐 Unified Login - Profile error:', profileError);
        // Continue with auth user data if profile doesn't exist
        setUserProfile({
          id: authData.user.id,
          email: authData.user.email || '',
          full_name: authData.user.user_metadata?.full_name || '',
          role: authData.user.user_metadata?.role || 'user',
          status: 'active',
        });
      } else {
        setUserProfile(profile);
      }

      // Step 3: Check user status
      const userStatus = profile?.status || 'active';
      if (userStatus === 'pending') {
        setError(
          'Your account is pending approval. Please contact an administrator.'
        );
        await supabase.auth.signOut();
        return;
      }

      if (userStatus === 'inactive') {
        setError(
          'Your account has been deactivated. Please contact an administrator.'
        );
        await supabase.auth.signOut();
        return;
      }

      setSuccess('Login successful! Redirecting...');

      // Step 4: Determine redirect path based on role
      const userRole =
        profile?.role || authData.user.user_metadata?.role || 'user';
      let redirectPath = '/en/dashboard';

      switch (userRole) {
        case 'provider':
          redirectPath = '/en/dashboard/provider-comprehensive';
          break;
        case 'client':
          redirectPath = '/en/dashboard/client-comprehensive';
          break;
        case 'admin':
        case 'super_admin':
          redirectPath = '/en/dashboard';
          break;
        case 'hr_admin':
        case 'hr_staff':
          redirectPath = '/en/hr';
          break;
        default:
          redirectPath = '/en/dashboard';
      }

      console.log('🔐 Unified Login - Redirecting to:', redirectPath);

      // Redirect after a short delay
      setTimeout(() => {
        router.push(redirectPath);
      }, 1500);
    } catch (error) {
      console.error('🔐 Unified Login - Exception:', error);
      setError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaReady = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError('');
    setError('');
  };

  const handleCaptchaError = (error: string) => {
    setCaptchaError(error);
    setCaptchaToken(null);
  };

  const resetCaptcha = () => {
    if (captchaRef.current) {
      captchaRef.current.reset();
    }
    setCaptchaToken(null);
    setCaptchaError('');
  };

  const quickLogin = (email: string, password: string) => {
    setFormData({ email, password });
  };

  const handleRetry = () => {
    setError('');
    setShowCaptcha(false);
    setCaptchaToken(null);
  };

  const handleBypass = () => {
    setError('');
    setShowCaptcha(false);
    setCaptchaToken(null);
    // In a real implementation, you might want to set a bypass flag
    console.log('CAPTCHA bypassed for development');
  };

  // Show CAPTCHA error handler if it's a CAPTCHA-related error
  if (
    error &&
    (error.toLowerCase().includes('captcha') ||
      error.toLowerCase().includes('verification') ||
      error.toLowerCase().includes('unexpected_failure'))
  ) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <CaptchaErrorHandler
          error={error}
          onRetry={handleRetry}
          onBypass={handleBypass}
        />
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold text-gray-900'>
            Welcome Back
          </CardTitle>
          <p className='text-sm text-gray-600'>
            Sign in to your account to continue
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email Address</Label>
              <Input
                id='email'
                name='email'
                type='email'
                value={formData.email}
                onChange={handleInputChange}
                placeholder='Enter your email'
                required
                disabled={loading}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder='Enter your password'
                  required
                  disabled={loading}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>

            {/* CAPTCHA Section */}
            {showCaptcha && (
              <div className='space-y-2'>
                <Label>Security Verification</Label>
                <div className='flex items-center gap-2'>
                  <CaptchaHandler
                    ref={captchaRef}
                    onCaptchaReady={handleCaptchaReady}
                    onCaptchaError={handleCaptchaError}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={resetCaptcha}
                    disabled={loading}
                  >
                    <RefreshCw className='h-4 w-4' />
                  </Button>
                </div>
                {captchaError && (
                  <p className='text-sm text-red-600'>{captchaError}</p>
                )}
              </div>
            )}

            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className='border-green-200 bg-green-50'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <AlertDescription className='text-green-800'>
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>

          {/* Quick Test Buttons */}
          <div className='mt-6 pt-4 border-t'>
            <p className='text-sm text-gray-600 mb-3'>Quick test accounts:</p>
            <div className='grid grid-cols-1 gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => quickLogin('provider@test.com', 'TestPass123!')}
                disabled={loading}
              >
                Test Provider Account
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => quickLogin('client@test.com', 'TestPass123!')}
                disabled={loading}
              >
                Test Client Account
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => quickLogin('admin@test.com', 'TestPass123!')}
                disabled={loading}
              >
                Test Admin Account
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <div className='mt-6 pt-4 border-t space-y-2'>
            <Button
              variant='ghost'
              className='w-full'
              onClick={() => router.push('/en/auth/register')}
            >
              Don't have an account? Sign up
            </Button>
            <Button
              variant='ghost'
              className='w-full'
              onClick={() => router.push('/en/auth/forgot-password')}
            >
              Forgot your password?
            </Button>
          </div>

          {/* User Profile Display */}
          {userProfile && (
            <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md'>
              <p className='text-sm text-blue-800'>
                <strong>
                  Welcome, {userProfile.full_name || userProfile.email}!
                </strong>
              </p>
              <p className='text-xs text-blue-600'>
                Role: {userProfile.role} | Status: {userProfile.status}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
