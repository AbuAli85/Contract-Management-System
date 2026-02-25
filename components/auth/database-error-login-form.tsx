'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
// import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

export function DatabaseErrorLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [databaseStatus, setDatabaseStatus] = useState<
    'unknown' | 'healthy' | 'error' | 'testing'
  >('unknown');
  const [fallbackMode, setFallbackMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const router = useRouter();
  // const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    testDatabaseHealth();
  }, []);

  const testDatabaseHealth = async () => {
    setDatabaseStatus('testing');

    try {
      // Test 1: Basic connection - use a simple query instead of RPC
      const { data: healthData, error: healthError } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (healthError) {

        // Test 2: Try simple auth check as fallback
        try {
          const { data: sessionData, error: sessionError } =
            await supabase.auth.getSession();
          if (sessionError) {
            setDatabaseStatus('error');
            setFallbackMode(true);
          } else {
            setDatabaseStatus('error');
          }
        } catch (authError) {
          setDatabaseStatus('error');
          setFallbackMode(true);
        }
      } else {
        setDatabaseStatus('healthy');
        setFallbackMode(false);
      }
    } catch (error) {
      setDatabaseStatus('error');
      setFallbackMode(true);
    }
  };

  const clearAuthData = async () => {
    try {
      // Clear localStorage
      const keysToRemove = Object.keys(localStorage).filter(
        key => key.includes('supabase') || key.includes('sb-')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Clear sessionStorage
      sessionStorage.clear();

      // Sign out from Supabase
      await supabase.auth.signOut();

      // toast({
      //   title: 'Authentication Reset',
      //   description: 'Cleared all authentication data. Please try logging in again.',
      // });
    } catch (error) {
    }
  };

  const handleDatabaseErrorLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Since we're in database error mode, skip all Supabase calls
      // and immediately redirect to offline mode
      setSuccess('Switching to offline mode...');

      // toast({
      //   title: 'Switching to Demo Mode',
      //   description: 'Redirecting to offline demo access...',
      // });

      // Wait a moment for user to see the message
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Redirect to instant offline mode
      router.push('/instant-offline');
    } catch (error: any) {
      setError(
        'Unable to switch to offline mode. Please try refreshing the page.'
      );

      // toast({
      //   title: 'Switch Failed',
      //   description: 'Please refresh the page and try again.',
      //   variant: 'destructive',
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleNormalLogin = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {

        if (authError.message.includes('Database error')) {
          setDatabaseStatus('error');
          setFallbackMode(true);
          throw new Error(
            'Database connection issue detected. Please try the emergency login below.'
          );
        }

        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Authentication failed - no user returned');
      }

      // Try to fetch user profile
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('users')
          .select('id, email, full_name, role, status')
          .eq('id', authData.user.id)
          .single();

        if (profileError) {
        }

        setSuccess('Login successful! Redirecting...');

        // toast({
        //   title: 'Login Successful',
        //   description: 'Welcome back!',
        // });

        // Wait longer to ensure session is properly established
        setTimeout(() => {
          router.push('/dashboard-role-router');
        }, 3000);
      } catch (profileError) {

        setSuccess('Login successful! Redirecting...');

        // Wait longer to ensure session is properly established
        setTimeout(() => {
          router.push('/dashboard-role-router');
        }, 3000);
      }
    } catch (error: any) {
      setError(error.message);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    if (fallbackMode || databaseStatus === 'error') {
      await handleDatabaseErrorLogin();
    } else {
      await handleNormalLogin();
    }
  };

  const retryConnection = async () => {
    setRetryCount(0);
    await testDatabaseHealth();
  };

  const getDatabaseStatusBadge = () => {
    switch (databaseStatus) {
      case 'healthy':
        return (
          <Badge className='bg-green-100 text-green-800'>
            <Database className='h-3 w-3 mr-1' />
            Database Healthy
          </Badge>
        );
      case 'error':
        return (
          <Badge className='bg-red-100 text-red-800'>
            <WifiOff className='h-3 w-3 mr-1' />
            Database Issues
          </Badge>
        );
      case 'testing':
        return (
          <Badge className='bg-blue-100 text-blue-800'>
            <RefreshCw className='h-3 w-3 mr-1 animate-spin' />
            Testing Connection
          </Badge>
        );
      default:
        return (
          <Badge className='bg-gray-100 text-gray-800'>
            <Wifi className='h-3 w-3 mr-1' />
            Unknown Status
          </Badge>
        );
    }
  };

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-2xl font-bold'>Sign In</CardTitle>
          {getDatabaseStatusBadge()}
        </div>
        <CardDescription>
          Enter your credentials to access your account
        </CardDescription>

        {databaseStatus === 'error' && (
          <Alert className='border-blue-200 bg-blue-50'>
            <AlertTriangle className='h-4 w-4 text-blue-600' />
            <AlertDescription className='text-blue-800'>
              Database connectivity issues detected. Click "Switch to Demo Mode"
              below to access the full-featured demo version.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className='space-y-4'>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <div className='relative'>
              <Mail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='Enter your email'
                className='pl-10'
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='password'>Password</Label>
            <div className='relative'>
              <Lock className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='password'
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='Enter your password'
                className='pl-10 pr-10'
                required
                disabled={loading}
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-2 top-2 h-6 w-6 p-0'
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
            <Alert className='border-red-200 bg-red-50'>
              <AlertTriangle className='h-4 w-4 text-red-600' />
              <AlertDescription className='text-red-800'>
                {error}
                {retryCount > 1 && (
                  <div className='mt-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={retryConnection}
                      className='text-red-600 border-red-200'
                    >
                      <RefreshCw className='h-3 w-3 mr-1' />
                      Retry Connection
                    </Button>
                  </div>
                )}
              </AlertDescription>
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
                {databaseStatus === 'error'
                  ? 'Switching to Demo Mode...'
                  : 'Signing In...'}
              </>
            ) : (
              <>
                <Lock className='mr-2 h-4 w-4' />
                {databaseStatus === 'error' ? 'Switch to Demo Mode' : 'Sign In'}
              </>
            )}
          </Button>
        </form>

        {databaseStatus === 'error' && !loading && (
          <div className='space-y-2 pt-4 border-t'>
            <p className='text-sm text-muted-foreground text-center'>
              Having trouble? Try these options:
            </p>
            <div className='grid grid-cols-2 gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={clearAuthData}
                className='text-xs'
              >
                <RefreshCw className='h-3 w-3 mr-1' />
                Clear Cache
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={retryConnection}
                className='text-xs'
              >
                <Database className='h-3 w-3 mr-1' />
                Test Connection
              </Button>
            </div>
          </div>
        )}

        <div className='text-center text-sm text-muted-foreground'>
          Don't have an account?{' '}
          <Button
            variant='link'
            className='p-0 h-auto font-normal'
            onClick={() => router.push('/register/provider')}
          >
            Sign up as Provider
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
