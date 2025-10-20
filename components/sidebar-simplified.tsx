'use client';

/**
 * Simplified Sidebar Component
 * Uses SimplifiedNavigation for focused Promoter & Contract Management
 */

import React, { useState, useEffect } from 'react';
import { Link } from '@/navigation';
import { useSafeParams, useLocaleFromParams } from '@/hooks/use-safe-params';
import { useAuth } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { SimplifiedNavigation } from '@/components/simplified-navigation';
import { User, Menu, X, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string;
  onSidebarToggle?: () => void;
  isSidebarCollapsed?: boolean;
}

export function SidebarSimplified({
  isOpen,
  onClose,
  locale: propLocale,
  onSidebarToggle,
  isSidebarCollapsed,
}: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const params = useSafeParams();
  const extractedLocale = useLocaleFromParams();
  const locale = propLocale || extractedLocale || 'en';
  const { user, loading, mounted: authMounted, signOut } = useAuth();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !authMounted || loading) {
    return (
      <div
        className={`sidebar-container ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex flex-col items-center justify-center h-full'>
          <div className='animate-pulse text-center'>
            <div className='w-8 h-8 bg-muted rounded-full mx-auto mb-2'></div>
            <div className='w-24 h-4 bg-muted rounded mx-auto'></div>
          </div>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    window.location.href = `/${locale}/auth/login`;
  };

  const userInitials = user?.email
    ? user.email
        .split('@')[0]
        ?.split('.')
        ?.map(n => n?.[0] || '')
        ?.join('')
        ?.toUpperCase()
        ?.slice(0, 2) || 'U'
    : 'U';

  return (
    <aside
      className={`fixed left-0 top-0 z-50 h-full transform bg-card shadow-lg transition-all duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isSidebarCollapsed ? 'w-16' : 'w-64'} md:translate-x-0`}
    >
      <div className='flex h-full flex-col'>
        {/* Header */}
        <div className='flex items-center justify-between border-b px-4 py-4'>
          {!isSidebarCollapsed && (
            <div className='flex items-center space-x-2'>
              <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground'>
                <span className='text-sm font-bold'>CMS</span>
              </div>
              <span className='font-semibold text-lg'>Promoter System</span>
            </div>
          )}
          <Button
            variant='ghost'
            size='icon'
            className='md:hidden'
            onClick={onClose}
          >
            <X className='h-4 w-4' />
          </Button>
          {!isSidebarCollapsed && onSidebarToggle && (
            <Button
              variant='ghost'
              size='icon'
              className='hidden md:flex'
              onClick={onSidebarToggle}
            >
              <ChevronLeft className='h-4 w-4' />
            </Button>
          )}
          {isSidebarCollapsed && onSidebarToggle && (
            <Button
              variant='ghost'
              size='icon'
              className='hidden md:flex'
              onClick={onSidebarToggle}
            >
              <ChevronRight className='h-4 w-4' />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className='flex-1 overflow-y-auto'>
          <SimplifiedNavigation
            isCollapsed={!!isSidebarCollapsed}
            locale={locale}
          />
        </div>

        {/* Footer - User Profile */}
        <div className='border-t p-4'>
          {!isSidebarCollapsed ? (
            <div className='space-y-3'>
              <div className='flex items-center space-x-3'>
                <Avatar className='h-10 w-10'>
                  <AvatarImage
                    src={user?.user_metadata?.avatar_url}
                    alt={user?.email || 'User'}
                  />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
                <div className='flex-1 min-w-0'>
                  <p className='text-sm font-medium truncate'>
                    {user?.user_metadata?.full_name || user?.email || 'User'}
                  </p>
                  <p className='text-xs text-muted-foreground truncate'>
                    {user?.email}
                  </p>
                </div>
              </div>
              <Button
                variant='outline'
                size='sm'
                className='w-full'
                onClick={handleSignOut}
              >
                <LogOut className='mr-2 h-4 w-4' />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className='flex flex-col items-center space-y-2'>
              <Avatar className='h-8 w-8'>
                <AvatarImage
                  src={user?.user_metadata?.avatar_url}
                  alt={user?.email || 'User'}
                />
                <AvatarFallback className='text-xs'>
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <Button
                variant='ghost'
                size='icon'
                onClick={handleSignOut}
                title='Sign Out'
              >
                <LogOut className='h-4 w-4' />
              </Button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

// Export as Sidebar for easy replacement
export { SidebarSimplified as Sidebar };
