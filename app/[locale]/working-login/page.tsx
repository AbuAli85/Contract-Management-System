'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function WorkingLoginPage() {
  const [email, setEmail] = useState('provider@test.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'checking' | 'connected' | 'error'
  >('checking');

  const _router = useRouter();
  const supabase = createClient();

  // Test Supabase connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      if (!supabase) {
        setConnectionStatus('error');
        setError('Supabase client is not available');
        return;
      }
      try {
        const { _data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);

        if (error) {

          setConnectionStatus('error');
          setError(`Connection failed: ${error.message}`);
        } else {
          setConnectionStatus('connected');
        }
      } catch (err) {

        setConnectionStatus('error');
        setError(
          `Connection error: ${err instanceof Error ? err.message : 'Unknown error'}`
        );
      }
    };

    testConnection();

    if (!supabase) return;

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setCurrentUser(session.user);
        setMessage(`Already logged in as: ${session.user.email}`);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setCurrentUser(session.user);
      } else {
        setCurrentUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogin = async () => {
    if (!supabase) {
      setError('Supabase client is not available');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      // Use the most basic auth method
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (authError) {

        // Provide specific error messages
        if (authError.message.includes('Invalid login credentials')) {
          setError(
            '❌ Invalid email or password. Please check your credentials.'
          );
        } else if (authError.message.includes('Database error')) {
          setError(
            '❌ Database error. Please run the schema fix script first.'
          );
        } else if (authError.message.includes('Email not confirmed')) {
          setError('❌ Email not confirmed. Please check your email.');
        } else {
          setError(`❌ Login failed: ${authError.message}`);
        }
        return;
      }

      if (!authData.user) {
        setError('❌ No user data returned from authentication');
        return;
      }

      setMessage(`✅ Successfully logged in as ${authData.user.email}`);
      setCurrentUser(authData.user);
    } catch (error) {

      setError(
        `❌ Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (!supabase) {
      setError('Supabase client is not available');
      return;
    }

    setLoading(true);
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setMessage('🔓 Logged out successfully');
    } catch (error) {
      setError(
        `❌ Logout error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    // Force navigation to dashboard
    window.location.href = `/${(window.location.pathname.match(/^\/([a-z]{2})\//)?.[1] ?? 'en')}/dashboard/provider-comprehensive`;
  };

  const runSchemaFix = () => {
    window.open(
      'https://reootcngcptfogfozlmz.supabase.co/project/reootcngcptfogfozlmz/sql/new',
      '_blank'
    );
  };

  const getConnectionBadge = () => {
    switch (connectionStatus) {
      case 'checking':
        return (
          <Badge variant='secondary'>
            <Loader2 className='h-3 w-3 mr-1 animate-spin' />
            Checking...
          </Badge>
        );
      case 'connected':
        return (
          <Badge variant='default' className='bg-green-500'>
            <CheckCircle className='h-3 w-3 mr-1' />
            Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge variant='destructive'>
            <XCircle className='h-3 w-3 mr-1' />
            Connection Error
          </Badge>
        );
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl flex items-center justify-center gap-2'>
            🔑 Working Login
            {getConnectionBadge()}
          </CardTitle>
          <p className='text-sm text-gray-600'>
            Simple authentication without complex logic
          </p>
        </CardHeader>

        <CardContent className='space-y-4'>
          {/* Connection Status Alert */}
          {connectionStatus === 'error' && (
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <div className='space-y-2'>
                  <p>Database connection failed. This usually means:</p>
                  <ul className='list-disc list-inside text-sm space-y-1'>
                    <li>Missing database tables/enums</li>
                    <li>Schema migration not applied</li>
                    <li>Role constraint issues</li>
                  </ul>
                  <Button size='sm' onClick={runSchemaFix} className='mt-2'>
                    🔧 Run Schema Fix in Supabase
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert className='border-green-200 bg-green-50'>
              <AlertDescription className='text-green-800'>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {currentUser && (
            <Alert className='border-blue-200 bg-blue-50'>
              <AlertDescription className='text-blue-800'>
                <div className='space-y-1'>
                  <div>
                    <strong>Logged in as:</strong> {currentUser.email}
                  </div>
                  <div>
                    <strong>User ID:</strong> {currentUser.id}
                  </div>
                  <div>
                    <strong>Confirmed:</strong>{' '}
                    {currentUser.email_confirmed_at ? '✅ Yes' : '❌ No'}
                  </div>
                  <div>
                    <strong>Role:</strong>{' '}
                    {currentUser.user_metadata?.role ||
                      currentUser.raw_user_meta_data?.role ||
                      'Unknown'}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {!currentUser ? (
            <div className='space-y-4'>
              <div>
                <Label htmlFor='email'>Email</Label>
                <Input
                  id='email'
                  type='email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder='provider@test.com'
                />
              </div>

              <div>
                <Label htmlFor='password'>Password</Label>
                <Input
                  id='password'
                  type='password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder='password'
                />
              </div>

              <Button
                className='w-full'
                onClick={handleLogin}
                disabled={loading || connectionStatus === 'error'}
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Logging in...
                  </>
                ) : (
                  '🔐 Login'
                )}
              </Button>

              {process.env.NODE_ENV === 'development' && (
                <div className='space-y-2'>
                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => {
                      setEmail('provider@test.com');
                      setPassword('password');
                    }}
                  >
                    📝 Provider Test Account
                  </Button>

                  <Button
                    variant='outline'
                    className='w-full'
                    onClick={() => {
                      setEmail('test@test.com');
                      setPassword('TestPass123!');
                    }}
                  >
                    🧪 Alternative Test Account
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className='space-y-3'>
              <Button
                className='w-full bg-green-600 hover:bg-green-700'
                onClick={goToDashboard}
              >
                🚀 Go to Provider Dashboard
              </Button>

              <Button
                variant='outline'
                className='w-full'
                onClick={handleLogout}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Logging out...
                  </>
                ) : (
                  '🔓 Logout'
                )}
              </Button>
            </div>
          )}

          <div className='text-xs text-gray-500 text-center border-t pt-2 space-y-1'>
            <p>
              <strong>Server:</strong> localhost:3001
            </p>
            <p>
              <strong>Supabase:</strong> reootcngcptfogfozlmz
            </p>
            <p>
              <strong>Connection:</strong> {connectionStatus}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
