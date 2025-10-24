'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Shield,
  User,
  Lock,
  Mail,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { LoginErrorHandler } from './login-error-handler';
import { authSessionManager } from '@/lib/auth-session-manager';

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

export default function EnhancedLoginFormV2() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ready' | 'error'>('checking');
  const [rememberMe, setRememberMe] = useState(false);
  const [showErrorHandler, setShowErrorHandler] = useState(false);
  const router = useRouter();

  // Check API status on mount
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/auth/simple-login', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (response.ok) {
          const data = await response.json();
          setApiStatus(data.ready ? 'ready' : 'error');
        } else {
          setApiStatus('error');
        }
      } catch (error) {
        console.error('API status check failed:', error);
        setApiStatus('error');
      }
    };

    checkApiStatus();
  }, []);

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

    try {
      console.log('🔐 Enhanced Login V2 - Starting login process...');
      console.log('🔐 Enhanced Login V2 - Email:', formData.email);

      // Use session manager for authentication
      const result = await authSessionManager.signIn(formData.email, formData.password);

      if (!result.success) {
        console.error('🔐 Enhanced Login V2 - Auth error:', result.error);

        // Enhanced error handling with detailed error handler
        if (result.error?.includes('captcha') || result.error?.includes('verification')) {
          setShowErrorHandler(true);
          return;
        }

        // Handle specific error types
        if (result.error?.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (result.error?.includes('pending approval')) {
          setError('Your account is pending approval. Please contact an administrator.');
        } else if (result.error?.includes('deactivated')) {
          setError('Your account has been deactivated. Please contact an administrator.');
        } else {
          setError(result.error || 'Login failed. Please try again.');
        }
        return;
      }

      console.log('🔐 Enhanced Login V2 - Login successful:', result.session?.user.id);
      setSuccess('Login successful! Redirecting...');

      if (result.session?.profile) {
        setUserProfile(result.session.profile);
      }

      // Store login state if remember me is checked
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      // Update last activity
      authSessionManager.updateLastActivity();

      // Determine redirect path based on user role
      const redirectPath = getRedirectPath(result.session?.profile?.role || 'user');

      // Redirect after a short delay using window.location for guaranteed redirect
      setTimeout(() => {
        console.log('🔐 Redirecting to:', redirectPath);
        // Use both methods for reliability
        router.push(redirectPath);
        // Fallback to hard redirect if router doesn't work
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 500);
      }, 1500);
    } catch (error) {
      console.error('🔐 Enhanced Login V2 - Exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Show error handler for connection issues
      if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('connection')) {
        setShowErrorHandler(true);
      } else {
        setError(`Connection error: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email: string, password: string) => {
    setFormData({ email, password });
    setError('');
    setSuccess('');
    
    // Auto-submit after setting form data
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  // Helper function to get redirect path based on role
  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'provider':
        return '/en/dashboard/provider-comprehensive';
      case 'client':
        return '/en/dashboard/client-comprehensive';
      case 'admin':
      case 'super_admin':
        return '/en/dashboard';
      case 'hr_admin':
      case 'hr_staff':
        return '/en/hr';
      default:
        return '/en/dashboard';
    }
  };

  // Load remembered email
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, []);

  // Show error handler for critical errors
  if (showErrorHandler) {
    return (
      <LoginErrorHandler
        error={error || 'An error occurred during login'}
        onRetry={() => {
          setShowErrorHandler(false);
          setError('');
          setSuccess('');
        }}
        onContactSupport={() => {
          // In a real app, this would open a support ticket or contact form
          window.open('mailto:support@example.com?subject=Login Issue', '_blank');
        }}
      />
    );
  }

  // Show API status error
  if (apiStatus === 'error') {
    return (
      <div className='min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-center text-red-600 flex items-center justify-center gap-2'>
              <AlertCircle className='h-5 w-5' />
              Service Unavailable
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                The authentication service is currently unavailable. Please try again later.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={() => window.location.reload()} 
              className='w-full'
              variant='outline'
            >
              <RefreshCw className='mr-2 h-4 w-4' />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md space-y-6'>
        {/* Header */}
        <div className='text-center space-y-2'>
          <div className='flex items-center justify-center gap-2 mb-4'>
            <div className='p-3 bg-blue-600 rounded-full'>
              <Shield className='h-6 w-6 text-white' />
            </div>
            <h1 className='text-2xl font-bold text-gray-900'>Welcome Back</h1>
          </div>
          <p className='text-gray-600'>
            Sign in to your account to continue
          </p>
        </div>

        {/* API Status Badge */}
        {apiStatus === 'ready' && (
          <div className='flex justify-center'>
            <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
              <CheckCircle className='mr-1 h-3 w-3' />
              Service Ready
            </Badge>
          </div>
        )}

        {/* Login Form */}
        <Card className='shadow-xl border-0'>
          <CardHeader className='space-y-1 pb-4'>
            <CardTitle className='text-xl font-semibold text-center'>
              Sign In
            </CardTitle>
            <p className='text-sm text-gray-600 text-center'>
              Enter your credentials to access your account
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className='space-y-4'>
              {/* Email Field */}
              <div className='space-y-2'>
                <Label htmlFor='email' className='text-sm font-medium'>
                  Email Address
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleInputChange}
                    className='pl-10'
                    placeholder='Enter your email'
                    required
                    disabled={loading}
                    autoComplete='email'
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className='space-y-2'>
                <Label htmlFor='password' className='text-sm font-medium'>
                  Password
                </Label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
                  <Input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleInputChange}
                    className='pl-10 pr-10'
                    placeholder='Enter your password'
                    required
                    disabled={loading}
                    autoComplete='current-password'
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
                      <EyeOff className='h-4 w-4 text-gray-400' />
                    ) : (
                      <Eye className='h-4 w-4 text-gray-400' />
                    )}
                  </Button>
                </div>
              </div>

              {/* Remember Me */}
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-2'>
                  <input
                    id='remember'
                    type='checkbox'
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className='rounded border-gray-300'
                    disabled={loading}
                    aria-label='Remember me'
                    title='Remember my email for future logins'
                  />
                  <Label htmlFor='remember' className='text-sm text-gray-600'>
                    Remember me
                  </Label>
                </div>
                <Button
                  type='button'
                  variant='link'
                  className='text-sm text-blue-600 hover:text-blue-800 p-0 h-auto'
                  disabled={loading}
                >
                  Forgot password?
                </Button>
              </div>

              {/* Error Message */}
              {error && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Success Message */}
              {success && (
                <Alert className='border-green-200 bg-green-50'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <AlertDescription className='text-green-800'>{success}</AlertDescription>
                </Alert>
              )}

              {/* Login Button */}
              <Button type='submit' className='w-full' disabled={loading || apiStatus !== 'ready'}>
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </>
                )}
              </Button>
            </form>

            {/* Test accounts are only available in development for testing purposes */}
            {/* They are hidden in production for security reasons */}
            {process.env.NODE_ENV === 'development' && 
             process.env.NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS === 'true' && (
              <div className='mt-6 pt-6 border-t border-gray-200'>
                <p className='text-xs text-gray-500 text-center mb-3'>
                  Quick test accounts for development:
                </p>
                <div className='grid grid-cols-1 gap-2'>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => quickLogin('provider@test.com', 'TestPass123!')}
                    disabled={loading}
                    className='text-xs'
                  >
                    <User className='mr-1 h-3 w-3' />
                    Test Provider
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => quickLogin('client@test.com', 'TestPass123!')}
                    disabled={loading}
                    className='text-xs'
                  >
                    <User className='mr-1 h-3 w-3' />
                    Test Client
                  </Button>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => quickLogin('admin@test.com', 'TestPass123!')}
                    disabled={loading}
                    className='text-xs'
                  >
                    <User className='mr-1 h-3 w-3' />
                    Test Admin
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className='text-center text-sm text-gray-500'>
          <p>
            Don't have an account?{' '}
            <Button variant='link' className='p-0 h-auto text-blue-600 hover:text-blue-800'>
              Contact administrator
            </Button>
          </p>
        </div>
      </div>
    </div>
  );
}
