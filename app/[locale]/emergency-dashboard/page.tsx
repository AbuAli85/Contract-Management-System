// Emergency minimal dashboard - completely isolated from auth loops
'use client';

import { useState } from 'react';
import {
  Building2,
  FileText,
  Users,
  BarChart3,
  Bell,
  User,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

// Completely isolated stats component with no external dependencies
function IsolatedStatsOverview() {
  const stats = {
    activeContracts: 8,
    totalSpent: 145000,
    savedAmount: 23000,
    completedProjects: 24,
    averageRating: 4.7,
    pendingPayments: 2,
  };

  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center'>
          <BarChart3 className='w-4 h-4 text-green-600' />
        </div>
        <h2 className='text-xl font-semibold text-slate-900'>
          Client Overview (No API Calls)
        </h2>
      </div>

      <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Active Contracts
              </CardDescription>
              <FileText className='w-8 h-8 text-blue-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.activeContracts}</div>
            <p className='text-xs text-muted-foreground'>Currently running</p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Total Investment
              </CardDescription>
              <BarChart3 className='w-8 h-8 text-green-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              ₹{stats.totalSpent.toLocaleString()}
            </div>
            <p className='text-xs text-muted-foreground'>Lifetime spending</p>
          </CardContent>
        </Card>

        <Card className='border-slate-200/60'>
          <CardHeader className='space-y-0 pb-2'>
            <div className='flex justify-between items-center'>
              <CardDescription className='text-sm font-medium'>
                Completed Projects
              </CardDescription>
              <Users className='w-8 h-8 text-indigo-600' />
            </div>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.completedProjects}</div>
            <p className='text-xs text-muted-foreground'>
              Successfully delivered
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Isolated quick actions with no external state
function IsolatedQuickActions() {
  return (
    <div className='bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8'>
      <div className='flex items-center gap-3 mb-6'>
        <div className='w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center'>
          <Building2 className='w-4 h-4 text-blue-600' />
        </div>
        <h2 className='text-xl font-semibold text-slate-900'>
          Quick Actions (Static)
        </h2>
      </div>

      <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
        <div className='group cursor-pointer'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-blue-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <Plus className='w-8 h-8 text-blue-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>New Contract</h3>
                  <p className='text-sm text-slate-600'>Create new contract</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='group cursor-pointer'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-green-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <FileText className='w-8 h-8 text-green-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>My Contracts</h3>
                  <p className='text-sm text-slate-600'>View all contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='group cursor-pointer'>
          <Card className='hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-purple-300'>
            <CardContent className='p-6'>
              <div className='flex items-center gap-3'>
                <Users className='w-8 h-8 text-purple-600' />
                <div>
                  <h3 className='font-semibold text-slate-900'>
                    Find Promoters
                  </h3>
                  <p className='text-sm text-slate-600'>
                    Browse available talent
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function EmergencyClientDashboard() {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      console.log('✅ Emergency dashboard refreshed - no API calls made');
    }, 1000);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 to-slate-100'>
      <div className='container mx-auto px-4 py-8 max-w-7xl'>
        {/* Header */}
        <div className='flex flex-col gap-6 mb-8'>
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-3'>
              <div className='w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center'>
                <Building2 className='w-5 h-5 text-blue-600' />
              </div>
              <div>
                <h1 className='text-3xl font-bold text-slate-900'>
                  Emergency Client Dashboard
                </h1>
                <p className='text-slate-600'>
                  Temporary isolated dashboard to stop infinite loops
                </p>
              </div>
            </div>

            <div className='flex items-center gap-2 mt-2'>
              <Badge
                variant='secondary'
                className='bg-red-100 text-red-800 border-red-200'
              >
                Emergency Mode
              </Badge>
              <Badge
                variant='outline'
                className='bg-yellow-50 text-yellow-800 border-yellow-200'
              >
                No API Calls
              </Badge>
            </div>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center'>
            <div className='text-sm text-slate-600'>
              Welcome back, Emergency User (No Auth Calls)
            </div>

            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={refreshing}
                className='flex items-center gap-2'
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                />
                {refreshing ? 'Refreshing...' : 'Safe Refresh'}
              </Button>

              <Button size='sm' className='flex items-center gap-2' disabled>
                <Plus className='w-4 h-4' />
                New Contract (Disabled)
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className='space-y-8'>
          {/* Emergency Notice */}
          <div className='bg-red-50 border border-red-200 rounded-2xl p-6'>
            <div className='flex items-center gap-3 mb-3'>
              <div className='w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center'>
                <Bell className='w-4 h-4 text-red-600' />
              </div>
              <h3 className='text-lg font-semibold text-red-900'>
                🚨 Emergency Mode Active
              </h3>
            </div>
            <p className='text-red-800 mb-4'>
              This dashboard is running in emergency mode to stop infinite API
              loops. All authentication and external API calls have been
              disabled.
            </p>
            <div className='text-sm text-red-700'>
              <strong>Next Steps:</strong>
              <br />• Check browser console for any remaining loop errors
              <br />• Verify no network requests are being made repeatedly
              <br />• Once confirmed stable, we can gradually re-enable features
            </div>
          </div>

          {/* Isolated Stats */}
          <IsolatedStatsOverview />

          {/* Isolated Quick Actions */}
          <IsolatedQuickActions />

          {/* Status Message */}
          <div className='bg-green-50 border border-green-200 rounded-2xl p-6'>
            <div className='text-center'>
              <div className='w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4'>
                <Building2 className='w-6 h-6 text-green-600' />
              </div>
              <h3 className='text-lg font-semibold text-green-900 mb-2'>
                ✅ Dashboard Stable
              </h3>
              <p className='text-green-800'>
                If you're seeing this and no infinite requests in the console,
                the loop issue has been isolated.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
