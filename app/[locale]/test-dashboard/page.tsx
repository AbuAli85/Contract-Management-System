'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  CheckCircle,
  AlertCircle,
  User,
  Database,
  Activity,
  LogIn,
  UserPlus,
  Eye,
  Server,
  Wifi,
  Shield,
} from 'lucide-react';
import Link from 'next/link';

export default function TestDashboardPage() {
  const { user, loading, hasPermission } = useEnhancedRBAC();
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);
  const [loginCredentials, setLoginCredentials] = useState({
    email: 'provider@test.com',
    password: 'TestPass123!',
  });

  const supabase = createClient();

  const runTests = async () => {
    setTesting(true);
    const results: any = {};

    try {
      // Test 1: Supabase Connection
      console.log('🔍 Testing Supabase connection...');
      try {
        const { data, error } = await supabase
          .from('users')
          .select('count')
          .limit(1);
        results.supabaseConnection = {
          success: true,
          message: 'Connected successfully',
        };
      } catch (error) {
        results.supabaseConnection = {
          success: false,
          message: `Connection failed: ${error}`,
        };
      }

      // Test 2: Authentication Status
      console.log('🔍 Testing authentication status...');
      results.authentication = {
        success: !!user,
        message: user
          ? `Logged in as: ${user.email} (${user.role})`
          : 'Not authenticated',
      };

      // Test 3: Role-Based Access
      console.log('🔍 Testing role-based access...');
      const hasDashboardAccess = hasPermission('dashboard.view');
      results.roleAccess = {
        success: hasDashboardAccess,
        message: hasDashboardAccess
          ? 'Dashboard access granted'
          : 'Dashboard access denied',
      };

      // Test 4: API Endpoints
      console.log('🔍 Testing API endpoints...');
      try {
        const response = await fetch('/api/provider/stats');
        results.apiEndpoints = {
          success: response.ok,
          message: response.ok
            ? 'API endpoints responding'
            : `API error: ${response.status}`,
        };
      } catch (error) {
        results.apiEndpoints = {
          success: false,
          message: `API connection failed: ${error}`,
        };
      }

      // Test 5: Database Tables
      console.log('🔍 Testing database tables...');
      try {
        const [usersCount, servicesCount, bookingsCount] = await Promise.all([
          supabase.from('users').select('count', { count: 'exact' }),
          supabase
            .from('provider_services')
            .select('count', { count: 'exact' }),
          supabase.from('bookings').select('count', { count: 'exact' }),
        ]);

        results.databaseTables = {
          success: true,
          message: `Tables exist - Users: ${usersCount.count}, Services: ${servicesCount.count}, Bookings: ${bookingsCount.count}`,
        };
      } catch (error) {
        results.databaseTables = {
          success: false,
          message: `Database query failed: ${error}`,
        };
      }

      // Test 6: Real-time Subscriptions
      console.log('🔍 Testing real-time subscriptions...');
      try {
        const channel = supabase.channel('test-channel');
        await new Promise(resolve => {
          channel.subscribe(status => {
            if (status === 'SUBSCRIBED') {
              results.realtime = {
                success: true,
                message: 'Real-time subscriptions working',
              };
              resolve(true);
            }
          });
          // Timeout after 5 seconds
          setTimeout(() => {
            results.realtime = {
              success: false,
              message: 'Real-time subscription timeout',
            };
            resolve(false);
          }, 5000);
        });
        supabase.removeChannel(channel);
      } catch (error) {
        results.realtime = {
          success: false,
          message: `Real-time test failed: ${error}`,
        };
      }

      setTestResults(results);
      toast.success('Tests completed!');
    } catch (error) {
      toast.error('Test execution failed');
      console.error('Test error:', error);
    } finally {
      setTesting(false);
    }
  };

  const testLogin = async () => {
    try {
      const { data, error } =
        await supabase.auth.signInWithPassword(loginCredentials);

      if (error) {
        toast.error(`Login failed: ${error.message}`);
      } else {
        toast.success('Login successful! Redirecting...');
        // Refresh page to update auth state
        window.location.reload();
      }
    } catch (error) {
      toast.error('Login test failed');
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className='h-5 w-5 text-green-600' />
    ) : (
      <AlertCircle className='h-5 w-5 text-red-600' />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50';
  };

  return (
    <div className='container mx-auto px-4 py-8 space-y-8'>
      {/* Header */}
      <div className='text-center'>
        <h1 className='text-3xl font-bold text-gray-900 mb-2'>
          Dashboard Access Test
        </h1>
        <p className='text-gray-600'>
          Test authentication, database connection, and real-time functionality
        </p>
      </div>

      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <User className='h-5 w-5' />
            <span>Current Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center space-x-3'>
              <Shield className='h-5 w-5 text-blue-600' />
              <div>
                <p className='font-medium'>Authentication</p>
                <p className='text-sm text-gray-600'>
                  {loading
                    ? 'Checking...'
                    : user
                      ? `${user.email}`
                      : 'Not logged in'}
                </p>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <UserPlus className='h-5 w-5 text-purple-600' />
              <div>
                <p className='font-medium'>Role</p>
                <Badge
                  className={
                    user?.role === 'provider'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                  }
                >
                  {user?.role || 'None'}
                </Badge>
              </div>
            </div>

            <div className='flex items-center space-x-3'>
              <Activity className='h-5 w-5 text-orange-600' />
              <div>
                <p className='font-medium'>Dashboard Access</p>
                <p className='text-sm text-gray-600'>
                  {hasPermission('dashboard.view') ? 'Granted' : 'Denied'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Login Test */}
      {!user && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center space-x-2'>
              <LogIn className='h-5 w-5' />
              <span>Quick Login Test</span>
            </CardTitle>
            <CardDescription>
              Test login with provider account credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 items-end'>
              <div>
                <label className='text-sm font-medium'>Email</label>
                <Input
                  value={loginCredentials.email}
                  onChange={e =>
                    setLoginCredentials(prev => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  placeholder='provider@test.com'
                />
              </div>
              <div>
                <label className='text-sm font-medium'>Password</label>
                <Input
                  type='password'
                  value={loginCredentials.password}
                  onChange={e =>
                    setLoginCredentials(prev => ({
                      ...prev,
                      password: e.target.value,
                    }))
                  }
                  placeholder='TestPass123!'
                />
              </div>
              <Button onClick={testLogin} className='w-full'>
                Test Login
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Tests */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Database className='h-5 w-5' />
              <span>System Tests</span>
            </div>
            <Button onClick={runTests} disabled={testing}>
              {testing ? 'Testing...' : 'Run Tests'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Object.entries({
              'Supabase Connection': {
                icon: Database,
                key: 'supabaseConnection',
              },
              Authentication: { icon: Shield, key: 'authentication' },
              'Role-Based Access': { icon: UserPlus, key: 'roleAccess' },
              'API Endpoints': { icon: Server, key: 'apiEndpoints' },
              'Database Tables': { icon: Database, key: 'databaseTables' },
              'Real-time Subscriptions': { icon: Wifi, key: 'realtime' },
            }).map(([name, { icon: Icon, key }]) => {
              const result = testResults[key];
              return (
                <div
                  key={key}
                  className='flex items-center space-x-3 p-3 rounded-lg border'
                >
                  <Icon className='h-5 w-5 text-gray-600' />
                  <div className='flex-1'>
                    <p className='font-medium'>{name}</p>
                    <p className='text-sm text-gray-600'>
                      {result ? result.message : 'Not tested yet'}
                    </p>
                  </div>
                  <div>
                    {result ? (
                      <Badge className={getStatusColor(result.success)}>
                        {getStatusIcon(result.success)}
                        <span className='ml-1'>
                          {result.success ? 'Pass' : 'Fail'}
                        </span>
                      </Badge>
                    ) : (
                      <Badge variant='outline'>Pending</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Eye className='h-5 w-5' />
            <span>Quick Access Links</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            <Link href='/en/auth/login'>
              <Button variant='outline' className='w-full h-16 flex-col'>
                <LogIn className='h-6 w-6 mb-2' />
                Login Page
              </Button>
            </Link>

            <Link href='/en/dashboard/provider-comprehensive'>
              <Button variant='outline' className='w-full h-16 flex-col'>
                <User className='h-6 w-6 mb-2' />
                Provider Dashboard
              </Button>
            </Link>

            <Link href='/en/dashboard/client-comprehensive'>
              <Button variant='outline' className='w-full h-16 flex-col'>
                <Users className='h-6 w-6 mb-2' />
                Client Dashboard
              </Button>
            </Link>

            <Link href='/marketplace/services'>
              <Button variant='outline' className='w-full h-16 flex-col'>
                <Activity className='h-6 w-6 mb-2' />
                Marketplace
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <div className='p-4 bg-blue-50 rounded-lg'>
              <h4 className='font-semibold text-blue-900 mb-2'>
                1. Create Test Accounts
              </h4>
              <p className='text-blue-700 text-sm'>
                Run the SQL script:{' '}
                <code className='bg-blue-100 px-2 py-1 rounded'>
                  scripts/create-test-accounts.sql
                </code>{' '}
                in your Supabase SQL Editor
              </p>
            </div>

            <div className='p-4 bg-green-50 rounded-lg'>
              <h4 className='font-semibold text-green-900 mb-2'>
                2. Test Login Credentials
              </h4>
              <div className='text-green-700 text-sm space-y-1'>
                <p>
                  <strong>Provider:</strong> provider@test.com / TestPass123!
                </p>
                <p>
                  <strong>Client:</strong> client@test.com / TestPass123!
                </p>
              </div>
            </div>

            <div className='p-4 bg-purple-50 rounded-lg'>
              <h4 className='font-semibold text-purple-900 mb-2'>
                3. Access Dashboards
              </h4>
              <div className='text-purple-700 text-sm space-y-1'>
                <p>
                  <strong>Provider Dashboard:</strong>{' '}
                  /en/dashboard/provider-comprehensive
                </p>
                <p>
                  <strong>Client Dashboard:</strong>{' '}
                  /en/dashboard/client-comprehensive
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
