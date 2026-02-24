'use client';

import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ArrowRight, Database, CheckCircle } from 'lucide-react';

export default function InstantOfflinePage() {
  useEffect(() => {
    // Auto-redirect to offline login after 3 seconds
    const timer = setTimeout(() => {
      window.location.href = '/offline-login';
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-6'>
      <Card className='w-full max-w-lg border-orange-200'>
        <CardHeader className='text-center'>
          <div className='flex justify-center mb-4'>
            <Badge className='bg-orange-100 text-orange-800 px-4 py-2'>
              <Database className='h-4 w-4 mr-2' />
              Database Unavailable
            </Badge>
          </div>
          <CardTitle className='text-2xl text-gray-900'>
            Switching to Demo Mode
          </CardTitle>
        </CardHeader>

        <CardContent className='space-y-6'>
          <Alert className='border-blue-200 bg-blue-50'>
            <CheckCircle className='h-4 w-4 text-blue-600' />
            <AlertDescription className='text-blue-800'>
              <strong>Good News!</strong> We've detected database connectivity
              issues and are automatically switching you to our fully functional
              demo mode.
            </AlertDescription>
          </Alert>

          <div className='text-center space-y-4'>
            <div className='flex justify-center'>
              <RefreshCw className='h-12 w-12 text-orange-500 animate-spin' />
            </div>

            <p className='text-gray-600'>
              Preparing demo environment with full features...
            </p>

            <div className='text-sm text-gray-500'>
              Auto-redirecting in 3 seconds...
            </div>
          </div>

          <div className='space-y-3'>
            <h4 className='font-semibold text-center'>
              Available in Demo Mode:
            </h4>
            <div className='grid grid-cols-1 gap-2 text-sm'>
              <div className='flex items-center gap-2 p-2 bg-green-50 rounded'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span>Provider Dashboard & Features</span>
              </div>
              <div className='flex items-center gap-2 p-2 bg-green-50 rounded'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span>User Authentication & Roles</span>
              </div>
              <div className='flex items-center gap-2 p-2 bg-green-50 rounded'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span>Complete UI & Navigation</span>
              </div>
              <div className='flex items-center gap-2 p-2 bg-green-50 rounded'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <span>Feature Demonstrations</span>
              </div>
            </div>
          </div>

          <div className='flex gap-2'>
            <Button
              className='flex-1 bg-orange-600 hover:bg-orange-700'
              onClick={() => (window.location.href = '/offline-login')}
            >
              <ArrowRight className='h-4 w-4 mr-2' />
              Continue to Demo
            </Button>

            <Button
              variant='outline'
              onClick={() => (window.location.href = '/database-health')}
            >
              <Database className='h-4 w-4 mr-2' />
              Check Status
            </Button>
          </div>

          <div className='text-center text-xs text-gray-500'>
            Demo mode provides full access to all features with sample data
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
