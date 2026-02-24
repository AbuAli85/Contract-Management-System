'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Settings,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  AlertCircle,
} from 'lucide-react';
import { NotificationsCenter } from '@/components/notifications/notifications-center';
import { NotificationSettings } from '@/components/notifications/notification-settings';
import { useNotifications } from '@/hooks/use-notifications-enhanced';

export default function NotificationsPage() {
  const { summary, loading, error, unreadCount, hasUnread, hasHighPriority } =
    useNotifications();

  const [activeTab, setActiveTab] = useState('center');

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Notifications</h1>
          <p className='text-muted-foreground'>
            Manage your notifications and stay updated with important events
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {hasUnread && (
            <Badge variant='destructive' className='text-sm'>
              {unreadCount} Unread
            </Badge>
          )}
          {hasHighPriority && (
            <Badge variant='outline' className='text-sm'>
              <AlertTriangle className='h-3 w-3 mr-1' />
              High Priority
            </Badge>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className='border-destructive'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-2 text-destructive'>
              <AlertCircle className='h-4 w-4' />
              <span className='text-sm'>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards Skeleton */}
      {loading && !summary && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardHeader className='pb-2'>
                <Skeleton className='h-4 w-20' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-8 w-12 mb-1' />
                <Skeleton className='h-3 w-24' />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Total</CardTitle>
              <Bell className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{summary.total}</div>
              <p className='text-xs text-muted-foreground'>All notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>Unread</CardTitle>
              <Clock className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-orange-600'>
                {summary.unread}
              </div>
              <p className='text-xs text-muted-foreground'>Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                High Priority
              </CardTitle>
              <AlertTriangle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-red-600'>
                {summary.high}
              </div>
              <p className='text-xs text-muted-foreground'>Urgent items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Medium Priority
              </CardTitle>
              <TrendingUp className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-yellow-600'>
                {summary.medium}
              </div>
              <p className='text-xs text-muted-foreground'>Important items</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Low Priority
              </CardTitle>
              <CheckCircle className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold text-blue-600'>
                {summary.low}
              </div>
              <p className='text-xs text-muted-foreground'>General updates</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Category Breakdown */}
      {summary && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <BarChart3 className='h-5 w-5' />
              Notifications by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-5 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {summary.categories.contract}
                </div>
                <div className='text-sm text-muted-foreground'>Contracts</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {summary.categories.promoter}
                </div>
                <div className='text-sm text-muted-foreground'>Promoters</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-purple-600'>
                  {summary.categories.document}
                </div>
                <div className='text-sm text-muted-foreground'>Documents</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-600'>
                  {summary.categories.system}
                </div>
                <div className='text-sm text-muted-foreground'>System</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-orange-600'>
                  {summary.categories.reminder}
                </div>
                <div className='text-sm text-muted-foreground'>Reminders</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className='space-y-4'
      >
        <TabsList>
          <TabsTrigger value='center' className='flex items-center gap-2'>
            <Bell className='h-4 w-4' />
            Notification Center
            {unreadCount > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='settings' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value='center' className='space-y-4'>
          <NotificationsCenter
            maxHeight='800px'
            showFilters={true}
            compact={false}
          />
        </TabsContent>

        <TabsContent value='settings' className='space-y-4'>
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
