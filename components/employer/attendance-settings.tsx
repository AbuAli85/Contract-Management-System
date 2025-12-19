'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Settings,
  Save,
  CheckCircle2,
  Loader2,
  Bell,
  MapPin,
  Clock,
  FileText,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/components/providers/company-provider';

interface AttendanceSettings {
  // Check-In Requirements
  require_photo: boolean;
  require_location: boolean;
  location_radius_meters: number;
  check_in_time_window_minutes: number;
  
  // Approval Settings
  auto_approve: boolean;
  require_approval: boolean;
  approval_deadline_hours: number;
  
  // Link Settings
  default_link_validity_hours: number;
  max_uses_per_link: number;
  link_expiry_hours: number;
  
  // Notification Settings
  send_check_in_reminders: boolean;
  reminder_time_minutes: number;
  send_check_out_reminders: boolean;
  notification_methods: string[];
  
  // Report Settings
  default_report_format: 'pdf' | 'excel' | 'csv';
  include_photos_in_reports: boolean;
  include_location_in_reports: boolean;
  auto_generate_reports: boolean;
}

export function AttendanceSettings() {
  const [settings, setSettings] = useState<AttendanceSettings>({
    require_photo: true,
    require_location: true,
    location_radius_meters: 50,
    check_in_time_window_minutes: 120,
    auto_approve: false,
    require_approval: true,
    approval_deadline_hours: 24,
    default_link_validity_hours: 8,
    max_uses_per_link: 1,
    link_expiry_hours: 24,
    send_check_in_reminders: true,
    reminder_time_minutes: 15,
    send_check_out_reminders: false,
    notification_methods: ['email'],
    default_report_format: 'pdf',
    include_photos_in_reports: false,
    include_location_in_reports: true,
    auto_generate_reports: false,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { companyId } = useCompany();
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, [companyId]);

  const fetchSettings = async () => {
    if (!companyId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/employer/attendance/settings?company_id=${companyId}`);
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!companyId) {
      toast({
        title: 'Error',
        description: 'No active company selected',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/employer/attendance/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          settings,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      toast({
        title: 'Success',
        description: 'Attendance settings saved successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Settings</h2>
          <p className="text-sm text-gray-500 mt-1">Configure attendance system preferences</p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Check-In Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Check-In Requirements
          </CardTitle>
          <CardDescription>Configure what is required for check-in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Photo</Label>
              <p className="text-sm text-gray-500">Employees must take a photo when checking in</p>
            </div>
            <Switch
              checked={settings.require_photo}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, require_photo: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Require Location</Label>
              <p className="text-sm text-gray-500">Employees must be at the correct location</p>
            </div>
            <Switch
              checked={settings.require_location}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, require_location: checked })
              }
            />
          </div>

          {settings.require_location && (
            <div className="space-y-2">
              <Label>Location Radius (meters)</Label>
              <Input
                type="number"
                value={settings.location_radius_meters}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    location_radius_meters: parseInt(e.target.value) || 50,
                  })
                }
                min="10"
                max="1000"
              />
              <p className="text-xs text-gray-500">
                Allowed distance from target location (10-1000 meters)
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label>Check-In Time Window (minutes)</Label>
            <Input
              type="number"
              value={settings.check_in_time_window_minutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  check_in_time_window_minutes: parseInt(e.target.value) || 120,
                })
              }
              min="30"
              max="480"
            />
            <p className="text-xs text-gray-500">
              How long after scheduled time can employees check in (30-480 minutes)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Approval Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Approval Settings
          </CardTitle>
          <CardDescription>Configure attendance approval workflow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Approve Valid Check-Ins</Label>
              <p className="text-sm text-gray-500">
                Automatically approve check-ins that meet all requirements
              </p>
            </div>
            <Switch
              checked={settings.auto_approve}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, auto_approve: checked })
              }
            />
          </div>

          {!settings.auto_approve && (
            <>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Require Manual Approval</Label>
                  <p className="text-sm text-gray-500">
                    All check-ins require manager approval
                  </p>
                </div>
                <Switch
                  checked={settings.require_approval}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, require_approval: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Approval Deadline (hours)</Label>
                <Input
                  type="number"
                  value={settings.approval_deadline_hours}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      approval_deadline_hours: parseInt(e.target.value) || 24,
                    })
                  }
                  min="1"
                  max="168"
                />
                <p className="text-xs text-gray-500">
                  Hours after check-in to approve (1-168 hours)
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Link Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Link Settings
          </CardTitle>
          <CardDescription>Configure attendance link behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Link Validity (hours)</Label>
            <Input
              type="number"
              value={settings.default_link_validity_hours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  default_link_validity_hours: parseInt(e.target.value) || 8,
                })
              }
              min="1"
              max="24"
            />
            <p className="text-xs text-gray-500">Default validity period for new links (1-24 hours)</p>
          </div>

          <div className="space-y-2">
            <Label>Max Uses Per Link</Label>
            <Input
              type="number"
              value={settings.max_uses_per_link}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  max_uses_per_link: parseInt(e.target.value) || 1,
                })
              }
              min="1"
              max="100"
            />
            <p className="text-xs text-gray-500">Maximum times a link can be used (1-100)</p>
          </div>

          <div className="space-y-2">
            <Label>Link Expiry (hours)</Label>
            <Input
              type="number"
              value={settings.link_expiry_hours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  link_expiry_hours: parseInt(e.target.value) || 24,
                })
              }
              min="1"
              max="168"
            />
            <p className="text-xs text-gray-500">Hours until link expires (1-168 hours)</p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure attendance notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Send Check-In Reminders</Label>
              <p className="text-sm text-gray-500">Send reminders before check-in time</p>
            </div>
            <Switch
              checked={settings.send_check_in_reminders}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, send_check_in_reminders: checked })
              }
            />
          </div>

          {settings.send_check_in_reminders && (
            <div className="space-y-2">
              <Label>Reminder Time (minutes before)</Label>
              <Input
                type="number"
                value={settings.reminder_time_minutes}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    reminder_time_minutes: parseInt(e.target.value) || 15,
                  })
                }
                min="5"
                max="120"
              />
              <p className="text-xs text-gray-500">Minutes before check-in to send reminder (5-120)</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Send Check-Out Reminders</Label>
              <p className="text-sm text-gray-500">Send reminders before check-out time</p>
            </div>
            <Switch
              checked={settings.send_check_out_reminders}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, send_check_out_reminders: checked })
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Notification Methods</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notify-email"
                  aria-label="Email notifications"
                  checked={settings.notification_methods.includes('email')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSettings({
                        ...settings,
                        notification_methods: [...settings.notification_methods, 'email'],
                      });
                    } else {
                      setSettings({
                        ...settings,
                        notification_methods: settings.notification_methods.filter(m => m !== 'email'),
                      });
                    }
                  }}
                />
                <Label htmlFor="notify-email" className="cursor-pointer">Email</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notify-sms"
                  aria-label="SMS notifications"
                  checked={settings.notification_methods.includes('sms')}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSettings({
                        ...settings,
                        notification_methods: [...settings.notification_methods, 'sms'],
                      });
                    } else {
                      setSettings({
                        ...settings,
                        notification_methods: settings.notification_methods.filter(m => m !== 'sms'),
                      });
                    }
                  }}
                />
                <Label htmlFor="notify-sms" className="cursor-pointer">SMS</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Report Settings
          </CardTitle>
          <CardDescription>Configure attendance report preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Report Format</Label>
            <Select
              value={settings.default_report_format}
              onValueChange={(value) =>
                setSettings({ ...settings, default_report_format: value as 'pdf' | 'excel' | 'csv' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Include Photos in Reports</Label>
              <p className="text-sm text-gray-500">Include check-in photos in generated reports</p>
            </div>
            <Switch
              checked={settings.include_photos_in_reports}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, include_photos_in_reports: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Include Location in Reports</Label>
              <p className="text-sm text-gray-500">Include location coordinates in reports</p>
            </div>
            <Switch
              checked={settings.include_location_in_reports}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, include_location_in_reports: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Generate Reports</Label>
              <p className="text-sm text-gray-500">Automatically generate reports at end of period</p>
            </div>
            <Switch
              checked={settings.auto_generate_reports}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, auto_generate_reports: checked })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

