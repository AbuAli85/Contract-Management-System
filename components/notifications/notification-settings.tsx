'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Bell,
  Settings,
  Mail,
  MessageSquare,
  AlertTriangle,
  Clock,
  FileText,
  Users,
  Calendar,
} from 'lucide-react';

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  soundEnabled: boolean;
  autoRefreshInterval: number;
  categories: {
    contract: boolean;
    promoter: boolean;
    document: boolean;
    system: boolean;
    reminder: boolean;
  };
  priorities: {
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

const defaultSettings: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  inAppNotifications: true,
  soundEnabled: true,
  autoRefreshInterval: 5,
  categories: {
    contract: true,
    promoter: true,
    document: true,
    system: true,
    reminder: true,
  },
  priorities: {
    high: true,
    medium: true,
    low: true,
  },
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
  },
};

export function NotificationSettings() {
  const [settings, setSettings] =
    useState<NotificationSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      // In a real implementation, save to backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store in localStorage for now
      localStorage.setItem('notificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (path: string, value: any) => {
    setSettings(prev => {
      const keys = path.split('.');
      const newSettings = { ...prev };
      let current: any = newSettings;

      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newSettings;
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contract':
        return <FileText className='h-4 w-4' />;
      case 'promoter':
        return <Users className='h-4 w-4' />;
      case 'document':
        return <Calendar className='h-4 w-4' />;
      case 'system':
        return <Settings className='h-4 w-4' />;
      case 'reminder':
        return <Clock className='h-4 w-4' />;
      default:
        return <Bell className='h-4 w-4' />;
    }
  };

  return (
    <div className='space-y-6'>
      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='h-5 w-5' />
            General Notification Settings
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Notification Types */}
          <div className='space-y-4'>
            <h3 className='text-sm font-medium'>Notification Types</h3>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Bell className='h-4 w-4' />
                <Label htmlFor='in-app'>In-App Notifications</Label>
              </div>
              <Switch
                id='in-app'
                checked={settings.inAppNotifications}
                onCheckedChange={checked =>
                  updateSetting('inAppNotifications', checked)
                }
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Mail className='h-4 w-4' />
                <Label htmlFor='email'>Email Notifications</Label>
              </div>
              <Switch
                id='email'
                checked={settings.emailNotifications}
                onCheckedChange={checked =>
                  updateSetting('emailNotifications', checked)
                }
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <MessageSquare className='h-4 w-4' />
                <Label htmlFor='push'>Push Notifications</Label>
              </div>
              <Switch
                id='push'
                checked={settings.pushNotifications}
                onCheckedChange={checked =>
                  updateSetting('pushNotifications', checked)
                }
              />
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <span>🔊</span>
                <Label htmlFor='sound'>Sound Alerts</Label>
              </div>
              <Switch
                id='sound'
                checked={settings.soundEnabled}
                onCheckedChange={checked =>
                  updateSetting('soundEnabled', checked)
                }
              />
            </div>
          </div>

          {/* Auto Refresh */}
          <div className='space-y-4'>
            <h3 className='text-sm font-medium'>Auto Refresh</h3>
            <div className='space-y-2'>
              <Label>
                Refresh Interval: {settings.autoRefreshInterval} minutes
              </Label>
              <Slider
                value={[settings.autoRefreshInterval]}
                onValueChange={(value: number[]) =>
                  updateSetting('autoRefreshInterval', value[0])
                }
                max={60}
                min={1}
                step={1}
                className='w-full'
              />
              <div className='flex justify-between text-xs text-gray-500'>
                <span>1 min</span>
                <span>30 min</span>
                <span>60 min</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Notification Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Object.entries(settings.categories).map(([category, enabled]) => (
              <div key={category} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  {getCategoryIcon(category)}
                  <Label htmlFor={category} className='capitalize'>
                    {category} Notifications
                  </Label>
                </div>
                <Switch
                  id={category}
                  checked={enabled}
                  onCheckedChange={checked =>
                    updateSetting(`categories.${category}`, checked)
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Priority Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Priority Levels</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Object.entries(settings.priorities).map(([priority, enabled]) => (
              <div key={priority} className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  {priority === 'high' && (
                    <AlertTriangle className='h-4 w-4 text-red-500' />
                  )}
                  {priority === 'medium' && (
                    <AlertTriangle className='h-4 w-4 text-yellow-500' />
                  )}
                  {priority === 'low' && (
                    <Clock className='h-4 w-4 text-blue-500' />
                  )}
                  <Label htmlFor={priority} className='capitalize'>
                    {priority} Priority
                  </Label>
                  <Badge
                    variant={
                      priority === 'high'
                        ? 'destructive'
                        : priority === 'medium'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {priority}
                  </Badge>
                </div>
                <Switch
                  id={priority}
                  checked={enabled}
                  onCheckedChange={checked =>
                    updateSetting(`priorities.${priority}`, checked)
                  }
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='quiet-hours'>Enable Quiet Hours</Label>
            <Switch
              id='quiet-hours'
              checked={settings.quietHours.enabled}
              onCheckedChange={checked =>
                updateSetting('quietHours.enabled', checked)
              }
            />
          </div>

          {settings.quietHours.enabled && (
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='start-time'>Start Time</Label>
                <Select
                  value={settings.quietHours.startTime}
                  onValueChange={value =>
                    updateSetting('quietHours.startTime', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor='end-time'>End Time</Label>
                <Select
                  value={settings.quietHours.endTime}
                  onValueChange={value =>
                    updateSetting('quietHours.endTime', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <SelectItem key={`${hour}:00`} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className='flex justify-end'>
        <Button onClick={handleSaveSettings} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
