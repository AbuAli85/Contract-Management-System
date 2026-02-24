'use client';
import { useParams } from 'next/navigation';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Calendar,
  FileText,
  Clock,
  UserPlus,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ActionItem {
  id: string;
  type:
    | 'leave_request'
    | 'document_expiry'
    | 'contract_approval'
    | 'task_overdue'
    | 'onboarding';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionUrl: string;
  count?: number;
  createdAt: string;
}

const getActionIcon = (type: ActionItem['type']) => {
  switch (type) {
    case 'leave_request':
      return <Calendar className='h-5 w-5' />;
    case 'document_expiry':
      return <FileText className='h-5 w-5' />;
    case 'contract_approval':
      return <FileText className='h-5 w-5' />;
    case 'task_overdue':
      return <Clock className='h-5 w-5' />;
    case 'onboarding':
      return <UserPlus className='h-5 w-5' />;
    default:
      return <AlertTriangle className='h-5 w-5' />;
  }
};

const getPriorityColor = (priority: ActionItem['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-red-50 border-red-200 text-red-900';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200 text-yellow-900';
    case 'low':
      return 'bg-blue-50 border-blue-200 text-blue-900';
    default:
      return 'bg-gray-50 border-gray-200 text-gray-900';
  }
};

const getPriorityBadgeColor = (priority: ActionItem['priority']) => {
  switch (priority) {
    case 'high':
      return 'bg-red-500 hover:bg-red-600';
    case 'medium':
      return 'bg-yellow-500 hover:bg-yellow-600';
    case 'low':
      return 'bg-blue-500 hover:bg-blue-600';
    default:
      return 'bg-gray-500 hover:bg-gray-600';
  }
};

interface ActionItemsSectionProps {
  locale?: string;
  maxItems?: number;
}

export function ActionItemsSection({
  locale = 'en',
  maxItems = 5,
}: ActionItemsSectionProps) {
  const {
    data: actionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['dashboard-action-items'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/action-items', {
        credentials: 'include',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch action items');
      }
      return response.json();
    },
    refetchInterval: 60000, // Refresh every minute
    staleTime: 30000, // Consider fresh for 30 seconds
  });

  const actionItems: ActionItem[] = actionData?.actionItems || [];
  const displayedItems = actionItems.slice(0, maxItems);

  if (isLoading) {
    return (
      <Card className='border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5 text-amber-600' />
            {locale === 'ar' ? 'الإجراءات المطلوبة' : 'Action Required'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className='h-16 bg-white/50 rounded-lg animate-pulse'
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !actionItems || actionItems.length === 0) {
    return (
      <Card className='border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50'>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle className='h-5 w-5 text-green-600' />
            {locale === 'ar'
              ? 'جميع الإجراءات محدثة'
              : 'All Actions Up to Date'}
          </CardTitle>
          <CardDescription>
            {locale === 'ar'
              ? 'لا توجد إجراءات معلقة تتطلب انتباهك'
              : 'No pending actions require your attention'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className='border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div>
            <CardTitle className='flex items-center gap-2'>
              <AlertTriangle className='h-5 w-5 text-amber-600' />
              {locale === 'ar' ? 'الإجراءات المطلوبة' : 'Action Required'}
            </CardTitle>
            <CardDescription className='mt-1'>
              {actionData?.highPriority > 0 && (
                <span className='text-red-600 font-medium'>
                  {actionData.highPriority}{' '}
                  {locale === 'ar' ? 'عاجل' : 'urgent'}
                  {actionData.highPriority > 1
                    ? locale === 'ar'
                      ? ''
                      : 's'
                    : ''}
                </span>
              )}
              {actionData?.highPriority > 0 &&
                actionItems.length > actionData.highPriority && (
                  <span className='text-gray-500'>
                    {' '}
                    {locale === 'ar' ? 'من' : 'of'} {actionItems.length}{' '}
                    {locale === 'ar' ? 'إجراء' : 'items'}
                  </span>
                )}
            </CardDescription>
          </div>
          {actionItems.length > maxItems && (
            <Badge variant='outline' className='text-xs'>
              +{actionItems.length - maxItems}{' '}
              {locale === 'ar' ? 'أكثر' : 'more'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className='space-y-3'>
          {displayedItems.map(item => (
            <Link key={item.id} href={item.actionUrl} className='block'>
              <div
                className={cn(
                  'p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer',
                  getPriorityColor(item.priority)
                )}
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex items-start gap-3 flex-1'>
                    <div
                      className={cn(
                        'p-2 rounded-lg',
                        item.priority === 'high' && 'bg-red-100 text-red-600',
                        item.priority === 'medium' &&
                          'bg-yellow-100 text-yellow-600',
                        item.priority === 'low' && 'bg-blue-100 text-blue-600'
                      )}
                    >
                      {getActionIcon(item.type)}
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <h4 className='font-semibold text-sm'>{item.title}</h4>
                        {item.count && item.count > 1 && (
                          <Badge
                            className={cn(
                              'text-xs',
                              getPriorityBadgeColor(item.priority)
                            )}
                          >
                            {item.count}
                          </Badge>
                        )}
                      </div>
                      <p className='text-sm opacity-90'>{item.description}</p>
                    </div>
                  </div>
                  <ArrowRight className='h-5 w-5 opacity-50 flex-shrink-0 mt-1' />
                </div>
              </div>
            </Link>
          ))}
        </div>
        {actionItems.length > maxItems && (
          <Button variant='outline' className='w-full mt-4' asChild>
            <Link href={`/${locale}/dashboard/action-items`}>
              {locale === 'ar'
                ? `عرض جميع الإجراءات (${actionItems.length})`
                : `View All Actions (${actionItems.length})`}
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
