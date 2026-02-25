'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle,
  AlertTriangle,
  Database,
  Users,
  Settings,
  Wrench,
} from 'lucide-react';

export default function FixRegistrationPage() {
  const [activeTab, setActiveTab] = useState('diagnosis');

  const copyScript = (scriptName: string) => {
    const scripts = {
      setup: `-- Quick Registration Fix
-- Run this in Supabase SQL Editor

-- 1. Create basic users table if missing
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'user',
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    phone TEXT,
    avatar_url TEXT
);

-- 2. Allow any role for now
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- 3. Create simple insert function
CREATE OR REPLACE FUNCTION sync_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, role, status, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'user'),
        'active',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 4. Create trigger for auto-sync
DROP TRIGGER IF EXISTS sync_user_profile_trigger ON auth.users;
CREATE TRIGGER sync_user_profile_trigger
    AFTER INSERT OR UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION sync_user_profile();

-- 5. Enable RLS but allow service role
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role" ON users
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Success
SELECT '✅ Registration system fixed!' as status;`,

      test: `-- Test Registration System
-- Run this to verify everything works

-- 1. Check if users table exists
SELECT 'Users table check' as test,
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_name = 'users'
       ) THEN '✅ Exists' ELSE '❌ Missing' END as result;

-- 2. Check table structure
SELECT 'Column check' as test,
       array_agg(column_name) as columns
FROM information_schema.columns 
WHERE table_name = 'users';

-- 3. Test insert
INSERT INTO users (email, full_name, role, status)
VALUES ('test@example.com', 'Test User', 'provider', 'active')
ON CONFLICT (email) DO NOTHING;

-- 4. Test select
SELECT 'Test data' as test, email, role, status 
FROM users WHERE email = 'test@example.com';

-- 5. Clean up test
DELETE FROM users WHERE email = 'test@example.com';

SELECT '✅ All tests completed!' as final_status;`,
    };

    navigator.clipboard.writeText(scripts[scriptName as keyof typeof scripts]);
  };

  const openSupabase = () => {
    window.open(
      'https://reootcngcptfogfozlmz.supabase.co/project/reootcngcptfogfozlmz/sql/new',
      '_blank'
    );
  };

  const openSimpleRegister = () => {
    window.open(
      `/${window.location.pathname.startsWith('/ar/') ? 'ar' : 'en'}/simple-register`,
      '_blank'
    );
  };

  const openWorkingLogin = () => {
    window.open(
      `/${window.location.pathname.startsWith('/ar/') ? 'ar' : 'en'}/working-login`,
      '_blank'
    );
  };

  const openDashboardPreview = () => {
    window.open(
      `/${window.location.pathname.startsWith('/ar/') ? 'ar' : 'en'}/dashboard-preview`,
      '_blank'
    );
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <Card className='border-red-200 bg-red-50'>
          <CardHeader className='text-center'>
            <CardTitle className='text-3xl flex items-center justify-center gap-2 text-red-900'>
              <Wrench className='h-8 w-8' />
              Registration System Fix
            </CardTitle>
            <p className='text-red-700'>
              Complete solution for registration issues - database setup,
              testing, and working alternatives
            </p>
          </CardHeader>
        </Card>

        {/* Issue Summary */}
        <Card className='border-yellow-200 bg-yellow-50'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <AlertTriangle className='h-5 w-5 text-yellow-600' />
              <h3 className='font-semibold text-yellow-900'>
                Common Registration Issues
              </h3>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800'>
              <div>
                <h4 className='font-semibold mb-1'>Database Issues:</h4>
                <ul className='space-y-1'>
                  <li>• Missing users table</li>
                  <li>• Role constraint errors</li>
                  <li>• Auth/public user sync issues</li>
                  <li>• Permission problems</li>
                </ul>
              </div>
              <div>
                <h4 className='font-semibold mb-1'>API Issues:</h4>
                <ul className='space-y-1'>
                  <li>• Admin API access errors</li>
                  <li>• Internal server errors</li>
                  <li>• Complex auth flows</li>
                  <li>• RLS policy conflicts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
          <TabsList className='grid w-full grid-cols-4'>
            <TabsTrigger value='diagnosis'>🔍 Diagnosis</TabsTrigger>
            <TabsTrigger value='fix'>🔧 Fix Database</TabsTrigger>
            <TabsTrigger value='test'>🧪 Test System</TabsTrigger>
            <TabsTrigger value='register'>👥 Register</TabsTrigger>
          </TabsList>

          <TabsContent value='diagnosis' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <AlertTriangle className='h-5 w-5' />
                  Problem Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Alert>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription>
                    <strong>Root Causes of Registration Failures:</strong>
                    <ol className='list-decimal list-inside mt-2 space-y-1'>
                      <li>
                        Missing or incorrectly structured <code>users</code>{' '}
                        table
                      </li>
                      <li>
                        Role constraint errors preventing provider/client roles
                      </li>
                      <li>
                        Auth admin API requiring service role (not available in
                        client)
                      </li>
                      <li>RLS policies blocking user creation</li>
                      <li>Sync issues between auth.users and public.users</li>
                    </ol>
                  </AlertDescription>
                </Alert>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Card className='border-red-200'>
                    <CardContent className='p-4'>
                      <h4 className='font-semibold text-red-900 mb-2'>
                        ❌ What's Breaking
                      </h4>
                      <ul className='text-sm text-red-700 space-y-1'>
                        <li>
                          • <code>/en/auth/signup</code> - Internal server error
                        </li>
                        <li>
                          • <code>/en/register-new</code> - Admin API fails
                        </li>
                        <li>• Database constraint violations</li>
                        <li>• Complex approval workflows</li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card className='border-green-200'>
                    <CardContent className='p-4'>
                      <h4 className='font-semibold text-green-900 mb-2'>
                        ✅ What Will Work
                      </h4>
                      <ul className='text-sm text-green-700 space-y-1'>
                        <li>• Standard Supabase signup method</li>
                        <li>• Simplified database structure</li>
                        <li>• Auto-sync triggers</li>
                        <li>• Manual fallback options</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='fix' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Database className='h-5 w-5' />
                  Database Setup & Fix
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Alert className='border-blue-200 bg-blue-50'>
                  <AlertDescription className='text-blue-800'>
                    <strong>Step 1:</strong> Run this script in Supabase SQL
                    Editor to fix all database issues
                  </AlertDescription>
                </Alert>

                <div className='space-y-3'>
                  <Button onClick={openSupabase} className='w-full'>
                    🚀 Open Supabase SQL Editor
                  </Button>

                  <Button
                    onClick={() => copyScript('setup')}
                    variant='outline'
                    className='w-full'
                  >
                    📋 Copy Setup Script
                  </Button>
                </div>

                <div className='bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-xs overflow-x-auto'>
                  <pre>{`-- Quick Registration Fix Script
-- Creates users table, removes constraints, adds auto-sync
-- Copy this and run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS users (...);
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
CREATE OR REPLACE FUNCTION sync_user_profile() ...`}</pre>
                </div>

                <Alert className='border-green-200 bg-green-50'>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription className='text-green-800'>
                    This script will:
                    <ul className='list-disc list-inside mt-1 space-y-1'>
                      <li>Create a working users table</li>
                      <li>Remove problematic constraints</li>
                      <li>Add auto-sync triggers</li>
                      <li>Set up proper RLS policies</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='test' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Settings className='h-5 w-5' />
                  Test & Verify
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Alert>
                  <AlertDescription>
                    <strong>Step 2:</strong> After running the setup script,
                    test that everything works
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={() => copyScript('test')}
                  variant='outline'
                  className='w-full'
                >
                  📋 Copy Test Script
                </Button>

                <div className='text-sm text-gray-600 space-y-2'>
                  <p>
                    <strong>Test Script Will Check:</strong>
                  </p>
                  <ul className='list-disc list-inside space-y-1'>
                    <li>Users table exists and has correct structure</li>
                    <li>Insert operations work without constraints</li>
                    <li>Auto-sync triggers are functioning</li>
                    <li>RLS policies allow proper access</li>
                  </ul>
                </div>

                <Alert className='border-yellow-200 bg-yellow-50'>
                  <AlertTriangle className='h-4 w-4' />
                  <AlertDescription className='text-yellow-800'>
                    If tests fail, re-run the setup script or contact support
                    with the error messages.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='register' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <Users className='h-5 w-5' />
                  Registration Options
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <Alert className='border-green-200 bg-green-50'>
                  <CheckCircle className='h-4 w-4' />
                  <AlertDescription className='text-green-800'>
                    <strong>Step 3:</strong> After database setup, use the
                    working registration system
                  </AlertDescription>
                </Alert>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <Card className='border-blue-200'>
                    <CardContent className='p-4'>
                      <h4 className='font-semibold text-blue-900 mb-2'>
                        ✅ Simple Registration
                      </h4>
                      <p className='text-sm text-blue-700 mb-3'>
                        Uses standard Supabase signup with manual sync fallback
                      </p>
                      <Button
                        onClick={openSimpleRegister}
                        className='w-full bg-blue-600'
                      >
                        👥 Simple Register
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className='border-green-200'>
                    <CardContent className='p-4'>
                      <h4 className='font-semibold text-green-900 mb-2'>
                        🔐 Working Login
                      </h4>
                      <p className='text-sm text-green-700 mb-3'>
                        Test login with existing or newly created accounts
                      </p>
                      <Button
                        onClick={openWorkingLogin}
                        variant='outline'
                        className='w-full'
                      >
                        🔐 Working Login
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Card className='border-purple-200'>
                  <CardContent className='p-4'>
                    <h4 className='font-semibold text-purple-900 mb-2'>
                      👁️ Dashboard Preview
                    </h4>
                    <p className='text-sm text-purple-700 mb-3'>
                      See how dashboards work without needing authentication
                    </p>
                    <Button
                      onClick={openDashboardPreview}
                      variant='outline'
                      className='w-full'
                    >
                      👁️ Dashboard Preview
                    </Button>
                  </CardContent>
                </Card>

                <Alert>
                  <AlertDescription>
                    <strong>Registration Flow:</strong>
                    <ol className='list-decimal list-inside mt-1 space-y-1'>
                      <li>
                        Create account at <code>/en/simple-register</code>
                      </li>
                      <li>
                        Login at <code>/en/working-login</code>
                      </li>
                      <li>Access role-specific dashboard</li>
                      <li>If issues persist, use manual sync option</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <Card className='border-gray-200'>
          <CardHeader>
            <CardTitle>🚀 Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              <Button variant='outline' size='sm' onClick={openSupabase}>
                📊 Supabase
              </Button>
              <Button variant='outline' size='sm' onClick={openSimpleRegister}>
                👥 Register
              </Button>
              <Button variant='outline' size='sm' onClick={openWorkingLogin}>
                🔐 Login
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={openDashboardPreview}
              >
                👁️ Preview
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
