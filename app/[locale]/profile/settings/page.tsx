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
import { User, Bell, Globe, Palette } from 'lucide-react';

export default function ProfileSettingsPage() {
  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Account Settings</h1>
        <p className='text-muted-foreground'>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Settings Content */}
      <Tabs defaultValue='profile' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='profile' className='flex items-center gap-2'>
            <User className='h-4 w-4' />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value='notifications'
            className='flex items-center gap-2'
          >
            <Bell className='h-4 w-4' />
            Notifications
          </TabsTrigger>
          <TabsTrigger value='preferences' className='flex items-center gap-2'>
            <Globe className='h-4 w-4' />
            Preferences
          </TabsTrigger>
          <TabsTrigger value='appearance' className='flex items-center gap-2'>
            <Palette className='h-4 w-4' />
            Appearance
          </TabsTrigger>
        </TabsList>

        <TabsContent value='profile' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='firstName'>First Name</Label>
                  <Input id='firstName' placeholder='Enter your first name' />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='lastName'>Last Name</Label>
                  <Input id='lastName' placeholder='Enter your last name' />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='email'>Email Address</Label>
                <Input id='email' type='email' placeholder='Enter your email' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='phone'>Phone Number</Label>
                <Input
                  id='phone'
                  type='tel'
                  placeholder='Enter your phone number'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='company'>Company</Label>
                <Input id='company' placeholder='Enter your company name' />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='position'>Position</Label>
                <Input id='position' placeholder='Enter your job title' />
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
                <Switch defaultChecked />
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
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Promoter Activity</Label>
                  <p className='text-sm text-muted-foreground'>
                    Get notified about promoter activities
                  </p>
                </div>
                <Switch />
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Weekly Reports</Label>
                  <p className='text-sm text-muted-foreground'>
                    Receive weekly activity reports
                  </p>
                </div>
                <Switch />
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='preferences' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>General Preferences</CardTitle>
              <CardDescription>
                Configure your general account preferences
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='language'>Language</Label>
                <select
                  id='language'
                  className='w-full rounded-md border p-2'
                  defaultValue='en'
                  aria-label='Select language'
                >
                  <option value='en'>English</option>
                  <option value='ar'>العربية (Arabic)</option>
                </select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='timezone'>Timezone</Label>
                <select
                  id='timezone'
                  className='w-full rounded-md border p-2'
                  defaultValue='UTC'
                  aria-label='Select timezone'
                >
                  <option value='UTC'>UTC (Coordinated Universal Time)</option>
                  <option value='EST'>EST (Eastern Standard Time)</option>
                  <option value='PST'>PST (Pacific Standard Time)</option>
                  <option value='GMT'>GMT (Greenwich Mean Time)</option>
                </select>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='dateFormat'>Date Format</Label>
                <select
                  id='dateFormat'
                  className='w-full rounded-md border p-2'
                  defaultValue='DD/MM/YYYY'
                  aria-label='Select date format'
                >
                  <option value='DD/MM/YYYY'>DD/MM/YYYY</option>
                  <option value='MM/DD/YYYY'>MM/DD/YYYY</option>
                  <option value='YYYY-MM-DD'>YYYY-MM-DD</option>
                </select>
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Auto-save</Label>
                  <p className='text-sm text-muted-foreground'>
                    Automatically save form data
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='appearance' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your interface
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
                  <Button variant='outline' size='sm'>
                    Orange
                  </Button>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Compact Mode</Label>
                  <p className='text-sm text-muted-foreground'>
                    Use compact spacing for better density
                  </p>
                </div>
                <Switch />
              </div>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Show Icons</Label>
                  <p className='text-sm text-muted-foreground'>
                    Display icons in navigation
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Button>Save Appearance</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
