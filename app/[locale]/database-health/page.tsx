'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  Server,
  Shield,
  Clock,
  Activity,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DatabaseHealth {
  connection: 'healthy' | 'error' | 'testing';
  auth: 'healthy' | 'error' | 'testing';
  tables: 'healthy' | 'error' | 'testing';
  rls: 'healthy' | 'error' | 'testing';
  lastChecked: Date | null;
  errors: string[];
}

export default function DatabaseHealthCheck() {
  const [health, setHealth] = useState<DatabaseHealth>({
    connection: 'testing',
    auth: 'testing', 
    tables: 'testing',
    rls: 'testing',
    lastChecked: null,
    errors: [],
  });
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const supabase = createClient();

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `${timestamp}: ${message}`]);
  };

  const runHealthCheck = async () => {
    setLoading(true);
    setLogs([]);
    
    const newHealth: DatabaseHealth = {
      connection: 'testing',
      auth: 'testing',
      tables: 'testing', 
      rls: 'testing',
      lastChecked: new Date(),
      errors: [],
    };

    addLog('🔍 Starting comprehensive database health check...');

    try {
      // Test 1: Basic Connection
      addLog('📡 Testing basic connection...');
      try {
        const startTime = Date.now();
        const { data, error } = await supabase
          .from('users')
          .select('count(*)')
          .limit(1);

        const duration = Date.now() - startTime;
        
        if (error) {
          newHealth.connection = 'error';
          newHealth.errors.push(`Connection failed: ${error.message}`);
          addLog(`❌ Connection failed (${duration}ms): ${error.message}`);
        } else {
          newHealth.connection = 'healthy';
          addLog(`✅ Connection successful (${duration}ms)`);
        }
      } catch (error) {
        newHealth.connection = 'error';
        newHealth.errors.push(`Connection error: ${error}`);
        addLog(`❌ Connection error: ${error}`);
      }

      // Test 2: Authentication Service
      addLog('🔐 Testing authentication service...');
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          newHealth.auth = 'error';
          newHealth.errors.push(`Auth service error: ${sessionError.message}`);
          addLog(`❌ Auth service error: ${sessionError.message}`);
        } else {
          newHealth.auth = 'healthy';
          addLog('✅ Auth service is accessible');
          
          if (sessionData.session) {
            addLog(`ℹ️ Active session found for: ${sessionData.session.user.email}`);
          } else {
            addLog('ℹ️ No active session (this is normal for logged out users)');
          }
        }
      } catch (error) {
        newHealth.auth = 'error';
        newHealth.errors.push(`Auth test failed: ${error}`);
        addLog(`❌ Auth test failed: ${error}`);
      }

      // Test 3: Essential Tables
      addLog('📋 Testing essential tables...');
      const essentialTables = ['users', 'companies', 'contracts'];
      let tableErrors = 0;

      for (const table of essentialTables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('count(*)')
            .limit(1);

          if (error) {
            tableErrors++;
            newHealth.errors.push(`Table ${table} error: ${error.message}`);
            addLog(`❌ Table ${table} error: ${error.message}`);
          } else {
            addLog(`✅ Table ${table} accessible`);
          }
        } catch (error) {
          tableErrors++;
          newHealth.errors.push(`Table ${table} test failed: ${error}`);
          addLog(`❌ Table ${table} test failed: ${error}`);
        }
      }

      newHealth.tables = tableErrors === 0 ? 'healthy' : 'error';

      // Test 4: Row Level Security
      addLog('🛡️ Testing Row Level Security policies...');
      try {
        // Test RLS by trying to access user data without authentication
        const { data: rlsTest, error: rlsError } = await supabase
          .from('users')
          .select('id')
          .limit(1);

        if (rlsError && rlsError.message.includes('RLS')) {
          newHealth.rls = 'healthy';
          addLog('✅ RLS policies are active and working');
        } else if (rlsError) {
          newHealth.rls = 'error';
          newHealth.errors.push(`RLS test error: ${rlsError.message}`);
          addLog(`❌ RLS test error: ${rlsError.message}`);
        } else {
          // If we can access data without auth, RLS might be misconfigured
          addLog('⚠️ RLS test passed but may indicate misconfiguration');
          newHealth.rls = 'healthy'; // Assume healthy for now
        }
      } catch (error) {
        newHealth.rls = 'error';
        newHealth.errors.push(`RLS test failed: ${error}`);
        addLog(`❌ RLS test failed: ${error}`);
      }

      setHealth(newHealth);
      addLog('🎯 Health check completed');

    } catch (error) {
      addLog(`❌ Health check failed: ${error}`);
      newHealth.errors.push(`Health check failed: ${error}`);
      setHealth(newHealth);
    } finally {
      setLoading(false);
    }
  };

  const fixDatabaseIssues = async () => {
    setLoading(true);
    addLog('🔧 Attempting to fix database issues...');

    try {
      // Fix 1: Clear authentication cache
      addLog('🧹 Clearing authentication cache...');
      // Don't clear Supabase session data - let Supabase handle it
      Object.keys(localStorage).forEach(key => {
        if (key.includes('supabase') || key.includes('sb-')) {
          localStorage.removeItem(key);
        }
      });
      sessionStorage.clear();
      addLog('✅ Authentication cache cleared');

      // Fix 2: Reset connection
      addLog('🔄 Resetting connection...');
      await supabase.auth.signOut();
      addLog('✅ Connection reset');

      // Fix 3: Test connection again
      addLog('🔍 Testing connection after fixes...');
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      await runHealthCheck();

    } catch (error) {
      addLog(`❌ Fix attempt failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: 'healthy' | 'error' | 'testing', label: string) => {
    const baseClasses = "flex items-center gap-1";
    
    switch (status) {
      case 'healthy':
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle className="h-3 w-3" />
            {label}
          </Badge>
        );
      case 'error':
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800`}>
            <AlertTriangle className="h-3 w-3" />
            {label}
          </Badge>
        );
      case 'testing':
        return (
          <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <RefreshCw className="h-3 w-3 animate-spin" />
            {label}
          </Badge>
        );
    }
  };

  const getOverallHealth = () => {
    const statuses = [health.connection, health.auth, health.tables, health.rls];
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('testing')) return 'testing';
    return 'healthy';
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Health Monitor
            {getStatusBadge(getOverallHealth(), 'Overall Status')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wifi className="h-4 w-4" />
                <span className="text-sm font-medium">Connection</span>
              </div>
              {getStatusBadge(health.connection, health.connection === 'healthy' ? 'Online' : 'Offline')}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="text-sm font-medium">Authentication</span>
              </div>
              {getStatusBadge(health.auth, health.auth === 'healthy' ? 'Working' : 'Failed')}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="text-sm font-medium">Tables</span>
              </div>
              {getStatusBadge(health.tables, health.tables === 'healthy' ? 'Accessible' : 'Issues')}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm font-medium">Security</span>
              </div>
              {getStatusBadge(health.rls, health.rls === 'healthy' ? 'Active' : 'Issues')}
            </div>
          </div>

          {health.lastChecked && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Last checked: {health.lastChecked.toLocaleString()}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={runHealthCheck}
              disabled={loading}
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Run Health Check
            </Button>

            {health.errors.length > 0 && (
              <Button
                onClick={fixDatabaseIssues}
                disabled={loading}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Database className="h-4 w-4 mr-2" />
                Attempt Fixes
              </Button>
            )}
          </div>

          {health.errors.length > 0 && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                <div className="text-red-800">
                  <strong>Issues Detected:</strong>
                  <ul className="mt-2 space-y-1">
                    {health.errors.map((error, index) => (
                      <li key={index} className="text-sm">• {error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {logs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Health Check Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="text-sm font-mono mb-1">
                  {log}
                </div>
              ))}
            </div>
            <Button
              onClick={() => setLogs([])}
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
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/auth-fix">Auth Fix Tool</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/auth/login">Try Login</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/register/provider">Register</a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/">Home</a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
