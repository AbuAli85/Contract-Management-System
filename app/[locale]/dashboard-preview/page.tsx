'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Eye, Play, Settings } from 'lucide-react';

export default function DashboardPreviewPage() {
  const openDemo = () => {
    window.location.href = '/en/demo-dashboard';
  };

  const openProvider = () => {
    window.open('/en/dashboard/provider-comprehensive', '_blank');
  };

  const openClient = () => {
    window.open('/en/dashboard/client-comprehensive', '_blank');
  };

  const openLogin = () => {
    window.open('/en/working-login', '_blank');
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='max-w-4xl w-full space-y-6'>
        {/* Header */}
        <Card className='text-center'>
          <CardHeader>
            <CardTitle className='text-3xl flex items-center justify-center gap-2'>
              <Eye className='h-8 w-8 text-blue-600' />
              Dashboard Preview Center
            </CardTitle>
            <p className='text-gray-600'>
              Explore Provider and Client dashboards without authentication
              issues
            </p>
          </CardHeader>
        </Card>

        {/* Main Demo Option */}
        <Card className='border-2 border-blue-200 bg-blue-50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-blue-900'>
              <Play className='h-5 w-5' />
              Interactive Dashboard Demo
              <Badge className='bg-blue-600'>RECOMMENDED</Badge>
            </CardTitle>
            <p className='text-blue-700'>
              See both Provider and Client dashboards working with real
              functionality and mock data
            </p>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4 text-sm'>
                <div className='space-y-2'>
                  <h4 className='font-semibold text-blue-900'>
                    Provider Dashboard Features:
                  </h4>
                  <ul className='space-y-1 text-blue-700'>
                    <li>• Service management & analytics</li>
                    <li>• Order tracking & status updates</li>
                    <li>• Earnings & performance metrics</li>
                    <li>• Digital marketing service types</li>
                    <li>• Real-time notifications</li>
                  </ul>
                </div>
                <div className='space-y-2'>
                  <h4 className='font-semibold text-blue-900'>
                    Client Dashboard Features:
                  </h4>
                  <ul className='space-y-1 text-blue-700'>
                    <li>• Project overview & tracking</li>
                    <li>• Service booking & management</li>
                    <li>• Progress monitoring</li>
                    <li>• Communication center</li>
                    <li>• Invoice & payment tracking</li>
                  </ul>
                </div>
              </div>

              <Button
                onClick={openDemo}
                className='w-full bg-blue-600 hover:bg-blue-700 text-lg py-6'
              >
                <Play className='mr-2 h-5 w-5' />
                Launch Interactive Demo
                <ArrowRight className='ml-2 h-5 w-5' />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Direct Access Options */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          {/* Provider Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5 text-purple-600' />
                Provider Dashboard
              </CardTitle>
              <p className='text-sm text-gray-600'>
                Direct access to provider dashboard (requires login)
              </p>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='text-sm text-gray-600'>
                <p>
                  <strong>Role:</strong> Provider
                </p>
                <p>
                  <strong>Features:</strong> Service management, orders,
                  analytics
                </p>
                <p>
                  <strong>Access:</strong> Requires provider authentication
                </p>
              </div>

              <Button
                onClick={openProvider}
                variant='outline'
                className='w-full border-purple-200 text-purple-700 hover:bg-purple-50'
              >
                Open Provider Dashboard
              </Button>
            </CardContent>
          </Card>

          {/* Client Dashboard */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Settings className='h-5 w-5 text-green-600' />
                Client Dashboard
              </CardTitle>
              <p className='text-sm text-gray-600'>
                Direct access to client dashboard (requires login)
              </p>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='text-sm text-gray-600'>
                <p>
                  <strong>Role:</strong> Client
                </p>
                <p>
                  <strong>Features:</strong> Project management, booking,
                  tracking
                </p>
                <p>
                  <strong>Access:</strong> Requires client authentication
                </p>
              </div>

              <Button
                onClick={openClient}
                variant='outline'
                className='w-full border-green-200 text-green-700 hover:bg-green-50'
              >
                Open Client Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Login Option */}
        <Card className='border-orange-200 bg-orange-50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-orange-900'>
              <Settings className='h-5 w-5' />
              Need to Login First?
            </CardTitle>
            <p className='text-orange-700'>
              If you want to test with real authentication, use the working
              login page
            </p>
          </CardHeader>
          <CardContent>
            <Button
              onClick={openLogin}
              variant='outline'
              className='w-full border-orange-200 text-orange-700 hover:bg-orange-100'
            >
              🔑 Go to Working Login Page
            </Button>

            <div className='mt-3 text-sm text-orange-700'>
              <p>
                <strong>Test Credentials:</strong>
              </p>
              <p>📧 Email: provider@test.com</p>
              <p>🔑 Password: password</p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Access */}
        <Card>
          <CardHeader>
            <CardTitle>🔗 Quick Access Links</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.open('/en/marketplace', '_blank')}
              >
                🏪 Marketplace
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.open('/en/workflow', '_blank')}
              >
                🔄 Workflow
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.open('/en/fix-auth', '_blank')}
              >
                🔧 Fix Auth
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={() => window.open('/en/dashboard', '_blank')}
              >
                📊 Main Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
