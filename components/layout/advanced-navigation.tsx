'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FileText,
  Users,
  BarChart3,
  Calendar,
  Package,
  Bell,
  Settings,
  Shield,
  Briefcase,
  FolderOpen,
  TrendingUp,
  Activity,
  Bookmark,
  Search,
  HelpCircle,
  Zap,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ElementType;
  description?: string;
  badge?: string;
  isNew?: boolean;
  subItems?: NavigationItem[];
}

interface AdvancedNavigationProps {
  className?: string;
  onItemClick?: () => void;
}

const navigationItems: NavigationItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and analytics',
  },
  {
    name: 'Advanced Dashboard',
    href: '/dashboard/advanced',
    icon: TrendingUp,
    description: 'Professional analytics & insights',
    badge: 'NEW',
    isNew: true,
  },
  {
    name: 'Contracts',
    href: '/contracts',
    icon: FileText,
    description: 'Manage all contracts',
    subItems: [
      { name: 'All Contracts', href: '/contracts', icon: FileText },
      {
        name: 'Draft Contracts',
        href: '/contracts?status=draft',
        icon: FileText,
      },
      {
        name: 'Active Contracts',
        href: '/contracts?status=active',
        icon: FileText,
      },
      {
        name: 'Expired Contracts',
        href: '/contracts?status=expired',
        icon: FileText,
      },
    ],
  },
  {
    name: 'Documents',
    href: '/documents',
    icon: FolderOpen,
    description: 'Document management',
    subItems: [
      { name: 'All Documents', href: '/documents', icon: FolderOpen },
      { name: 'Shared Documents', href: '/documents/shared', icon: FolderOpen },
      { name: 'Recent Documents', href: '/documents/recent', icon: FolderOpen },
    ],
  },
  {
    name: 'Booking System',
    href: '/booking',
    icon: Calendar,
    description: 'Resource booking & scheduling',
    badge: 'NEW',
    isNew: true,
    subItems: [
      { name: 'View Calendar', href: '/booking', icon: Calendar },
      { name: 'My Bookings', href: '/booking/my-bookings', icon: Calendar },
      { name: 'Resources', href: '/booking/resources', icon: Calendar },
      { name: 'Booking History', href: '/booking/history', icon: Calendar },
    ],
  },
  {
    name: 'Tracking',
    href: '/tracking',
    icon: Package,
    description: 'Track projects & deliveries',
    badge: 'NEW',
    isNew: true,
    subItems: [
      { name: 'Overview', href: '/tracking', icon: Activity },
      { name: 'Project Tracking', href: '/tracking/projects', icon: Briefcase },
      {
        name: 'Delivery Tracking',
        href: '/tracking/deliveries',
        icon: Package,
      },
      { name: 'Timeline View', href: '/tracking/timeline', icon: Activity },
    ],
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
    description: 'Notification center',
    badge: '3',
    isNew: true,
    subItems: [
      { name: 'All Notifications', href: '/notifications', icon: Bell },
      { name: 'Unread', href: '/notifications?filter=unread', icon: Bell },
      {
        name: 'Starred',
        href: '/notifications?filter=starred',
        icon: Bookmark,
      },
      { name: 'Settings', href: '/notifications/settings', icon: Settings },
    ],
  },
  {
    name: 'Users',
    href: '/users',
    icon: Users,
    description: 'User management',
    subItems: [
      { name: 'All Users', href: '/users', icon: Users },
      { name: 'Roles & Permissions', href: '/users/roles', icon: Shield },
      { name: 'User Activity', href: '/users/activity', icon: Activity },
    ],
  },
  {
    name: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: 'Analytics and reports',
    subItems: [
      { name: 'Contract Reports', href: '/reports/contracts', icon: FileText },
      { name: 'User Reports', href: '/reports/users', icon: Users },
      { name: 'System Reports', href: '/reports/system', icon: BarChart3 },
      { name: 'Custom Reports', href: '/reports/custom', icon: TrendingUp },
    ],
  },
];

const quickActions = [
  { name: 'New Contract', href: '/en/generate-contract', icon: FileText },
  { name: 'Book Resource', href: '/booking/new', icon: Calendar },
  { name: 'Create Project', href: '/tracking/projects/new', icon: Briefcase },
  { name: 'Search', href: '/search', icon: Search },
];

const bottomItems = [
  { name: 'Settings', href: '/settings', icon: Settings },
  { name: 'Help & Support', href: '/help', icon: HelpCircle },
];

