'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Code, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export default function DevStatusPage() {
  const [status, setStatus] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = async () => {
    setIsLoading(true);
    const results: any = {};

    try {
      // Check environment
      results.environment = {
        nodeEnv: process.env.NODE_ENV,
        isDevelopment: process.env.NODE_ENV === 'development',
        timestamp: new Date().toLocaleTimeString()
      };

      // Check localStorage
      if (typeof window !== 'undefined') {
        results.localStorage = {
          emergencyBypass: localStorage.getItem('emergency-bypass'),
          supabaseToken: localStorage.getItem('supabase.auth.token') ? 'Present' : 'Not found',
          userRole: localStorage.getItem('user-role'),
          timestamp: new Date().toLocaleTimeString()
        };
      }

      // Test auth API
      try {
        const authResponse = await fetch('/api/auth/check-session');
        results.authApi = {
          status: authResponse.status,
          ok: authResponse.ok,
          timestamp: new Date().toLocaleTimeString()
        };
        
        if (authResponse.ok) {
          const authData = await authResponse.json();
          results.authApi.data = authData;
        }
      } catch (error) {
        results.authApi = {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toLocaleTimeString()
        };
      }

      // Test bypass
      try {
        const bypassResponse = await fetch('/api/auth/check-session?bypass=true');
        results.bypassApi = {
          status: bypassResponse.status,
          ok: bypassResponse.ok,
          timestamp: new Date().toLocaleTimeString()
        };
        
        if (bypassResponse.ok) {
          const bypassData = await bypassResponse.json();
          results.bypassApi.data = bypassData;
        }
      } catch (error) {
        results.bypassApi = {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toLocaleTimeString()
        };
      }

    } catch (error) {
      results.error = error instanceof Error ? error.message : 'Unknown error';
    }

    setStatus(results);
    setIsLoading(false);
  };

  const enableBypass = () => {
    localStorage.setItem('emergency-bypass', 'true');
    window.location.reload();
  };

  const disableBypass = () => {
    localStorage.removeItem('emergency-bypass');
    window.location.reload();
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Code className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Development Status
          </h1>
          <p className="text-gray-600">
            Check the current status of the authentication system
          </p>
          <Badge variant="outline" className="mt-2">
            Development Environment
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Emergency bypass controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Button 
                  onClick={enableBypass}
                  variant="default"
                  className="flex-1"
                >
                  🚨 Enable Bypass
                </Button>
                <Button 
                  onClick={disableBypass}
                  variant="outline"
                  className="flex-1"
                >
                  Disable Bypass
                </Button>
              </div>
              
              <Button 
                onClick={checkStatus}
                disabled={isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Status
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
              <CardDescription>
                Real-time system status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Environment:</span>
                  <Badge variant={status.environment?.isDevelopment ? 'default' : 'secondary'}>
                    {status.environment?.nodeEnv || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Emergency Bypass:</span>
                  <Badge variant={status.localStorage?.emergencyBypass ? 'destructive' : 'secondary'}>
                    {status.localStorage?.emergencyBypass ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Auth API:</span>
                  <Badge variant={status.authApi?.ok ? 'default' : 'destructive'}>
                    {status.authApi?.status || 'Unknown'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Bypass API:</span>
                  <Badge variant={status.bypassApi?.ok ? 'default' : 'destructive'}>
                    {status.bypassApi?.status || 'Unknown'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {Object.keys(status).length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Detailed Status</CardTitle>
              <CardDescription>
                Complete system information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(status).map(([key, value]) => (
                  <div key={key} className="border rounded-lg p-3">
                    <h4 className="font-medium text-sm mb-2 capitalize">{key}</h4>
                    <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                      {JSON.stringify(value, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

