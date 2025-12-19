'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  XCircle,
  Settings,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Notification {
  id: string;
  type: 'check_in_reminder' | 'approval_pending' | 'approval_approved' | 'approval_rejected' | 'anomaly' | 'late_warning';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata?: {
    attendance_id?: string;
    employee_id?: string;
    [key: string]: any;
  };
}

interface NotificationSettings {
  check_in_reminders: boolean;
  approval_notifications: boolean;
  anomaly_alerts: boolean;
  late_warnings: boolean;
  reminder_time: string; // HH:MM format
}

export function AttendanceNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<NotificationSettings>({
    check_in_reminders: true,
    approval_notifications: true,
    anomaly_alerts: true,
    late_warnings: true,
    reminder_time: '08:45',
  });
  const [showSettings, setShowSettings] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotifications();
    fetchSettings();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/employee/attendance/notifications');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch notifications');
      }

      setNotifications(data.notifications || []);
    } catch (error: any) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/employee/attendance/notifications/settings');
      const data = await response.json();

      if (response.ok && data.settings) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/employee/attendance/notifications/${id}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/employee/attendance/notifications/read-all', {
        method: 'POST',
      });

      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast({
          title: 'Success',
          description: 'All notifications marked as read',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    }
  };

  const updateSettings = async (newSettings: NotificationSettings) => {
    try {
      const response = await fetch('/api/employee/attendance/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings),
      });

      if (response.ok) {
        setSettings(newSettings);
        toast({
          title: 'Settings Updated',
          description: 'Notification preferences saved',
        });
        setShowSettings(false);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update settings',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'check_in_reminder':
        return <Clock className="h-5 w-5 text-blue-500" />;
      case 'approval_pending':
      case 'approval_approved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'approval_rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'anomaly':
      case 'late_warning':
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      check_in_reminder: { className: 'bg-blue-100 text-blue-800 border-blue-300', label: 'Reminder' },
      approval_pending: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Pending' },
      approval_approved: { className: 'bg-green-100 text-green-800 border-green-300', label: 'Approved' },
      approval_rejected: { className: 'bg-red-100 text-red-800 border-red-300', label: 'Rejected' },
      anomaly: { className: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Anomaly' },
      late_warning: { className: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Warning' },
    };

    const config = variants[type] || { className: '', label: type };
    return (
      <Badge variant="outline" className={cn('text-xs', config.className)}>
        {config.label}
      </Badge>
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading notifications...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Stay updated with attendance alerts and reminders</CardDescription>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" size="sm">
                  Mark All Read
                </Button>
              )}
              <Button onClick={() => setShowSettings(true)} variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No notifications yet</p>
              <p className="text-sm">You'll be notified about attendance updates here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'p-4 rounded-lg border cursor-pointer transition-colors',
                    notification.read
                      ? 'bg-white border-gray-200'
                      : 'bg-blue-50 border-blue-200'
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            {getNotificationBadge(notification.type)}
                          </div>
                          <p className="text-sm text-gray-600">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {format(parseISO(notification.created_at), 'MMM dd, yyyy hh:mm a')}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1"></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Settings</DialogTitle>
            <DialogDescription>
              Configure your attendance notification preferences
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Check-in Reminders</Label>
                <p className="text-sm text-gray-500">Get reminded to check in</p>
              </div>
              <Switch
                checked={settings.check_in_reminders}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, check_in_reminders: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Approval Notifications</Label>
                <p className="text-sm text-gray-500">Notify when attendance is approved/rejected</p>
              </div>
              <Switch
                checked={settings.approval_notifications}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, approval_notifications: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Anomaly Alerts</Label>
                <p className="text-sm text-gray-500">Alert on unusual attendance patterns</p>
              </div>
              <Switch
                checked={settings.anomaly_alerts}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, anomaly_alerts: checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Late Warnings</Label>
                <p className="text-sm text-gray-500">Warn when approaching late check-in time</p>
              </div>
              <Switch
                checked={settings.late_warnings}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, late_warnings: checked })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Reminder Time</Label>
              <input
                type="time"
                value={settings.reminder_time}
                onChange={(e) => setSettings({ ...settings, reminder_time: e.target.value })}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                Cancel
              </Button>
              <Button onClick={() => updateSettings(settings)}>
                Save Settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

