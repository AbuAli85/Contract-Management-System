'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DirectLoginPage() {
  const [email, setEmail] = useState('provider@test.com');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
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
    setLoading(true);
    setMessage('');
    setError('');

    try {
      console.log('🔐 Direct Login - Attempting:', email);

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        setError(`❌ Login failed: ${authError.message}`);
        console.error('Auth error:', authError);
        return;
      }

      if (!authData.user) {
        setError('❌ No user data returned');
        return;
      }

      setMessage(`✅ Success! Logged in as ${authData.user.email}`);
      setCurrentUser(authData.user);

      console.log('✅ Login successful:', authData.user);
    } catch (error) {
      console.error('Login error:', error);
      setError(
        `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
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
    window.location.href = '/en/dashboard/provider-comprehensive';
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl'>🔐 Direct Login</CardTitle>
          <p className='text-sm text-gray-600'>
            Direct Supabase authentication
          </p>
        </CardHeader>

        <CardContent className='space-y-4'>
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
                    <strong>User ID:</strong> {currentUser.id}
                  </div>
                  <div>
                    <strong>Email:</strong> {currentUser.email}
                  </div>
                  <div>
                    <strong>Confirmed:</strong>{' '}
                    {currentUser.email_confirmed_at ? '✅ Yes' : '❌ No'}
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
                disabled={loading}
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

              <div className='space-y-2'>
                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => {
                    setEmail('provider@test.com');
                    setPassword('password');
                  }}
                >
                  📝 Use Provider Credentials
                </Button>

                <Button
                  variant='outline'
                  className='w-full'
                  onClick={() => {
                    setEmail('test@test.com');
                    setPassword('TestPass123!');
                  }}
                >
                  🧪 Use Test Credentials
                </Button>
              </div>
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

          <div className='text-xs text-gray-500 text-center border-t pt-2'>
            <p>Server: localhost:3001</p>
            <p>Direct Supabase auth test</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
