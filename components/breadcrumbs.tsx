'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
    parties: 'Parties',
    approvals: 'Approvals',
    communications: 'Communications',
    contacts: 'Contacts',
  };

  // Build breadcrumb items
  const breadcrumbItems = segments.map((segment, index) => {
    const href = `/${locale}/${segments.slice(0, index + 1).join('/')}`;
    const title = segmentTitles[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    const isLast = index === segments.length - 1;

    return {
      href,
      title,
      isLast,
    };
  });

  // For mobile: Show ellipsis if more than 3 items
  const shouldCollapse = breadcrumbItems.length > 3;
  const visibleItems = shouldCollapse && breadcrumbItems.length >= 2
    ? [breadcrumbItems[0]!, breadcrumbItems[breadcrumbItems.length - 1]!]
    : breadcrumbItems;
  const hiddenItems = shouldCollapse
    ? breadcrumbItems.slice(1, -1)
    : [];

  return (
    <Breadcrumb className={className}>
      <BreadcrumbList>
        {/* Home link */}
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={`/${locale}/dashboard`} aria-label="Dashboard">
              <Home className="h-4 w-4" />
            </Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {!shouldCollapse ? (
          // Show all items on desktop or when few items
          breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {item.isLast ? (
                  <BreadcrumbPage>{item.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.title}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))
        ) : (
          // Show collapsed view on mobile
          <>
            {/* First item */}
            {(() => {
              const firstItem = visibleItems[0];
              if (!firstItem) return null;
              return (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href={firstItem.href}>{firstItem.title}</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                </>
              );
            })()}

            {/* Ellipsis with dropdown for hidden items */}
            {hiddenItems.length > 0 && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1">
                      <BreadcrumbEllipsis className="h-4 w-4" />
                      <span className="sr-only">Toggle menu</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {hiddenItems.map((item) => (
                        <DropdownMenuItem key={item.href}>
                          <Link href={item.href}>{item.title}</Link>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
              </>
            )}

            {/* Last item */}
            {(() => {
              const lastItem = visibleItems[1];
              if (!lastItem) return null;
              return (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{lastItem.title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              );
            })()}
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

