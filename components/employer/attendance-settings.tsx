'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
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
  AlertTriangle,
  BarChart3,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/components/providers/company-provider';

interface AttendanceSettings {
  // Check-In Requirements
  require_photo: boolean;
  require_location: boolean;
  location_radius_meters: number;
  check_in_time_window_minutes: number;

  // Working Hours Configuration
  default_check_in_time: string; // HH:mm format
  default_check_out_time: string; // HH:mm format
  standard_work_hours: number;
  overtime_threshold_hours: number;
  overtime_rate_multiplier: number;

  // Break Settings
  allow_breaks: boolean;
  max_break_duration_minutes: number;
  max_breaks_per_day: number;
  unpaid_break_minutes: number;

  // Late/Absence Rules
  late_threshold_minutes: number;
  absent_threshold_hours: number;
  auto_mark_absent: boolean;
  auto_mark_absent_time: string; // HH:mm format

  // Approval Settings
  auto_approve: boolean;
  require_approval: boolean;
  approval_deadline_hours: number;
  auto_approve_valid_checkins: boolean;

  // Link Settings
  default_link_validity_hours: number;
  max_uses_per_link: number;
  link_expiry_hours: number;

  // Notification Settings
  send_check_in_reminders: boolean;
  reminder_time_minutes: number;
  send_check_out_reminders: boolean;
  send_approval_notifications: boolean;
  send_late_notifications: boolean;
  notification_methods: string[];

  // Report Settings
  default_report_format: 'pdf' | 'excel' | 'csv';
  include_photos_in_reports: boolean;
  include_location_in_reports: boolean;
  include_device_info_in_reports: boolean;
  auto_generate_reports: boolean;
  report_generation_schedule:
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'quarterly'
    | 'yearly'
    | 'manual';
  report_generation_day: number;

  // Analytics Settings
  enable_analytics: boolean;
  analytics_retention_days: number;
  track_overtime_trends: boolean;
  track_attendance_patterns: boolean;
  alert_on_anomalies: boolean;
}