export function AdvancedNavigation({
  className,
  onItemClick,
}: AdvancedNavigationProps) {
  const pathname = usePathname();

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard' && pathname === '/') return true;
    if (href === '/dashboard' && pathname === '/dashboard') return true;
    return pathname.startsWith(href) && href !== '/';
  };

  const NavigationLink = ({
    item,
    isSubItem = false,
  }: {
    item: NavigationItem;
    isSubItem?: boolean;
  }) => {
    const isActive = isActiveRoute(item.href);
    const Icon = item.icon;

    return (
      <motion.div
        whileHover={{ x: isSubItem ? 4 : 2 }}
        whileTap={{ scale: 0.95 }}
      >
        <Link
          href={item.href}
          onClick={onItemClick}
          className={cn(
            'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent hover:text-accent-foreground',
            isActive
              ? 'bg-accent text-accent-foreground'
              : 'text-muted-foreground',
            isSubItem && 'ml-6 py-1.5 text-xs',
            className
          )}
        >
          <Icon className={cn('h-4 w-4 shrink-0', isSubItem && 'h-3 w-3')} />
          <span className='truncate'>{item.name}</span>

          {item.badge && (
            <Badge
              variant={item.isNew ? 'default' : 'secondary'}
              className={cn(
                'ml-auto text-xs px-1.5 py-0.5',
                item.isNew && 'bg-blue-500 text-white animate-pulse'
              )}
            >
              {item.badge}
            </Badge>
          )}

          {item.isNew && !item.badge && (
            <div className='ml-auto h-2 w-2 bg-blue-500 rounded-full animate-pulse' />
          )}
        </Link>
      </motion.div>
    );
  };

  return (
    <div className='flex h-full w-64 flex-col bg-background border-r'>
      {/* Header */}
      <div className='flex h-16 items-center border-b px-4'>
        <div className='flex items-center gap-2'>
          <div className='h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center'>
            <Zap className='h-4 w-4 text-white' />
          </div>
          <div>
            <h2 className='text-lg font-semibold'>ContractPro</h2>
            <div className='flex items-center gap-1'>
              <Badge
                variant='default'
                className='text-xs px-1 py-0 bg-blue-500'
              >
                Phase 4
              </Badge>
              <Badge variant='outline' className='text-xs px-1 py-0'>
                Advanced
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Phase 4 Feature Highlight */}
      <div className='p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50'>
        <div className='text-center'>
          <div className='flex items-center justify-center gap-1 mb-2'>
            <Zap className='h-4 w-4 text-blue-600' />
            <span className='text-sm font-semibold text-blue-900'>
              🚀 NEW FEATURES
            </span>
          </div>
          <div className='grid grid-cols-2 gap-1 text-xs'>
            <div className='flex items-center gap-1 text-blue-700'>
              <Calendar className='h-3 w-3' />
              <span>Booking</span>
            </div>
            <div className='flex items-center gap-1 text-blue-700'>
              <Package className='h-3 w-3' />
              <span>Tracking</span>
            </div>
            <div className='flex items-center gap-1 text-blue-700'>
              <Bell className='h-3 w-3' />
              <span>Notifications</span>
            </div>
            <div className='flex items-center gap-1 text-blue-700'>
              <TrendingUp className='h-3 w-3' />
              <span>Analytics</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className='p-4 border-b'>
        <h3 className='text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3'>
          Quick Actions
        </h3>
        <div className='grid grid-cols-2 gap-2'>
          {quickActions.map(action => {
            const Icon = action.icon;
            return (
              <motion.div
                key={action.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link
                  href={action.href}
                  onClick={onItemClick}
                  className='flex flex-col items-center gap-1 p-2 rounded-lg border border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-accent transition-all text-center'
                >
                  <Icon className='h-4 w-4 text-muted-foreground' />
                  <span className='text-xs text-muted-foreground truncate w-full'>
                    {action.name}
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Main Navigation */}
      <div className='flex-1 overflow-y-auto p-4'>
        <nav className='space-y-1'>
          {navigationItems.map(item => (
            <div key={item.name} className='space-y-1'>
              <NavigationLink item={item} />
              {item.subItems && isActiveRoute(item.href) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className='space-y-1'
                >
                  {item.subItems.map(subItem => (
                    <NavigationLink
                      key={subItem.name}
                      item={subItem}
                      isSubItem
                    />
                  ))}
                </motion.div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Section */}
      <div className='border-t p-4'>
        <nav className='space-y-1'>
          {bottomItems.map(item => (
            <NavigationLink key={item.name} item={item} />
          ))}
        </nav>

        {/* System Status */}
        <div className='mt-4 p-2 bg-green-50 rounded-lg border border-green-200'>
          <div className='flex items-center gap-2'>
            <div className='h-2 w-2 bg-green-500 rounded-full animate-pulse' />
            <span className='text-xs text-green-700 font-medium'>
              All Systems Operational
            </span>
          </div>
          <p className='text-xs text-green-600 mt-1'>Phase 4 Features Active</p>
        </div>
      </div>
    </div>
  );
}
