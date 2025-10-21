'use client';

import React, { useMemo } from 'react';
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

// Helper function to check if a string is a UUID (defined outside component to prevent recreating)
function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

// Map segment names to human-readable titles (defined outside to prevent recreating)
const SEGMENT_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  promoters: 'Promoters Intelligence Hub',
  'manage-promoters': 'Promoters',
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

export function Breadcrumbs({ className, locale = 'en' }: BreadcrumbsProps) {
  const pathname = usePathname();

  // Memoize segments to prevent re-creating array on every render
  const segments = useMemo(() => {
    return pathname
      ?.split('/')
      .filter((segment) => segment && segment !== locale) || [];
  }, [pathname, locale]);

  // If we're on the home page or dashboard, don't show breadcrumbs
  if (segments.length === 0 || (segments.length === 1 && segments[0] === 'dashboard')) {
    return null;
  }

  // Build breadcrumb items
  const breadcrumbItems = useMemo(() => segments
    .filter((segment): segment is string => !!segment)
    .map((segment, index) => {
      const href = `/${locale}/${segments.slice(0, index + 1).join('/')}`;
      
      // Get title from static map or format the segment
      let title: string;
      if (SEGMENT_TITLES[segment]) {
        title = SEGMENT_TITLES[segment];
      } else if (isUUID(segment)) {
        // Use a consistent shortened format for UUIDs
        const previousSegment = index > 0 ? segments[index - 1] : null;
        if (previousSegment === 'manage-promoters' || previousSegment === 'promoters') {
          title = `Promoter Details`;
        } else if (previousSegment === 'contracts') {
          title = `Contract Details`;
        } else if (previousSegment === 'manage-parties' || previousSegment === 'parties') {
          title = `Party Details`;
        } else {
          title = segment.slice(0, 8);
        }
      } else {
        title = segment.charAt(0).toUpperCase() + segment.slice(1);
      }
      
      const isLast = index === segments.length - 1;

      return {
        href,
        title,
        isLast,
      };
    }), [segments, locale]);

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