export function AttendanceSettings() {
  const [settings, setSettings] = useState<AttendanceSettings>({
    require_photo: true,
    require_location: true,
    location_radius_meters: 50,
    check_in_time_window_minutes: 120,
    default_check_in_time: '09:00',
    default_check_out_time: '17:00',
    standard_work_hours: 8.0,
    overtime_threshold_hours: 8.0,
    overtime_rate_multiplier: 1.5,
    allow_breaks: true,
    max_break_duration_minutes: 60,
    max_breaks_per_day: 2,
    unpaid_break_minutes: 0,
    late_threshold_minutes: 15,
    absent_threshold_hours: 4,
    auto_mark_absent: false,
    auto_mark_absent_time: '12:00',
    auto_approve: false,
    require_approval: true,
    approval_deadline_hours: 24,
    auto_approve_valid_checkins: false,
    default_link_validity_hours: 8,
    max_uses_per_link: 1,
    link_expiry_hours: 24,
    send_check_in_reminders: true,
    reminder_time_minutes: 15,
    send_check_out_reminders: false,
    send_approval_notifications: true,
    send_late_notifications: true,
    notification_methods: ['email'],
    default_report_format: 'pdf',
    include_photos_in_reports: false,
    include_location_in_reports: true,
    include_device_info_in_reports: false,
    auto_generate_reports: false,
    report_generation_schedule: 'monthly',
    report_generation_day: 1,
    enable_analytics: true,
    analytics_retention_days: 365,
    track_overtime_trends: true,
    track_attendance_patterns: true,
    alert_on_anomalies: true,
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
      const response = await fetch(
        `/api/employer/attendance/settings?company_id=${companyId}`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
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
        description:
          error instanceof Error ? error.message : 'Failed to save settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold'>Attendance Settings</h2>
          <p className='text-sm text-gray-500 mt-1'>
            Configure attendance system preferences
          </p>
        </div>
        <Button onClick={saveSettings} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className='h-4 w-4 mr-2 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Save className='h-4 w-4 mr-2' />
              Save Settings
            </>
          )}
        </Button>
      </div>

      {/* Check-In Requirements */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Check-In Requirements
          </CardTitle>
          <CardDescription>
            Configure what is required for check-in
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Require Photo</Label>
              <p className='text-sm text-gray-500'>
                Employees must take a photo when checking in
              </p>
            </div>
            <Switch
              checked={settings.require_photo}
              onCheckedChange={checked =>
                setSettings({ ...settings, require_photo: checked })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Require Location</Label>
              <p className='text-sm text-gray-500'>
                Employees must be at the correct location
              </p>
            </div>
            <Switch
              checked={settings.require_location}
              onCheckedChange={checked =>
                setSettings({ ...settings, require_location: checked })
              }
            />
          </div>

          {settings.require_location && (
            <div className='space-y-2'>
              <Label>Location Radius (meters)</Label>
              <Input
                type='number'
                value={settings.location_radius_meters}
                onChange={e =>
                  setSettings({
                    ...settings,
                    location_radius_meters: parseInt(e.target.value) || 50,
                  })
                }
                min='10'
                max='1000'
              />
              <p className='text-xs text-gray-500'>
                Allowed distance from target location (10-1000 meters)
              </p>
            </div>
          )}

          <div className='space-y-2'>
            <Label>Check-In Time Window (minutes)</Label>
            <Input
              type='number'
              value={settings.check_in_time_window_minutes}
              onChange={e =>
                setSettings({
                  ...settings,
                  check_in_time_window_minutes: parseInt(e.target.value) || 120,
                })
              }
              min='30'
              max='480'
            />
            <p className='text-xs text-gray-500'>
              How long after scheduled time can employees check in (30-480
              minutes)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Approval Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle2 className='h-5 w-5' />
            Approval Settings
          </CardTitle>
          <CardDescription>
            Configure attendance approval workflow
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Auto-Approve Valid Check-Ins</Label>
              <p className='text-sm text-gray-500'>
                Automatically approve check-ins that meet all requirements
              </p>
            </div>
            <Switch
              checked={settings.auto_approve}
              onCheckedChange={checked =>
                setSettings({ ...settings, auto_approve: checked })
              }
            />
          </div>

          {!settings.auto_approve && (
            <>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Require Manual Approval</Label>
                  <p className='text-sm text-gray-500'>
                    All check-ins require manager approval
                  </p>
                </div>
                <Switch
                  checked={settings.require_approval}
                  onCheckedChange={checked =>
                    setSettings({ ...settings, require_approval: checked })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Auto-Approve Valid Check-Ins</Label>
                  <p className='text-sm text-gray-500'>
                    Automatically approve check-ins that meet all requirements
                    (location verified, on time)
                  </p>
                </div>
                <Switch
                  checked={settings.auto_approve_valid_checkins}
                  onCheckedChange={checked =>
                    setSettings({
                      ...settings,
                      auto_approve_valid_checkins: checked,
                    })
                  }
                />
              </div>

              <div className='space-y-2'>
                <Label>Approval Deadline (hours)</Label>
                <Input
                  type='number'
                  value={settings.approval_deadline_hours}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      approval_deadline_hours: parseInt(e.target.value) || 24,
                    })
                  }
                  min='1'
                  max='168'
                />
                <p className='text-xs text-gray-500'>
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
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Link Settings
          </CardTitle>
          <CardDescription>Configure attendance link behavior</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label>Default Link Validity (hours)</Label>
            <Input
              type='number'
              value={settings.default_link_validity_hours}
              onChange={e =>
                setSettings({
                  ...settings,
                  default_link_validity_hours: parseInt(e.target.value) || 8,
                })
              }
              min='1'
              max='24'
            />
            <p className='text-xs text-gray-500'>
              Default validity period for new links (1-24 hours)
            </p>
          </div>

          <div className='space-y-2'>
            <Label>Max Uses Per Link</Label>
            <Input
              type='number'
              value={settings.max_uses_per_link}
              onChange={e =>
                setSettings({
                  ...settings,
                  max_uses_per_link: parseInt(e.target.value) || 1,
                })
              }
              min='1'
              max='100'
            />
            <p className='text-xs text-gray-500'>
              Maximum times a link can be used (1-100)
            </p>
          </div>

          <div className='space-y-2'>
            <Label>Link Expiry (hours)</Label>
            <Input
              type='number'
              value={settings.link_expiry_hours}
              onChange={e =>
                setSettings({
                  ...settings,
                  link_expiry_hours: parseInt(e.target.value) || 24,
                })
              }
              min='1'
              max='168'
            />
            <p className='text-xs text-gray-500'>
              Hours until link expires (1-168 hours)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Bell className='h-5 w-5' />
            Notification Settings
          </CardTitle>
          <CardDescription>Configure attendance notifications</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Send Check-In Reminders</Label>
              <p className='text-sm text-gray-500'>
                Send reminders before check-in time
              </p>
            </div>
            <Switch
              checked={settings.send_check_in_reminders}
              onCheckedChange={checked =>
                setSettings({ ...settings, send_check_in_reminders: checked })
              }
            />
          </div>

          {settings.send_check_in_reminders && (
            <div className='space-y-2'>
              <Label>Reminder Time (minutes before)</Label>
              <Input
                type='number'
                value={settings.reminder_time_minutes}
                onChange={e =>
                  setSettings({
                    ...settings,
                    reminder_time_minutes: parseInt(e.target.value) || 15,
                  })
                }
                min='5'
                max='120'
              />
              <p className='text-xs text-gray-500'>
                Minutes before check-in to send reminder (5-120)
              </p>
            </div>
          )}

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Send Check-Out Reminders</Label>
              <p className='text-sm text-gray-500'>
                Send reminders before check-out time
              </p>
            </div>
            <Switch
              checked={settings.send_check_out_reminders}
              onCheckedChange={checked =>
                setSettings({ ...settings, send_check_out_reminders: checked })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Send Approval Notifications</Label>
              <p className='text-sm text-gray-500'>
                Notify employees when attendance is approved/rejected
              </p>
            </div>
            <Switch
              checked={settings.send_approval_notifications}
              onCheckedChange={checked =>
                setSettings({
                  ...settings,
                  send_approval_notifications: checked,
                })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Send Late Notifications</Label>
              <p className='text-sm text-gray-500'>
                Notify managers when employees check in late
              </p>
            </div>
            <Switch
              checked={settings.send_late_notifications}
              onCheckedChange={checked =>
                setSettings({ ...settings, send_late_notifications: checked })
              }
            />
          </div>

          <div className='space-y-2'>
            <Label>Notification Methods</Label>
            <div className='flex items-center gap-4'>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='notify-email'
                  aria-label='Email notifications'
                  checked={settings.notification_methods.includes('email')}
                  onChange={e => {
                    if (e.target.checked) {
                      setSettings({
                        ...settings,
                        notification_methods: [
                          ...settings.notification_methods,
                          'email',
                        ],
                      });
                    } else {
                      setSettings({
                        ...settings,
                        notification_methods:
                          settings.notification_methods.filter(
                            m => m !== 'email'
                          ),
                      });
                    }
                  }}
                />
                <Label htmlFor='notify-email' className='cursor-pointer'>
                  Email
                </Label>
              </div>
              <div className='flex items-center gap-2'>
                <input
                  type='checkbox'
                  id='notify-sms'
                  aria-label='SMS notifications'
                  checked={settings.notification_methods.includes('sms')}
                  onChange={e => {
                    if (e.target.checked) {
                      setSettings({
                        ...settings,
                        notification_methods: [
                          ...settings.notification_methods,
                          'sms',
                        ],
                      });
                    } else {
                      setSettings({
                        ...settings,
                        notification_methods:
                          settings.notification_methods.filter(
                            m => m !== 'sms'
                          ),
                      });
                    }
                  }}
                />
                <Label htmlFor='notify-sms' className='cursor-pointer'>
                  SMS
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Working Hours Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Working Hours Configuration
          </CardTitle>
          <CardDescription>
            Set default working hours and overtime rules
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Default Check-In Time</Label>
              <Input
                type='time'
                value={settings.default_check_in_time}
                onChange={e =>
                  setSettings({
                    ...settings,
                    default_check_in_time: e.target.value,
                  })
                }
              />
              <p className='text-xs text-gray-500'>
                Standard check-in time for employees
              </p>
            </div>
            <div className='space-y-2'>
              <Label>Default Check-Out Time</Label>
              <Input
                type='time'
                value={settings.default_check_out_time}
                onChange={e =>
                  setSettings({
                    ...settings,
                    default_check_out_time: e.target.value,
                  })
                }
              />
              <p className='text-xs text-gray-500'>
                Standard check-out time for employees
              </p>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Standard Work Hours</Label>
              <Input
                type='number'
                step='0.5'
                min='1'
                max='24'
                value={settings.standard_work_hours}
                onChange={e =>
                  setSettings({
                    ...settings,
                    standard_work_hours: parseFloat(e.target.value) || 8.0,
                  })
                }
              />
              <p className='text-xs text-gray-500'>Hours per day (e.g., 8.0)</p>
            </div>
            <div className='space-y-2'>
              <Label>Overtime Threshold (hours)</Label>
              <Input
                type='number'
                step='0.5'
                min='1'
                max='24'
                value={settings.overtime_threshold_hours}
                onChange={e =>
                  setSettings({
                    ...settings,
                    overtime_threshold_hours: parseFloat(e.target.value) || 8.0,
                  })
                }
              />
              <p className='text-xs text-gray-500'>
                Hours before overtime applies
              </p>
            </div>
          </div>

          <div className='space-y-2'>
            <Label>Overtime Rate Multiplier</Label>
            <Input
              type='number'
              step='0.1'
              min='1'
              max='3'
              value={settings.overtime_rate_multiplier}
              onChange={e =>
                setSettings({
                  ...settings,
                  overtime_rate_multiplier: parseFloat(e.target.value) || 1.5,
                })
              }
            />
            <p className='text-xs text-gray-500'>
              Overtime pay multiplier (e.g., 1.5 for time-and-a-half)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Break Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Clock className='h-5 w-5' />
            Break Settings
          </CardTitle>
          <CardDescription>Configure break rules and policies</CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Allow Breaks</Label>
              <p className='text-sm text-gray-500'>
                Enable break tracking for employees
              </p>
            </div>
            <Switch
              checked={settings.allow_breaks}
              onCheckedChange={checked =>
                setSettings({ ...settings, allow_breaks: checked })
              }
            />
          </div>

          {settings.allow_breaks && (
            <>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Max Break Duration (minutes)</Label>
                  <Input
                    type='number'
                    min='5'
                    max='480'
                    value={settings.max_break_duration_minutes}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        max_break_duration_minutes:
                          parseInt(e.target.value) || 60,
                      })
                    }
                  />
                  <p className='text-xs text-gray-500'>
                    Maximum break duration per session
                  </p>
                </div>
                <div className='space-y-2'>
                  <Label>Max Breaks Per Day</Label>
                  <Input
                    type='number'
                    min='1'
                    max='10'
                    value={settings.max_breaks_per_day}
                    onChange={e =>
                      setSettings({
                        ...settings,
                        max_breaks_per_day: parseInt(e.target.value) || 2,
                      })
                    }
                  />
                  <p className='text-xs text-gray-500'>
                    Maximum number of breaks allowed per day
                  </p>
                </div>
              </div>

              <div className='space-y-2'>
                <Label>Unpaid Break Minutes</Label>
                <Input
                  type='number'
                  min='0'
                  max='480'
                  value={settings.unpaid_break_minutes}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      unpaid_break_minutes: parseInt(e.target.value) || 0,
                    })
                  }
                />
                <p className='text-xs text-gray-500'>
                  Break time that doesn't count toward work hours (e.g., lunch)
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Late/Absence Rules */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <AlertTriangle className='h-5 w-5' />
            Late & Absence Rules
          </CardTitle>
          <CardDescription>
            Configure late arrival and absence detection
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>Late Threshold (minutes)</Label>
              <Input
                type='number'
                min='0'
                max='480'
                value={settings.late_threshold_minutes}
                onChange={e =>
                  setSettings({
                    ...settings,
                    late_threshold_minutes: parseInt(e.target.value) || 15,
                  })
                }
              />
              <p className='text-xs text-gray-500'>
                Minutes after check-in time to be considered late
              </p>
            </div>
            <div className='space-y-2'>
              <Label>Absent Threshold (hours)</Label>
              <Input
                type='number'
                min='1'
                max='24'
                value={settings.absent_threshold_hours}
                onChange={e =>
                  setSettings({
                    ...settings,
                    absent_threshold_hours: parseInt(e.target.value) || 4,
                  })
                }
              />
              <p className='text-xs text-gray-500'>
                Hours after check-in time to mark as absent
              </p>
            </div>
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Auto-Mark Absent</Label>
              <p className='text-sm text-gray-500'>
                Automatically mark employees as absent if not checked in by
                specified time
              </p>
            </div>
            <Switch
              checked={settings.auto_mark_absent}
              onCheckedChange={checked =>
                setSettings({ ...settings, auto_mark_absent: checked })
              }
            />
          </div>

          {settings.auto_mark_absent && (
            <div className='space-y-2'>
              <Label>Auto-Mark Absent Time</Label>
              <Input
                type='time'
                value={settings.auto_mark_absent_time}
                onChange={e =>
                  setSettings({
                    ...settings,
                    auto_mark_absent_time: e.target.value,
                  })
                }
              />
              <p className='text-xs text-gray-500'>
                Time to automatically mark as absent if not checked in
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Report Settings
          </CardTitle>
          <CardDescription>
            Configure attendance report preferences
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label>Default Report Format</Label>
            <Select
              value={settings.default_report_format}
              onValueChange={value =>
                setSettings({
                  ...settings,
                  default_report_format: value as 'pdf' | 'excel' | 'csv',
                })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='pdf'>PDF</SelectItem>
                <SelectItem value='excel'>Excel</SelectItem>
                <SelectItem value='csv'>CSV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Include Photos in Reports</Label>
              <p className='text-sm text-gray-500'>
                Include check-in photos in generated reports
              </p>
            </div>
            <Switch
              checked={settings.include_photos_in_reports}
              onCheckedChange={checked =>
                setSettings({ ...settings, include_photos_in_reports: checked })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Include Location in Reports</Label>
              <p className='text-sm text-gray-500'>
                Include location coordinates in reports
              </p>
            </div>
            <Switch
              checked={settings.include_location_in_reports}
              onCheckedChange={checked =>
                setSettings({
                  ...settings,
                  include_location_in_reports: checked,
                })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Include Device Info in Reports</Label>
              <p className='text-sm text-gray-500'>
                Include device information in reports
              </p>
            </div>
            <Switch
              checked={settings.include_device_info_in_reports}
              onCheckedChange={checked =>
                setSettings({
                  ...settings,
                  include_device_info_in_reports: checked,
                })
              }
            />
          </div>

          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Auto-Generate Reports</Label>
              <p className='text-sm text-gray-500'>
                Automatically generate reports at end of period
              </p>
            </div>
            <Switch
              checked={settings.auto_generate_reports}
              onCheckedChange={checked =>
                setSettings({ ...settings, auto_generate_reports: checked })
              }
            />
          </div>

          {settings.auto_generate_reports && (
            <>
              <div className='space-y-2'>
                <Label>Report Generation Schedule</Label>
                <Select
                  value={settings.report_generation_schedule}
                  onValueChange={value =>
                    setSettings({
                      ...settings,
                      report_generation_schedule: value as
                        | 'daily'
                        | 'weekly'
                        | 'monthly'
                        | 'quarterly'
                        | 'yearly'
                        | 'manual',
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='daily'>Daily</SelectItem>
                    <SelectItem value='weekly'>Weekly</SelectItem>
                    <SelectItem value='monthly'>Monthly</SelectItem>
                    <SelectItem value='quarterly'>Quarterly</SelectItem>
                    <SelectItem value='yearly'>Yearly</SelectItem>
                    <SelectItem value='manual'>Manual Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Report Generation Day</Label>
                <Input
                  type='number'
                  min='1'
                  max={
                    settings.report_generation_schedule === 'weekly' ? 7 : 31
                  }
                  value={settings.report_generation_day}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      report_generation_day: parseInt(e.target.value) || 1,
                    })
                  }
                />
                <p className='text-xs text-gray-500'>
                  {settings.report_generation_schedule === 'weekly'
                    ? 'Day of week (1=Monday, 7=Sunday)'
                    : 'Day of month (1-31)'}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Analytics Settings */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            Analytics Settings
          </CardTitle>
          <CardDescription>
            Configure attendance analytics and tracking
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Enable Analytics</Label>
              <p className='text-sm text-gray-500'>
                Enable attendance analytics and insights
              </p>
            </div>
            <Switch
              checked={settings.enable_analytics}
              onCheckedChange={checked =>
                setSettings({ ...settings, enable_analytics: checked })
              }
            />
          </div>

          {settings.enable_analytics && (
            <>
              <div className='space-y-2'>
                <Label>Analytics Retention (days)</Label>
                <Input
                  type='number'
                  min='30'
                  max='3650'
                  value={settings.analytics_retention_days}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      analytics_retention_days: parseInt(e.target.value) || 365,
                    })
                  }
                />
                <p className='text-xs text-gray-500'>
                  How long to keep analytics data (30-3650 days)
                </p>
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Track Overtime Trends</Label>
                  <p className='text-sm text-gray-500'>
                    Track and analyze overtime patterns
                  </p>
                </div>
                <Switch
                  checked={settings.track_overtime_trends}
                  onCheckedChange={checked =>
                    setSettings({ ...settings, track_overtime_trends: checked })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Track Attendance Patterns</Label>
                  <p className='text-sm text-gray-500'>
                    Analyze attendance patterns and trends
                  </p>
                </div>
                <Switch
                  checked={settings.track_attendance_patterns}
                  onCheckedChange={checked =>
                    setSettings({
                      ...settings,
                      track_attendance_patterns: checked,
                    })
                  }
                />
              </div>

              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label>Alert on Anomalies</Label>
                  <p className='text-sm text-gray-500'>
                    Send alerts for unusual attendance patterns
                  </p>
                </div>
                <Switch
                  checked={settings.alert_on_anomalies}
                  onCheckedChange={checked =>
                    setSettings({ ...settings, alert_on_anomalies: checked })
                  }
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
