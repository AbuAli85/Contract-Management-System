'use client';

/**
 * Simplified Navigation for Promoter & Contract Management System
 * Focus: Promoter Management and Development Letter/Contracts only
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from '@/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Home,
  Users,
  FilePlus,
  FileEdit,
  FileSearch,
  Bell,
  FileCheck,
  Building2,
  User,
  Settings,
  HelpCircle,
  UserCog,
  ChevronRight,
} from 'lucide-react';

interface SimplifiedNavigationProps {
  isCollapsed?: boolean;
  locale?: string;
}

export function SimplifiedNavigation({
  isCollapsed = false,
  locale = 'en',
}: SimplifiedNavigationProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Simplified navigation focused on Promoters and Contracts
  const navigationSections = [
    {
      title: 'Dashboard',
      titleAr: 'لوحة التحكم',
      items: [
        {
          href: `/${locale}/dashboard`,
          label: 'Dashboard',
          labelAr: 'لوحة التحكم',
          icon: Home,
        },
      ],
    },
    {
      title: 'Promoter Management',
      titleAr: 'إدارة المروجين',
      items: [
        {
          href: `/${locale}/promoters`,
          label: 'All Promoters',
          labelAr: 'جميع المروجين',
          icon: Users,
        },
        {
          href: `/${locale}/manage-promoters`,
          label: 'Manage Promoters',
          labelAr: 'إدارة المروجين',
          icon: UserCog,
        },
      ],
    },
    {
      title: 'Contract Management',
      titleAr: 'إدارة العقود',
      items: [
        {
          href: `/${locale}/generate-contract`,
          label: 'Simple Contracts',
          labelAr: 'العقود البسيطة',
          icon: FilePlus,
        },
        {
          href: `/${locale}/contracts/general`,
          label: 'General Contracts',
          labelAr: 'العقود العامة',
          icon: FileEdit,
        },
        {
          href: `/${locale}/contracts`,
          label: 'All Contracts',
          labelAr: 'جميع العقود',
          icon: FileSearch,
        },
        {
          href: `/${locale}/contracts/pending`,
          label: 'Pending',
          labelAr: 'معلقة',
          icon: Bell,
        },
        {
          href: `/${locale}/contracts/approved`,
          label: 'Approved',
          labelAr: 'معتمدة',
          icon: FileCheck,
        },
      ],
    },
    {
      title: 'Parties & Employers',
      titleAr: 'الأطراف وأصحاب العمل',
      items: [
        {
          href: `/${locale}/manage-parties`,
          label: 'Manage Parties',
          labelAr: 'إدارة الأطراف',
          icon: Building2,
        },
      ],
    },
    {
      title: 'Settings',
      titleAr: 'الإعدادات',
      items: [
        {
          href: `/${locale}/profile`,
          label: 'Profile',
          labelAr: 'الملف الشخصي',
          icon: User,
        },
        {
          href: `/${locale}/dashboard/settings`,
          label: 'Settings',
          labelAr: 'الإعدادات',
          icon: Settings,
        },
        {
          href: `/${locale}/dashboard/settings`,
          label: 'Help',
          labelAr: 'المساعدة',
          icon: HelpCircle,
        },
      ],
    },
  ];

  if (!mounted) {
    return null;
  }

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(href + '/');
  };

  return (
    <nav className='space-y-6 px-3 py-4'>
      {navigationSections.map((section, sectionIdx) => (
        <div key={sectionIdx} className='space-y-2'>
          {!isCollapsed && (
            <h3 className='px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              {locale === 'ar' ? section.titleAr : section.title}
            </h3>
          )}
          <div className='space-y-1'>
            {section.items.map((item, itemIdx) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link key={itemIdx} href={item.href}>
                  <Button
                    variant={active ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start',
                      isCollapsed && 'justify-center px-2',
                      active && 'bg-accent font-semibold'
                    )}
                    size={isCollapsed ? 'icon' : 'default'}
                  >
                    <Icon className={cn('h-4 w-4', !isCollapsed && 'mr-2')} />
                    {!isCollapsed && (
                      <span>{locale === 'ar' ? item.labelAr : item.label}</span>
                    )}
                    {!isCollapsed && active && (
                      <ChevronRight className='ml-auto h-4 w-4' />
                    )}
                  </Button>
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
