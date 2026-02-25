'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  Check,
  Trash2,
  Settings,
  Filter,
  Search,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  FileText,
  Calendar,
  Clock,
  User,
  MoreHorizontal,
  Mail,
  Smartphone,
  Volume2,
  Eye,
  Star,
  Archive,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

import { SimpleNotificationService } from '@/lib/advanced/simple-notification-service';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message';
  title: string;
  message: string;
  is_read: boolean;
  is_starred: boolean;
  is_archived: boolean;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category:
    | 'system'
    | 'contract'
    | 'document'
    | 'project'
    | 'reminder'
    | 'announcement';
  action_url?: string;
  sender?: string;
  metadata: Record<string, any>;
  created_at: string;
  read_at?: string;
}

interface NotificationSettings {
  email_notifications: boolean;
  push_notifications: boolean;
  sound_notifications: boolean;
  notification_frequency: 'immediate' | 'hourly' | 'daily';
  categories: {
    system: boolean;
    contract: boolean;
    document: boolean;
    project: boolean;
    reminder: boolean;
    announcement: boolean;
  };
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    push_notifications: true,
    sound_notifications: false,
    notification_frequency: 'immediate',
    categories: {
      system: true,
      contract: true,
      document: true,
      project: true,
      reminder: true,
      announcement: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>(
    []
  );

  const notificationService = new SimpleNotificationService();

  useEffect(() => {
    loadNotifications();
  }, [selectedFilter]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFilter === 'unread') params.set('unread_only', 'true');
      const response = await fetch(`/api/notifications?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      setNotifications(data.notifications ?? []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return CheckCircle;
      case 'warning':
        return AlertTriangle;
      case 'error':
        return AlertCircle;
      case 'message':
        return MessageSquare;
      case 'info':
      default:
        return Info;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'message':
        return 'text-blue-600 bg-blue-100';
      case 'info':
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const markAsRead = async (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.map(notification =>
        notificationIds.includes(notification.id)
          ? {
              ...notification,
              is_read: true,
              read_at: new Date().toISOString(),
            }
          : notification
      )
    );
  };

  const markAsUnread = async (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, is_read: false, read_at: undefined }
          : notification
      )
    );
  };

  const toggleStar = async (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, is_starred: !notification.is_starred }
          : notification
      )
    );
  };

  const deleteNotifications = async (notificationIds: string[]) => {
    setNotifications(prev => prev.filter(n => !notificationIds.includes(n.id)));
    setSelectedNotifications([]);
  };

  const archiveNotifications = async (notificationIds: string[]) => {
    setNotifications(prev =>
      prev.map(notification =>
        notificationIds.includes(notification.id)
          ? { ...notification, is_archived: true }
          : notification
      )
    );
    setSelectedNotifications([]);
  };

  const filteredNotifications = notifications.filter(notification => {
    if (notification.is_archived && selectedFilter !== 'archived') return false;

    const matchesFilter =
      selectedFilter === 'all' ||
      (selectedFilter === 'unread' && !notification.is_read) ||
      (selectedFilter === 'starred' && notification.is_starred) ||
      (selectedFilter === 'archived' && notification.is_archived) ||
      selectedFilter === notification.category ||
      selectedFilter === notification.type;

    const matchesSearch =
      notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.sender?.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const unreadCount = notifications.filter(
    n => !n.is_read && !n.is_archived
  ).length;

  if (loading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4' />
          <p className='text-muted-foreground text-lg'>
            Loading notifications...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div className='flex items-center gap-3'>
          <div className='relative'>
            <Bell className='h-8 w-8 text-primary' />
            {unreadCount > 0 && (
              <div className='absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center'>
                <span className='text-xs text-white font-medium'>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              </div>
            )}
          </div>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              Notification Center
            </h1>
            <p className='text-muted-foreground'>
              Stay updated with all your important notifications
            </p>
          </div>
        </div>

        <div className='flex items-center gap-3'>
          <Input
            placeholder='Search notifications...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='w-64'
          />

          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className='w-48'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Notifications</SelectItem>
              <SelectItem value='unread'>Unread ({unreadCount})</SelectItem>
              <SelectItem value='starred'>Starred</SelectItem>
              <SelectItem value='archived'>Archived</SelectItem>
              <SelectItem value='system'>System</SelectItem>
              <SelectItem value='contract'>Contracts</SelectItem>
              <SelectItem value='document'>Documents</SelectItem>
              <SelectItem value='project'>Projects</SelectItem>
              <SelectItem value='reminder'>Reminders</SelectItem>
              <SelectItem value='announcement'>Announcements</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedNotifications.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className='flex items-center gap-3 p-4 bg-blue-50 rounded-lg'
        >
          <span className='text-sm font-medium'>
            {selectedNotifications.length} notification
            {selectedNotifications.length > 1 ? 's' : ''} selected
          </span>

          <div className='flex items-center gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => markAsRead(selectedNotifications)}
            >
              <Check className='h-4 w-4 mr-2' />
              Mark as Read
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => archiveNotifications(selectedNotifications)}
            >
              <Archive className='h-4 w-4 mr-2' />
              Archive
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => deleteNotifications(selectedNotifications)}
              className='text-red-600 hover:text-red-700'
            >
              <Trash2 className='h-4 w-4 mr-2' />
              Delete
            </Button>

            <Button
              variant='outline'
              size='sm'
              onClick={() => setSelectedNotifications([])}
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Content */}
      <Tabs defaultValue='notifications' className='space-y-6'>
        <TabsList>
          <TabsTrigger value='notifications'>
            Notifications
            {unreadCount > 0 && (
              <Badge
                variant='destructive'
                className='ml-2 h-5 w-5 rounded-full p-0 text-xs'
              >
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value='settings'>Settings</TabsTrigger>
        </TabsList>

        <TabsContent value='notifications' className='space-y-6'>
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className='flex items-center justify-center py-12'>
                <div className='text-center'>
                  <BellOff className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                  <h3 className='text-lg font-medium mb-2'>
                    No notifications found
                  </h3>
                  <p className='text-muted-foreground'>
                    {searchQuery
                      ? 'Try adjusting your search query'
                      : "You're all caught up!"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className='space-y-2'>
              <AnimatePresence>
                {filteredNotifications.map(notification => {
                  const Icon = getNotificationIcon(notification.type);
                  const isSelected = selectedNotifications.includes(
                    notification.id
                  );

                  return (
                    <motion.div
                      key={notification.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className={`p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                        !notification.is_read
                          ? 'bg-blue-50 border-blue-200'
                          : ''
                      } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                    >
                      <div className='flex items-start gap-4'>
                        {/* Selection Checkbox */}
                        <input
                          type='checkbox'
                          checked={isSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedNotifications(prev => [
                                ...prev,
                                notification.id,
                              ]);
                            } else {
                              setSelectedNotifications(prev =>
                                prev.filter(id => id !== notification.id)
                              );
                            }
                          }}
                          className='mt-1'
                        />

                        {/* Icon */}
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${getTypeColor(notification.type)}`}
                        >
                          <Icon className='h-5 w-5' />
                        </div>

                        {/* Content */}
                        <div className='flex-1 min-w-0'>
                          <div className='flex items-start justify-between gap-2 mb-2'>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <h3
                                className={`font-medium ${!notification.is_read ? 'font-semibold' : ''}`}
                              >
                                {notification.title}
                              </h3>
                              <Badge
                                className={getPriorityColor(
                                  notification.priority
                                )}
                              >
                                {notification.priority}
                              </Badge>
                              <Badge variant='outline' className='text-xs'>
                                {notification.category}
                              </Badge>
                            </div>

                            <div className='flex items-center gap-1 flex-shrink-0'>
                              <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => toggleStar(notification.id)}
                                className={
                                  notification.is_starred
                                    ? 'text-yellow-500'
                                    : ''
                                }
                              >
                                <Star
                                  className={`h-4 w-4 ${notification.is_starred ? 'fill-current' : ''}`}
                                />
                              </Button>

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant='ghost' size='sm'>
                                    <MoreHorizontal className='h-4 w-4' />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      notification.is_read
                                        ? markAsUnread([notification.id])
                                        : markAsRead([notification.id])
                                    }
                                  >
                                    <Eye className='h-4 w-4 mr-2' />
                                    Mark as{' '}
                                    {notification.is_read ? 'Unread' : 'Read'}
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      archiveNotifications([notification.id])
                                    }
                                  >
                                    <Archive className='h-4 w-4 mr-2' />
                                    Archive
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      deleteNotifications([notification.id])
                                    }
                                    className='text-red-600'
                                  >
                                    <Trash2 className='h-4 w-4 mr-2' />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>

                          <p className='text-sm text-muted-foreground mb-3'>
                            {notification.message}
                          </p>

                          <div className='flex items-center justify-between text-xs text-muted-foreground'>
                            <div className='flex items-center gap-4'>
                              {notification.sender && (
                                <span className='flex items-center gap-1'>
                                  <User className='h-3 w-3' />
                                  {notification.sender}
                                </span>
                              )}
                              <span className='flex items-center gap-1'>
                                <Clock className='h-3 w-3' />
                                {new Date(
                                  notification.created_at
                                ).toLocaleString()}
                              </span>
                            </div>

                            {notification.action_url && (
                              <Button variant='outline' size='sm'>
                                View Details
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </TabsContent>

        <TabsContent value='settings' className='space-y-6'>
          <div className='grid gap-6'>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Customize how you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className='space-y-4'>
                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <label className='text-sm font-medium'>
                        Email Notifications
                      </label>
                      <p className='text-xs text-muted-foreground'>
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.email_notifications}
                      onCheckedChange={checked =>
                        setSettings(prev => ({
                          ...prev,
                          email_notifications: checked,
                        }))
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <label className='text-sm font-medium'>
                        Push Notifications
                      </label>
                      <p className='text-xs text-muted-foreground'>
                        Receive browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.push_notifications}
                      onCheckedChange={checked =>
                        setSettings(prev => ({
                          ...prev,
                          push_notifications: checked,
                        }))
                      }
                    />
                  </div>

                  <div className='flex items-center justify-between'>
                    <div className='space-y-0.5'>
                      <label className='text-sm font-medium'>
                        Sound Notifications
                      </label>
                      <p className='text-xs text-muted-foreground'>
                        Play sound for notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.sound_notifications}
                      onCheckedChange={checked =>
                        setSettings(prev => ({
                          ...prev,
                          sound_notifications: checked,
                        }))
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className='space-y-3'>
                  <label className='text-sm font-medium'>
                    Notification Frequency
                  </label>
                  <Select
                    value={settings.notification_frequency}
                    onValueChange={(value: 'immediate' | 'hourly' | 'daily') =>
                      setSettings(prev => ({
                        ...prev,
                        notification_frequency: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='immediate'>Immediate</SelectItem>
                      <SelectItem value='hourly'>Hourly Summary</SelectItem>
                      <SelectItem value='daily'>Daily Summary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Preferences</CardTitle>
                <CardDescription>
                  Choose which types of notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  {Object.entries(settings.categories).map(
                    ([category, enabled]) => (
                      <div
                        key={category}
                        className='flex items-center justify-between'
                      >
                        <div className='space-y-0.5'>
                          <label className='text-sm font-medium capitalize'>
                            {category} Notifications
                          </label>
                          <p className='text-xs text-muted-foreground'>
                            Receive notifications for {category}-related
                            activities
                          </p>
                        </div>
                        <Switch
                          checked={enabled}
                          onCheckedChange={checked =>
                            setSettings(prev => ({
                              ...prev,
                              categories: {
                                ...prev.categories,
                                [category]: checked,
                              },
                            }))
                          }
                        />
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
