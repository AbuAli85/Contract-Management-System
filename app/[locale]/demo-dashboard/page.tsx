'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RealTimeProviderDashboard } from '@/components/dashboards/real-time-provider-dashboard';
import { RealTimeClientDashboard } from '@/components/dashboards/real-time-client-dashboard';
import { User, Building, Settings, Eye } from 'lucide-react';

// Mock user data for demo
const mockProviderUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'provider@demo.com',
  full_name: 'Demo Provider',
  role: 'provider' as const,
  status: 'active' as const,
};

const mockClientUser = {
  id: '22222222-2222-2222-2222-222222222222',
  email: 'client@demo.com',
  full_name: 'Demo Client',
  role: 'client' as const,
  status: 'active' as const,
};

export default function DemoDashboardPage() {
  const [selectedRole, setSelectedRole] = useState<'provider' | 'client'>(
    'provider'
  );

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <div className='bg-white border-b shadow-sm'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex items-center justify-between h-16'>
            <div className='flex items-center space-x-4'>
              <div className='flex items-center space-x-2'>
                <Building className='h-8 w-8 text-blue-600' />
                <h1 className='text-xl font-bold text-gray-900'>
                  Contract Management System
                </h1>
                <Badge
                  variant='secondary'
                  className='bg-green-100 text-green-800'
                >
                  DEMO MODE
                </Badge>
              </div>
            </div>

            <div className='flex items-center space-x-4'>
              <Badge variant='outline' className='flex items-center gap-2'>
                <Eye className='h-4 w-4' />
                Dashboard Preview
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Selection */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <Card className='mb-6'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Settings className='h-5 w-5' />
              Dashboard Demo
            </CardTitle>
            <p className='text-sm text-gray-600'>
              Choose which dashboard to preview. This demo shows the full
              functionality without requiring authentication.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs
              value={selectedRole}
              onValueChange={value =>
                setSelectedRole(value as 'provider' | 'client')
              }
            >
              <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger
                  value='provider'
                  className='flex items-center gap-2'
                >
                  <User className='h-4 w-4' />
                  Provider Dashboard
                </TabsTrigger>
                <TabsTrigger value='client' className='flex items-center gap-2'>
                  <Building className='h-4 w-4' />
                  Client Dashboard
                </TabsTrigger>
              </TabsList>

              <div className='mt-4 space-y-4'>
                <TabsContent value='provider' className='space-y-4'>
                  <Card className='border-blue-200 bg-blue-50'>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h3 className='font-semibold text-blue-900'>
                            Provider Dashboard Features
                          </h3>
                          <p className='text-sm text-blue-700'>
                            Service management, order tracking, earnings
                            analytics, real-time updates
                          </p>
                        </div>
                        <Badge className='bg-blue-600'>
                          Digital Marketing Services
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value='client' className='space-y-4'>
                  <Card className='border-green-200 bg-green-50'>
                    <CardContent className='p-4'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <h3 className='font-semibold text-green-900'>
                            Client Dashboard Features
                          </h3>
                          <p className='text-sm text-green-700'>
                            Project management, service booking, progress
                            tracking, communication
                          </p>
                        </div>
                        <Badge className='bg-green-600'>
                          Project Management
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Dashboard Content */}
        <div className='bg-white rounded-lg shadow-sm border'>
          {selectedRole === 'provider' ? (
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    Provider Dashboard
                  </h2>
                  <p className='text-gray-600'>
                    Logged in as: {mockProviderUser.full_name}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='outline' className='bg-blue-50 text-blue-700'>
                    Provider Role
                  </Badge>
                  <Badge className='bg-green-500'>Real-time Data</Badge>
                </div>
              </div>

              {/* Provider Dashboard Component */}
              <RealTimeProviderDashboard providerId={mockProviderUser.id} />
            </div>
          ) : (
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <div>
                  <h2 className='text-2xl font-bold text-gray-900'>
                    Client Dashboard
                  </h2>
                  <p className='text-gray-600'>
                    Logged in as: {mockClientUser.full_name}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge
                    variant='outline'
                    className='bg-green-50 text-green-700'
                  >
                    Client Role
                  </Badge>
                  <Badge className='bg-green-500'>Real-time Data</Badge>
                </div>
              </div>

              {/* Client Dashboard Component */}
              <RealTimeClientDashboard clientId={mockClientUser.id} />
            </div>
          )}
        </div>

        {/* Demo Information */}
        <Card className='mt-6 border-yellow-200 bg-yellow-50'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 mb-2'>
              <Eye className='h-4 w-4 text-yellow-600' />
              <h3 className='font-semibold text-yellow-900'>
                Demo Mode Information
              </h3>
            </div>
            <div className='text-sm text-yellow-800 space-y-2'>
              <p>
                <strong>What you're seeing:</strong> Real dashboard components
                with mock data
              </p>
              <p>
                <strong>Features shown:</strong> All dashboard functionality,
                real-time updates, interactive elements
              </p>
              <p>
                <strong>Data source:</strong> Mock data that demonstrates the
                full system capabilities
              </p>
              <p>
                <strong>Navigation:</strong> Use the tabs above to switch
                between Provider and Client views
              </p>
            </div>

            <div className='mt-4 flex flex-wrap gap-2'>
              <Button
                size='sm'
                variant='outline'
                onClick={() => window.open('/en/working-login', '_blank')}
              >
                🔑 Try Real Login
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => window.open('/en/fix-auth', '_blank')}
              >
                🔧 Fix Authentication
              </Button>
              <Button
                size='sm'
                variant='outline'
                onClick={() => window.open('/en/marketplace', '_blank')}
              >
                🏪 View Marketplace
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
