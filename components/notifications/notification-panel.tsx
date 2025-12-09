'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Bell,
  X,
  Check,
  CheckCheck,
  Trash2,
  FileText,
  Users,
  Building2,
  AlertCircle,
  Clock,
  Calendar,
  Settings,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

// Notification types
export type NotificationType =
  | 'contract_expiring'
  | 'pending_approval'
  | 'promoter_added'
  | 'document_expiring'
  | 'system_update'
  | 'contract_created'
  | 'party_added'
  | 'error'
  | 'success';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  action_url?: string;
  metadata?: Record<string, any>;
}

interface NotificationPanelProps {
  unreadCount?: number;
}

export function NotificationPanel({
  unreadCount: initialUnreadCount = 0,
}: NotificationPanelProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  // Set up real-time updates with Supabase
  useEffect(() => {
    const supabase = createClient();

    if (!supabase) {
      console.warn('Supabase client not available for real-time notifications');
      return;
    }

    let contractsChannel: ReturnType<typeof supabase.channel> | null = null;
    let promotersChannel: ReturnType<typeof supabase.channel> | null = null;

    try {
      // Subscribe to contracts table changes
      contractsChannel = supabase
        .channel('contracts-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'contracts',
          },
          payload => {
            console.log('📬 Contract change detected:', payload);
            // Refresh notifications when contracts change
            if (open) {
              fetchNotifications();
            }
          }
        )
        .subscribe();

      // Subscribe to promoters table changes
      promotersChannel = supabase
        .channel('promoters-notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'promoters',
          },
          payload => {
            console.log('📬 Promoter change detected:', payload);
            // Refresh notifications when promoters change
            if (open) {
              fetchNotifications();
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.error('Error setting up realtime subscriptions:', error);
    }

    // Cleanup subscriptions
    return () => {
      if (contractsChannel) {
        supabase.removeChannel(contractsChannel);
      }
      if (promotersChannel) {
        supabase.removeChannel(promotersChannel);
      }
    };
  }, [open]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dashboard/notifications');
      if (response.ok) {
        const data = await response.json();

        // Map API notifications to our format
        const mappedNotifications = (data.notifications || []).map(
          (n: any) => ({
            id: n.id,
            type: mapCategoryToType(n.category, n.type),
            title: n.title,
            description: n.message,
            timestamp: n.timestamp,
            read: n.read,
            action_url: n.action?.url,
            metadata: n.metadata,
          })
        );

        setNotifications(mappedNotifications);
        setUnreadCount(data.summary?.unread || 0);
      } else {
        throw new Error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const mapCategoryToType = (
    category: string,
    apiType: string
  ): NotificationType => {
    if (category === 'contract') {
      if (apiType === 'warning' || apiType === 'error')
        return 'contract_expiring';
      return 'contract_created';
    }
    if (category === 'promoter') return 'promoter_added';
    if (category === 'document') return 'document_expiring';
    if (category === 'system') return 'system_update';
    if (category === 'reminder') return 'pending_approval';
    return 'system_update';
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/dashboard/notifications/${notificationId}/read`,
        {
          method: 'PATCH',
        }
      );

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(
        '/api/dashboard/notifications/mark-all-read',
        {
          method: 'PATCH',
        }
      );

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch(
        `/api/dashboard/notifications/${notificationId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        const wasUnread =
          notifications.find(n => n.id === notificationId)?.read === false;
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        if (wasUnread) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const clearAll = async () => {
    try {
      const response = await fetch('/api/dashboard/notifications/clear-all', {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications([]);
        setUnreadCount(0);
        toast({
          title: 'Success',
          description: 'All notifications cleared',
        });
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear notifications',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'contract_expiring':
      case 'contract_created':
        return <FileText className='h-5 w-5 text-blue-500' />;
      case 'pending_approval':
        return <Clock className='h-5 w-5 text-orange-500' />;
      case 'promoter_added':
        return <Users className='h-5 w-5 text-green-500' />;
      case 'document_expiring':
        return <Calendar className='h-5 w-5 text-amber-500' />;
      case 'system_update':
        return <Settings className='h-5 w-5 text-purple-500' />;
      case 'party_added':
        return <Building2 className='h-5 w-5 text-indigo-500' />;
      case 'error':
        return <AlertCircle className='h-5 w-5 text-red-500' />;
      case 'success':
        return <Check className='h-5 w-5 text-green-500' />;
      default:
        return <Bell className='h-5 w-5 text-gray-500' />;
    }
  };

  const getNotificationColor = (type: NotificationType) => {
    switch (type) {
      case 'contract_expiring':
      case 'document_expiring':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800';
      case 'pending_approval':
        return 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800';
      case 'contract_created':
      case 'promoter_added':
      case 'party_added':
      case 'success':
        return 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800';
      case 'system_update':
        return 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800';
      default:
        return 'bg-gray-50 dark:bg-gray-950/20 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='sm' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <Badge
              variant='destructive'
              className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs'
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className='w-full sm:max-w-lg'>
        <SheetHeader>
          <div className='flex items-center justify-between'>
            <SheetTitle className='flex items-center gap-2'>
              <Bell className='h-5 w-5' />
              Notifications
              {unreadCount > 0 && (
                <Badge variant='secondary'>{unreadCount} new</Badge>
              )}
            </SheetTitle>
          </div>
          <SheetDescription>
            Stay updated with important events and changes
          </SheetDescription>
        </SheetHeader>

        {/* Action Buttons */}
        <div className='flex gap-2 mt-4'>
          <Button
            variant='outline'
            size='sm'
            onClick={markAllAsRead}
            disabled={
              loading || notifications.length === 0 || unreadCount === 0
            }
            className='flex-1'
          >
            <CheckCheck className='mr-2 h-4 w-4' />
            Mark All Read
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={clearAll}
            disabled={loading || notifications.length === 0}
            className='flex-1'
          >
            <Trash2 className='mr-2 h-4 w-4' />
            Clear All
          </Button>
        </div>

        <Separator className='my-4' />

        {/* Notifications List */}
        <ScrollArea className='h-[calc(100vh-200px)]'>
          {loading ? (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-primary' />
            </div>
          ) : notifications.length === 0 ? (
            <div className='py-4'>
              <EmptyState
                icon={Bell}
                title="You're all caught up!"
                description="No new notifications right now. We'll let you know when something important happens."
                iconClassName='text-green-500'
              />
            </div>
          ) : (
            <div className='space-y-2'>
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={cn(
                    'relative rounded-lg border p-4 transition-all',
                    getNotificationColor(notification.type),
                    !notification.read && 'ring-2 ring-primary/20',
                    notification.read && 'opacity-75'
                  )}
                >
                  {/* Unread Indicator */}
                  {!notification.read && (
                    <div className='absolute top-2 right-2'>
                      <div className='h-2 w-2 rounded-full bg-primary animate-pulse' />
                    </div>
                  )}

                  <div className='flex gap-3'>
                    {/* Icon */}
                    <div className='flex-shrink-0 mt-1'>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1'>
                          <h4 className='font-semibold text-sm leading-tight mb-1'>
                            {notification.title}
                          </h4>
                          <p className='text-sm text-muted-foreground leading-snug'>
                            {notification.description}
                          </p>
                          <div className='flex items-center gap-2 mt-2'>
                            <Clock className='h-3 w-3 text-muted-foreground' />
                            <span className='text-xs text-muted-foreground'>
                              {formatDistanceToNow(
                                new Date(notification.timestamp),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className='flex gap-2 mt-3'>
                        {notification.action_url && (
                          <Button
                            variant='link'
                            size='sm'
                            className='h-auto p-0 text-xs'
                            asChild
                          >
                            <a href={notification.action_url}>View Details →</a>
                          </Button>
                        )}
                        {!notification.read && (
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-auto p-0 text-xs'
                            onClick={() => markAsRead(notification.id)}
                          >
                            <Check className='mr-1 h-3 w-3' />
                            Mark as read
                          </Button>
                        )}
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-auto p-0 text-xs text-red-500 hover:text-red-600'
                          onClick={() => deleteNotification(notification.id)}
                        >
                          <Trash2 className='mr-1 h-3 w-3' />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
