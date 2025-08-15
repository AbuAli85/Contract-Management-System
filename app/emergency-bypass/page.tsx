'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

export default function EmergencyBypassPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const testBypass = async () => {
    setIsTesting(true);
    try {
      const response = await fetch('/api/auth/check-session?bypass=true');
      const data = await response.json();
      
      setTestResult({
        success: response.ok,
        status: response.status,
        data: data,
        timestamp: new Date().toLocaleTimeString()
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        timestamp: new Date().toLocaleTimeString()
      });
    } finally {
      setIsTesting(false);
    }
  };

  const goToDashboard = () => {
    // Set a flag in localStorage to bypass auth temporarily
    localStorage.setItem('emergency-bypass', 'true');
    window.location.href = '/en/dashboard';
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-yellow-100">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Emergency Authentication Bypass
          </h1>
          <p className="text-gray-600">
            Development mode only - Use this page to bypass authentication issues
          </p>
          <Badge variant="outline" className="mt-2">
            Development Environment
          </Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Test Bypass</CardTitle>
              <CardDescription>
                Test the authentication bypass functionality
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={testBypass} 
                disabled={isTesting}
                className="w-full"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  'Test Bypass'
                )}
              </Button>
              
              {testResult && (
                <div className={`p-3 rounded-lg border ${
                  testResult.success 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-red-200 bg-red-50'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {testResult.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-medium">
                      {testResult.success ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Status: {testResult.status}</p>
                    <p>Time: {testResult.timestamp}</p>
                    {testResult.error && (
                      <p className="text-red-600">Error: {testResult.error}</p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Access</CardTitle>
              <CardDescription>
                Bypass authentication and access the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={goToDashboard}
                className="w-full"
                variant="default"
              >
                Go to Dashboard (Bypass Auth)
              </Button>
              
              <div className="text-sm text-gray-600 p-3 bg-blue-50 rounded-lg">
                <p><strong>Note:</strong> This will set a temporary bypass flag in localStorage.</p>
                <p className="mt-1">Remove the flag to restore normal authentication.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Instructions</CardTitle>
            <CardDescription>
              How to use the emergency bypass
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="font-medium">1.</span>
              <span>Use this page only in development when authentication is broken</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">2.</span>
              <span>Test the bypass first to ensure it's working</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">3.</span>
              <span>Click "Go to Dashboard" to bypass authentication</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">4.</span>
              <span>Remove the bypass flag from localStorage when done testing</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">5.</span>
              <span>Fix the underlying authentication issues before deploying</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
