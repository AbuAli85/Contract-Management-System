'use client';

import React, { useState, useEffect } from 'react';
import { Link } from '@/navigation';
import {
  useSafeParams,
  useLocaleFromParams,
  useSafePathname,
} from '@/hooks/use-safe-params';
import { useAuth } from '@/lib/auth-service';
import { usePendingUsersCount } from '@/hooks/use-pending-users';
import { useNotifications } from '@/hooks/use-notifications-enhanced';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRolePermissions } from '@/components/user-role-display';
import { usePermissions } from '@/hooks/use-permissions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  User,
  Bell,
  FilePlus,
  Building2,
  BarChart3,
  Shield,
  Crown,
  UserCheck,
  WifiOff,
  SignalHigh,
  SignalMedium,
  SignalLow,
  BatteryFull,
  BatteryCharging,
  Power,
  PowerOff,
  Volume1,
  VolumeX,
  MicOff,
  VideoOff,
  CameraOff,
  Loader2,
  ImageOff,
  FileEdit,
  FolderOpen,
  FolderPlus,
  FolderMinus,
  FolderX,
  FolderCheck,
  FolderSearch,
  FolderEdit,
  Sun,
  Moon,
  UserPlus,
  Menu,
  Search,
  HelpCircle,
  Settings,
  RefreshCw,
  LogOut,
  ChevronRight,
  ChevronDown,
  Users,
  Briefcase,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { getRoleDisplay } from '@/lib/role-hierarchy';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  locale?: string | undefined;
  onSidebarToggle?: (() => void) | undefined;
  isSidebarCollapsed?: boolean | undefined;
}

