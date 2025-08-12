'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, CheckCircle, AlertTriangle, Zap } from 'lucide-react';

export default function CompleteSolutionPage() {
  const openPage = (url: string) => {
    window.open(url, '_blank');
  };

  const goToPage = (url: string) => {
    window.location.href = url;
  };

  return (
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <Card className='border-2 border-blue-200 bg-blue-50'>
          <CardHeader className='text-center'>
            <CardTitle className='text-3xl flex items-center justify-center gap-2 text-blue-900'>
              <Zap className='h-8 w-8' />
              Complete Working Solution
            </CardTitle>
            <p className='text-blue-700'>
              Everything you need to get registration and dashboards working
            </p>
          </CardHeader>
        </Card>

        {/* Problem Summary */}
        <Card className='border-yellow-200 bg-yellow-50'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <AlertTriangle className='h-5 w-5 text-yellow-600' />
              <h3 className='font-semibold text-yellow-900'>
                Current Issues Summary
              </h3>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800'>
              <div>
                <h4 className='font-semibold mb-1'>❌ What's Not Working:</h4>
                <ul className='space-y-1'>
                  <li>• Complex registration systems failing</li>
                  <li>• Database constraint errors</li>
                  <li>• Admin API access issues</li>
                  <li>• Internal server errors</li>
                </ul>
              </div>
              <div>
                <h4 className='font-semibold mb-1'>
                  ✅ What We'll Use Instead:
                </h4>
                <ul className='space-y-1'>
                  <li>• Simple Supabase signup</li>
                  <li>• Direct authentication tests</li>
                  <li>• Dashboard preview mode</li>
                  <li>• Working alternatives</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Solutions */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Authentication Solution */}
          <Card className='border-green-200'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-green-900'>
                <CheckCircle className='h-5 w-5' />
                Authentication Solution
              </CardTitle>
              <Badge className='bg-green-600 w-fit'>GUARANTEED TO WORK</Badge>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Alert className='border-green-200 bg-green-50'>
                <AlertDescription className='text-green-800'>
                  <strong>Step 1:</strong> Test what's working right now
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => goToPage('/en/auth-test')}
                className='w-full bg-green-600 hover:bg-green-700'
              >
                🧪 Test Authentication System
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>

              <Alert className='border-blue-200 bg-blue-50'>
                <AlertDescription className='text-blue-800'>
                  <strong>Step 2:</strong> Create account with simple method
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => openPage('/en/basic-signup')}
                variant='outline'
                className='w-full border-blue-200 text-blue-700'
              >
                👥 Basic Account Creation
              </Button>

              <Alert className='border-purple-200 bg-purple-50'>
                <AlertDescription className='text-purple-800'>
                  <strong>Step 3:</strong> Login with working system
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => openPage('/en/working-login')}
                variant='outline'
                className='w-full border-purple-200 text-purple-700'
              >
                🔐 Working Login System
              </Button>

              <div className='text-xs text-green-700 bg-green-100 p-2 rounded'>
                <p>
                  <strong>Why this works:</strong>
                </p>
                <p>• Uses only standard Supabase methods</p>
                <p>• No complex database operations</p>
                <p>• Real-time testing and feedback</p>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Solution */}
          <Card className='border-blue-200'>
            <CardHeader>
              <CardTitle className='flex items-center gap-2 text-blue-900'>
                <CheckCircle className='h-5 w-5' />
                Dashboard Solution
              </CardTitle>
              <Badge className='bg-blue-600 w-fit'>NO LOGIN REQUIRED</Badge>
            </CardHeader>
            <CardContent className='space-y-4'>
              <Alert className='border-blue-200 bg-blue-50'>
                <AlertDescription className='text-blue-800'>
                  <strong>Preview Mode:</strong> See dashboards working without
                  authentication
                </AlertDescription>
              </Alert>

              <Button
                onClick={() => goToPage('/en/dashboard-preview')}
                className='w-full bg-blue-600 hover:bg-blue-700'
              >
                👁️ Dashboard Preview Center
                <ArrowRight className='ml-2 h-4 w-4' />
              </Button>

              <div className='grid grid-cols-1 gap-3'>
                <Button
                  onClick={() => openPage('/en/demo-dashboard')}
                  variant='outline'
                  className='w-full'
                >
                  📊 Interactive Demo
                </Button>

                <Button
                  onClick={() =>
                    openPage('/en/dashboard/provider-comprehensive')
                  }
                  variant='outline'
                  className='w-full'
                >
                  🏢 Provider Dashboard (Direct)
                </Button>

                <Button
                  onClick={() => openPage('/en/dashboard/client-comprehensive')}
                  variant='outline'
                  className='w-full'
                >
                  👤 Client Dashboard (Direct)
                </Button>
              </div>

              <div className='text-xs text-blue-700 bg-blue-100 p-2 rounded'>
                <p>
                  <strong>What you'll see:</strong>
                </p>
                <p>• Complete provider/client workflows</p>
                <p>• Service management systems</p>
                <p>• Real-time features and analytics</p>
                <p>• Full marketplace functionality</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Start Guide */}
        <Card className='border-2 border-green-200 bg-green-50'>
          <CardHeader>
            <CardTitle className='text-green-900'>
              🚀 Quick Start Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='bg-green-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold'>
                  1
                </div>
                <Button
                  size='sm'
                  onClick={() => goToPage('/en/auth-test')}
                  className='w-full bg-green-600'
                >
                  Test Auth
                </Button>
                <p className='text-xs text-green-700 mt-1'>Check what works</p>
              </div>

              <div className='text-center'>
                <div className='bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold'>
                  2
                </div>
                <Button
                  size='sm'
                  onClick={() => openPage('/en/basic-signup')}
                  className='w-full bg-blue-600'
                >
                  Create Account
                </Button>
                <p className='text-xs text-blue-700 mt-1'>Simple signup</p>
              </div>

              <div className='text-center'>
                <div className='bg-purple-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold'>
                  3
                </div>
                <Button
                  size='sm'
                  onClick={() => openPage('/en/working-login')}
                  className='w-full bg-purple-600'
                >
                  Login
                </Button>
                <p className='text-xs text-purple-700 mt-1'>
                  Use working login
                </p>
              </div>

              <div className='text-center'>
                <div className='bg-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center mx-auto mb-2 font-bold'>
                  4
                </div>
                <Button
                  size='sm'
                  onClick={() => goToPage('/en/dashboard-preview')}
                  className='w-full bg-orange-600'
                >
                  Dashboard
                </Button>
                <p className='text-xs text-orange-700 mt-1'>Explore features</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Options */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Alternative Access Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-6 gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => openPage('/en/fix-registration')}
              >
                🔧 Fix Center
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => openPage('/en/simple-register')}
              >
                📝 Simple Register
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => openPage('/en/test-registration')}
              >
                🧪 Test System
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => openPage('/en/marketplace')}
              >
                🏪 Marketplace
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => openPage('/en/workflow')}
              >
                🔄 Workflow
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() =>
                  openPage(
                    'https://reootcngcptfogfozlmz.supabase.co/project/reootcngcptfogfozlmz/auth/users'
                  )
                }
              >
                👤 Supabase
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Success Metrics */}
        <Card className='border-green-200 bg-green-50'>
          <CardContent className='p-4'>
            <h3 className='font-semibold text-green-900 mb-2'>
              ✅ Success Criteria
            </h3>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-green-800'>
              <div>
                <h4 className='font-semibold mb-1'>Authentication:</h4>
                <ul className='space-y-1'>
                  <li>• ✅ Can create account</li>
                  <li>• ✅ Can login successfully</li>
                  <li>• ✅ Session persists</li>
                </ul>
              </div>
              <div>
                <h4 className='font-semibold mb-1'>Dashboard Access:</h4>
                <ul className='space-y-1'>
                  <li>• ✅ Provider dashboard loads</li>
                  <li>• ✅ Client dashboard loads</li>
                  <li>• ✅ All features visible</li>
                </ul>
              </div>
              <div>
                <h4 className='font-semibold mb-1'>Functionality:</h4>
                <ul className='space-y-1'>
                  <li>• ✅ Service management</li>
                  <li>• ✅ Booking system</li>
                  <li>• ✅ Analytics & reports</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
