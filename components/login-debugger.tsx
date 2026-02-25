'use client';

import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';

export function LoginDebugger() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleLogin = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setDebugInfo(null);

    try {
      const requestBody = {
        email: email.trim(),
        password,
      };

      const response = await fetch('/api/auth/simple-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseText = await response.text();

      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🔍 Debug Login - JSON parse error:', parseError);
        setError(`Invalid JSON response: ${responseText}`);
        return;
      }

      const debugData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData,
        timestamp: new Date().toISOString(),
        requestBody: { ...requestBody, password: '[HIDDEN]' },
      };

      setDebugInfo(debugData);

      if (response.ok) {
        setSuccess(
          `Login successful! Welcome ${responseData.user?.user_metadata?.full_name || responseData.user?.email}`
        );
      } else {
        console.error('🔍 Debug Login - Login failed:', responseData);
        setError(
          responseData.error ||
            `HTTP ${response.status}: ${response.statusText}`
        );
      }
    } catch (fetchError) {
      console.error('🔍 Debug Login - Fetch error:', fetchError);
      setError(
        `Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEndpoint = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setDebugInfo(null);

    try {
      const response = await fetch('/api/auth/simple-login', {
        method: 'GET',
      });

      const responseData = await response.json();

      const debugData = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseData,
        timestamp: new Date().toISOString(),
        testType: 'GET',
      };

      setDebugInfo(debugData);
    } catch (fetchError) {
      console.error('🔍 Debug Login - GET test error:', fetchError);
      setError(
        `GET test failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='space-y-6 max-w-2xl mx-auto p-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertCircle className='h-5 w-5' />
            Login Debugger
          </CardTitle>
          <CardDescription>
            Debug login issues by testing the simple-login endpoint directly
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='debug-email'>Email</Label>
              <Input
                id='debug-email'
                type='email'
                placeholder='Enter email address'
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='debug-password'>Password</Label>
              <div className='relative'>
                <Input
                  id='debug-password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className='flex gap-2'>
            <Button
              onClick={handleLogin}
              disabled={isLoading || !email || !password}
              className='flex-1'
            >
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Testing Login...
                </>
              ) : (
                'Test Login'
              )}
            </Button>
            <Button
              onClick={handleTestEndpoint}
              disabled={isLoading}
              variant='outline'
            >
              {isLoading ? (
                <Loader2 className='h-4 w-4 animate-spin' />
              ) : (
                'Test Endpoint'
              )}
            </Button>
          </div>

          {error && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className='h-4 w-4' />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {debugInfo && (
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>Debug Information</CardTitle>
                <CardDescription>
                  Response details from the simple-login endpoint
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant={
                      debugInfo.status >= 200 && debugInfo.status < 300
                        ? 'default'
                        : 'destructive'
                    }
                  >
                    {debugInfo.status} {debugInfo.statusText}
                  </Badge>
                  <span className='text-sm text-muted-foreground'>
                    {new Date(debugInfo.timestamp).toLocaleString()}
                  </span>
                </div>

                {debugInfo.body && (
                  <div>
                    <h4 className='font-medium mb-2'>Response Body:</h4>
                    <pre className='bg-muted p-3 rounded-md text-sm overflow-auto max-h-64'>
                      {JSON.stringify(debugInfo.body, null, 2)}
                    </pre>
                  </div>
                )}

                {debugInfo.headers && (
                  <div>
                    <h4 className='font-medium mb-2'>Response Headers:</h4>
                    <pre className='bg-muted p-3 rounded-md text-sm overflow-auto max-h-32'>
                      {JSON.stringify(debugInfo.headers, null, 2)}
                    </pre>
                  </div>
                )}

                {debugInfo.requestBody && (
                  <div>
                    <h4 className='font-medium mb-2'>Request Body:</h4>
                    <pre className='bg-muted p-3 rounded-md text-sm overflow-auto'>
                      {JSON.stringify(debugInfo.requestBody, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Common Issues & Solutions</CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='space-y-2'>
            <h4 className='font-medium text-green-600'>✅ Success (200)</h4>
            <p className='text-sm text-muted-foreground'>
              Login successful. Check the response body for user data and
              redirect path.
            </p>
          </div>

          <div className='space-y-2'>
            <h4 className='font-medium text-red-600'>❌ 400 Bad Request</h4>
            <ul className='text-sm text-muted-foreground space-y-1 ml-4'>
              <li>• Invalid email format</li>
              <li>• Missing email or password</li>
              <li>• Invalid credentials</li>
              <li>• CAPTCHA verification required</li>
              <li>• Account pending approval</li>
              <li>• Account deactivated</li>
            </ul>
          </div>

          <div className='space-y-2'>
            <h4 className='font-medium text-red-600'>
              ❌ 500 Internal Server Error
            </h4>
            <ul className='text-sm text-muted-foreground space-y-1 ml-4'>
              <li>• Supabase connection issues</li>
              <li>• Environment variables missing</li>
              <li>• Database connection problems</li>
              <li>• Server configuration issues</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