function SidebarContent({
  isOpen,
  onClose,
  locale: propLocale,
  onSidebarToggle,
  isSidebarCollapsed,
}: SidebarProps) {
  const [mounted, setMounted] = useState(false);
  const params = useSafeParams();
  const pathname = useSafePathname();
  const extractedLocale = useLocaleFromParams();
  const locale = propLocale || extractedLocale;

  // Auto-expand menus based on current path
  const getInitialExpandedMenus = () => {
    const expanded: Record<string, boolean> = {};
    // Auto-expand "Parties & Employers" if on any party management page
    if (pathname?.includes('/manage-parties')) {
      expanded['Parties & Employers'] = true;
    }
    return expanded;
  };

  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    getInitialExpandedMenus()
  );
  const { user, loading, mounted: authMounted, signOut } = useAuth();
  const { profile: userProfile } = useUserProfile();
  const { roleInfo } = useRolePermissions();
  const { theme, setTheme } = useTheme();
  const { unreadCount: notificationCount } = useNotifications();
  const { count: pendingUsersCount = 0 } = usePendingUsersCount();

  // Toggle expanded menu
  const toggleMenu = (menuTitle: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuTitle]: !prev[menuTitle],
    }));
  };

  // Debug logging for params issue (removed to prevent infinite loops)
  // The params object changes on every render, causing infinite re-renders

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-expand relevant menus when pathname changes
  useEffect(() => {
    if (pathname?.includes('/manage-parties')) {
      setExpandedMenus(prev => ({
        ...prev,
        'Parties & Employers': true,
      }));
    }
  }, [pathname]);

  // Don't render anything until mounted to prevent hydration issues
  if (!mounted) {
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

  // Emergency fallback - if on dashboard pages but no user detected, still show navigation
  const showEmergencyNavigation =
    pathname?.includes('/dashboard') && !user && authMounted && !loading;

  // Safe navigation items with error handling
  const createNavigationItems = () => {
    try {
      const baseItems = [
        {
          title: 'Dashboard',
          href: '/dashboard',
          icon: BarChart3,
          description: 'Overview and analytics',
        },
        {
          title: 'eXtra Contracts',
          href: '/generate-contract',
          icon: FilePlus,
          description: 'Employment contracts',
        },
        {
          title: 'General Contracts',
          href: '/contracts/general',
          icon: FileEdit,
          description: 'Business contracts',
          badge: 'New',
        },
        {
          title: 'Sharaf DG Deployment',
          href: '/contracts/sharaf-dg',
          icon: Building2,
          description: 'Deployment letters with PDF',
          badge: 'PDF',
        },
        {
          title: 'View Contracts',
          href: '/contracts',
          icon: FolderOpen,
          description: 'Browse existing contracts',
          badge: 'Active',
        },
        {
          title: 'Parties & Employers',
          icon: Building2,
          description: 'Manage parties and employers',
          children: [
            {
              title: 'Manage Parties',
              href: '/manage-parties',
              icon: FilePlus,
              description: 'Add or edit parties',
            },
            {
              title: 'Employers',
              href: '/manage-parties/employers',
              icon: Building2,
              description: 'View all employers',
            },
            {
              title: 'Clients',
              href: '/manage-parties/clients',
              icon: Users,
              description: 'View all clients',
            },
            {
              title: 'Generic Parties',
              href: '/manage-parties/generic',
              icon: Briefcase,
              description: 'View generic parties',
            },
          ],
        },
        {
          title: 'Promoters',
          href: '/promoters',
          icon: Users,
          description: 'View and manage all promoters',
        },
        {
          title: 'Promoter Analysis',
          href: '/promoter-analysis',
          icon: FolderSearch,
          description: 'Performance analytics',
        },
        {
          title: 'User Management',
          href: '/dashboard/users',
          icon: UserCheck,
          description: 'Manage system users',
        },
        {
          title: 'User Approvals',
          href: '/dashboard/user-approvals',
          icon: UserPlus,
          description: 'Approve pending users',
        },
        {
          title: 'CRM',
          href: '/crm',
          icon: Building2,
          description: 'Customer relationship management',
        },
        {
          title: 'Analytics',
          href: '/dashboard/analytics',
          icon: FolderEdit,
          description: 'Detailed analytics',
        },
        {
          title: 'Reports',
          href: '/dashboard/reports',
          icon: FolderCheck,
          description: 'Generate reports',
        },
        {
          title: 'Audit Logs',
          href: '/dashboard/audit',
          icon: Shield,
          description: 'System audit trails',
        },
        {
          title: 'Notifications',
          href: '/notifications',
          icon: Bell,
          description: 'View all notifications',
          badge:
            notificationCount > 0 ? notificationCount.toString() : undefined,
          badgeVariant: 'secondary',
        },
        {
          title: 'Profile',
          href: '/profile',
          icon: User,
          description: 'Your profile settings',
        },
        {
          title: 'Settings',
          href: '/dashboard/settings',
          icon: Settings,
          description: 'App configuration',
        },
      ];

      // Add employer team management (for employers, managers, and admins)
      const userMetadata = (user?.user_metadata || {}) as Record<string, any>;
      const userRole = userProfile?.role || userMetadata?.role || '';
      
      // Check if user is admin, manager, or employer (multiple checks for reliability)
      const isAdmin = userRole === 'admin' || 
                      userRole === 'super_admin' || 
                      roleInfo?.canDoAdmin === true ||
                      (roleInfo && typeof roleInfo.canDoAdmin !== 'undefined' && roleInfo.canDoAdmin);
      const isManager = userRole === 'manager';
      const isEmployer = userRole === 'employer' || 
                         userMetadata?.employer_id ||
                         userMetadata?.company_id;
      
      // Always show Team Management for admins, managers, and employers
      // For debugging: uncomment to see why it might not show
      // console.log('Team Management visibility check:', { userRole, isAdmin, isManager, isEmployer, canDoAdmin: roleInfo?.canDoAdmin });
      
      if (isAdmin || isManager || isEmployer) {
        baseItems.splice(
          -2,
          0, // Insert before Settings
          {
            title: 'Team Management',
            href: '/employer/team',
            icon: Users,
            description: 'Manage your team, attendance, tasks, and targets',
            badge: 'New',
          }
        );
      }

      // Add Employee Dashboard for promoters/employees assigned to a team
      const isPromoter = userRole === 'promoter' || userRole === 'user';
      if (isPromoter || isAdmin) {
        baseItems.splice(
          -2,
          0, // Insert before Settings
          {
            title: 'My Workplace',
            href: '/employee/dashboard',
            icon: Briefcase,
            description: 'View your tasks, targets, and attendance',
            badge: undefined,
          }
        );
      }

      // Add admin-only items
      if (roleInfo?.canDoAdmin) {
        baseItems.splice(
          -2,
          0, // Insert before Settings
          {
            title: 'Role Management',
            href: '/dashboard/roles',
            icon: Crown,
            description: 'Manage user roles',
            badge: 'Admin',
          },
          {
            title: 'Advanced Dashboard',
            href: '/dashboard/advanced',
            icon: Power,
            description: 'Advanced features',
            badge: 'Pro',
          }
        );
      }

      return baseItems;
    } catch (error) {
      console.error('Error creating navigation items:', error);
      return [
        {
          title: 'Dashboard',
          href: `/${locale}/dashboard`,
          icon: BarChart3,
          description: 'Overview and analytics',
        },
      ];
    }
  };

  const navigationItems = createNavigationItems();

  const isActiveRoute = (href: string) => {
    try {
      if (!pathname || typeof pathname !== 'string') return false;
      return pathname === href || pathname.startsWith(`${href}/`);
    } catch (error) {
      console.error('Error checking active route:', error);
      return false;
    }
  };

  // Determine what to render based on auth state
  const shouldShowEmergencyNavigation = showEmergencyNavigation;
  const shouldShowLoginPrompt =
    !user && authMounted && !loading && !pathname?.includes('/dashboard');
  const shouldShowLoading = !authMounted || loading;

  // Handle different rendering states
  if (shouldShowLoading) {
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
            <p className='text-sm text-muted-foreground mt-2'>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (shouldShowLoginPrompt) {
    return (
      <div
        className={`fixed left-0 top-0 z-50 h-full w-64 transform bg-card shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className='flex flex-col items-center justify-center h-full'>
          <div className='text-center p-4'>
            <User className='mx-auto mb-4 h-10 w-10 text-muted-foreground' />
            <p className='mb-2 text-lg font-semibold text-card-foreground'>
              Not signed in
            </p>
            <p className='mb-4 text-sm text-muted-foreground'>
              Please log in to access the sidebar features.
            </p>
            <Button asChild variant='default' className='w-full'>
              <Link href={'/auth/login'}>Login</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (shouldShowEmergencyNavigation) {
    return (
      <div
        className={`sidebar-container ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header */}
        <div className='border-b p-4'>
          <div className='flex items-center justify-between'>
            <h2 className='text-lg font-semibold text-card-foreground'>
              Navigation
            </h2>
            <Button variant='ghost' size='sm' onClick={onClose} className='p-1'>
              ×
            </Button>
          </div>
        </div>

        {/* Emergency Navigation */}
        <nav className='flex-1 overflow-y-auto p-4'>
          <div className='space-y-2'>
            <h3 className='mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Quick Access
            </h3>
            {navigationItems.map(item => {
              const IconComponent = item.icon;
              const isActive = item.href ? isActiveRoute(item.href) : false;

              return (
                <Link
                  key={item.title}
                  href={item.href || '#'}
                  onClick={onClose}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  <div className='flex items-center space-x-3'>
                    <IconComponent className='h-4 w-4 shrink-0' />
                    <span className='truncate'>{item.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer with login link */}
        <div className='border-t p-4'>
          <Button asChild variant='outline' className='w-full'>
            <Link href='/auth/login'>Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`h-full ${
        isSidebarCollapsed ? 'w-16' : 'w-64'
      } bg-card shadow-lg transition-all duration-300 ease-in-out`}
    >
      {/* Header */}
      <div className='border-b p-4'>
        <div className='flex items-center justify-between'>
          {!isSidebarCollapsed && (
            <h2 className='text-lg font-semibold text-card-foreground'>Menu</h2>
          )}
          <div className='flex items-center gap-2'>
            <Button
              variant='ghost'
              size='sm'
              onClick={onSidebarToggle}
              className='p-1'
              title={isSidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              <Menu className='h-4 w-4' />
            </Button>
            {!isSidebarCollapsed && (
              <Button
                variant='ghost'
                size='sm'
                onClick={onClose}
                className='p-1 md:hidden'
              >
                ×
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      {user && (
        <div className='border-b p-4'>
          <div className='flex items-center space-x-3'>
            <div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground'>
              {userProfile?.getInitials?.() ||
                user.email?.[0]?.toUpperCase() ||
                'U'}
            </div>
            {!isSidebarCollapsed && (
              <div className='flex-1 min-w-0'>
                <p className='text-sm font-medium text-card-foreground truncate'>
                  {userProfile?.getDisplayName?.() ||
                    userProfile?.full_name ||
                    userProfile?.display_name ||
                    user.email?.split('@')[0] ||
                    'User'}
                </p>
                <div className='flex items-center gap-1'>
                  <Crown className='h-3 w-3 text-yellow-500' />
                  <span className='text-xs text-muted-foreground'>
                    {roleInfo?.displayText || 'User'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className='flex-1 overflow-y-auto p-4'>
        <div className='space-y-2'>
          {!isSidebarCollapsed && (
            <h3 className='mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Main Navigation
            </h3>
          )}

          {Array.isArray(navigationItems) &&
            navigationItems.map(item => {
              const IconComponent = item.icon;
              const hasChildren = item.children && item.children.length > 0;
              const isActive = item.href ? isActiveRoute(item.href) : false;

              // If item has children, render as expandable menu
              if (hasChildren && !isSidebarCollapsed) {
                const isExpanded = expandedMenus[item.title] || false;

                return (
                  <div key={item.title} className='space-y-1'>
                    <button
                      onClick={() => toggleMenu(item.title)}
                      className='group flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
                    >
                      <div className='flex items-center space-x-3'>
                        <IconComponent className='h-4 w-4 shrink-0' />
                        <span className='truncate'>{item.title}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className='h-4 w-4 transition-transform' />
                      ) : (
                        <ChevronRight className='h-4 w-4 transition-transform' />
                      )}
                    </button>

                    {/* Children items */}
                    {isExpanded && (
                      <div className='ml-4 space-y-1 border-l-2 border-muted pl-3'>
                        {(item.children || []).map((child: any) => {
                          const ChildIcon = child.icon;
                          const isChildActive = child.href
                            ? isActiveRoute(child.href)
                            : false;

                          return (
                            <Link
                              key={child.title}
                              href={child.href || '#'}
                              onClick={onClose}
                              className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                                isChildActive
                                  ? 'bg-accent text-accent-foreground font-medium'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              <div className='flex items-center space-x-2'>
                                <ChildIcon className='h-3 w-3 shrink-0' />
                                <span className='truncate text-xs'>
                                  {child.title}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              // Regular menu item without children
              return (
                <Link
                  key={item.title}
                  href={item.href || '#'}
                  onClick={onClose}
                  className={`group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground'
                  }`}
                  title={isSidebarCollapsed ? item.title : undefined}
                >
                  <div className='flex items-center space-x-3'>
                    <IconComponent className='h-4 w-4 shrink-0' />
                    {!isSidebarCollapsed && (
                      <span className='truncate'>{item.title}</span>
                    )}
                  </div>
                  {!isSidebarCollapsed && (
                    <div className='flex items-center space-x-1'>
                      {item.badge && (
                        <Badge
                          variant={
                            (item.badgeVariant as
                              | 'destructive'
                              | 'secondary'
                              | 'default'
                              | 'outline') || 'secondary'
                          }
                          className='text-xs px-1.5 py-0.5'
                        >
                          {item.badge}
                        </Badge>
                      )}
                      <ChevronRight className='h-3 w-3 text-muted-foreground group-hover:text-accent-foreground' />
                    </div>
                  )}
                </Link>
              );
            })}
        </div>

        {/* Admin Section - only show when expanded */}
        {user && !isSidebarCollapsed && (
          <div className='mt-6 space-y-2'>
            <h3 className='mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Admin
            </h3>

            <Link
              href={'/dashboard/users'}
              onClick={onClose}
              className='group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
            >
              <div className='flex items-center space-x-3'>
                <Users className='h-4 w-4 shrink-0' />
                <span>User Management</span>
              </div>
              <ChevronRight className='h-3 w-3 text-muted-foreground group-hover:text-accent-foreground' />
            </Link>

            {pendingUsersCount > 0 && (
              <Link
                href={'/dashboard/users/approvals'}
                onClick={onClose}
                className='group flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground'
              >
                <div className='flex items-center space-x-3'>
                  <User className='h-4 w-4 shrink-0' />
                  <span>Pending Approvals</span>
                </div>
                <div className='flex items-center space-x-1'>
                  <Badge
                    variant='destructive'
                    className='text-xs px-1.5 py-0.5'
                  >
                    {pendingUsersCount}
                  </Badge>
                  <ChevronRight className='h-3 w-3 text-muted-foreground group-hover:text-accent-foreground' />
                </div>
              </Link>
            )}
          </div>
        )}
      </nav>
    </div>
  );
}

export function Sidebar({
  isOpen,
  onClose,
  locale,
  onSidebarToggle,
  isSidebarCollapsed,
}: SidebarProps) {
  return (
    <SidebarContent
      isOpen={isOpen}
      onClose={onClose}
      locale={locale || undefined}
      onSidebarToggle={onSidebarToggle || undefined}
      isSidebarCollapsed={isSidebarCollapsed || undefined}
    />
  );
}
