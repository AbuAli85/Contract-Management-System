'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
  Shield,
} from 'lucide-react';
import ProductionCaptcha from './production-captcha';

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

interface CaptchaConfig {
  provider: 'hcaptcha' | 'turnstile' | null;
  siteKey: string | null;
  enabled: boolean;
}

export default function ProductionLoginForm() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
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
  const [captchaConfig, setCaptchaConfig] = useState<CaptchaConfig | null>(
    null
  );
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const captchaRef = useRef<any>(null);
  const router = useRouter();

  const supabase = createClient();

  // Load CAPTCHA configuration on mount
  useEffect(() => {
    loadCaptchaConfig();
  }, []);

  const loadCaptchaConfig = async () => {
    try {
      const response = await fetch('/api/auth/production-login');
      const data = await response.json();

      if (response.ok) {
        setCaptchaConfig(data.captchaConfig);
        setCaptchaRequired(data.captchaRequired);
      }
    } catch (error) {
      console.error('Failed to load CAPTCHA config:', error);
    }
  };

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
      // Prepare request body
      const requestBody: any = {
        email: formData.email.trim(),
        password: formData.password,
      };

      // Add CAPTCHA token if available
      if (captchaToken) {
        requestBody.captchaToken = captchaToken;
      }

      // Make API request
      const response = await fetch('/api/auth/production-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Check if CAPTCHA is required
        if (data.captchaRequired) {
          setShowCaptcha(true);
          setCaptchaConfig(data.captchaConfig);
          setError('Please complete the CAPTCHA verification');
          return;
        }

        setError(data.error || 'Login failed');
        return;
      }

      setSuccess('Login successful! Redirecting...');

      // Get user profile to determine redirect
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, email, full_name, role, status')
        .eq('id', data.user.id)
        .single();

      if (!profileError && profile) {
        setUserProfile(profile);
      }

      // Check user status
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

      // Determine redirect path based on role
      const userRole = profile?.role || data.user.user_metadata?.role || 'user';
      const currentLocale =
        typeof window !== 'undefined' &&
        window.location.pathname.startsWith('/ar/')
          ? 'ar'
          : 'en';
      let redirectPath = `/${currentLocale}/dashboard`;

      switch (userRole) {
        case 'provider':
          redirectPath = `/${currentLocale}/dashboard/provider-comprehensive`;
          break;
        case 'client':
          redirectPath = `/${currentLocale}/dashboard/client-comprehensive`;
          break;
        case 'admin':
        case 'super_admin':
          redirectPath = `/${currentLocale}/dashboard`;
          break;
        case 'hr_admin':
        case 'hr_staff':
          redirectPath = `/${currentLocale}/hr`;
          break;
        default:
          redirectPath = `/${currentLocale}/dashboard`;
      }

      // Redirect after a short delay
      setTimeout(() => {
        router.push(redirectPath);
      }, 1500);
    } catch (error) {
      console.error('🔐 Production Login - Exception:', error);
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

  const handleCaptchaExpired = () => {
    setCaptchaToken(null);
    setCaptchaError('CAPTCHA expired. Please complete it again.');
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

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <div className='flex items-center justify-center mb-2'>
            <Shield className='h-6 w-6 text-blue-600 mr-2' />
            <CardTitle className='text-2xl font-bold text-gray-900'>
              Production Login
            </CardTitle>
          </div>
          <p className='text-sm text-gray-600'>
            Secure authentication with CAPTCHA protection
          </p>
          {captchaConfig?.enabled && (
            <div className='mt-2'>
              <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                <Shield className='h-3 w-3 mr-1' />
                CAPTCHA Protected
              </span>
            </div>
          )}
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
            {showCaptcha && captchaConfig?.enabled && (
              <div className='space-y-2'>
                <Label>Security Verification</Label>
                <div className='flex items-center gap-2'>
                  <ProductionCaptcha
                    ref={captchaRef}
                    provider={captchaConfig.provider || 'hcaptcha'}
                    siteKey={captchaConfig.siteKey || ''}
                    onCaptchaReady={handleCaptchaReady}
                    onCaptchaError={handleCaptchaError}
                    onCaptchaExpired={handleCaptchaExpired}
                    className='flex-1'
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

            <Button
              type='submit'
              className='w-full'
              disabled={loading || (captchaRequired && !captchaToken)}
            >
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

          {/* Quick Test Buttons (only in development) */}
          {process.env.NODE_ENV === 'development' && (
            <div className='mt-6 pt-4 border-t'>
              <p className='text-sm text-gray-600 mb-3'>Quick test accounts:</p>
              <div className='grid grid-cols-1 gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    quickLogin('provider@test.com', 'TestPass123!')
                  }
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
          )}

          {/* Navigation */}
          <div className='mt-6 pt-4 border-t space-y-2'>
            <Button
              variant='ghost'
              className='w-full'
              onClick={() => router.push(`/${locale}/auth/register`)}
            >
              Don't have an account? Sign up
            </Button>
            <Button
              variant='ghost'
              className='w-full'
              onClick={() => router.push(`/${locale}/auth/forgot-password`)}
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

          {/* Environment Info */}
          <div className='text-xs text-gray-500 border-t pt-2 mt-4'>
            <p>Environment: {process.env.NODE_ENV}</p>
            <p>CAPTCHA: {captchaConfig?.enabled ? 'Enabled' : 'Disabled'}</p>
            <p>Provider: {captchaConfig?.provider || 'None'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
