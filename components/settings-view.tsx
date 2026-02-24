'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-service';
import {
  Settings,
  Database,
  Shield,
  Bell,
  Globe,
  Clock,
  CheckCircle,
  Loader2,
  Save,
  RefreshCw,
  User,
  Palette,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface SettingsState {
  emailNotifications: boolean;
  pushNotifications: boolean;
  contractAlerts: boolean;
  weeklyDigest: boolean;
  theme: 'light' | 'dark' | 'system';
  language: 'en' | 'ar';
  timezone: string;
  sessionTimeout: number;
}

const DEFAULT_SETTINGS: SettingsState = {
  emailNotifications: true,
  pushNotifications: true,
  contractAlerts: true,
  weeklyDigest: false,
  theme: 'system',
  language: 'en',
  timezone: 'Asia/Riyadh',
  sessionTimeout: 60,
};

const TIMEZONES = [
  { value: 'Asia/Riyadh', label: 'Riyadh (UTC+3)' },
  { value: 'Asia/Dubai', label: 'Dubai (UTC+4)' },
  { value: 'Asia/Kuwait', label: 'Kuwait (UTC+3)' },
  { value: 'Africa/Cairo', label: 'Cairo (UTC+2)' },
  { value: 'Europe/London', label: 'London (UTC+0)' },
  { value: 'America/New_York', label: 'New York (UTC-5)' },
  { value: 'UTC', label: 'UTC' },
];

export function SettingsView() {
  const { user } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'error'>(
    'checking'
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem('app-settings');
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<SettingsState>;
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const checkDb = async () => {
      try {
        const res = await fetch('/api/health', { cache: 'no-store' });
        setDbStatus(res.ok ? 'connected' : 'error');
      } catch {
        setDbStatus('error');
      }
    };
    checkDb();
  }, []);

  const updateSetting = <K extends keyof SettingsState>(
    key: K,
    value: SettingsState[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem('app-settings', JSON.stringify(settings));
      const root = document.documentElement;
      if (settings.theme === 'dark') {
        root.classList.add('dark');
      } else if (settings.theme === 'light') {
        root.classList.remove('dark');
      } else {
        const prefersDark = window.matchMedia(
          '(prefers-color-scheme: dark)'
        ).matches;
        root.classList.toggle('dark', prefersDark);
      }
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated successfully.',
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to save settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem('app-settings');
    toast({
      title: 'Settings Reset',
      description: 'All settings restored to defaults.',
    });
  };

  return (
    <div className='container mx-auto p-6 space-y-6 max-w-4xl'>
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          <div className='w-10 h-10 bg-primary rounded-lg flex items-center justify-center'>
            <Settings className='w-5 h-5 text-primary-foreground' />
          </div>
          <div>
            <h1 className='text-2xl font-bold'>Settings</h1>
            <p className='text-muted-foreground'>
              Manage your application settings and preferences
            </p>
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={handleReset}>
            <RefreshCw className='h-4 w-4 mr-2' />
            Reset
          </Button>
          <Button size='sm' onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
            ) : (
              <Save className='h-4 w-4 mr-2' />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Database className='w-4 h-4' />
              System Status
            </CardTitle>
            <CardDescription>
              Current system health and configuration
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Database</span>
              {dbStatus === 'checking' ? (
                <Badge variant='outline' className='gap-1'>
                  <Loader2 className='h-3 w-3 animate-spin' />
                  Checking
                </Badge>
              ) : dbStatus === 'connected' ? (
                <Badge className='bg-green-100 text-green-800 border-green-200 gap-1'>
                  <CheckCircle className='h-3 w-3' />
                  Connected
                </Badge>
              ) : (
                <Badge variant='destructive'>Error</Badge>
              )}
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>API Version</span>
              <Badge variant='outline'>v1.0.0</Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Logged in as</span>
              <span className='text-sm text-muted-foreground truncate max-w-[180px]'>
                {user?.email || 'Unknown'}
              </span>
            </div>
            <Separator />
            <Button variant='outline' size='sm' className='w-full' asChild>
              <Link href={`/${locale}/dashboard/profile`}>
                <User className='h-4 w-4 mr-2' />
                Manage Profile
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='w-4 h-4' />
              Security
            </CardTitle>
            <CardDescription>
              Authentication and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Two-Factor Auth</span>
              <Badge className='bg-green-100 text-green-800'>Enabled</Badge>
            </div>
            <div className='space-y-2'>
              <Label className='text-sm'>Session Timeout</Label>
              <Select
                value={String(settings.sessionTimeout)}
                onValueChange={v => updateSetting('sessionTimeout', Number(v))}
              >
                <SelectTrigger className='h-8'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='15'>15 minutes</SelectItem>
                  <SelectItem value='30'>30 minutes</SelectItem>
                  <SelectItem value='60'>1 hour</SelectItem>
                  <SelectItem value='120'>2 hours</SelectItem>
                  <SelectItem value='480'>8 hours</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <Button variant='outline' size='sm' className='w-full' asChild>
              <Link href={`/${locale}/auth/change-password`}>
                <Shield className='h-4 w-4 mr-2' />
                Change Password
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Bell className='w-4 h-4' />
              Notifications
            </CardTitle>
            <CardDescription>
              Configure notification preferences and alerts
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            {(
              [
                { id: 'emailNotifications', label: 'Email Notifications' },
                { id: 'pushNotifications', label: 'Push Notifications' },
                { id: 'contractAlerts', label: 'Contract Expiry Alerts' },
                { id: 'weeklyDigest', label: 'Weekly Digest Email' },
              ] as const
            ).map(item => (
              <div key={item.id} className='flex items-center justify-between'>
                <Label htmlFor={item.id} className='text-sm cursor-pointer'>
                  {item.label}
                </Label>
                <Switch
                  id={item.id}
                  checked={settings[item.id]}
                  onCheckedChange={v => updateSetting(item.id, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Globe className='w-4 h-4' />
              Localization
            </CardTitle>
            <CardDescription>
              Language, timezone and regional preferences
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <Label className='text-sm'>Language</Label>
              <Select
                value={settings.language}
                onValueChange={v => updateSetting('language', v as 'en' | 'ar')}
              >
                <SelectTrigger className='h-8'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='en'>English</SelectItem>
                  <SelectItem value='ar'>العربية (Arabic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className='space-y-2'>
              <Label className='text-sm flex items-center gap-1'>
                <Clock className='h-3 w-3' />
                Timezone
              </Label>
              <Select
                value={settings.timezone}
                onValueChange={v => updateSetting('timezone', v)}
              >
                <SelectTrigger className='h-8'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map(tz => (
                    <SelectItem key={tz.value} value={tz.value}>
                      {tz.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Palette className='w-4 h-4' />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize the look and feel of your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-3 gap-4'>
            {(['light', 'dark', 'system'] as const).map(theme => (
              <Button
                key={theme}
                variant={settings.theme === theme ? 'default' : 'outline'}
                size='sm'
                onClick={() => updateSetting('theme', theme)}
              >
                {theme === 'light' && '☀️ '}
                {theme === 'dark' && '🌙 '}
                {theme === 'system' && '💻 '}
                {theme.charAt(0).toUpperCase() + theme.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className='flex justify-end gap-2 pt-2'>
        <Button variant='outline' onClick={handleReset}>
          <RefreshCw className='h-4 w-4 mr-2' />
          Reset to Defaults
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className='h-4 w-4 mr-2 animate-spin' />
          ) : (
            <Save className='h-4 w-4 mr-2' />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
