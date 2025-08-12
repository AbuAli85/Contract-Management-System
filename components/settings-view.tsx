'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Database, Shield, Bell, User, Palette } from 'lucide-react';

export function SettingsView() {
  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='flex items-center gap-3 mb-6'>
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

      <div className='grid gap-6 md:grid-cols-2'>
        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Database className='w-4 h-4' />
              System Settings
            </CardTitle>
            <CardDescription>
              Configure core system parameters and database settings
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Database Status</span>
              <Badge
                variant='secondary'
                className='bg-green-100 text-green-800'
              >
                Connected
              </Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>API Version</span>
              <Badge variant='outline'>v1.0.0</Badge>
            </div>
            <Button variant='outline' size='sm' className='w-full'>
              Configure Database
            </Button>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Shield className='w-4 h-4' />
              Security Settings
            </CardTitle>
            <CardDescription>
              Manage authentication and security preferences
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Two-Factor Auth</span>
              <Badge variant='secondary'>Enabled</Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Session Timeout</span>
              <Badge variant='outline'>5 minutes</Badge>
            </div>
            <Button variant='outline' size='sm' className='w-full'>
              Security Settings
            </Button>
          </CardContent>
        </Card>

        {/* Notification Settings */}
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
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Email Notifications</span>
              <Badge variant='secondary'>Enabled</Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Push Notifications</span>
              <Badge variant='secondary'>Enabled</Badge>
            </div>
            <Button variant='outline' size='sm' className='w-full'>
              Notification Settings
            </Button>
          </CardContent>
        </Card>

        {/* User Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='w-4 h-4' />
              User Preferences
            </CardTitle>
            <CardDescription>
              Customize your personal preferences and display options
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Language</span>
              <Badge variant='outline'>English</Badge>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm'>Time Zone</span>
              <Badge variant='outline'>UTC+3</Badge>
            </div>
            <Button variant='outline' size='sm' className='w-full'>
              User Preferences
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Theme Settings */}
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
            <Button variant='outline' size='sm'>
              Light Theme
            </Button>
            <Button variant='outline' size='sm'>
              Dark Theme
            </Button>
            <Button variant='outline' size='sm'>
              Auto
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
