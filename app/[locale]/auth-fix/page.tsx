'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Trash2,
  Database,
  Key,
  LogOut,
  LogIn,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function AuthFixPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<any>(null);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const clearAuthTokens = async () => {
    setLoading(true);
    try {
      // Clear localStorage tokens
      // Don't clear Supabase session data - let Supabase handle it
      localStorage.removeItem('sb-reootcngcptfogfozlmz-auth-token');
      
      // Clear all supabase related items
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });

      // Clear sessionStorage
      sessionStorage.clear();

      addResult('✅ Cleared all authentication tokens');
      
      // Force page reload after clearing tokens
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      addResult(`❌ Error clearing tokens: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testSupabaseConnection = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      addResult('🔍 Testing Supabase connection...');
      
      // Test 1: Basic connection
      const { data: healthCheck, error: healthError } = await supabase
        .from('users')
        .select('count(*)')
        .limit(1);

      if (healthError) {
        addResult(`❌ Database connection failed: ${healthError.message}`);
        
        // Try alternative connection test
        const { data: authData, error: authError } = await supabase.auth.getSession();
        if (authError) {
          addResult(`❌ Auth service failed: ${authError.message}`);
        } else {
          addResult('✅ Auth service is accessible');
        }
      } else {
        addResult('✅ Database connection successful');
      }

      // Test 2: Check current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        addResult(`❌ Session check failed: ${sessionError.message}`);
      } else if (sessionData.session) {
        addResult(`✅ Valid session found for: ${sessionData.session.user.email}`);
      } else {
        addResult('ℹ️ No active session');
      }

      // Test 3: Check if we can create a new client
      try {
        const newClient = createClient();
        addResult('✅ New client creation successful');
      } catch (error) {
        addResult(`❌ Client creation failed: ${error}`);
      }

      setTestResults({
        connection: !healthError,
        session: !!sessionData.session,
        timestamp: new Date().toISOString(),
      });

    } catch (error) {
      addResult(`❌ Connection test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const forceSignOut = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      addResult('🚪 Forcing sign out...');
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        addResult(`⚠️ Supabase signout error: ${error.message}`);
      } else {
        addResult('✅ Supabase signout successful');
      }

      // Clear all local storage
      localStorage.clear();
      sessionStorage.clear();
      
      addResult('✅ Local storage cleared');
      
      // Redirect to login
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 1000);
      
    } catch (error) {
      addResult(`❌ Force signout failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const resetToCleanState = async () => {
    setLoading(true);
    try {
      addResult('🧹 Starting clean state reset...');
      
      // 1. Clear all tokens
      await clearAuthTokens();
      
      // 2. Clear cookies (if any)
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      });
      
      addResult('✅ Clean state reset complete');
      addResult('🔄 Reloading page...');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
      
    } catch (error) {
      addResult(`❌ Reset failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testProviderLogin = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      
      addResult('🔐 Testing provider login...');
      
      // Try to sign in with test credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'provider@test.com',
        password: 'password123',
      });

      if (error) {
        addResult(`❌ Login failed: ${error.message}`);
        
        // If user doesn't exist, try to create it
        if (error.message.includes('Invalid login credentials')) {
          addResult('🔄 Attempting to create test user...');
          
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'provider@test.com',
            password: 'password123',
          });

          if (signUpError) {
            addResult(`❌ Signup failed: ${signUpError.message}`);
          } else {
            addResult('✅ Test user created successfully');
            if (signUpData.user && !signUpData.session) {
              addResult('📧 Check email for confirmation link');
            }
          }
        }
      } else {
        addResult(`✅ Login successful for: ${data.user.email}`);
        addResult('🔄 Redirecting to dashboard...');
        
        setTimeout(() => {
          window.location.href = '/dashboard-role-router';
        }, 2000);
      }
      
    } catch (error) {
      addResult(`❌ Login test failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Authentication Fix & Debug Tool
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Use this tool to diagnose and fix authentication issues including invalid refresh tokens,
              database connectivity problems, and login failures.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              onClick={clearAuthTokens} 
              disabled={loading}
              variant="outline"
              className="justify-start"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Auth Tokens
            </Button>

            <Button 
              onClick={testSupabaseConnection} 
              disabled={loading}
              variant="outline"
              className="justify-start"
            >
              <Database className="h-4 w-4 mr-2" />
              Test Connection
            </Button>

            <Button 
              onClick={forceSignOut} 
              disabled={loading}
              variant="outline"
              className="justify-start"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Force Sign Out
            </Button>

            <Button 
              onClick={testProviderLogin} 
              disabled={loading}
              variant="outline"
              className="justify-start"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Test Provider Login
            </Button>

            <Button 
              onClick={resetToCleanState} 
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white md:col-span-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset to Clean State
            </Button>
          </div>

          {testResults && (
            <div className="space-y-2">
              <h4 className="font-medium">Connection Test Results:</h4>
              <div className="flex gap-2">
                <Badge className={testResults.connection ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {testResults.connection ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  Database
                </Badge>
                <Badge className={testResults.session ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                  {testResults.session ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  Session
                </Badge>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Debug Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {result}
                </div>
              ))}
            </div>
            <Button 
              onClick={() => setResults([])} 
              variant="outline" 
              size="sm"
              className="mt-2"
            >
              Clear Log
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/auth/login">Login Page</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/register/provider">Provider Registration</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/test-provider">Provider Test</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard-role-router">Dashboard Router</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
