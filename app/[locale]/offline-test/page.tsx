'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  WifiOff, 
  User, 
  Shield, 
  CheckCircle, 
  AlertTriangle,
  Database,
  RefreshCw,
  LogOut,
  Settings
} from 'lucide-react';
import { OfflineModeInfo } from '@/components/auth/offline-mode-status';
import { demoSessionManager, isDemoMode, getCurrentDemoUser } from '@/lib/auth/demo-session';
import { useRouter } from 'next/navigation';

export default function OfflineTestPage() {
  const [sessionInfo, setSessionInfo] = useState(demoSessionManager.getSessionInfo());
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Update session info every second
    const interval = setInterval(() => {
      setSessionInfo(demoSessionManager.getSessionInfo());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setLoading(true);
    demoSessionManager.clearSession();
    setTimeout(() => {
      window.location.href = '/auth/login';
    }, 1000);
  };

  const handleSwitchRole = (newRole: 'provider' | 'admin' | 'client') => {
    if (sessionInfo.user) {
      demoSessionManager.updateSession({ role: newRole });
      setSessionInfo(demoSessionManager.getSessionInfo());
      
      // Redirect to appropriate dashboard
      const dashboardMap = {
        provider: '/dashboard/provider',
        admin: '/dashboard/admin',
        client: '/dashboard/client',
      };
      
      setTimeout(() => {
        router.push(dashboardMap[newRole]);
      }, 1000);
    }
  };

  const testFeatures = [
    {
      name: 'Authentication',
      status: sessionInfo.isAuthenticated ? 'working' : 'failed',
      description: 'Demo user authentication system'
    },
    {
      name: 'Role Detection',
      status: sessionInfo.role ? 'working' : 'failed',
      description: 'User role identification and management'
    },
    {
      name: 'Session Management',
      status: sessionInfo.hasSession ? 'working' : 'failed',
      description: 'Local session storage and persistence'
    },
    {
      name: 'Demo Mode',
      status: sessionInfo.isDemoMode ? 'working' : 'failed',
      description: 'Offline mode functionality'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            Offline Mode Test
            {sessionInfo.isDemoMode ? (
              <Badge className="bg-orange-100 text-orange-800">Demo Active</Badge>
            ) : (
              <Badge className="bg-green-100 text-green-800">Online Mode</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="border-blue-200 bg-blue-50">
            <Database className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              This page tests offline mode functionality when the database is unavailable.
              Use the buttons below to test different features and role switching.
            </AlertDescription>
          </Alert>

          {/* Session Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Session Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Authenticated:</span>
                  <Badge className={sessionInfo.isAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {sessionInfo.isAuthenticated ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Demo Mode:</span>
                  <Badge className={sessionInfo.isDemoMode ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}>
                    {sessionInfo.isDemoMode ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">User Role:</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {sessionInfo.role || 'None'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {sessionInfo.user && (
              <Card className="border-gray-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">User Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm">
                    <strong>Name:</strong> {sessionInfo.user.name}
                  </div>
                  <div className="text-sm">
                    <strong>Email:</strong> {sessionInfo.user.email}
                  </div>
                  <div className="text-sm">
                    <strong>Company:</strong> {sessionInfo.user.company}
                  </div>
                  <div className="text-sm">
                    <strong>Login:</strong> {new Date(sessionInfo.user.loginTime).toLocaleString()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Feature Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feature Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testFeatures.map((feature, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium text-sm">{feature.name}</div>
                      <div className="text-xs text-muted-foreground">{feature.description}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {feature.status === 'working' ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      )}
                      <Badge className={feature.status === 'working' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {feature.status === 'working' ? 'Working' : 'Failed'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Role Switching (Demo Only)</h4>
              <div className="flex gap-2">
                <Button
                  variant={sessionInfo.role === 'provider' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSwitchRole('provider')}
                  disabled={!sessionInfo.isDemoMode || loading}
                >
                  <User className="h-4 w-4 mr-1" />
                  Provider
                </Button>
                <Button
                  variant={sessionInfo.role === 'admin' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSwitchRole('admin')}
                  disabled={!sessionInfo.isDemoMode || loading}
                >
                  <Shield className="h-4 w-4 mr-1" />
                  Admin
                </Button>
                <Button
                  variant={sessionInfo.role === 'client' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSwitchRole('client')}
                  disabled={!sessionInfo.isDemoMode || loading}
                >
                  <User className="h-4 w-4 mr-1" />
                  Client
                </Button>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Quick Actions</h4>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/database-health')}
                >
                  <Database className="h-4 w-4 mr-1" />
                  Check Database
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh Page
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  disabled={loading}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {loading ? 'Logging out...' : 'Logout'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <OfflineModeInfo />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Navigation Tests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard/provider">Provider Dashboard</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/test-provider">Provider Test</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/auth-fix">Auth Fix</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/auth/login">Login Page</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
