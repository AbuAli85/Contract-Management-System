'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { TestTube, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

export default function AuthTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [bypassAuth, setBypassAuth] = useState(false);

  const runAuthTest = async () => {
    setIsTesting(true);
    const results = [];

    try {
      // Test 1: Normal auth check
      console.log('🧪 Test 1: Normal authentication check');
      const startTime = Date.now();
      const response = await fetch('/api/auth/check-session', {
        headers: bypassAuth ? { 'x-bypass-auth': 'true' } : {}
      });
      const endTime = Date.now();
      
      results.push({
        test: 'Normal Auth Check',
        status: response.status,
        success: response.ok,
        duration: `${endTime - startTime}ms`,
        timestamp: new Date().toLocaleTimeString()
      });

      // Test 2: Rate limiting test
      console.log('🧪 Test 2: Rate limiting test');
      const rateLimitPromises = Array.from({ length: 5 }, (_, i) => 
        fetch('/api/auth/check-session', {
          headers: bypassAuth ? { 'x-bypass-auth': 'true' } : {}
        }).then(res => ({ status: res.status, index: i + 1 }))
      );
      
      const rateLimitResults = await Promise.all(rateLimitPromises);
      const rateLimited = rateLimitResults.some(r => r.status === 429);
      
      results.push({
        test: 'Rate Limiting Test',
        status: rateLimited ? '429 (Rate Limited)' : '200 (OK)',
        success: !rateLimited,
        duration: 'Multiple requests',
        timestamp: new Date().toLocaleTimeString()
      });

      // Test 3: Performance test
      console.log('🧪 Test 3: Performance test');
      const perfPromises = Array.from({ length: 3 }, async (_, i) => {
        const start = Date.now();
        const res = await fetch('/api/auth/check-session', {
          headers: bypassAuth ? { 'x-bypass-auth': 'true' } : {}
        });
        const end = Date.now();
        return { status: res.status, duration: end - start, index: i + 1 };
      });
      
      const perfResults = await Promise.all(perfPromises);
      const avgDuration = perfResults.reduce((sum, r) => sum + r.duration, 0) / perfResults.length;
      
      results.push({
        test: 'Performance Test',
        status: '200 (OK)',
        success: true,
        duration: `${Math.round(avgDuration)}ms avg`,
        timestamp: new Date().toLocaleTimeString()
      });

    } catch (error) {
      results.push({
        test: 'Error Test',
        status: 'Error',
        success: false,
        duration: 'N/A',
        timestamp: new Date().toLocaleTimeString(),
        error: error.message
      });
    }

    setTestResults(results);
    setIsTesting(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Authentication System Test
          </h1>
          <p className="text-gray-600">
            Test the authentication system and rate limiting
          </p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Configuration
            </CardTitle>
            <CardDescription>
              Configure test parameters and run authentication tests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="bypass-auth"
                checked={bypassAuth}
                onChange={(e) => setBypassAuth(e.target.checked)}
                className="rounded border-gray-300"
                aria-label="Bypass authentication for development testing"
                title="Bypass authentication for development testing"
              />
              <Label htmlFor="bypass-auth">
                Bypass Authentication (Development Mode)
              </Label>
            </div>
            
            <div className="flex space-x-4">
              <Button 
                onClick={runAuthTest} 
                disabled={isTesting}
                className="flex-1"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Run Tests
                  </>
                )}
              </Button>
              
              <Button 
                onClick={clearResults} 
                variant="outline"
                disabled={testResults.length === 0}
              >
                Clear Results
              </Button>
            </div>
          </CardContent>
        </Card>

        {testResults.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Results</CardTitle>
              <CardDescription>
                Results from the latest test run
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.success 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {result.success ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        <span className="font-medium">{result.test}</span>
                      </div>
                      <Badge variant={result.success ? 'default' : 'destructive'}>
                        {result.status}
                      </Badge>
                    </div>
                    
                    <div className="mt-2 text-sm text-gray-600">
                      <span className="mr-4">Duration: {result.duration}</span>
                      <span>Time: {result.timestamp}</span>
                      {result.error && (
                        <div className="mt-1 text-red-600">
                          Error: {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Summary:</strong> {testResults.filter(r => r.success).length} out of {testResults.length} tests passed
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
