'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, User, Shield, Mail } from 'lucide-react';

interface UserInfo {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: string;
  created_at: string;
}

export default function AuthTestPage() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (supabase) {
      checkAuthStatus();
    }
  }, [supabase]);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError('');

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error(sessionError.message);
      }

      if (session?.user) {
        setUser(session.user);
        console.log('🔐 Auth Test - User session found:', session.user);

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('id, email, full_name, role, status, created_at')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          console.warn('Profile fetch error:', profileError);
          // Use auth user data if profile doesn't exist
          setUserProfile({
            id: session.user.id,
            email: session.user.email || '',
            full_name: session.user.user_metadata?.full_name || '',
            role: session.user.user_metadata?.role || 'user',
            status: 'active',
            created_at: session.user.created_at,
          });
        } else {
          setUserProfile(profile);
        }

        setSuccess('Authentication successful!');
      } else {
        setUser(null);
        setUserProfile(null);
        setError('No active session found');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setError(error instanceof Error ? error.message : 'Authentication check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      setUser(null);
      setUserProfile(null);
      setSuccess('Signed out successfully');
      setError('');
    } catch (error) {
      console.error('Sign out error:', error);
      setError(error instanceof Error ? error.message : 'Sign out failed');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    const variants = {
      super_admin: 'bg-purple-100 text-purple-800',
      admin: 'bg-blue-100 text-blue-800',
      provider: 'bg-green-100 text-green-800',
      client: 'bg-orange-100 text-orange-800',
      user: 'bg-gray-100 text-gray-800',
    };
    return (
      <Badge className={variants[role as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {role}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800',
    };
    return (
      <Badge className={variants[status as keyof typeof variants] || 'bg-gray-100 text-gray-800'}>
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Checking authentication status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Authentication Test</h1>
          <p className="text-gray-600 mt-2">
            Test the authentication system and view user information
          </p>
        </div>

        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          {/* Auth Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Authentication Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Status:</span>
                  {user ? (
                    <Badge className="bg-green-100 text-green-800">Authenticated</Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800">Not Authenticated</Badge>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={checkAuthStatus} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Checking...
                      </>
                    ) : (
                      'Refresh Status'
                    )}
                  </Button>
                  
                  {user && (
                    <Button variant="destructive" onClick={handleSignOut} disabled={loading}>
                      Sign Out
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* User Information Card */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  User Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">User ID</label>
                      <p className="text-sm text-gray-900 font-mono">{user.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-sm text-gray-900 flex items-center gap-1">
                        <Mail className="h-4 w-4" />
                        {user.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email Confirmed</label>
                      <p className="text-sm text-gray-900">
                        {user.email_confirmed_at ? 'Yes' : 'No'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Created At</label>
                      <p className="text-sm text-gray-900">
                        {new Date(user.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {userProfile && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium text-gray-900 mb-2">Profile Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Full Name</label>
                          <p className="text-sm text-gray-900">{userProfile.full_name || 'Not set'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Role</label>
                          <div className="mt-1">
                            {getRoleBadge(userProfile.role)}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <div className="mt-1">
                            {getStatusBadge(userProfile.status)}
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Profile Created</label>
                          <p className="text-sm text-gray-900">
                            {new Date(userProfile.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="font-medium text-gray-900 mb-2">User Metadata</h3>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(user.user_metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Card */}
          <Card>
            <CardHeader>
              <CardTitle>Navigation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/en/auth/login'}
                  className="w-full"
                >
                  Go to Login
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/en/auth/register'}
                  className="w-full"
                >
                  Go to Register
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/en/dashboard'}
                  className="w-full"
                >
                  Go to Dashboard
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.href = '/en/admin/users'}
                  className="w-full"
                >
                  User Management
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
