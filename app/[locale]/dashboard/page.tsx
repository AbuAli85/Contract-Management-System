'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AuthGuard } from '@/components/auth/auth-guard';
import {
  User,
  FileText,
  Users,
  TrendingUp,
  LogOut,
  Settings,
  Bell,
} from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  last_name?: string;
}

function DashboardContent() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // LIMITED CLEANUP - Only clear demo/development data, preserve Supabase sessions
    const limitedCleanup = () => {
      try {
        // Clear only demo session data
        localStorage.removeItem('demo-user-session');
        localStorage.removeItem('user-role');
        localStorage.removeItem('auth-mode');

        // Clear other auth-related data but NOT Supabase session data
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user-session');
        localStorage.removeItem('admin-session');

        // Don't clear sessionStorage as it may contain Supabase session data

        console.log('🧹 Limited cleanup of demo auth data completed');
      } catch (error) {
        console.warn('Could not perform limited cleanup:', error);
      }
    };

    // Perform limited cleanup first
    limitedCleanup();

    // Check for admin session without clearing Supabase data
    const checkForAdminSession = () => {
      try {
        const hasAdminSession =
          localStorage.getItem('demo-user-session') ||
          sessionStorage.getItem('admin-session');

        if (hasAdminSession) {
          console.warn('🚫 Admin session detected - forcing redirect to login');
          router.push('/en/auth/login');
          return;
        }
      } catch (error) {
        console.warn('Could not check for admin session:', error);
      }
    };

    checkForAdminSession();

    // Get user info from AuthGuard context
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated && data.user) {
            // If this is admin@contractmanagement.com, force redirect
            if (data.user.email === 'admin@contractmanagement.com') {
              console.warn('🚫 Blocked admin@contractmanagement.com access');
              router.push('/en/auth/login');
              return;
            }
            setUser(data.user);
          }
        }
      } catch (error) {
        console.error('Error getting user info:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/en/auth/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <p className='mt-4 text-gray-600'>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      {/* Header */}
      <header className='bg-white shadow-sm border-b'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-16'>
            <div className='flex items-center'>
              <h1 className='text-xl font-semibold text-gray-900'>
                Contract Management System
              </h1>
            </div>
            <div className='flex items-center space-x-4'>
              <Button variant='ghost' size='sm'>
                <Bell className='h-5 w-5' />
              </Button>
              <Button variant='ghost' size='sm'>
                <Settings className='h-5 w-5' />
              </Button>
              <Button variant='ghost' size='sm' onClick={handleLogout}>
                <LogOut className='h-5 w-5' />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Welcome Section */}
        <div className='mb-8'>
          <h2 className='text-2xl font-bold text-gray-900'>
            Welcome back, {user.full_name || user.email}!
          </h2>
          <p className='text-gray-600'>
            Here's what's happening with your contracts today.
          </p>
          <div className='mt-2'>
            <Badge variant='secondary' className='text-sm'>
              Role: {user.role}
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Total Contracts
              </CardTitle>
              <FileText className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>24</div>
              <p className='text-xs text-muted-foreground'>
                +2 from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Active Promoters
              </CardTitle>
              <Users className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>12</div>
              <p className='text-xs text-muted-foreground'>+1 from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Revenue</CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>$45,231</div>
              <p className='text-xs text-muted-foreground'>
                +20.1% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-bold'>
                Pending Approvals
              </CardTitle>
              <User className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>3</div>
              <p className='text-xs text-muted-foreground'>
                Requires attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <FileText className='h-5 w-5 mr-2' />
                Create Contract
              </CardTitle>
              <CardDescription>
                Start a new contract from scratch or use a template
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full' asChild>
                <Link href='/en/contracts/new'>Create New</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <Users className='h-5 w-5 mr-2' />
                Manage Promoters
              </CardTitle>
              <CardDescription>
                View and manage promoter profiles and performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full' asChild>
                <Link href='/en/promoters'>View Promoters</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <CardHeader>
              <CardTitle className='flex items-center'>
                <TrendingUp className='h-5 w-5 mr-2' />
                View Analytics
              </CardTitle>
              <CardDescription>
                Check performance metrics and reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className='w-full' asChild>
                <Link href='/en/analytics'>View Reports</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard requireAuth={true}>
      <DashboardContent />
    </AuthGuard>
  );
}
