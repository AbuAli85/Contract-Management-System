'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Bell, Shield, Database, Globe, Palette } from 'lucide-react';

export default function DashboardSettingsPage() {
  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Settings</h1>
        <p className='text-muted-foreground'>
          Configure system settings and preferences
        </p>
      </div>

      {/* Settings Content */}
      <Tabs defaultValue='general' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='general' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            General
          </TabsTrigger>
          <TabsTrigger
            value='notifications'
            className='flex items-center gap-2'
          >
            <Bell className='h-4 w-4' />
            Notifications
          </TabsTrigger>
          <TabsTrigger value='security' className='flex items-center gap-2'>
            <Shield className='h-4 w-4' />
            Security
          </TabsTrigger>
          <TabsTrigger value='appearance' className='flex items-center gap-2'>
            <Palette className='h-4 w-4' />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value='general' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Configure basic system settings</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='company-name'>Company Name</Label>
                <Input id='company-name' placeholder='Enter company name' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='timezone'>Timezone</Label>
                <Input id='timezone' placeholder='Select timezone' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='language'>Language</Label>
                <Input id='language' placeholder='Select language' />
              </div>
              <Button>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='notifications' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Configure how you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Email Notifications</Label>
                  <p className='text-sm text-muted-foreground'>
                    Receive notifications via email
                  </p>
                </div>
                <Switch />
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Contract Updates</Label>
                  <p className='text-sm text-muted-foreground'>
                    Get notified about contract changes
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>System Alerts</Label>
                  <p className='text-sm text-muted-foreground'>
                    Receive system-wide alerts
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='security' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Two-Factor Authentication</Label>
                  <p className='text-sm text-muted-foreground'>
                    Add an extra layer of security
                  </p>
                </div>
                <Switch />
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Session Timeout</Label>
                  <p className='text-sm text-muted-foreground'>
                    Automatically log out after inactivity
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button variant='outline'>Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='appearance' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Theme</Label>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm'>
                    Light
                  </Button>
                  <Button variant='outline' size='sm'>
                    Dark
                  </Button>
                  <Button variant='outline' size='sm'>
                    System
                  </Button>
                </div>
              </div>
              <div className='space-y-2'>
                <Label>Color Scheme</Label>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm'>
                    Blue
                  </Button>
                  <Button variant='outline' size='sm'>
                    Green
                  </Button>
                  <Button variant='outline' size='sm'>
                    Purple
                  </Button>
                </div>
              </div>
              <Button>Save Appearance</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
