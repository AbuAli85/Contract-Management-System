'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function SimpleWorkingLogin() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const supabase = createClient();

  // Check if Supabase client is available
  if (!supabase) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <div className='w-full max-w-md bg-white rounded-lg shadow-md p-6'>
          <div className='text-center'>
            <h1 className='text-2xl font-bold text-red-600 mb-4'>
              Configuration Error
            </h1>
            <p className='text-gray-600 mb-4'>
              Supabase client is not properly configured. Please check your
              environment variables.
            </p>
            <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-red-800 text-sm'>
                NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must
                be set.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('🔐 Simple Login - Attempting login with:', email);

      // Step 1: Try Supabase auth login
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {
        console.error('🔐 Simple Login - Auth error:', authError);
        setError(`Login failed: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        setError('Login failed: No user data returned');
        return;
      }

      console.log('🔐 Simple Login - Auth successful:', authData.user.id);
      setMessage('Login successful! Redirecting...');

      // Step 2: Get user profile to determine redirect
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role, status, full_name')
        .eq('id', authData.user.id)
        .single();

      let redirectPath = '/en/dashboard';

      if (!profileError && userProfile && userProfile.role) {
        console.log('🔐 Simple Login - User role:', userProfile.role);

        // Route based on role
        switch (userProfile.role) {
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
          default:
            redirectPath = '/en/dashboard';
        }
      }

      console.log('🔐 Simple Login - Redirecting to:', redirectPath);

      // Use Next.js router for proper navigation
      setTimeout(() => {
        router.push(redirectPath);
      }, 1000);
    } catch (error) {
      console.error('🔐 Simple Login - Exception:', error);
      setError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (testEmail: string, testPassword: string) => {
    setEmail(testEmail);
    setPassword(testPassword);

    // Auto-submit after a brief delay
    setTimeout(() => {
      const form = document.getElementById(
        'simple-login-form'
      ) as HTMLFormElement;
      if (form) {
        form.requestSubmit();
      }
    }, 100);
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-md bg-white rounded-lg shadow-md p-6'>
        <div className='text-center mb-6'>
          <h1 className='text-2xl font-bold text-gray-900'>
            Simple Login Test
          </h1>
          <p className='text-sm text-gray-600'>
            Direct Supabase authentication
          </p>
        </div>

        <form
          id='simple-login-form'
          onSubmit={handleLogin}
          className='space-y-4'
        >
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder='Enter email'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Password
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder='Enter password'
              className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              required
            />
          </div>

          {error && (
            <div className='p-3 bg-red-50 border border-red-200 rounded-md'>
              <p className='text-red-800 text-sm'>{error}</p>
            </div>
          )}

          {message && (
            <div className='p-3 bg-green-50 border border-green-200 rounded-md'>
              <p className='text-green-800 text-sm'>{message}</p>
            </div>
          )}

          <button
            type='submit'
            className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50'
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Quick Test Buttons */}
        <div className='border-t pt-4 mt-4'>
          <p className='text-sm text-gray-600 mb-2'>Quick test accounts:</p>
          <div className='space-y-2'>
            <button
              className='w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm'
              onClick={() => quickLogin('provider@test.com', 'TestPass123!')}
              disabled={loading}
            >
              Test Provider Account
            </button>
            <button
              className='w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm'
              onClick={() => quickLogin('user@test.com', 'TestPass123!')}
              disabled={loading}
            >
              Test User Account
            </button>
            <button
              className='w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 text-sm'
              onClick={() => quickLogin('admin@test.com', 'TestPass123!')}
              disabled={loading}
            >
              Test Admin Account
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className='border-t pt-4 mt-4 space-y-2'>
          <button
            className='w-full bg-transparent text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            onClick={() => router.push(`/${locale}/test-auth`)}
          >
            🧪 Open Diagnostic Page
          </button>
          <button
            className='w-full bg-transparent text-blue-600 py-2 px-4 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
            onClick={() => router.push(`/${locale}/auth/register`)}
          >
            📝 Create New Account
          </button>
        </div>

        {/* Debug Info */}
        <div className='text-xs text-gray-500 border-t pt-2 mt-4'>
          <p>Server: localhost:3001</p>
          <p>
            Supabase:{' '}
            {process.env.NEXT_PUBLIC_SUPABASE_URL
              ? 'Connected'
              : 'Not configured'}
          </p>
        </div>
      </div>
    </div>
  );
}
