'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';

// Test different aspects that might cause Server Component errors
export default function DiagnosticPage() {
  const [mounted, setMounted] = useState(false);
  const [testResults, setTestResults] = useState<{
    [key: string]: 'loading' | 'success' | 'error';
  }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const runTest = async (testName: string, testFn: () => Promise<void>) => {
    setTestResults(prev => ({ ...prev, [testName]: 'loading' }));
    try {
      await testFn();
      setTestResults(prev => ({ ...prev, [testName]: 'success' }));
    } catch (error) {
      setTestResults(prev => ({ ...prev, [testName]: 'error' }));
      setErrors(prev => ({
        ...prev,
        [testName]: error instanceof Error ? error.message : String(error),
      }));
    }
  };

  const testClientSideOnly = async () => {
    if (typeof window === 'undefined') {
      throw new Error('Window object not available');
    }
    // Simple client-side test
    return Promise.resolve();
  };

  const testDynamicImport = async () => {
    try {
      const importedModule = await import(
        '@/components/unified-contract-generator-form'
      );
      if (!importedModule.default) {
        throw new Error('Default export not found');
      }
    } catch (error) {
      throw new Error(`Dynamic import failed: ${error}`);
    }
  };

  const testTanStackQuery = async () => {
    try {
      const { QueryClient } = await import('@tanstack/react-query');
      const queryClient = new QueryClient();
      if (!queryClient) {
        throw new Error('QueryClient creation failed');
      }
    } catch (error) {
      throw new Error(`TanStack Query test failed: ${error}`);
    }
  };

  const testSupabaseClient = async () => {
    try {
      const { createClient } = await import('@/lib/supabase/client');
      const client = createClient();
      if (!client) {
        throw new Error('Supabase client creation failed');
      }
    } catch (error) {
      throw new Error(`Supabase client test failed: ${error}`);
    }
  };

  const testFormLibraries = async () => {
    try {
      const { useForm } = await import('react-hook-form');
      const { zodResolver } = await import('@hookform/resolvers/zod');
      if (!useForm || !zodResolver) {
        throw new Error('Form libraries not available');
      }
    } catch (error) {
      throw new Error(`Form libraries test failed: ${error}`);
    }
  };

  const getStatusIcon = (status: 'loading' | 'success' | 'error') => {
    switch (status) {
      case 'loading':
        return <Loader2 className='h-4 w-4 animate-spin text-blue-500' />;
      case 'success':
        return <CheckCircle className='h-4 w-4 text-green-500' />;
      case 'error':
        return <AlertTriangle className='h-4 w-4 text-red-500' />;
    }
  };

  if (!mounted) {
    return (
      <div className='flex items-center justify-center p-8'>
        <div className='text-center'>
          <Loader2 className='mx-auto h-8 w-8 animate-spin' />
          <p className='mt-2'>Initializing diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-4xl p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>Contract Form Diagnostics</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert>
            <AlertDescription>
              This page tests various components that might cause Server
              Component rendering errors.
            </AlertDescription>
          </Alert>

          <div className='grid gap-4 md:grid-cols-2'>
            {[
              { name: 'Client-side Environment', fn: testClientSideOnly },
              { name: 'Dynamic Import', fn: testDynamicImport },
              { name: 'TanStack Query', fn: testTanStackQuery },
              { name: 'Supabase Client', fn: testSupabaseClient },
              { name: 'Form Libraries', fn: testFormLibraries },
            ].map(({ name, fn }) => (
              <Card key={name} className='p-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    {testResults[name] && getStatusIcon(testResults[name])}
                    <span className='font-medium'>{name}</span>
                  </div>
                  <Button
                    size='sm'
                    onClick={() => runTest(name, fn)}
                    disabled={testResults[name] === 'loading'}
                  >
                    Test
                  </Button>
                </div>
                {testResults[name] === 'error' && errors[name] && (
                  <div className='mt-2 text-sm text-red-600'>
                    {errors[name]}
                  </div>
                )}
              </Card>
            ))}
          </div>

          <div className='pt-4'>
            <Button
              onClick={() => {
                const tests = [
                  { name: 'Client-side Environment', fn: testClientSideOnly },
                  { name: 'Dynamic Import', fn: testDynamicImport },
                  { name: 'TanStack Query', fn: testTanStackQuery },
                  { name: 'Supabase Client', fn: testSupabaseClient },
                  { name: 'Form Libraries', fn: testFormLibraries },
                ];
                tests.forEach(({ name, fn }) => runTest(name, fn));
              }}
              className='w-full'
            >
              Run All Tests
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
