'use client';

// Simple sidebar component
import React from 'react';
import Link from 'next/link';
import {
  FileText,
  Users,
  Target,
  BarChart3,
  Settings,
  Bell,
  Home,
  User,
  Building2,
  FileBarChart,
  UserPlus,
  TrendingUp,
  Briefcase,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SimpleSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SimpleSidebar({ isOpen, onClose }: SimpleSidebarProps) {
  const pathname = usePathname();
  const locale = pathname?.match(/^\/([a-z]{2})\//)?.[1] ?? 'en';
  const navigationItems = [
    {
      label: 'Dashboard',
      href: `/${locale}/dashboard`,
      icon: Home,
      description: 'Overview and metrics',
    },
    {
      label: 'Advanced Dashboard',
      href: `/${locale}/dashboard/advanced`,
      icon: TrendingUp,
      description: 'Professional analytics',
      badge: 'NEW',
    },
    {
      label: 'eXtra Contracts',
      href: `/${locale}/generate-contract`,
      icon: FileText,
      description: 'Employment contracts',
    },
    {
      label: 'General Contracts',
      href: `/${locale}/contracts/general`,
      icon: Users,
      description: 'Business contracts',
      badge: 'NEW',
    },
    {
      label: 'Sharaf DG Deployment',
      href: `/${locale}/contracts/sharaf-dg`,
      icon: Building2,
      description: 'Deployment letters with PDF',
      badge: 'PDF',
    },
    {
      label: 'Contracts',
      href: `/${locale}/contracts`,
      icon: FileText,
      description: 'Manage all contracts',
    },
    {
      label: 'Booking System',
      href: `/${locale}/booking-system`,
      icon: Briefcase,
      description: 'Resource booking & scheduling',
      badge: 'PRO',
    },
    {
      label: 'Tracking Dashboard',
      href: `/${locale}/tracking`,
      icon: Target,
      description: 'Real-time project tracking',
      badge: 'LIVE',
    },
    {
      label: 'Promoters',
      href: `/${locale}/promoters`,
      icon: Users,
      description: 'Manage promoters',
      // Badge removed - should be dynamically populated with real data if needed
    },
    {
      label: 'Companies',
      href: `/${locale}/companies`,
      icon: Building2,
      description: 'Manage companies',
      // Badge removed - should be dynamically populated with real data if needed
    },
    {
      label: 'Analytics',
      href: `/${locale}/analytics`,
      icon: BarChart3,
      description: 'Performance metrics',
    },
    {
      label: 'Reports',
      href: `/${locale}/dashboard/reports`,
      icon: FileBarChart,
      description: 'Generate reports',
    },
    {
      label: 'User Management',
      href: `/${locale}/dashboard/users`,
      icon: UserPlus,
      description: 'Manage users',
    },
    {
      label: 'Notifications',
      href: `/${locale}/notifications`,
      icon: Bell,
      description: 'View notifications',
      // Badge removed - should be dynamically populated with real notification count if needed
    },
    {
      label: 'Profile',
      href: `/${locale}/profile`,
      icon: User,
      description: 'User profile',
    },
    {
      label: 'Settings',
      href: `/${locale}/settings`,
      icon: Settings,
      description: 'System settings',
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 md:hidden'
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed top-0 left-0 h-full w-64 bg-card border-r border-border shadow-lg z-50
        transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 md:shadow-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        {/* Sidebar Header */}
        <div className='p-4 border-b border-border'>
          <div className='flex items-center gap-3'>
            <div className='w-8 h-8 bg-primary rounded-lg flex items-center justify-center'>
              <Briefcase className='w-4 h-4 text-primary-foreground' />
            </div>
            <div>
              <h2 className='font-semibold text-sm'>Contract System</h2>
              <p className='text-xs text-muted-foreground'>Management Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className='flex-1 overflow-y-auto'>
          <nav className='p-2 space-y-1'>
            {navigationItems.map(item => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className='flex items-center gap-3 px-3 py-2 rounded-lg text-sm 
                           hover:bg-accent hover:text-accent-foreground 
                           transition-colors duration-200'
                  onClick={onClose}
                >
                  <Icon className='w-4 h-4 flex-shrink-0' />
                  <div className='flex-1 min-w-0'>
                    <div className='font-medium truncate'>{item.label}</div>
                    <div className='text-xs text-muted-foreground truncate'>
                      {item.description}
                    </div>
                  </div>
                  {item.badge && (
                    <Badge variant='secondary' className='text-xs'>
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className='p-4 border-t border-border'>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Shield className='w-3 h-3' />
            <span>System Online</span>
            <div className='w-2 h-2 bg-green-500 rounded-full'></div>
          </div>
        </div>
      </div>
    </>
  );
}
