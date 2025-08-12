'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  WifiOff, 
  Shield, 
  Database, 
  Info, 
  CheckCircle,
  User,
  Clock
} from 'lucide-react';
import { isDemoMode, getCurrentDemoUser, demoSessionManager } from '@/lib/auth/demo-session';

export function OfflineModeStatus() {
  const isOffline = isDemoMode();
  const demoUser = getCurrentDemoUser();
  const sessionInfo = demoSessionManager.getSessionInfo();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <Alert className="border-orange-200 bg-orange-50">
        <WifiOff className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-orange-800">Demo Mode Active</span>
              <Badge className="bg-orange-100 text-orange-800 text-xs">
                Offline
              </Badge>
            </div>
            
            {demoUser && (
              <div className="text-xs text-orange-700 space-y-1">
                <div className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  <span>{demoUser.name} ({demoUser.role})</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Since: {new Date(demoUser.loginTime).toLocaleTimeString()}</span>
                </div>
              </div>
            )}
            
            <div className="text-xs text-orange-600">
              Database unavailable - using local demo data
            </div>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function OfflineModeInfo() {
  const isOffline = isDemoMode();
  const sessionInfo = demoSessionManager.getSessionInfo();

  if (!isOffline) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-green-800 flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Online Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 text-sm">
            Connected to live database. All features fully functional.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-orange-800 flex items-center gap-2">
            <WifiOff className="h-5 w-5" />
            Demo Mode Active
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Demo Mode:</strong> The application is running with local demo data 
              because the database is currently unavailable.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Database Status</span>
              </div>
              <Badge className="bg-red-100 text-red-800">Offline</Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-white rounded border">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Demo Authentication</span>
              </div>
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            </div>

            {sessionInfo.user && (
              <div className="flex items-center justify-between p-2 bg-white rounded border">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Current User</span>
                </div>
                <div className="text-right text-xs">
                  <div className="font-medium">{sessionInfo.user.name}</div>
                  <div className="text-muted-foreground">{sessionInfo.user.role}</div>
                </div>
              </div>
            )}
          </div>

          <div className="text-xs text-orange-600 space-y-1">
            <p><strong>Demo Features Available:</strong></p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>User authentication and role management</li>
              <li>Provider dashboard with sample data</li>
              <li>Navigation and UI components</li>
              <li>Feature demonstrations</li>
            </ul>
          </div>

          <div className="text-xs text-orange-600">
            <p><strong>Limited Functionality:</strong> Data changes are not persistent and some features may be restricted.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
