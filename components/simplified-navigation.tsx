'use client';

/**
 * Simplified Navigation for Promoter & Contract Management System
 * Focus: Promoter Management and Development Letter/Contracts only
 */

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-service';
import { useUserProfile } from '@/hooks/use-user-profile';
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
  UserPlus,
  ChevronRight,
  Upload,
  BarChart3,
  Briefcase,
  Shield,
  Calendar,
  FileText,
  Clock,
  Link as LinkIcon,
  TrendingUp,
  AlertTriangle,
  GitBranch,
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
  const { user } = useAuth();
  const { profile: userProfile } = useUserProfile();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user role
  const userMetadata = (user?.user_metadata || {}) as Record<string, any>;
  const userRole = userProfile?.role || userMetadata?.role || '';
  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const isManager = userRole === 'manager';
  const isEmployer = userRole === 'employer';
  const isPromoter = userRole === 'promoter' || userRole === 'user';

  // Build navigation sections based on user role
  const navigationSections: any[] = [
    {
      title: 'Dashboard',
      titleAr: 'لوحة التحكم',
      roles: ['admin', 'manager', 'employer', 'promoter', 'user'], // Everyone
      items: [
        {
          href: `/${locale}/dashboard`,
          label: 'Dashboard',
          labelAr: 'لوحة التحكم',
          icon: Home,
          roles: ['admin', 'manager', 'employer', 'promoter', 'user'],
        },
      ],
    },
  ];

  // Promoter/Employee specific items
  if (isPromoter) {
    navigationSections.push({
      title: 'My Information',
      titleAr: 'معلوماتي',
      roles: ['promoter', 'user'],
      items: [
        {
          href: `/${locale}/manage-promoters/${user?.id}`,
          label: 'My Profile',
          labelAr: 'ملفي الشخصي',
          icon: User,
          description: 'View and edit your profile',
          roles: ['promoter', 'user'],
        },
        {
          href: `/${locale}/contracts`,
          label: 'My Contracts',
          labelAr: 'عقودي',
          icon: FileText,
          description: 'View your assigned contracts',
          roles: ['promoter', 'user'],
        },
        {
          href: `/${locale}/employee/dashboard`,
          label: 'My Workplace',
          labelAr: 'مكان عملي',
          icon: Briefcase,
          description: 'View tasks, targets, and attendance',
          roles: ['promoter', 'user'],
        },
        {
          href: `/${locale}/attendance`,
          label: 'My Attendance',
          labelAr: 'حضوري',
          icon: Clock,
          description: 'View and manage your attendance records',
          roles: ['promoter', 'user'],
        },
      ],
    });
  }

  // Admin/Manager/Employer only sections
  if (isAdmin || isManager || isEmployer) {
    navigationSections.push(
      {
        title: 'Promoter Management',
        titleAr: 'إدارة المروجين',
        roles: ['admin', 'manager', 'employer'],
        items: [
          {
            href: `/${locale}/promoters`,
            label: 'Promoters',
            labelAr: 'المروجين',
            icon: Users,
            description: 'View, manage, and analyze all promoters',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/manage-promoters/new`,
            label: 'Add Promoter',
            labelAr: 'إضافة مروج',
            icon: UserPlus,
            description: 'Add a new promoter',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/csv-import`,
            label: 'Import CSV',
            labelAr: 'استيراد CSV',
            icon: Upload,
            description: 'Bulk import promoters from CSV file',
            roles: ['admin', 'manager', 'employer'],
          },
        ],
      },
      {
        title: 'Contract Management',
        titleAr: 'إدارة العقود',
        roles: ['admin', 'manager', 'employer'],
        items: [
          {
            href: `/${locale}/generate-contract`,
            label: 'eXtra Contracts',
            labelAr: 'العقود البسيطة',
            icon: FilePlus,
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/contracts/general`,
            label: 'General Contracts',
            labelAr: 'العقود العامة',
            icon: FileEdit,
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/contracts/sharaf-dg`,
            label: 'Sharaf DG Deployment',
            labelAr: 'إلحاق شرف DG',
            icon: Building2,
            description: 'Deployment letters with PDF generation',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/contracts`,
            label: 'All Contracts',
            labelAr: 'جميع العقود',
            icon: FileSearch,
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/contracts/pending`,
            label: 'Pending',
            labelAr: 'معلقة',
            icon: Bell,
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/contracts/approved`,
            label: 'Approved',
            labelAr: 'معتمدة',
            icon: FileCheck,
            roles: ['admin', 'manager', 'employer'],
          },
        ],
      },
      {
        title: 'Parties & Employers',
        titleAr: 'الأطراف وأصحاب العمل',
        roles: ['admin', 'manager', 'employer'],
        items: [
          {
            href: `/${locale}/manage-parties`,
            label: 'Manage Parties',
            labelAr: 'إدارة الأطراف',
            icon: Building2,
            roles: ['admin', 'manager', 'employer'],
          },
        ],
      },
      {
        title: 'Company & Team',
        titleAr: 'الشركة والفريق',
        roles: ['admin', 'manager', 'employer'],
        items: [
          {
            href: `/${locale}/dashboard/companies`,
            label: 'All Companies',
            labelAr: 'جميع الشركات',
            icon: BarChart3,
            description: 'Cross-company dashboard',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/employer/team`,
            label: 'Team Management',
            labelAr: 'إدارة الفريق',
            icon: Users,
            description: 'Manage employees, attendance, tasks',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/settings/company`,
            label: 'Company Settings',
            labelAr: 'إعدادات الشركة',
            icon: Settings,
            description: 'Logo, policies, branding',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/settings/company/members`,
            label: 'Company Members',
            labelAr: 'أعضاء الشركة',
            icon: Shield,
            description: 'Manage admins and access',
            roles: ['admin', 'manager', 'employer'],
          },
        ],
      },
      {
        title: 'HR Management',
        titleAr: 'إدارة الموارد البشرية',
        roles: ['admin', 'manager', 'employer'],
        items: [
          {
            href: `/${locale}/employer/attendance-approval`,
            label: 'Attendance Approval',
            labelAr: 'الموافقة على الحضور',
            icon: Clock,
            description: 'Review and approve employee attendance',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/employer/attendance-links`,
            label: 'Attendance Links',
            labelAr: 'روابط الحضور',
            icon: LinkIcon,
            description: 'Create location-restricted check-in links',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/employer/attendance-schedules`,
            label: 'Automated Schedules',
            labelAr: 'الجدولات التلقائية',
            icon: Calendar,
            description: 'Automated daily attendance link generation',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/employer/attendance-groups`,
            label: 'Employee Groups',
            labelAr: 'مجموعات الموظفين',
            icon: Users,
            description: 'Organize employees by location or department',
            roles: ['admin', 'manager', 'employer'],
          },
        ],
      },
      {
        title: 'Analytics & Compliance',
        titleAr: 'التحليلات والامتثال',
        roles: ['admin', 'manager', 'employer'],
        items: [
          {
            href: `/${locale}/dashboard/kpi`,
            label: 'KPI Dashboard',
            labelAr: 'لوحة مؤشرات الأداء',
            icon: TrendingUp,
            description: 'Key performance indicators and metrics',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/dashboard/compliance`,
            label: 'Compliance Alerts',
            labelAr: 'تنبيهات الامتثال',
            icon: AlertTriangle,
            description: 'Monitor and resolve compliance issues',
            roles: ['admin', 'manager', 'employer'],
          },
          {
            href: `/${locale}/workflow`,
            label: 'Workflow Manager',
            labelAr: 'مدير سير العمل',
            icon: GitBranch,
            description: 'View and manage workflow instances',
            roles: ['admin', 'manager'],
          },
        ],
      }
    );
  }

  // Settings section - everyone can see
  navigationSections.push({
    title: 'Settings',
    titleAr: 'الإعدادات',
    roles: ['admin', 'manager', 'employer', 'promoter', 'user'],
    items: [
      {
        href: `/${locale}/profile`,
        label: 'Profile',
        labelAr: 'الملف الشخصي',
        icon: User,
        roles: ['admin', 'manager', 'employer', 'promoter', 'user'],
      },
      {
        href: `/${locale}/dashboard/settings`,
        label: 'Settings',
        labelAr: 'الإعدادات',
        icon: Settings,
        roles: ['admin', 'manager', 'employer', 'promoter', 'user'],
      },
      {
        href: `/${locale}/help`,
        label: 'Help',
        labelAr: 'المساعدة',
        icon: HelpCircle,
        description: 'Documentation and support',
        roles: ['admin', 'manager', 'employer', 'promoter', 'user'],
      },
    ],
  });

  // Filter sections and items based on user role
  const filteredSections = navigationSections
    .filter(section => {
      if (!section.roles) return true;
      return (
        section.roles.includes(userRole) ||
        (isAdmin && section.roles.includes('admin')) ||
        (isManager && section.roles.includes('manager')) ||
        (isEmployer && section.roles.includes('employer')) ||
        (isPromoter &&
          (section.roles.includes('promoter') ||
            section.roles.includes('user')))
      );
    })
    .map(section => ({
      ...section,
      items: section.items.filter((item: any) => {
        if (!item.roles) return true;
        return (
          item.roles.includes(userRole) ||
          (isAdmin && item.roles.includes('admin')) ||
          (isManager && item.roles.includes('manager')) ||
          (isEmployer && item.roles.includes('employer')) ||
          (isPromoter &&
            (item.roles.includes('promoter') || item.roles.includes('user')))
        );
      }),
    }))
    .filter(section => section.items.length > 0); // Remove empty sections

  if (!mounted) {
    return null;
  }

  const isActive = (href: string) => {
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  return (
    <nav className='space-y-6 px-3 py-4'>
      {filteredSections.map((section, sectionIdx) => (
        <div key={sectionIdx} className='space-y-2'>
          {!isCollapsed && (
            <h3 className='px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              {locale === 'ar' ? section.titleAr : section.title}
            </h3>
          )}
          <div className='space-y-1'>
            {section.items.map((item: any, itemIdx: number) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={itemIdx}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    isCollapsed && 'justify-center px-2',
                    active && 'bg-accent font-semibold text-accent-foreground',
                    !active && 'text-muted-foreground'
                  )}
                  title={
                    isCollapsed
                      ? locale === 'ar'
                        ? item.labelAr
                        : item.label
                      : (item as any).description
                  }
                >
                  <Icon className='h-4 w-4 shrink-0' aria-hidden='true' />
                  {!isCollapsed && (
                    <>
                      <span className='flex-1'>
                        {locale === 'ar' ? item.labelAr : item.label}
                      </span>
                      {active && (
                        <ChevronRight
                          className='h-4 w-4 shrink-0'
                          aria-hidden='true'
                        />
                      )}
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
