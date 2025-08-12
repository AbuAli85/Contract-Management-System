'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-service';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  AlertCircle,
  Users,
  Settings,
  BarChart3,
  MessageSquare,
  Calendar,
  DollarSign,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';
import { ProviderFeaturesShowcase } from '@/components/provider-features-showcase';

interface UserRoleInfo {
  role: string;
  source: string;
  isProvider: boolean;
  hasProfile: boolean;
  hasUserRole: boolean;
}

export default function ProviderTestPage() {
  const { user, loading } = useAuth();
  const [roleInfo, setRoleInfo] = useState<UserRoleInfo | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupResult, setSetupResult] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRoleInfo();
    }
  }, [user]);

  const fetchRoleInfo = async () => {
    try {
      const response = await fetch('/api/setup-user-role');
      if (response.ok) {
        const data = await response.json();
        setRoleInfo({
          role: data.user?.role || 'unknown',
          source: 'database',
          isProvider: data.isProvider || false,
          hasProfile: data.hasProfile || false,
          hasUserRole: data.hasUserRole || false,
        });
      }
    } catch (error) {
      console.error('Error fetching role info:', error);
    }
  };

  const setupProviderRole = async () => {
    setSetupLoading(true);
    setSetupResult(null);
    
    try {
      const response = await fetch('/api/setup-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'provider',
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSetupResult('Provider role setup successful!');
        await fetchRoleInfo(); // Refresh role info
      } else {
        const error = await response.json();
        setSetupResult(`Setup failed: ${error.error}`);
      }
    } catch (error) {
      setSetupResult(`Setup error: ${error}`);
    } finally {
      setSetupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        <span className="ml-3">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the provider test page.
            <Link href="/auth/login" className="ml-2 text-blue-600 hover:underline">
              Go to Login
            </Link>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Provider System Test</h1>
        <p className="text-gray-600">
          Test and verify provider role assignment and features
        </p>
      </div>

      {/* User Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            User Account Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">User ID</p>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
          </div>

          {roleInfo && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <Badge className={roleInfo.isProvider ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                  {roleInfo.isProvider ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  {roleInfo.isProvider ? 'Provider Role' : 'Not Provider'}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={roleInfo.hasProfile ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                  {roleInfo.hasProfile ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  Profile
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={roleInfo.hasUserRole ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}>
                  {roleInfo.hasUserRole ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                  User Role
                </Badge>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={fetchRoleInfo} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            
            {roleInfo && !roleInfo.isProvider && (
              <Button 
                onClick={setupProviderRole}
                disabled={setupLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                {setupLoading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Settings className="h-4 w-4 mr-2" />
                )}
                Setup Provider Role
              </Button>
            )}
          </div>

          {setupResult && (
            <Alert className={setupResult.includes('successful') ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription>{setupResult}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Provider Dashboard Links */}
      {roleInfo?.isProvider && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Provider Dashboard Access
            </CardTitle>
            <CardDescription>
              Access your provider-specific features and dashboards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/dashboard/provider">
                <Button className="w-full justify-start h-auto p-4" variant="outline">
                  <div className="text-left">
                    <div className="flex items-center gap-2 font-medium">
                      <BarChart3 className="h-4 w-4" />
                      Provider Dashboard
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Analytics and overview</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              <Link href="/manage-promoters">
                <Button className="w-full justify-start h-auto p-4" variant="outline">
                  <div className="text-left">
                    <div className="flex items-center gap-2 font-medium">
                      <Users className="h-4 w-4" />
                      Manage Promoters
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Team management</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              <Link href="/dashboard-role-router">
                <Button className="w-full justify-start h-auto p-4" variant="outline">
                  <div className="text-left">
                    <div className="flex items-center gap-2 font-medium">
                      <Settings className="h-4 w-4" />
                      Role-Based Router
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Auto dashboard detection</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              <Link href="/business-management">
                <Button className="w-full justify-start h-auto p-4" variant="outline">
                  <div className="text-left">
                    <div className="flex items-center gap-2 font-medium">
                      <DollarSign className="h-4 w-4" />
                      Business Management
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Financial overview</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              <Link href="/contracts">
                <Button className="w-full justify-start h-auto p-4" variant="outline">
                  <div className="text-left">
                    <div className="flex items-center gap-2 font-medium">
                      <MessageSquare className="h-4 w-4" />
                      Contracts
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Contract management</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
              </Link>

              <Link href="/booking-system">
                <Button className="w-full justify-start h-auto p-4" variant="outline">
                  <div className="text-left">
                    <div className="flex items-center gap-2 font-medium">
                      <Calendar className="h-4 w-4" />
                      Booking System
                    </div>
                    <p className="text-xs text-gray-600 mt-1">Schedule management</p>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provider Features Showcase */}
      {roleInfo?.isProvider && <ProviderFeaturesShowcase />}

      {/* Registration Instructions */}
      {!roleInfo?.isProvider && (
        <Card>
          <CardHeader>
            <CardTitle>Become a Provider</CardTitle>
            <CardDescription>
              Register as a service provider to access all provider features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need a provider account to access provider-specific features.
              </AlertDescription>
            </Alert>
            
            <div className="flex gap-2">
              <Link href="/register/provider">
                <Button className="bg-green-600 hover:bg-green-700">
                  Register as Provider
                </Button>
              </Link>
              <Button onClick={setupProviderRole} variant="outline">
                Or Setup Provider Role Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
