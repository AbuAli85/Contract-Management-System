'use client';
import React, { useState, useRef, useEffect } from 'react';
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
import {
  Loader2,
  Mail,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Shield,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const emailRef = useRef<HTMLInputElement>(null);
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const validateEmail = (value: string): string => {
    if (!value.trim()) return 'Email address is required';
    if (!/\S+@\S+\.\S+/.test(value))
      return 'Please enter a valid email address';
    return '';
  };

  const handleBlur = () => {
    setFieldError(validateEmail(email));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validateEmail(email);
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
      } else {
        setError(
          data.error?.message || 'Failed to send reset email. Please try again.'
        );
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          </div>
          <Card className='border-0 shadow-2xl bg-white/95 backdrop-blur-sm text-center'>
            <CardContent className='pt-8 pb-8 px-8'>
              <div className='flex justify-center mb-4'>
                <div className='w-16 h-16 rounded-full bg-green-100 flex items-center justify-center'>
                  <CheckCircle className='h-8 w-8 text-green-600' />
                </div>
              </div>
              <h2 className='text-xl font-semibold text-slate-800 mb-2'>
                Check your email
              </h2>
              <p className='text-slate-500 text-sm mb-2'>
                We&apos;ve sent a password reset link to
              </p>
              <p className='font-semibold text-slate-800 text-sm mb-6 break-all'>
                {email}
              </p>
              <p className='text-slate-400 text-xs mb-6'>
                Didn&apos;t receive the email? Check your spam folder, or{' '}
                <button
                  onClick={() => setSuccess(false)}
                  className='text-blue-600 hover:underline font-medium'
                >
                  try again
                </button>
                .
              </p>
              <Link
                href={`/${locale}/auth/login`}
                className='inline-flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium'
              >
                <ArrowLeft className='h-4 w-4' />
                Back to sign in
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
            <div className='flex justify-center mb-3'>
              <div className='w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center'>
                <Mail className='h-6 w-6 text-blue-600' />
              </div>
            </div>
            <CardTitle className='text-xl font-semibold text-slate-800 text-center'>
              Forgot your password?
            </CardTitle>
            <CardDescription className='text-center text-slate-500'>
              Enter your email address and we&apos;ll send you a secure link to
              reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent className='px-6 pb-6'>
            <form onSubmit={handleSubmit} className='space-y-4' noValidate>
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
                    type='email'
                    autoComplete='email'
                    placeholder='you@company.com'
                    value={email}
                    onChange={e => {
                      setEmail(e.target.value);
                      if (error) setError('');
                      if (fieldError) setFieldError('');
                    }}
                    onBlur={handleBlur}
                    required
                    disabled={loading}
                    aria-invalid={!!fieldError}
                    className={`pl-10 h-11 transition-colors ${
                      fieldError
                        ? 'border-red-400 focus-visible:ring-red-400'
                        : 'border-slate-200 focus-visible:ring-blue-500'
                    }`}
                  />
                </div>
                {fieldError && (
                  <p className='text-xs text-red-500 flex items-center gap-1 mt-1'>
                    <AlertCircle className='h-3 w-3' />
                    {fieldError}
                  </p>
                )}
              </div>

              {error && (
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

              <Button
                type='submit'
                className='w-full h-11 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium shadow-md shadow-blue-500/20 transition-all'
                disabled={loading || !email}
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Sending reset link...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>

              <div className='text-center pt-2'>
                <Link
                  href={`/${locale}/auth/login`}
                  className='inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 transition-colors'
                >
                  <ArrowLeft className='h-3.5 w-3.5' />
                  Back to sign in
                </Link>
              </div>
            </form>
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
