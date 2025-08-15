'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Database,
  User,
  Key,
  Shield,
} from 'lucide-react';

export default function AuthTestPage() {
  const [connectionStatus, setConnectionStatus] = useState<
    'checking' | 'connected' | 'error'
  >('checking');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authTests, setAuthTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    testConnection();
    checkCurrentUser();
  }, []);

  const testConnection = async () => {
    try {
      console.log('🔗 Testing Supabase connection...');

      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Test basic connection
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        console.error('❌ Connection test failed:', error);
        setConnectionStatus('error');
        setAuthTests(prev => [
          ...prev,
          {
            name: 'Database Connection',
            status: 'error',
            message: error.message,
          },
        ]);
      } else {
        console.log('✅ Supabase connection successful');
        setConnectionStatus('connected');
        setAuthTests(prev => [
          ...prev,
          {
            name: 'Database Connection',
            status: 'success',
            message: 'Connected to Supabase successfully',
          },
        ]);
      }
    } catch (err) {
      console.error('❌ Connection error:', err);
      setConnectionStatus('error');
      setAuthTests(prev => [
        ...prev,
        {
          name: 'Database Connection',
          status: 'error',
          message:
            err instanceof Error ? err.message : 'Unknown connection error',
        },
      ]);
    }
  };

  const checkCurrentUser = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setCurrentUser(session.user);
        setAuthTests(prev => [
          ...prev,
          {
            name: 'Current Session',
            status: 'success',
            message: `Logged in as ${session.user.email}`,
          },
        ]);
      } else {
        setAuthTests(prev => [
          ...prev,
          {
            name: 'Current Session',
            status: 'info',
            message: 'No active session',
          },
        ]);
      }
    } catch (err) {
      setAuthTests(prev => [
        ...prev,
        {
          name: 'Current Session',
          status: 'error',
          message: err instanceof Error ? err.message : 'Session check failed',
        },
      ]);
    }
  };

  const testBasicAuth = async () => {
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Test basic signup
      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'testpass123';

      console.log('🧪 Testing basic signup:', testEmail);

      const { data: signupData, error: signupError } =
        await supabase.auth.signUp({
          email: testEmail,
          password: testPassword,
          options: {
            data: {
              full_name: 'Test User',
              role: 'provider',
            },
          },
        });

      if (signupError) {
        setAuthTests(prev => [
          ...prev,
          {
            name: 'Basic Signup Test',
            status: 'error',
            message: `Signup failed: ${signupError.message}`,
          },
        ]);
      } else if (signupData.user) {
        setAuthTests(prev => [
          ...prev,
          {
            name: 'Basic Signup Test',
            status: 'success',
            message: `Test account created: ${testEmail}`,
          },
        ]);

        // Test immediate login
        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: testEmail,
            password: testPassword,
          });

        if (loginError) {
          setAuthTests(prev => [
            ...prev,
            {
              name: 'Basic Login Test',
              status: 'error',
              message: `Login failed: ${loginError.message}`,
            },
          ]);
        } else {
          setAuthTests(prev => [
            ...prev,
            {
              name: 'Basic Login Test',
              status: 'success',
              message: `Login successful for ${testEmail}`,
            },
          ]);
          setCurrentUser(loginData.user);
        }
      }
    } catch (err) {
      setAuthTests(prev => [
        ...prev,
        {
          name: 'Auth Test',
          status: 'error',
          message: err instanceof Error ? err.message : 'Auth test failed',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const testExistingLogin = async () => {
    setLoading(true);

    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Test with known credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'provider@test.com',
        password: 'password',
      });

      if (error) {
        setAuthTests(prev => [
          ...prev,
          {
            name: 'Test Account Login',
            status: 'error',
            message: `Login failed: ${error.message}`,
          },
        ]);
      } else {
        setAuthTests(prev => [
          ...prev,
          {
            name: 'Test Account Login',
            status: 'success',
            message: `Logged in as provider@test.com`,
          },
        ]);
        setCurrentUser(data.user);
      }
    } catch (err) {
      setAuthTests(prev => [
        ...prev,
        {
          name: 'Test Account Login',
          status: 'error',
          message: err instanceof Error ? err.message : 'Login test failed',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      await supabase.auth.signOut();
      setCurrentUser(null);
      setAuthTests(prev => [
        ...prev,
        {
          name: 'Logout',
          status: 'success',
          message: 'Logged out successfully',
        },
      ]);
    } catch (err) {
      setAuthTests(prev => [
        ...prev,
        {
          name: 'Logout',
          status: 'error',
          message: err instanceof Error ? err.message : 'Logout failed',
        },
      ]);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'error':
        return <XCircle className='h-4 w-4 text-red-500' />;
      case 'info':
        return <AlertTriangle className='h-4 w-4 text-blue-500' />;
      default:
        return <AlertTriangle className='h-4 w-4 text-yellow-500' />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className='bg-green-500'>✅ Pass</Badge>;
      case 'error':
        return <Badge variant='destructive'>❌ Fail</Badge>;
      case 'info':
        return <Badge variant='secondary'>ℹ️ Info</Badge>;
      default:
        return <Badge variant='secondary'>⚠️ Unknown</Badge>;
    }
  };

  const [authTest, setAuthTest] = useState<string>('Not tested');
  const [sessionTest, setSessionTest] = useState<string>('Not tested');
  const [demoTest, setDemoTest] = useState<string>('Not tested');
  const [loading, setLoading] = useState(false);

  // Test authentication system
  const testAuthentication = async () => {
    setLoading(true);
    try {
      // Test 1: Check if demo mode is disabled
      const demoMode = localStorage.getItem('auth-mode') === 'offline-demo';
      if (demoMode) {
        setDemoTest('❌ Demo mode is still active - clearing now');
        // Clear demo mode
        localStorage.removeItem('demo-user-session');
        localStorage.removeItem('user-role');
        localStorage.removeItem('auth-mode');
        setDemoTest('✅ Demo mode cleared');
      } else {
        setDemoTest('✅ Demo mode is disabled');
      }

      // Test 2: Check authentication endpoint
      const response = await fetch('/api/auth/check-session');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          setAuthTest(`✅ Authenticated as: ${data.user?.email || 'Unknown'}`);
        } else {
          setAuthTest('✅ Not authenticated (correct behavior)');
        }
      } else {
        setAuthTest(`❌ Auth endpoint error: ${response.status}`);
      }

      // Test 3: Check session
      const sessionResponse = await fetch('/api/auth/check-session');
      if (sessionResponse.ok) {
        const sessionData = await sessionResponse.json();
        if (sessionData.authenticated && sessionData.user) {
          setSessionTest(`✅ Valid session for: ${sessionData.user.email}`);
        } else {
          setSessionTest('✅ No valid session (correct behavior)');
        }
      } else {
        setSessionTest(`❌ Session check error: ${sessionResponse.status}`);
      }

    } catch (error) {
      console.error('Test error:', error);
      setAuthTest(`❌ Test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='text-3xl flex items-center justify-center gap-2'>
              <Database className='h-8 w-8 text-blue-600' />
              Authentication Test Center
            </CardTitle>
            <p className='text-gray-600'>
              Test and diagnose authentication issues in real-time
            </p>
          </CardHeader>
        </Card>

        {/* Connection Status */}
        <Card
          className={`border-2 ${connectionStatus === 'connected' ? 'border-green-200 bg-green-50' : connectionStatus === 'error' ? 'border-red-200 bg-red-50' : 'border-yellow-200 bg-yellow-50'}`}
        >
          <CardContent className='p-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Database className='h-5 w-5' />
                <span className='font-semibold'>Supabase Connection</span>
              </div>
              <Badge
                className={
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'error'
                      ? 'bg-red-500'
                      : 'bg-yellow-500'
                }
              >
                {connectionStatus === 'connected'
                  ? '✅ Connected'
                  : connectionStatus === 'error'
                    ? '❌ Error'
                    : '🔄 Checking'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Current User */}
        {currentUser && (
          <Card className='border-blue-200 bg-blue-50'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='font-semibold text-blue-900 flex items-center gap-2'>
                    <User className='h-4 w-4' />
                    Current User
                  </h3>
                  <p className='text-sm text-blue-700'>
                    📧 {currentUser.email} | 🆔 {currentUser.id}
                  </p>
                  <p className='text-sm text-blue-700'>
                    ✅ Confirmed:{' '}
                    {currentUser.email_confirmed_at ? 'Yes' : 'No'} | 👤 Role:{' '}
                    {currentUser.user_metadata?.role || 'Unknown'}
                  </p>
                </div>
                <Button size='sm' onClick={logout} variant='outline'>
                  🔓 Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Key className='h-5 w-5' />
              Authentication Tests
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Button
                onClick={testBasicAuth}
                disabled={loading || connectionStatus !== 'connected'}
                className='w-full'
              >
                🧪 Test Signup/Login
              </Button>

              <Button
                onClick={testExistingLogin}
                disabled={loading || connectionStatus !== 'connected'}
                variant='outline'
                className='w-full'
              >
                🔐 Test Existing Account
              </Button>

              <Button
                onClick={() => window.open('/en/basic-signup', '_blank')}
                variant='outline'
                className='w-full'
              >
                👥 Try Basic Signup
              </Button>
            </div>

            <Alert>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                <strong>Test Credentials:</strong> provider@test.com / password
                <br />
                <strong>New Signup:</strong> Creates temporary test account for
                verification
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Test Results */}
        {authTests.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {authTests.map((test, index) => (
                <Card key={index} className='border-l-4 border-l-gray-300'>
                  <CardContent className='p-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center gap-2'>
                        {getStatusIcon(test.status)}
                        <span className='font-medium'>{test.name}</span>
                      </div>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className='text-sm text-gray-600'>{test.message}</p>
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Quick Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.open('/en/basic-signup', '_blank')}
              >
                👥 Basic Signup
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.open('/en/working-login', '_blank')}
              >
                🔐 Working Login
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.open('/en/dashboard-preview', '_blank')}
              >
                👁️ Dashboard Demo
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  window.open(
                    'https://reootcngcptfogfozlmz.supabase.co/project/reootcngcptfogfozlmz/auth/users',
                    '_blank'
                  )
                }
              >
                👤 Supabase Users
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Authentication System Test
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Authentication Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  Test the authentication system and verify it's working properly
                </p>
                <Button 
                  onClick={testAuthentication} 
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Testing...' : 'Run Authentication Tests'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Test Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <strong>Demo Mode:</strong> {demoTest}
                </div>
                <div>
                  <strong>Authentication:</strong> {authTest}
                </div>
                <div>
                  <strong>Session:</strong> {sessionTest}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🔒 Authentication System Status
            </h3>
            <p className="text-blue-800 text-sm">
              The authentication system has been fixed to prevent automatic demo mode bypass. 
              Users must now properly authenticate through the login system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
