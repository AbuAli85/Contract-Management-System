'use client';

import React, { useState, useEffect } from 'react';
import { DatabaseErrorLoginForm } from '@/components/auth/database-error-login-form';
import { OfflineLoginForm } from '@/components/auth/offline-login-form';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Wifi, WifiOff } from 'lucide-react';

export default function SmartLoginPage() {
  const [databaseStatus, setDatabaseStatus] = useState<'checking' | 'healthy' | 'failed'>('checking');
  const [showOfflineMode, setShowOfflineMode] = useState(false);

  useEffect(() => {
    checkDatabaseHealth();
  }, []);

  const checkDatabaseHealth = async () => {
    try {
      console.log('🔍 Checking database health...');
      setDatabaseStatus('checking');
      
      const supabase = createClient();
      
      if (!supabase) {
        throw new Error('Failed to create Supabase client');
      }
      
      // Quick health check with very short timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 2000)
      );
      
      // Simple table check instead of auth session (which might have issues)
      const healthPromise = supabase
        .from('users')
        .select('count')
        .limit(1);
      
      const result = await Promise.race([healthPromise, timeoutPromise]);
      
      // Check if it's a Supabase response with error
      if (typeof result === 'object' && result !== null && 'error' in result && result.error) {
        throw result.error;
      }
      
      console.log('✅ Database health check passed');
      setDatabaseStatus('healthy');
      setShowOfflineMode(false);
      
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      setDatabaseStatus('failed');
      
      // Immediately redirect to instant offline mode
      console.log('🔄 Redirecting to instant offline mode...');
      window.location.href = '/instant-offline';
    }
  };

  const getStatusBadge = () => {
    switch (databaseStatus) {
      case 'checking':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
            Checking Database
          </Badge>
        );
      case 'healthy':
        return (
          <Badge className="bg-green-100 text-green-800">
            <Database className="h-3 w-3 mr-1" />
            Database Online
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-red-100 text-red-800">
            <WifiOff className="h-3 w-3 mr-1" />
            Database Offline
          </Badge>
        );
    }
  };

  // Show loading state while checking
  if (databaseStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Connecting...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground">
              Checking database connectivity...
            </p>
            {getStatusBadge()}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show offline mode if database failed and user has waited
  if (databaseStatus === 'failed' && showOfflineMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <OfflineLoginForm />
      </div>
    );
  }

  // Show database-aware login form (handles both healthy and failed states)
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="space-y-4">
        <div className="flex justify-center">
          {getStatusBadge()}
        </div>
        <DatabaseErrorLoginForm />
        
        {databaseStatus === 'failed' && !showOfflineMode && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Database connection issues detected. Switching to demo mode...
            </p>
            <Button
              onClick={() => setShowOfflineMode(true)}
              variant="outline"
              size="sm"
              className="text-orange-600 border-orange-300"
            >
              <WifiOff className="h-4 w-4 mr-2" />
              Switch to Demo Mode Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
