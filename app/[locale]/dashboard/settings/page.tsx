'use client';

// Force dynamic rendering to avoid build-time Supabase issues
export const dynamic = 'force-dynamic';
import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);

  // Notification settings state
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    contractExpiry: true,
    documentExpiry: true,
    newContracts: false,
    weeklyDigest: true,
    pushNotifications: false,
  });

  // Integration settings state
  const [integrationSettings, setIntegrationSettings] = useState({
    webhookUrl: '',
    apiKey: '',
  });
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Load saved settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        // Load notification settings from localStorage as fallback
        const savedNotifications = localStorage.getItem(
          'notification-settings'
        );
        if (savedNotifications) {
          setNotificationSettings(JSON.parse(savedNotifications));
        }

        // Load integration settings from localStorage as fallback
        const savedIntegrations = localStorage.getItem('integration-settings');
        if (savedIntegrations) {
          setIntegrationSettings(JSON.parse(savedIntegrations));
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, []);

  const handleSaveNotifications = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (can be replaced with API call)
      localStorage.setItem(
        'notification-settings',
        JSON.stringify(notificationSettings)
      );

      toast({
        title: '✅ Settings Saved',
        description: 'Your notification preferences have been updated.',
      });
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveIntegrations = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage (can be replaced with API call)
      localStorage.setItem(
        'integration-settings',
        JSON.stringify(integrationSettings)
      );

      toast({
        title: '✅ Settings Saved',
        description: 'Your integration settings have been updated.',
      });
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestWebhook = async () => {
    if (!integrationSettings.webhookUrl) {
      toast({
        title: '⚠️ Webhook URL Required',
        description: 'Please enter a webhook URL before testing.',
        variant: 'destructive',
      });
      return;
    }

    setIsTestingWebhook(true);
    try {
      const response = await fetch(integrationSettings.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(integrationSettings.apiKey && {
            'X-API-Key': integrationSettings.apiKey,
          }),
        },
        body: JSON.stringify({
          test: true,
          message: 'Test webhook from Contract Management System',
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        toast({
          title: '✅ Webhook Test Successful',
          description: 'Your webhook URL is working correctly.',
        });
      } else {
        toast({
          title: '⚠️ Webhook Test Failed',
          description: `Server responded with status: ${response.status}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: '❌ Webhook Test Failed',
        description:
          'Could not reach the webhook URL. Please check the URL and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader className='p-0'>
          <CardTitle>System Settings / إعدادات النظام</CardTitle>
          <CardDescription>
            Configure application settings and preferences. / تكوين إعدادات
            وتفضيلات التطبيق.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue='general'>
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='general'>General</TabsTrigger>
              <TabsTrigger value='notifications'>Notifications</TabsTrigger>
              <TabsTrigger value='integrations'>Integrations</TabsTrigger>
            </TabsList>

            {/* General Settings Tab */}
            <TabsContent value='general'>
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>
                    Manage general application settings.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <div className='space-y-1'>
                    <Label htmlFor='appName'>Application Name</Label>
                    <Input
                      id='appName'
                      defaultValue='Contract Management CRM'
                    />
                  </div>
                  <div className='space-y-1'>
                    <Label htmlFor='defaultCurrency'>Default Currency</Label>
                    <Input id='defaultCurrency' defaultValue='USD' />
                  </div>
                  <Button>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings Tab */}
            <TabsContent value='notifications'>
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how you receive notifications about contracts and
                    workforce.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='email-notifications'>
                          Email Notifications
                        </Label>
                        <p className='text-sm text-muted-foreground'>
                          Receive email updates about your contracts
                        </p>
                      </div>
                      <Switch
                        id='email-notifications'
                        checked={notificationSettings.emailNotifications}
                        onCheckedChange={checked =>
                          setNotificationSettings({
                            ...notificationSettings,
                            emailNotifications: checked,
                          })
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='contract-expiry'>
                          Contract Expiry Alerts
                        </Label>
                        <p className='text-sm text-muted-foreground'>
                          Get notified 30 days before contract expiration
                        </p>
                      </div>
                      <Switch
                        id='contract-expiry'
                        checked={notificationSettings.contractExpiry}
                        onCheckedChange={checked =>
                          setNotificationSettings({
                            ...notificationSettings,
                            contractExpiry: checked,
                          })
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='document-expiry'>
                          Document Expiry Alerts
                        </Label>
                        <p className='text-sm text-muted-foreground'>
                          Alerts for expiring promoter documents
                        </p>
                      </div>
                      <Switch
                        id='document-expiry'
                        checked={notificationSettings.documentExpiry}
                        onCheckedChange={checked =>
                          setNotificationSettings({
                            ...notificationSettings,
                            documentExpiry: checked,
                          })
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='new-contracts'>
                          New Contract Notifications
                        </Label>
                        <p className='text-sm text-muted-foreground'>
                          Notify when new contracts are created
                        </p>
                      </div>
                      <Switch
                        id='new-contracts'
                        checked={notificationSettings.newContracts}
                        onCheckedChange={checked =>
                          setNotificationSettings({
                            ...notificationSettings,
                            newContracts: checked,
                          })
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='weekly-digest'>
                          Weekly Summary Digest
                        </Label>
                        <p className='text-sm text-muted-foreground'>
                          Receive a weekly summary every Monday
                        </p>
                      </div>
                      <Switch
                        id='weekly-digest'
                        checked={notificationSettings.weeklyDigest}
                        onCheckedChange={checked =>
                          setNotificationSettings({
                            ...notificationSettings,
                            weeklyDigest: checked,
                          })
                        }
                      />
                    </div>

                    <div className='flex items-center justify-between'>
                      <div className='space-y-0.5'>
                        <Label htmlFor='push-notifications'>
                          Push Notifications
                        </Label>
                        <p className='text-sm text-muted-foreground'>
                          Enable browser push notifications
                        </p>
                      </div>
                      <Switch
                        id='push-notifications'
                        checked={notificationSettings.pushNotifications}
                        onCheckedChange={checked =>
                          setNotificationSettings({
                            ...notificationSettings,
                            pushNotifications: checked,
                          })
                        }
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveNotifications} disabled={isSaving}>
                    {isSaving && (
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    )}
                    Save Changes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Integrations Settings Tab */}
            <TabsContent value='integrations'>
              <Card>
                <CardHeader>
                  <CardTitle>Third-Party Integrations</CardTitle>
                  <CardDescription>
                    Connect external services to automate your workflow.
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    <div className='space-y-2'>
                      <Label htmlFor='webhook-url'>Make.com Webhook URL</Label>
                      <Input
                        id='webhook-url'
                        type='url'
                        placeholder='https://hook.eu2.make.com/...'
                        value={integrationSettings.webhookUrl}
                        onChange={e =>
                          setIntegrationSettings({
                            ...integrationSettings,
                            webhookUrl: e.target.value,
                          })
                        }
                      />
                      <p className='text-xs text-muted-foreground'>
                        Receive real-time updates about contracts and workforce
                        changes.
                      </p>
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor='api-key'>API Key (Optional)</Label>
                      <Input
                        id='api-key'
                        type='password'
                        placeholder='Enter your API key'
                        value={integrationSettings.apiKey}
                        onChange={e =>
                          setIntegrationSettings({
                            ...integrationSettings,
                            apiKey: e.target.value,
                          })
                        }
                      />
                      <p className='text-xs text-muted-foreground'>
                        Secure your webhook with an API key for authentication.
                      </p>
                    </div>
                  </div>

                  <div className='flex gap-2'>
                    <Button
                      onClick={handleSaveIntegrations}
                      disabled={isSaving}
                    >
                      {isSaving && (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      )}
                      Save Settings
                    </Button>
                    <Button
                      variant='outline'
                      onClick={handleTestWebhook}
                      disabled={
                        isTestingWebhook || !integrationSettings.webhookUrl
                      }
                    >
                      {isTestingWebhook && (
                        <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      )}
                      Test Webhook
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
