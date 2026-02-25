'use client';

import React, { useState } from 'react';
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
  Wifi,
  WifiOff,
  Shield,
  UserCheck,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { demoSessionManager } from '@/lib/auth/demo-session';

// Local authentication store for demo/development
const DEMO_USERS = [
  {
    email: 'provider@test.com',
    password: 'password123',
    role: 'provider',
    name: 'Demo Provider',
    company: 'Test Company Ltd',
  },
  {
    email: 'admin@test.com',
    password: 'admin123',
    role: 'admin',
    name: 'Demo Admin',
    company: 'System Admin',
  },
  {
    email: 'client@test.com',
    password: 'client123',
    role: 'client',
    name: 'Demo Client',
    company: 'Client Company',
  },
];

export function OfflineLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [offlineMode, setOfflineMode] = useState(true);

  const router = useRouter();
  const { toast } = useToast();

  const handleOfflineLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Simulate authentication delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check against demo users
      const user = DEMO_USERS.find(
        u => u.email === email && u.password === password
      );

      if (!user) {
        throw new Error(
          'Invalid credentials. Try: provider@test.com / password123'
        );
      }

      // Create demo session using session manager
      const session = demoSessionManager.createSession({
        email: user.email,
        name: user.name,
        role: user.role as 'provider' | 'admin' | 'client',
        company: user.company,
      });

      setSuccess(`Login successful! Welcome ${user.name} (${user.role})`);

      toast({
        title: 'Offline Login Successful',
        description: `Welcome back, ${user.name}! Using demo mode while database is unavailable.`,
      });

      // Redirect based on role
      setTimeout(() => {
        if (user.role === 'provider') {
          router.push('/dashboard/provider');
        } else if (user.role === 'admin') {
          router.push('/dashboard/admin');
        } else {
          router.push('/dashboard/client');
        }
      }, 2000);
    } catch (error: any) {
      console.error('🔒 Offline login failed:', error);
      setError(error.message);

      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (userType: 'provider' | 'admin' | 'client') => {
    const user = DEMO_USERS.find(u => u.role === userType);
    if (user) {
      setEmail(user.email);
      setPassword(user.password);
    }
  };

  return (
    <Card className='w-full max-w-md mx-auto'>
      <CardHeader className='space-y-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='text-2xl font-bold'>Demo Login</CardTitle>
          <Badge className='bg-orange-100 text-orange-800'>
            <WifiOff className='h-3 w-3 mr-1' />
            Offline Mode
          </Badge>
        </div>
        <CardDescription>
          Database unavailable - using demo authentication
        </CardDescription>

        <Alert className='border-blue-200 bg-blue-50'>
          <Shield className='h-4 w-4 text-blue-600' />
          <AlertDescription className='text-blue-800'>
            <strong>Demo Mode Active:</strong> Supabase database is experiencing
            issues. You can test the application using demo credentials below.
          </AlertDescription>
        </Alert>
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Quick Demo Login Buttons */}
        <div className='space-y-2'>
          <Label className='text-sm font-medium'>Quick Demo Login:</Label>
          <div className='grid grid-cols-1 gap-2'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => fillDemoCredentials('provider')}
              className='justify-start'
            >
              <UserCheck className='h-4 w-4 mr-2' />
              Provider Demo (provider@test.com)
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => fillDemoCredentials('admin')}
              className='justify-start'
            >
              <Shield className='h-4 w-4 mr-2' />
              Admin Demo (admin@test.com)
            </Button>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={() => fillDemoCredentials('client')}
              className='justify-start'
            >
              <Mail className='h-4 w-4 mr-2' />
              Client Demo (client@test.com)
            </Button>
          </div>
        </div>

        <div className='relative'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>
              Or enter manually
            </span>
          </div>
        </div>

        <form onSubmit={handleOfflineLogin} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='email'>Email</Label>
            <div className='relative'>
              <Mail className='absolute left-3 top-3 h-4 w-4 text-muted-foreground' />
              <Input
                id='email'
                type='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='Enter demo email'
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
                placeholder='Enter demo password'
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
                Authenticating...
              </>
            ) : (
              <>
                <Shield className='mr-2 h-4 w-4' />
                Demo Login
              </>
            )}
          </Button>
        </form>

        <div className='space-y-3 pt-4 border-t'>
          <div className='text-sm text-muted-foreground'>
            <strong>Demo Credentials:</strong>
          </div>
          <div className='text-xs space-y-1 text-muted-foreground'>
            <div>
              👤 <strong>Provider:</strong> provider@test.com / password123
            </div>
            <div>
              🛡️ <strong>Admin:</strong> admin@test.com / admin123
            </div>
            <div>
              📧 <strong>Client:</strong> client@test.com / client123
            </div>
          </div>
        </div>

        <div className='text-center'>
          <Button
            variant='link'
            className='p-0 h-auto font-normal text-xs'
            onClick={() => router.push('/database-health')}
          >
            Check Database Status
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
