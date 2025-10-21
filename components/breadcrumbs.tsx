'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbsProps {
  className?: string;
  locale?: string;
}

export function Breadcrumbs({ className, locale = 'en' }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Parse the pathname to get breadcrumb segments
  const segments = pathname
    ?.split('/')
    .filter((segment) => segment && segment !== locale) || [];

  // If we're on the home page or dashboard, don't show breadcrumbs
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return null;
  }

  // Map segment names to human-readable titles
  const segmentTitles: Record<string, string> = {
    dashboard: 'Dashboard',
    promoters: 'Promoters Intelligence Hub',
    'manage-promoters': 'Promoters List',
    contracts: 'Contracts',
    'generate-contract': 'Generate Contract',
    general: 'General Contracts',
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    'manage-parties': 'Manage Parties',
    profile: 'Profile',
    settings: 'Settings',
    help: 'Help',
    users: 'Users',
    roles: 'Roles',
    analytics: 'Analytics',
    reports: 'Reports',
    audit: 'Audit Logs',
    notifications: 'Notifications',
    crm: 'CRM',
    new: 'New',
    edit: 'Edit',
  };

  // Build breadcrumb items
  const breadcrumbs = segments.map((segment, index) => {
    const href = `/${locale}/${segments.slice(0, index + 1).join('/')}`;
    const title = segmentTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return {
      href,
      title,
      isLast,
    };
  });

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}
    >
      {/* Home link */}
      <Link
        href={`/${locale}/dashboard`}
        className="flex items-center hover:text-foreground transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.href}>
          <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
          {breadcrumb.isLast ? (
            <span className="font-medium text-foreground truncate" aria-current="page">
              {breadcrumb.title}
            </span>
          ) : (
            <Link
              href={breadcrumb.href}
              className="hover:text-foreground transition-colors truncate"
            >
              {breadcrumb.title}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

