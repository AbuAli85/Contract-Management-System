'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function DebugDashboardPage() {
  const { user, loading: authLoading, profile, mounted } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        // Test environment variables
        const envResponse = await fetch('/api/debug/env');
        const envData = await envResponse.json();

        // Test auth status
        const authResponse = await fetch('/api/auth/status');
        const authData = await authResponse.json();

        // Test Supabase connection
        const supabaseResponse = await fetch('/api/debug/supabase');
        const supabaseData = await supabaseResponse.json();

        // Test analytics API
        const analyticsResponse = await fetch('/api/dashboard/analytics');
        const analyticsData = await analyticsResponse.json();

        setDebugInfo({
          env: envData,
          auth: authData,
          supabase: supabaseData,
          analytics: {
            status: analyticsResponse.status,
            data: analyticsData,
          },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        setDebugInfo({
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDebugInfo();
  }, []);

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600'></div>
          <p className='text-gray-600'>Loading debug information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 p-6'>
      <div className='flex items-center justify-between'>
        <h1 className='text-3xl font-bold'>Dashboard Debug</h1>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>

      {/* Auth Status */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            🔐 Authentication Status
            <Badge variant={authLoading ? 'secondary' : 'default'}>
              {authLoading ? 'Loading' : 'Ready'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <p>
              <strong>Mounted:</strong> {mounted ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>Loading:</strong> {authLoading ? 'Yes' : 'No'}
            </p>
            <p>
              <strong>User:</strong> {user ? user.email : 'None'}
            </p>
            <p>
              <strong>Profile:</strong> {profile ? 'Loaded' : 'None'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Environment Variables */}
      <Card>
        <CardHeader>
          <CardTitle>🌍 Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          {debugInfo.env ? (
            <div className='space-y-2'>
              <p>
                <strong>Supabase URL:</strong>{' '}
                {debugInfo.env.env?.hasSupabaseUrl ? '✅ Set' : '❌ Missing'}
              </p>
              <p>
                <strong>Supabase Anon Key:</strong>{' '}
                {debugInfo.env.env?.hasSupabaseAnonKey
                  ? '✅ Set'
                  : '❌ Missing'}
              </p>
              <p>
                <strong>Service Role Key:</strong>{' '}
                {debugInfo.env.env?.hasServiceRoleKey ? '✅ Set' : '❌ Missing'}
              </p>
              <p>
                <strong>Node Environment:</strong>{' '}
                {debugInfo.env.env?.nodeEnv || 'Not set'}
              </p>
              <p>
                <strong>Vercel Environment:</strong>{' '}
                {debugInfo.env.env?.vercelEnv || 'Not set'}
              </p>
            </div>
          ) : (
            <p className='text-red-500'>Failed to load environment info</p>
          )}
        </CardContent>
      </Card>

      {/* Auth API Status */}
      <Card>
        <CardHeader>
          <CardTitle>🔑 Auth API Status</CardTitle>
        </CardHeader>
        <CardContent>
          {debugInfo.auth ? (
            <div className='space-y-2'>
              <p>
                <strong>Has Session:</strong>{' '}
                {debugInfo.auth.auth?.hasSession ? '✅ Yes' : '❌ No'}
              </p>
              <p>
                <strong>Has User:</strong>{' '}
                {debugInfo.auth.auth?.hasUser ? '✅ Yes' : '❌ No'}
              </p>
              <p>
                <strong>User ID:</strong>{' '}
                {debugInfo.auth.auth?.userId || 'None'}
              </p>
              <p>
                <strong>User Email:</strong>{' '}
                {debugInfo.auth.auth?.userEmail || 'None'}
              </p>
              {debugInfo.auth.auth?.sessionError && (
                <p>
                  <strong>Session Error:</strong>{' '}
                  <span className='text-red-500'>
                    {debugInfo.auth.auth.sessionError}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className='text-red-500'>Failed to load auth status</p>
          )}
        </CardContent>
      </Card>

      {/* Supabase Connection */}
      <Card>
        <CardHeader>
          <CardTitle>🗄️ Supabase Connection</CardTitle>
        </CardHeader>
        <CardContent>
          {debugInfo.supabase ? (
            <div className='space-y-2'>
              <p>
                <strong>Can Connect:</strong>{' '}
                {debugInfo.supabase.supabase?.canConnect ? '✅ Yes' : '❌ No'}
              </p>
              <p>
                <strong>Has Data:</strong>{' '}
                {debugInfo.supabase.supabase?.hasData ? '✅ Yes' : '❌ No'}
              </p>
              {debugInfo.supabase.supabase?.error && (
                <p>
                  <strong>Error:</strong>{' '}
                  <span className='text-red-500'>
                    {debugInfo.supabase.supabase.error}
                  </span>
                </p>
              )}
            </div>
          ) : (
            <p className='text-red-500'>Failed to test Supabase connection</p>
          )}
        </CardContent>
      </Card>

      {/* Analytics API */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Analytics API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <p>
              <strong>Status:</strong>{' '}
              {debugInfo.analytics?.status || 'Unknown'}
            </p>
            <p>
              <strong>Success:</strong>{' '}
              {debugInfo.analytics?.data?.success ? '✅ Yes' : '❌ No'}
            </p>
            {debugInfo.analytics?.data?.error && (
              <p>
                <strong>Error:</strong>{' '}
                <span className='text-red-500'>
                  {debugInfo.analytics.data.error}
                </span>
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Browser Info */}
      <Card>
        <CardHeader>
          <CardTitle>🌐 Browser Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            <p>
              <strong>URL:</strong> {window.location.href}
            </p>
            <p>
              <strong>User Agent:</strong> {navigator.userAgent}
            </p>
            <p>
              <strong>Local Storage Keys:</strong>{' '}
              {Object.keys(localStorage).length}
            </p>
            <p>
              <strong>Session Storage Keys:</strong>{' '}
              {Object.keys(sessionStorage).length}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {debugInfo.error && (
        <Card className='border-red-200 bg-red-50'>
          <CardHeader>
            <CardTitle className='text-red-600'>❌ Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-red-600'>{debugInfo.error}</p>
          </CardContent>
        </Card>
      )}

      <div className='text-sm text-gray-500'>
        Last updated: {debugInfo.timestamp}
      </div>
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic';
