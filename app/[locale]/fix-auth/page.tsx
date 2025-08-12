'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Play } from 'lucide-react';

export default function FixAuthPage() {
  const [copied, setCopied] = useState(false);

  const sqlScript = `-- Simple Test Account Creation Script
-- Run this in Supabase SQL Editor

-- 1. Clean up any existing test accounts
DELETE FROM auth.users WHERE email IN ('provider@test.com', 'test@test.com', 'admin@test.com');
DELETE FROM public.users WHERE email IN ('provider@test.com', 'test@test.com', 'admin@test.com');

-- 2. Create auth users with proper password hashes
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data,
  aud,
  role
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'provider@test.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  NOW(),
  NOW(),
  NOW(),
  '{"full_name": "Test Provider", "role": "provider"}',
  'authenticated',
  'authenticated'
);

-- 3. Fix role constraint
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' AND constraint_name = 'users_role_check'
    ) THEN
        ALTER TABLE users DROP CONSTRAINT users_role_check;
    END IF;
    
    ALTER TABLE users ADD CONSTRAINT users_role_check 
    CHECK (role IN ('admin', 'manager', 'user', 'viewer', 'client', 'provider', 'super_admin'));
END $$;

-- 4. Create public user
INSERT INTO public.users (
  id,
  email,
  full_name,
  role,
  status,
  phone,
  created_at,
  updated_at
) VALUES 
(
  '11111111-1111-1111-1111-111111111111',
  'provider@test.com',
  'Test Provider',
  'provider',
  'active',
  '+1234567890',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = EXCLUDED.role;

-- 5. Verify
SELECT 'Account created!' as status, email, role FROM public.users WHERE email = 'provider@test.com';`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(sqlScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const openSupabase = () => {
    window.open(
      'https://reootcngcptfogfozlmz.supabase.co/project/reootcngcptfogfozlmz/sql/new',
      '_blank'
    );
  };

  const openDirectLogin = () => {
    window.open('/en/login-direct', '_blank');
  };

  const testDashboard = () => {
    window.open('/en/dashboard/provider-comprehensive', '_blank');
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <Card>
          <CardHeader className='text-center'>
            <CardTitle className='text-3xl'>
              🔧 Authentication Fix Center
            </CardTitle>
            <p className='text-gray-600'>
              Follow these steps to fix the login issue
            </p>
          </CardHeader>
        </Card>

        {/* Step 1 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Badge className='bg-blue-500'>1</Badge>
              Run SQL Script in Supabase
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto'>
              <pre>{sqlScript}</pre>
            </div>

            <div className='flex gap-2'>
              <Button onClick={copyToClipboard} variant='outline'>
                <Copy className='mr-2 h-4 w-4' />
                {copied ? '✅ Copied!' : '📋 Copy SQL'}
              </Button>

              <Button
                onClick={openSupabase}
                className='bg-green-600 hover:bg-green-700'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                🚀 Open Supabase SQL Editor
              </Button>
            </div>

            <Alert>
              <AlertDescription>
                <strong>Instructions:</strong>
                <ol className='list-decimal list-inside mt-2 space-y-1'>
                  <li>Click "Open Supabase SQL Editor" above</li>
                  <li>Paste the copied SQL script</li>
                  <li>Click "Run" to execute</li>
                  <li>Look for success message</li>
                </ol>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Badge className='bg-green-500'>2</Badge>
              Test Direct Login
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p>After running the SQL script, test the authentication:</p>

            <Button
              onClick={openDirectLogin}
              className='bg-blue-600 hover:bg-blue-700 w-full'
            >
              <Play className='mr-2 h-4 w-4' />
              🔐 Open Direct Login Page
            </Button>

            <Alert className='border-blue-200 bg-blue-50'>
              <AlertDescription className='text-blue-800'>
                <strong>Test Credentials:</strong>
                <br />
                📧 Email: provider@test.com
                <br />
                🔑 Password: password
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Badge className='bg-purple-500'>3</Badge>
              Access Provider Dashboard
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            <p>Once logged in, you should be able to access the dashboard:</p>

            <Button
              onClick={testDashboard}
              className='bg-purple-600 hover:bg-purple-700 w-full'
            >
              <ExternalLink className='mr-2 h-4 w-4' />
              📊 Open Provider Dashboard
            </Button>

            <Alert className='border-green-200 bg-green-50'>
              <AlertDescription className='text-green-800'>
                If you see the dashboard instead of "Authentication Required",
                the fix worked! 🎉
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Quick Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <Button
                variant='outline'
                onClick={() => window.open('/en/quick-login', '_blank')}
              >
                ⚡ Quick Login
              </Button>

              <Button
                variant='outline'
                onClick={() => window.open('/en/test-auth', '_blank')}
              >
                🧪 Test Auth
              </Button>

              <Button
                variant='outline'
                onClick={() => window.open('/en/simple-login', '_blank')}
              >
                📝 Simple Login
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>🔍 Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-sm text-gray-600 space-y-1'>
              <p>
                <strong>Server:</strong> localhost:3001
              </p>
              <p>
                <strong>Supabase Project:</strong> reootcngcptfogfozlmz
              </p>
              <p>
                <strong>Environment:</strong> .env.local loaded ✅
              </p>
              <p>
                <strong>Issue:</strong> Authentication Required on
                /en/dashboard/provider-comprehensive
              </p>
              <p>
                <strong>Solution:</strong> Create proper test accounts and use
                direct login
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
