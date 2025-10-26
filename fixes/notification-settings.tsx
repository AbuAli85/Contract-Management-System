/**
 * Notification Settings Component
 * 
 * Complete implementation for the notification preferences tab in settings.
 * Replaces placeholder text with functional notification management.
 * 
 * Location: app/[locale]/dashboard/settings/page.tsx (Notifications tab)
 */

'use client';

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Bell, Mail, MessageSquare, Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface NotificationPreferences {
  emailNotifications: boolean;
  contractExpiry: boolean;
  documentExpiry: boolean;
  newContracts: boolean;
  contractApprovals: boolean;
  weeklyDigest: boolean;
  monthlyReport: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  expiryReminderDays: number;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationPreferences>({
    emailNotifications: true,
    contractExpiry: true,
    documentExpiry: true,
    newContracts: false,
    contractApprovals: true,
    weeklyDigest: true,
    monthlyReport: false,
    pushNotifications: false,
    smsNotifications: false,
    expiryReminderDays: 30,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/user/notification-preferences');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: '✅ Settings Saved',
          description: 'Your notification preferences have been updated successfully.',
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: '❌ Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof NotificationPreferences, value: boolean | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Notification Preferences</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive notifications about your contracts, workforce, and system updates.
        </p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <CardTitle>Email Notifications</CardTitle>
          </div>
          <CardDescription>
            Receive important updates and alerts via email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email-notifications">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Master switch for all email notifications
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.emailNotifications}
              onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="contract-expiry">Contract Expiry Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when contracts are about to expire
              </p>
            </div>
            <Switch
              id="contract-expiry"
              checked={settings.contractExpiry}
              onCheckedChange={(checked) => updateSetting('contractExpiry', checked)}
              disabled={!settings.emailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="document-expiry">Document Expiry Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alerts for expiring IDs, passports, and other documents
              </p>
            </div>
            <Switch
              id="document-expiry"
              checked={settings.documentExpiry}
              onCheckedChange={(checked) => updateSetting('documentExpiry', checked)}
              disabled={!settings.emailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="new-contracts">New Contract Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Be notified when new contracts are created
              </p>
            </div>
            <Switch
              id="new-contracts"
              checked={settings.newContracts}
              onCheckedChange={(checked) => updateSetting('newContracts', checked)}
              disabled={!settings.emailNotifications}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="contract-approvals">Contract Approval Requests</Label>
              <p className="text-sm text-muted-foreground">
                Notifications for contracts pending your approval
              </p>
            </div>
            <Switch
              id="contract-approvals"
              checked={settings.contractApprovals}
              onCheckedChange={(checked) => updateSetting('contractApprovals', checked)}
              disabled={!settings.emailNotifications}
            />
          </div>
        </CardContent>
      </Card>

      {/* Digest Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            <CardTitle>Digest Reports</CardTitle>
          </div>
          <CardDescription>
            Receive periodic summaries of your system activity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-digest">Weekly Summary Digest</Label>
              <p className="text-sm text-muted-foreground">
                Comprehensive weekly report every Monday morning
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={settings.weeklyDigest}
              onCheckedChange={(checked) => updateSetting('weeklyDigest', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="monthly-report">Monthly Performance Report</Label>
              <p className="text-sm text-muted-foreground">
                Detailed monthly analytics and insights
              </p>
            </div>
            <Switch
              id="monthly-report"
              checked={settings.monthlyReport}
              onCheckedChange={(checked) => updateSetting('monthlyReport', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Other Notification Channels */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <CardTitle>Other Channels</CardTitle>
          </div>
          <CardDescription>
            Additional notification delivery methods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="push-notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Browser push notifications for real-time alerts
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.pushNotifications}
              onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sms-notifications">SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Critical alerts via text message (additional charges may apply)
              </p>
            </div>
            <Switch
              id="sms-notifications"
              checked={settings.smsNotifications}
              onCheckedChange={(checked) => updateSetting('smsNotifications', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={loadSettings} disabled={saving}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </div>
  );
}

