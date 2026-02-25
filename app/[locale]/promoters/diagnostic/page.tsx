'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  Clock,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';

interface TestResult {
  name: string;
  endpoint: string;
  status: 'pending' | 'running' | 'success' | 'error';
  data?: unknown;
  error?: string;
  duration?: number;
}

const DIAGNOSTIC_TESTS = [
  { name: 'Health Check', endpoint: '/api/promoters/health' },
  { name: 'Main API (5 records)', endpoint: '/api/promoters?page=1&limit=5' },
  { name: 'User Permissions', endpoint: '/api/debug/user-permissions' },
  {
    name: 'Promoter Metrics',
    endpoint: '/api/dashboard/promoter-metrics',
  },
];

export default function DiagnosticPage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading: authLoading } = useAuth();

  const locale = pathname?.match(/^\/([a-z]{2})\//)?.[1] ?? 'en';

  const [tests, setTests] = useState<TestResult[]>(
    DIAGNOSTIC_TESTS.map(t => ({ ...t, status: 'pending' as const }))
  );
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<
    'idle' | 'running' | 'passed' | 'failed'
  >('idle');

  const runTest = useCallback(async (endpoint: string, index: number) => {
    setTests(prev => {
      const next = [...prev];
      if (next[index]) next[index] = { ...next[index]!, status: 'running' };
      return next;
    });

    const startTime = Date.now();
    try {
      const response = await fetch(endpoint, { credentials: 'include' });
      const data = await response.json();
      const duration = Date.now() - startTime;

      setTests(prev => {
        const next = [...prev];
        if (next[index]) {
          next[index] = {
            ...next[index]!,
            status: response.ok ? 'success' : 'error',
            data,
            duration,
            error: response.ok
              ? undefined
              : data?.error || `HTTP ${response.status}`,
          };
        }
        return next;
      });
      return response.ok;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      setTests(prev => {
        const next = [...prev];
        if (next[index]) {
          next[index] = {
            ...next[index]!,
            status: 'error',
            error: (error as Error).message || 'Network error',
            duration,
          };
        }
        return next;
      });
      return false;
    }
  }, []);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    setOverallStatus('running');
    setTests(DIAGNOSTIC_TESTS.map(t => ({ ...t, status: 'pending' as const })));

    const results: boolean[] = [];
    for (let i = 0; i < DIAGNOSTIC_TESTS.length; i++) {
      const test = DIAGNOSTIC_TESTS[i];
      if (test) {
        const ok = await runTest(test.endpoint, i);
        results.push(ok);
      }
    }

    const allPassed = results.every(Boolean);
    setOverallStatus(allPassed ? 'passed' : 'failed');
    setIsRunning(false);
  }, [runTest]);

  // Auto-run tests on mount
  useEffect(() => {
    if (!authLoading && user) {
      runAllTests();
    }
  }, [authLoading, user, runAllTests]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className='flex min-h-[60vh] items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  // Require authentication
  if (!user) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-2xl'>
        <Alert variant='destructive'>
          <Shield className='h-4 w-4' />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You must be logged in to access the diagnostic page.
          </AlertDescription>
        </Alert>
        <Button
          className='mt-4'
          onClick={() => router.push(`/${locale}/auth/login`)}
        >
          Log In
        </Button>
      </div>
    );
  }

  const passedCount = tests.filter(t => t.status === 'success').length;
  const failedCount = tests.filter(t => t.status === 'error').length;

  return (
    <div className='container mx-auto px-4 py-8 max-w-4xl'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle className='text-2xl'>
                Promoters API Diagnostic
              </CardTitle>
              <CardDescription>
                Testing all API endpoints to identify issues
              </CardDescription>
            </div>
            {overallStatus !== 'idle' && (
              <Badge
                variant='outline'
                className={
                  overallStatus === 'passed'
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : overallStatus === 'failed'
                      ? 'border-red-300 bg-red-50 text-red-700'
                      : 'border-blue-300 bg-blue-50 text-blue-700'
                }
              >
                {overallStatus === 'passed'
                  ? `All ${passedCount} tests passed`
                  : overallStatus === 'failed'
                    ? `${failedCount} of ${tests.length} tests failed`
                    : 'Running...'}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Button
            onClick={runAllTests}
            disabled={isRunning}
            className='w-full'
            variant={overallStatus === 'failed' ? 'destructive' : 'default'}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRunning ? 'animate-spin' : ''}`}
            />
            {isRunning ? 'Running Tests...' : 'Run Tests Again'}
          </Button>

          <div className='space-y-3'>
            {tests.map((test, index) => (
              <Card
                key={index}
                className={
                  test.status === 'success'
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950'
                    : test.status === 'error'
                      ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950'
                      : test.status === 'running'
                        ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950'
                        : 'border-gray-200 dark:border-gray-700'
                }
              >
                <CardHeader className='py-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {test.status === 'pending' && (
                        <Clock className='h-4 w-4 text-gray-400' />
                      )}
                      {test.status === 'running' && (
                        <Loader2 className='h-4 w-4 animate-spin text-blue-500' />
                      )}
                      {test.status === 'success' && (
                        <CheckCircle className='h-4 w-4 text-green-600' />
                      )}
                      {test.status === 'error' && (
                        <XCircle className='h-4 w-4 text-red-600' />
                      )}
                      <div>
                        <CardTitle className='text-base'>{test.name}</CardTitle>
                        <p className='text-xs text-muted-foreground font-mono mt-0.5'>
                          {test.endpoint}
                        </p>
                      </div>
                    </div>
                    {test.duration !== undefined && (
                      <Badge
                        variant='outline'
                        className={
                          test.duration > 2000
                            ? 'border-amber-300 text-amber-700'
                            : 'border-gray-300'
                        }
                      >
                        {test.duration}ms
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                {(test.data || test.error) && (
                  <CardContent className='py-3 pt-0'>
                    {test.error && (
                      <div className='text-sm text-red-600 font-mono bg-red-100 dark:bg-red-900 rounded px-3 py-2'>
                        Error: {test.error}
                      </div>
                    )}
                    {test.data && (
                      <details className='text-sm'>
                        <summary className='cursor-pointer font-semibold mb-2 text-muted-foreground hover:text-foreground transition-colors'>
                          View Response Data
                        </summary>
                        <pre className='bg-white dark:bg-gray-900 p-3 rounded border overflow-x-auto text-xs max-h-48'>
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          <Card className='bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'>
            <CardHeader className='py-3'>
              <div className='flex items-center gap-2'>
                <AlertTriangle className='h-4 w-4 text-blue-600' />
                <CardTitle className='text-base'>Troubleshooting Guide</CardTitle>
              </div>
            </CardHeader>
            <CardContent className='text-sm space-y-2 text-muted-foreground'>
              <p>
                <strong className='text-foreground'>Health Check fails:</strong>{' '}
                API routes not deployed or not accessible
              </p>
              <p>
                <strong className='text-foreground'>
                  Main API returns empty array:
                </strong>{' '}
                Database connection or RLS policy issue
              </p>
              <p>
                <strong className='text-foreground'>
                  User Permissions fails:
                </strong>{' '}
                Authentication or RBAC configuration issue
              </p>
              <p>
                <strong className='text-foreground'>
                  Promoter Metrics fails:
                </strong>{' '}
                Metrics service or database aggregation issue
              </p>
              <p>
                <strong className='text-foreground'>
                  Response time &gt; 2000ms:
                </strong>{' '}
                Consider adding database indexes or caching
              </p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
