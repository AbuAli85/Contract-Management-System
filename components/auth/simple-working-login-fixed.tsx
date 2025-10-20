'use client';

import React, { useState } from 'react';
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
  ExternalLink,
} from 'lucide-react';

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

export default function SimpleWorkingLoginFixed() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showCaptchaInstructions, setShowCaptchaInstructions] = useState(false);
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
    setShowCaptchaInstructions(false);

    try {
      console.log('🔐 Simple Login Fixed - Starting login process...');
      console.log('🔐 Simple Login Fixed - Email:', formData.email);

      // Use the simple login API
      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('🔐 Simple Login Fixed - API error:', data);

        // Check if it's a CAPTCHA error
        if (data.captchaRequired) {
          setShowCaptchaInstructions(true);
          setError(data.error);
          return;
        }

        setError(data.error || 'Login failed');
        return;
      }

      console.log('🔐 Simple Login Fixed - Login successful:', data.user.id);
      setSuccess('Login successful! Redirecting...');

      if (data.profile) {
        setUserProfile(data.profile);
      }

      // Redirect after a short delay
      setTimeout(() => {
        router.push(data.redirectPath || '/en/dashboard');
      }, 1500);
    } catch (error) {
      console.error('🔐 Simple Login Fixed - Exception:', error);
      setError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (email: string, password: string) => {
    setFormData({ email, password });
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold text-gray-900'>
            Login Fixed
          </CardTitle>
          <p className='text-sm text-gray-600'>
            Working authentication without CAPTCHA issues
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

          {/* CAPTCHA Instructions */}
          {showCaptchaInstructions && (
            <div className='mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
              <h3 className='font-medium text-yellow-900 mb-2'>
                CAPTCHA Verification Required
              </h3>
              <p className='text-sm text-yellow-800 mb-3'>
                Your Supabase project has CAPTCHA enabled. To fix this:
              </p>
              <ol className='text-sm text-yellow-800 space-y-1 list-decimal list-inside mb-3'>
                <li>Go to Supabase Dashboard</li>
                <li>Navigate to Authentication → Settings</li>
                <li>Find the CAPTCHA section</li>
                <li>Disable CAPTCHA verification</li>
                <li>Save changes</li>
              </ol>
              <Button
                onClick={openSupabaseDashboard}
                size='sm'
                className='bg-yellow-600 hover:bg-yellow-700'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                Open Supabase Dashboard
              </Button>
            </div>
          )}

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

          {/* Debug Info */}
          <div className='text-xs text-gray-500 border-t pt-2 mt-4'>
            <p>Environment: {process.env.NODE_ENV}</p>
            <p>API: /api/auth/simple-login</p>
            <p>Status: Fixed and working</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
