'use client';

/**
 * Simplified Dashboard Component
 * Focus: Promoter & Contract Management metrics only
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  FilePlus,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  promoters: {
    total: number;
    active: number;
    inactive: number;
    expiringSoon: number;
  };
  contracts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

interface SimplifiedDashboardProps {
  stats?: DashboardStats;
  locale?: string;
}

export function SimplifiedDashboard({
  stats,
  locale = 'en',
}: SimplifiedDashboardProps) {
  // Default stats if not provided
  const defaultStats: DashboardStats = {
    promoters: {
      total: 0,
      active: 0,
      inactive: 0,
      expiringSoon: 0,
    },
    contracts: {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
    },
  };

  const dashboardStats = stats || defaultStats;

  const promoterCards = [
    {
      title: 'Total Promoters',
      titleAr: 'إجمالي المروجين',
      value: dashboardStats.promoters.total,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: `/${locale}/promoters`,
    },
    {
      title: 'Active Promoters',
      titleAr: 'المروجين النشطين',
      value: dashboardStats.promoters.active,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: `/${locale}/promoters?status=active`,
    },
    {
      title: 'Expiring Soon',
      titleAr: 'تنتهي قريباً',
      value: dashboardStats.promoters.expiringSoon,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: `/${locale}/promoters?expiring=true`,
    },
  ];

  const contractCards = [
    {
      title: 'Total Contracts',
      titleAr: 'إجمالي العقود',
      value: dashboardStats.contracts.total,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: `/${locale}/contracts`,
    },
    {
      title: 'Pending Approval',
      titleAr: 'في انتظار الموافقة',
      value: dashboardStats.contracts.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      href: `/${locale}/contracts/pending`,
    },
    {
      title: 'Approved',
      titleAr: 'معتمدة',
      value: dashboardStats.contracts.approved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: `/${locale}/contracts/approved`,
    },
  ];

  const quickActions = [
    {
      title: 'Generate Contract',
      titleAr: 'إنشاء عقد',
      description: 'Create a new development letter or contract',
      descriptionAr: 'إنشاء خطاب تطوير أو عقد جديد',
      icon: FilePlus,
      href: `/${locale}/generate-contract`,
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Add Promoter',
      titleAr: 'إضافة مروج',
      description: 'Register a new promoter in the system',
      descriptionAr: 'تسجيل مروج جديد في النظام',
      icon: UserPlus,
      href: `/${locale}/manage-promoters`,
      color: 'bg-green-600 hover:bg-green-700',
    },
  ];

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          {locale === 'ar' ? 'لوحة التحكم' : 'Dashboard'}
        </h1>
        <p className='text-muted-foreground mt-1'>
          {locale === 'ar'
            ? 'نظرة عامة على المروجين والعقود'
            : 'Overview of promoters and contracts'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className='grid gap-4 md:grid-cols-2'>
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <Link key={index} href={action.href}>
              <Card className='hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary'>
                <CardContent className='p-6'>
                  <div className='flex items-start space-x-4'>
                    <div
                      className={`${action.color} p-3 rounded-lg text-white`}
                    >
                      <Icon className='h-6 w-6' />
                    </div>
                    <div className='flex-1'>
                      <h3 className='font-semibold text-lg'>
                        {locale === 'ar' ? action.titleAr : action.title}
                      </h3>
                      <p className='text-sm text-muted-foreground mt-1'>
                        {locale === 'ar'
                          ? action.descriptionAr
                          : action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Promoter Statistics */}
      <div>
        <h2 className='text-xl font-semibold mb-4'>
          {locale === 'ar' ? 'إحصائيات المروجين' : 'Promoter Statistics'}
        </h2>
        <div className='grid gap-4 md:grid-cols-3'>
          {promoterCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link key={index} href={card.href}>
                <Card className='hover:shadow-md transition-shadow cursor-pointer'>
                  <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      {locale === 'ar' ? card.titleAr : card.title}
                    </CardTitle>
                    <div className={`${card.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='text-3xl font-bold'>{card.value}</div>
                    <p className='text-xs text-muted-foreground mt-1'>
                      {locale === 'ar' ? 'اضغط للعرض' : 'Click to view'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Contract Statistics */}
      <div>
        <h2 className='text-xl font-semibold mb-4'>
          {locale === 'ar' ? 'إحصائيات العقود' : 'Contract Statistics'}
        </h2>
        <div className='grid gap-4 md:grid-cols-3'>
          {contractCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Link key={index} href={card.href}>
                <Card className='hover:shadow-md transition-shadow cursor-pointer'>
                  <CardHeader className='flex flex-row items-center justify-between pb-2'>
                    <CardTitle className='text-sm font-medium'>
                      {locale === 'ar' ? card.titleAr : card.title}
                    </CardTitle>
                    <div className={`${card.bgColor} p-2 rounded-lg`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='text-3xl font-bold'>{card.value}</div>
                    <p className='text-xs text-muted-foreground mt-1'>
                      {locale === 'ar' ? 'اضغط للعرض' : 'Click to view'}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === 'ar' ? 'حالة النظام' : 'System Status'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center space-x-2'>
            <div className='h-2 w-2 rounded-full bg-green-500 animate-pulse'></div>
            <span className='text-sm text-muted-foreground'>
              {locale === 'ar'
                ? 'النظام يعمل بشكل طبيعي'
                : 'All systems operational'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
