'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, LogOut, User, Shield } from 'lucide-react';

export function AuthStatusDebug() {
  const { user, session, loading, signOut } = useAuth();
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const [checkCount, setCheckCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLastCheck(new Date());
      setCheckCount(prev => prev + 1);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      console.log('✅ User signed out successfully');
    } catch (error) {
      console.error('❌ Error signing out:', error);
    }
  };

  const handleRefresh = () => {
    setLastCheck(new Date());
    setCheckCount(0);
    console.log('🔄 Auth status refreshed');
  };

  if (!user && !session) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Shield className="h-6 w-6 text-gray-600" />
          </div>
          <CardTitle className="text-lg">Not Authenticated</CardTitle>
          <CardDescription>
            No active session found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            <p>Status: <Badge variant="secondary">Not Logged In</Badge></p>
            <p>Last Check: {lastCheck.toLocaleTimeString()}</p>
            <p>Check Count: {checkCount}</p>
          </div>
          <Button onClick={handleRefresh} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <User className="h-6 w-6 text-green-600" />
        </div>
        <CardTitle className="text-lg">Authenticated</CardTitle>
        <CardDescription>
          User is logged in
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">Email:</span>
            <span className="text-gray-600">{user?.email || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">User ID:</span>
            <span className="text-gray-600 font-mono text-xs">{user?.id?.substring(0, 8)}...</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Status:</span>
            <Badge variant="default">Logged In</Badge>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Last Check:</span>
            <span className="text-gray-600">{lastCheck.toLocaleTimeString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Check Count:</span>
            <span className="text-gray-600">{checkCount}</span>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button onClick={handleRefresh} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleSignOut} variant="destructive" className="flex-1">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
