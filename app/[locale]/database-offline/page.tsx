'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  WifiOff,
  CheckCircle,
  ArrowRight,
  User,
  Shield,
  Mail,
} from 'lucide-react';

export default function DatabaseOfflinePage() {
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 p-6'>
      <div className='max-w-4xl mx-auto space-y-6'>
        {/* Header */}
        <div className='text-center space-y-4'>
          <Badge className='bg-orange-100 text-orange-800 text-sm px-4 py-2'>
            <WifiOff className='h-4 w-4 mr-2' />
            Database Maintenance Mode
          </Badge>
          <h1 className='text-4xl font-bold text-gray-900'>
            Contract Management System
          </h1>
          <p className='text-xl text-gray-600'>
            Demo Mode Available - Full Features Accessible
          </p>
        </div>

        {/* Status Alert */}
        <Alert className='border-orange-200 bg-orange-50'>
          <Database className='h-4 w-4 text-orange-600' />
          <AlertDescription className='text-orange-800'>
            <strong>Service Notice:</strong> Our database is currently
            experiencing connectivity issues. We've activated demo mode so you
            can explore all features without interruption.
          </AlertDescription>
        </Alert>

        {/* Demo Access Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          {/* Provider Demo */}
          <Card className='border-blue-200 hover:shadow-lg transition-shadow'>
            <CardHeader className='text-center'>
              <User className='h-12 w-12 text-blue-600 mx-auto mb-2' />
              <CardTitle className='text-blue-800'>Provider Demo</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-sm text-gray-600 space-y-2'>
                <p>
                  <strong>Email:</strong> provider@test.com
                </p>
                <p>
                  <strong>Password:</strong> password123
                </p>
              </div>

              <div className='space-y-2'>
                <h4 className='font-semibold text-sm'>Features Available:</h4>
                <ul className='text-xs text-gray-600 space-y-1'>
                  <li>• Service Management Dashboard</li>
                  <li>• Promoter Management System</li>
                  <li>• Booking Management Tools</li>
                  <li>• Financial Analytics</li>
                  <li>• Client Relations Hub</li>
                  <li>• Location Services</li>
                </ul>
              </div>

              <Button className='w-full bg-blue-600 hover:bg-blue-700' asChild>
                <a href='/offline-login?role=provider'>
                  Access Provider Demo
                  <ArrowRight className='h-4 w-4 ml-2' />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Admin Demo */}
          <Card className='border-purple-200 hover:shadow-lg transition-shadow'>
            <CardHeader className='text-center'>
              <Shield className='h-12 w-12 text-purple-600 mx-auto mb-2' />
              <CardTitle className='text-purple-800'>Admin Demo</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-sm text-gray-600 space-y-2'>
                <p>
                  <strong>Email:</strong> admin@test.com
                </p>
                <p>
                  <strong>Password:</strong> admin123
                </p>
              </div>

              <div className='space-y-2'>
                <h4 className='font-semibold text-sm'>Features Available:</h4>
                <ul className='text-xs text-gray-600 space-y-1'>
                  <li>• System Administration</li>
                  <li>• User Management</li>
                  <li>• Security Settings</li>
                  <li>• Analytics Overview</li>
                  <li>• Configuration Tools</li>
                  <li>• Audit Logs</li>
                </ul>
              </div>

              <Button
                className='w-full bg-purple-600 hover:bg-purple-700'
                asChild
              >
                <a href='/offline-login?role=admin'>
                  Access Admin Demo
                  <ArrowRight className='h-4 w-4 ml-2' />
                </a>
              </Button>
            </CardContent>
          </Card>

          {/* Client Demo */}
          <Card className='border-green-200 hover:shadow-lg transition-shadow'>
            <CardHeader className='text-center'>
              <Mail className='h-12 w-12 text-green-600 mx-auto mb-2' />
              <CardTitle className='text-green-800'>Client Demo</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='text-sm text-gray-600 space-y-2'>
                <p>
                  <strong>Email:</strong> client@test.com
                </p>
                <p>
                  <strong>Password:</strong> client123
                </p>
              </div>

              <div className='space-y-2'>
                <h4 className='font-semibold text-sm'>Features Available:</h4>
                <ul className='text-xs text-gray-600 space-y-1'>
                  <li>• Contract Management</li>
                  <li>• Service Booking</li>
                  <li>• Payment History</li>
                  <li>• Communication Hub</li>
                  <li>• Document Center</li>
                  <li>• Support Portal</li>
                </ul>
              </div>

              <Button
                className='w-full bg-green-600 hover:bg-green-700'
                asChild
              >
                <a href='/offline-login?role=client'>
                  Access Client Demo
                  <ArrowRight className='h-4 w-4 ml-2' />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
              <Button variant='outline' asChild>
                <a href='/offline-login'>Demo Login</a>
              </Button>
              <Button variant='outline' asChild>
                <a href='/offline-test'>Test Features</a>
              </Button>
              <Button variant='outline' asChild>
                <a href='/database-health'>Check Status</a>
              </Button>
              <Button variant='outline' asChild>
                <a href='/auth-fix'>Troubleshoot</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Status Information */}
        <Card className='border-gray-200'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <CheckCircle className='h-5 w-5 text-green-600' />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <h4 className='font-semibold'>✅ Working Features</h4>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>• User authentication (demo mode)</li>
                  <li>• Role-based access control</li>
                  <li>• Dashboard interfaces</li>
                  <li>• Feature demonstrations</li>
                  <li>• Navigation and UI</li>
                </ul>
              </div>
              <div className='space-y-2'>
                <h4 className='font-semibold'>⚠️ Temporary Limitations</h4>
                <ul className='text-sm text-gray-600 space-y-1'>
                  <li>• Data persistence (demo only)</li>
                  <li>• Real-time synchronization</li>
                  <li>• External integrations</li>
                  <li>• Email notifications</li>
                  <li>• Live database operations</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className='text-center text-sm text-gray-500'>
          <p>
            Demo mode provides full access to application features with sample
            data. All functionality is preserved while database connectivity is
            restored.
          </p>
        </div>
      </div>
    </div>
  );
}
