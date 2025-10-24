'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from '@/lib/auth-service';
// RBACProvider is now handled in app/providers.tsx
import { ThemeProvider } from '@/components/theme-provider';
import { Sidebar } from '@/components/sidebar-simplified';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { NotificationPanel } from '@/components/notifications/notification-panel';
import { usePathname } from '@/navigation';
import { Button } from '@/components/ui/button';
import {
  FilePlus,
  UserPlus,
  Sun,
  Bell,
  User,
  LogOut,
} from 'lucide-react';
import GlobalSearch from '@/components/global-search';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useTheme } from 'next-themes';
import { useRouter } from 'next/navigation';

// Pages that don't need authentication or sidebar
const PUBLIC_PAGES = [
  // Authentication pages
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/unauthorized',
  '/auth/logout',

  // Registration pages
  '/register/client',
  '/register/provider',
  '/register-new',

  // Promoters pages (for testing without auth)
  '/promoters',
  '/manage-promoters',

  // Admin tools (accessible to logged-in users)
  '/csv-import',
  '/bulk-import',
  '/data-import',

  // Essential system pages
  '/unauthorized',
  '/logout',
];

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
  locale: string;
}

export function AuthenticatedLayout({
  children,
  locale,
}: AuthenticatedLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only check authentication status, don't redirect on every page load
    if (!loading && !user) {
      // Check if on a public page
      const isPublicPage = PUBLIC_PAGES.some(page => pathname?.includes(page));
      
      if (!isPublicPage) {
        // Only redirect to login if not on a public page
        console.log('🔍 AuthenticatedLayout: No user, redirecting to login');
        router.push('/en/auth/login');
      }
      return;
    }

    // Don't redirect authenticated users unless they're on root
    // This allows them to navigate freely to any page
  }, [loading, user, router, pathname]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  // Check if user is authenticated
  if (!mounted || loading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4'></div>
          <p className='text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  // Check if current page is public
  const isPublicPage = PUBLIC_PAGES.some(page => pathname?.includes(page));

  // Check if user is not authenticated
  if (!user && !isPublicPage) {
    console.log('🔍 AuthenticatedLayout: No user, redirecting to login');
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='mb-4'>
            <h2 className='text-2xl font-bold mb-2'>Welcome Back</h2>
            <p className='text-muted-foreground'>
              Please sign in to access your account
            </p>
          </div>
          <div className='space-y-3'>
            <Button asChild className='w-full'>
              <Link href='/auth/login'>Sign In</Link>
            </Button>
            <Button variant='outline' asChild className='w-full'>
              <Link href='/auth/signup'>Create Account</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, always show sidebar and navigation
  if (user) {
    return (
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        <div className='flex h-screen bg-background'>
          {/* Mobile overlay */}
          {!isSidebarCollapsed && (
            <div
              className='fixed inset-0 z-40 bg-black/50 md:hidden'
              onClick={toggleSidebar}
            />
          )}

          {/* Sidebar */}
          <div
            className={`${
              isSidebarCollapsed
                ? 'hidden md:flex md:w-16'
                : 'fixed md:relative z-50 w-64'
            } h-full flex-shrink-0`}
          >
            <Sidebar
              isOpen={!isSidebarCollapsed}
              onClose={toggleSidebar}
              locale={locale}
              onSidebarToggle={toggleSidebar}
              isSidebarCollapsed={isSidebarCollapsed}
            />
          </div>

          {/* Main Content */}
          <div className='flex-1 flex flex-col min-w-0'>
            {/* Header */}
            <header className='border-b bg-card shadow-sm'>
              <div className='flex items-center justify-between px-4 py-3'>
                {/* Left side - Search and Quick Actions */}
                <div className='flex items-center space-x-4 flex-1'>
                  {/* Global Search */}
                  <GlobalSearch />

                  {/* Quick Actions - Only show on non-promoter pages */}
                  {!pathname?.includes('/promoters') && (
                    <div className='hidden md:flex items-center space-x-2'>
                      <Button size='sm' variant='outline' asChild>
                        <Link href='/en/generate-contract'>
                          <FilePlus className='mr-2 h-4 w-4' />
                          New Contract
                        </Link>
                      </Button>
                      <Button size='sm' variant='outline' asChild>
                        <Link href='/manage-promoters/new'>
                          <UserPlus className='mr-2 h-4 w-4' />
                          Add Promoter
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Right side - Theme, Notifications, User */}
                <div className='flex items-center space-x-2'>
                  {/* Theme Toggle */}
                  <Button variant='ghost' size='sm' onClick={toggleTheme}>
                    <Sun className='h-4 w-4' />
                  </Button>

                  {/* Notifications */}
                  <NotificationPanel />

                  {/* User Menu */}
                  <div className='flex items-center space-x-2'>
                    <Button variant='ghost' size='sm' asChild>
                      <Link href='/dashboard/profile'>
                        <User className='h-4 w-4' />
                      </Link>
                    </Button>
                    <Button variant='ghost' size='sm' onClick={handleSignOut}>
                      <LogOut className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              </div>
            </header>

            {/* Breadcrumbs */}
            <div className='border-b bg-background px-6 py-2'>
              <Breadcrumbs locale={locale} />
            </div>

            {/* Page Content */}
            <main className='flex-1 overflow-auto p-6'>{children}</main>
          </div>
        </div>
      </ThemeProvider>
    );
  }

  // Show login prompt if no user and not a public page
  if (!user && !isPublicPage) {
    console.log('🔍 AuthenticatedLayout: No user, showing login prompt');
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='text-center'>
          <h2 className='mb-4 text-2xl font-bold'>Authentication Required</h2>
          <p className='mb-4 text-muted-foreground'>
            Please log in to access the application.
          </p>
          <div className='flex items-center space-x-4'>
            <span className='text-sm text-gray-600'>
              Not signed in? <Link href='/en/auth/login'>Sign In</Link>
            </span>
          </div>
        </div>
      </div>
    );
  }

  // For public pages without user, render without sidebar
  return <>{children}</>;
}
