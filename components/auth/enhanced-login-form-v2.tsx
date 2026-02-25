'use client';
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Shield,
  Lock,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { LoginErrorHandler } from './login-error-handler';
import { authSessionManager } from '@/lib/auth-session-manager';
import { useAuth } from '@/app/providers';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;

interface LoginFormData {
  email: string;
  password: string;
}

export default function EnhancedLoginFormV2() {
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
  const [rememberMe, setRememberMe] = useState(false);
  const [showErrorHandler, setShowErrorHandler] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<LoginFormData>>({});
  const [attemptCount, setAttemptCount] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const emailRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { refreshSession } = useAuth();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
    const storedLockout = localStorage.getItem('loginLockoutUntil');
    if (storedLockout) {
      const lockoutTime = parseInt(storedLockout, 10);
      if (lockoutTime > Date.now()) {
        setLockedUntil(lockoutTime);
      } else {
        localStorage.removeItem('loginLockoutUntil');
        localStorage.removeItem('loginAttemptCount');
      }
    }
    const storedAttempts = localStorage.getItem('loginAttemptCount');
    if (storedAttempts) setAttemptCount(parseInt(storedAttempts, 10));
  }, []);

  useEffect(() => {
    if (!lockedUntil) return;
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
      if (remaining <= 0) {
        setLockedUntil(null);
        setAttemptCount(0);
        setLockCountdown(0);
        localStorage.removeItem('loginLockoutUntil');
        localStorage.removeItem('loginAttemptCount');
        clearInterval(interval);
      } else {
        setLockCountdown(remaining);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lockedUntil]);

  const validateField = (name: keyof LoginFormData, value: string): string => {
    if (name === 'email') {
      if (!value.trim()) return 'Email is required';
      if (!/\S+@\S+\.\S+/.test(value))
        return 'Please enter a valid email address';
    }
    if (name === 'password') {
      if (!value.trim()) return 'Password is required';
      if (value.length < 6) return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
      if (error) setError('');
      if (fieldErrors[name as keyof LoginFormData]) {
        setFieldErrors(prev => ({
          ...prev,
          [name]: validateField(name as keyof LoginFormData, value),
        }));
      }
    },
    [error, fieldErrors]
  );

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFieldErrors(prev => ({
      ...prev,
      [name]: validateField(name as keyof LoginFormData, value),
    }));
  }, []);

  const getRedirectPath = (role: string): string => {
    switch (role) {
      case 'provider':
        return `/${locale}/dashboard/provider-comprehensive`;
      case 'client':
        return `/${locale}/dashboard/client-comprehensive`;
      case 'admin':
      case 'super_admin':
        return `/${locale}/dashboard`;
      case 'hr_admin':
      case 'hr_staff':
        return `/${locale}/hr`;
      default:
        return `/${locale}/dashboard`;
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockedUntil && lockedUntil > Date.now()) return;
    const emailError = validateField('email', formData.email);
    const passwordError = validateField('password', formData.password);
    if (emailError || passwordError) {
      setFieldErrors({ email: emailError, password: passwordError });
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const result = await authSessionManager.signIn(
        formData.email,
        formData.password
      );
      if (!result.success) {
        const newCount = attemptCount + 1;
        setAttemptCount(newCount);
        localStorage.setItem('loginAttemptCount', newCount.toString());
        if (newCount >= MAX_ATTEMPTS) {
          const lockoutTime = Date.now() + LOCKOUT_DURATION_MS;
          setLockedUntil(lockoutTime);
          localStorage.setItem('loginLockoutUntil', lockoutTime.toString());
          setError('Too many failed attempts. Account locked for 15 minutes.');
          return;
        }
        if (
          result.error?.includes('captcha') ||
          result.error?.includes('verification')
        ) {
          setShowErrorHandler(true);
          return;
        }
        if (result.error?.includes('Invalid login credentials')) {
          setError(
            `Invalid email or password. ${MAX_ATTEMPTS - newCount} attempt(s) remaining.`
          );
        } else if (result.error?.includes('pending approval')) {
          setError(
            'Your account is pending approval. Please contact an administrator.'
          );
        } else if (result.error?.includes('deactivated')) {
          setError(
            'Your account has been deactivated. Please contact an administrator.'
          );
        } else if (result.error?.includes('Email not confirmed')) {
          setError(
            'Please verify your email address. Check your inbox for a confirmation link.'
          );
        } else {
          setError(result.error || 'Login failed. Please try again.');
        }
        return;
      }
      setAttemptCount(0);
      localStorage.removeItem('loginAttemptCount');
      localStorage.removeItem('loginLockoutUntil');
      setSuccess('Login successful! Redirecting...');
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', formData.email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      authSessionManager.updateLastActivity();
      localStorage.setItem('just_logged_in', Date.now().toString());
      const redirectPath = getRedirectPath(
        result.session?.profile?.role || 'user'
      );
      try {
        await refreshSession();
      } catch {
        /* non-fatal */
      }
      setTimeout(() => {
        window.location.replace(redirectPath);
      }, 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (
        msg.includes('fetch') ||
        msg.includes('network') ||
        msg.includes('connection')
      ) {
        setShowErrorHandler(true);
      } else {
        setError(`Connection error: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  if (showErrorHandler) {
    return (
      <LoginErrorHandler
        error={error || 'An error occurred during login'}
        onRetry={() => {
          setShowErrorHandler(false);
          setError('');
        }}
      />
    );
  }

  const isLocked = lockedUntil !== null && lockedUntil > Date.now();
  const formatCountdown = (s: number) =>
    `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4'>
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl' />
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl' />
      </div>
      <div className='w-full max-w-md relative z-10'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/30 mb-4'>
            <Shield className='h-8 w-8 text-white' />
          </div>
          <h1 className='text-2xl font-bold text-white'>SmartPro CMS</h1>
          <p className='text-slate-400 text-sm mt-1'>
            Contract Management System
          </p>
        </div>
        <Card className='border-0 shadow-2xl bg-white/95 backdrop-blur-sm'>
          <CardHeader className='pb-4 pt-6 px-6'>
            <h2 className='text-xl font-semibold text-slate-800'>
              Welcome back
            </h2>
            <p className='text-slate-500 text-sm'>
              Sign in to your account to continue
            </p>
          </CardHeader>
          <CardContent className='px-6 pb-6 space-y-5'>
            <form onSubmit={handleLogin} className='space-y-4' noValidate>
              <div className='space-y-1.5'>
                <Label
                  htmlFor='email'
                  className='text-slate-700 font-medium text-sm'
                >
                  Email address
                </Label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                  <Input
                    ref={emailRef}
                    id='email'
                    name='email'
                    type='email'
                    autoComplete='email'
                    placeholder='you@company.com'
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={loading || isLocked}
                    aria-invalid={!!fieldErrors.email}
                    className={`pl-10 h-11 transition-colors ${fieldErrors.email ? 'border-red-400 focus-visible:ring-red-400' : 'border-slate-200 focus-visible:ring-blue-500'}`}
                  />
                </div>
                {fieldErrors.email && (
                  <p className='text-xs text-red-500 flex items-center gap-1 mt-1'>
                    <AlertCircle className='h-3 w-3' />
                    {fieldErrors.email}
                  </p>
                )}
              </div>
              <div className='space-y-1.5'>
                <div className='flex items-center justify-between'>
                  <Label
                    htmlFor='password'
                    className='text-slate-700 font-medium text-sm'
                  >
                    Password
                  </Label>
                  <Button
                    type='button'
                    variant='link'
                    className='text-xs text-blue-600 hover:text-blue-700 p-0 h-auto font-normal'
                    onClick={() =>
                      router.push(`/${locale}/auth/forgot-password`)
                    }
                    disabled={loading}
                  >
                    Forgot password?
                  </Button>
                </div>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400' />
                  <Input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='current-password'
                    placeholder='Enter your password'
                    value={formData.password}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={loading || isLocked}
                    aria-invalid={!!fieldErrors.password}
                    className={`pl-10 pr-10 h-11 transition-colors ${fieldErrors.password ? 'border-red-400 focus-visible:ring-red-400' : 'border-slate-200 focus-visible:ring-blue-500'}`}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(v => !v)}
                    className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors'
                    aria-label={
                      showPassword ? 'Hide password' : 'Show password'
                    }
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className='text-xs text-red-500 flex items-center gap-1 mt-1'>
                    <AlertCircle className='h-3 w-3' />
                    {fieldErrors.password}
                  </p>
                )}
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='remember'
                  checked={rememberMe}
                  onCheckedChange={c => setRememberMe(c === true)}
                  disabled={loading || isLocked}
                />
                <Label
                  htmlFor='remember'
                  className='text-sm text-slate-600 cursor-pointer font-normal'
                >
                  Remember me for 30 days
                </Label>
              </div>
              {isLocked && (
                <Alert
                  variant='destructive'
                  className='border-red-300 bg-red-50'
                >
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription className='text-red-800'>
                    Account temporarily locked. Try again in{' '}
                    <span className='font-semibold'>
                      {formatCountdown(lockCountdown)}
                    </span>
                  </AlertDescription>
                </Alert>
              )}
              {error && !isLocked && (
                <Alert
                  variant='destructive'
                  className='border-red-300 bg-red-50'
                >
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription className='text-red-800'>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              {success && (
                <Alert className='border-green-300 bg-green-50'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <AlertDescription className='text-green-800'>
                    {success}
                  </AlertDescription>
                </Alert>
              )}
              {attemptCount > 0 && attemptCount < MAX_ATTEMPTS && !isLocked && (
                <p className='text-xs text-amber-600 text-center'>
                  {MAX_ATTEMPTS - attemptCount} attempt(s) remaining before
                  temporary lockout
                </p>
              )}
              <Button
                type='submit'
                className='w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md shadow-blue-500/20 transition-all'
                disabled={loading || isLocked}
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className='ml-2 h-4 w-4' />
                  </>
                )}
              </Button>
            </form>
            <div className='pt-4 border-t border-slate-100 text-center'>
              <p className='text-sm text-slate-500'>
                Don&apos;t have an account?{' '}
                <Button
                  variant='link'
                  className='p-0 h-auto text-blue-600 hover:text-blue-700 text-sm font-medium'
                  onClick={() => router.push(`/${locale}/auth/register`)}
                >
                  Contact your administrator
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
        <div className='flex items-center justify-center gap-2 mt-6 text-slate-500 text-xs'>
          <Shield className='h-3.5 w-3.5' />
          <span>Secured with 256-bit SSL encryption</span>
        </div>
      </div>
    </div>
  );
}
