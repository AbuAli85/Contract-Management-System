'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  data?: any;
  error?: string;
  duration?: number;
}

export default function DiagnosticPage() {
  const [tests, setTests] = useState<TestResult[]>([
    { name: 'Health Check', status: 'pending' },
    { name: 'Main API', status: 'pending' },
    { name: 'Test API', status: 'pending' },
    { name: 'User Permissions', status: 'pending' },
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const runTest = async (endpoint: string, index: number) => {
    const startTime = Date.now();
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      const duration = Date.now() - startTime;

      setTests(prev => {
        const newTests = [...prev];
        newTests[index] = {
          ...newTests[index],
          status: response.ok ? 'success' : 'error',
          data,
          duration,
        };
        return newTests;
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      setTests(prev => {
        const newTests = [...prev];
        newTests[index] = {
          ...newTests[index],
          status: 'error',
          error: error.message,
          duration,
        };
        return newTests;
      });
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTests([
      { name: 'Health Check', status: 'pending' },
      { name: 'Main API', status: 'pending' },
      { name: 'Test API', status: 'pending' },
      { name: 'User Permissions', status: 'pending' },
    ]);

    await runTest('/api/promoters/health', 0);
    await runTest('/api/promoters?page=1&limit=5', 1);
    await runTest('/api/promoters/test', 2);
    await runTest('/api/debug/user-permissions', 3);

    setIsRunning(false);
  };

  useEffect(() => {
    runAllTests();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Promoters API Diagnostic</CardTitle>
          <CardDescription>
            Testing all API endpoints to identify issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runAllTests} disabled={isRunning} className="w-full">
            <RefreshCw className={`mr-2 h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
            {isRunning ? 'Running Tests...' : 'Run Tests Again'}
          </Button>

          <div className="space-y-3">
            {tests.map((test, index) => (
              <Card key={index} className={
                test.status === 'success' ? 'border-green-200 bg-green-50' :
                test.status === 'error' ? 'border-red-200 bg-red-50' :
                'border-gray-200'
              }>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {test.status === 'pending' && (
                        <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />
                      )}
                      {test.status === 'success' && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      {test.status === 'error' && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <CardTitle className="text-base">{test.name}</CardTitle>
                    </div>
                    {test.duration && (
                      <Badge variant="outline">{test.duration}ms</Badge>
                    )}
                  </div>
                </CardHeader>
                {(test.data || test.error) && (
                  <CardContent className="py-3 pt-0">
                    {test.error && (
                      <div className="text-sm text-red-600 font-mono">
                        Error: {test.error}
                      </div>
                    )}
                    {test.data && (
                      <details className="text-sm">
                        <summary className="cursor-pointer font-semibold mb-2">
                          View Response Data
                        </summary>
                        <pre className="bg-white p-3 rounded border overflow-x-auto text-xs">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Card className="bg-blue-50 border-blue-200">
            <CardHeader className="py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <CardTitle className="text-base">Next Steps</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p><strong>If Health Check fails:</strong> API routes not deployed or not accessible</p>
              <p><strong>If Main API returns empty array:</strong> Database connection or RLS policy issue</p>
              <p><strong>If Test API fails:</strong> Deployment issue or routing problem</p>
              <p><strong>If User Permissions fails:</strong> Authentication or RBAC configuration issue</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}

