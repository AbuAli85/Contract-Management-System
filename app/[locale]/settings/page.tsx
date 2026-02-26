'use client';
import { useState, useEffect } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings, Building2, Bell, Shield, Globe, Palette, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ full_name: '', email: '', phone: '', position: '' });
  const [notifications, setNotifications] = useState({ email_alerts: true, whatsapp_alerts: false, contract_expiry: true, task_reminders: true, leave_approvals: true });
  const [company, setCompany] = useState({ name: '', timezone: 'Asia/Muscat', language: 'en', currency: 'OMR', date_format: 'DD/MM/YYYY' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setProfile({ full_name: user.user_metadata?.full_name || '', email: user.email || '', phone: user.user_metadata?.phone || '', position: user.user_metadata?.position || '' });
      }
    }
    load();
  }, [supabase]);

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: profile.full_name, phone: profile.phone, position: profile.position } });
    setSaving(false);
    if (error) { toast({ title: 'Error saving profile', variant: 'destructive' }); return; }
    toast({ title: 'Profile saved successfully' });
  }

  async function saveNotifications() {
    setSaving(true);
    await new Promise(r => setTimeout(r, 500));
    setSaving(false);
    toast({ title: 'Notification preferences saved' });
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center"><Settings className="h-6 w-6 text-gray-600" /></div>
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-gray-500">Manage your account and platform preferences</p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="mb-6 grid grid-cols-4 w-full">
          <TabsTrigger value="profile" className="gap-2"><Shield className="h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2"><Bell className="h-4 w-4" />Notifications</TabsTrigger>
          <TabsTrigger value="company" className="gap-2"><Building2 className="h-4 w-4" />Company</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2"><Palette className="h-4 w-4" />Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Personal Information</CardTitle><CardDescription>Update your personal details and contact information</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="mb-1.5 block">Full Name</Label><Input value={profile.full_name} onChange={e => setProfile(p => ({...p, full_name: e.target.value}))} /></div>
                <div><Label className="mb-1.5 block">Email</Label><Input value={profile.email} disabled className="bg-gray-50" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="mb-1.5 block">Phone</Label><Input value={profile.phone} onChange={e => setProfile(p => ({...p, phone: e.target.value}))} placeholder="+968 9XXX XXXX" /></div>
                <div><Label className="mb-1.5 block">Position / Title</Label><Input value={profile.position} onChange={e => setProfile(p => ({...p, position: e.target.value}))} placeholder="e.g. HR Manager" /></div>
              </div>
              <Button onClick={saveProfile} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Profile'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader><CardTitle>Notification Preferences</CardTitle><CardDescription>Control how and when you receive alerts</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              {[
                { key: 'email_alerts', label: 'Email Notifications', desc: 'Receive notifications via email' },
                { key: 'whatsapp_alerts', label: 'WhatsApp Notifications', desc: 'Receive notifications via WhatsApp' },
                { key: 'contract_expiry', label: 'Contract Expiry Alerts', desc: 'Get notified before contracts expire' },
                { key: 'task_reminders', label: 'Task Reminders', desc: 'Reminders for upcoming and overdue tasks' },
                { key: 'leave_approvals', label: 'Leave Approval Alerts', desc: 'Notifications for leave request status changes' },
              ].map(n => (
                <div key={n.key} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="font-medium">{n.label}</div>
                    <div className="text-sm text-gray-500">{n.desc}</div>
                  </div>
                  <Switch checked={(notifications as any)[n.key]} onCheckedChange={v => setNotifications(p => ({...p, [n.key]: v}))} />
                </div>
              ))}
              <Button onClick={saveNotifications} disabled={saving} className="gap-2"><Save className="h-4 w-4" />{saving ? 'Saving...' : 'Save Preferences'}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card>
            <CardHeader><CardTitle>Company Settings</CardTitle><CardDescription>Configure platform-wide settings for your organization</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div><Label className="mb-1.5 block">Company Name</Label><Input value={company.name} onChange={e => setCompany(p => ({...p, name: e.target.value}))} placeholder="Your Company Name" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="mb-1.5 block">Timezone</Label>
                  <Select value={company.timezone} onValueChange={v => setCompany(p => ({...p, timezone: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Muscat">Asia/Muscat (GMT+4)</SelectItem>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (GMT+4)</SelectItem>
                      <SelectItem value="Asia/Riyadh">Asia/Riyadh (GMT+3)</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="mb-1.5 block">Default Language</Label>
                  <Select value={company.language} onValueChange={v => setCompany(p => ({...p, language: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="ar">Arabic (العربية)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label className="mb-1.5 block">Currency</Label>
                  <Select value={company.currency} onValueChange={v => setCompany(p => ({...p, currency: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OMR">OMR — Omani Rial</SelectItem>
                      <SelectItem value="AED">AED — UAE Dirham</SelectItem>
                      <SelectItem value="SAR">SAR — Saudi Riyal</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="mb-1.5 block">Date Format</Label>
                  <Select value={company.date_format} onValueChange={v => setCompany(p => ({...p, date_format: v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => toast({ title: 'Company settings saved' })} className="gap-2"><Save className="h-4 w-4" />Save Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader><CardTitle>Appearance</CardTitle><CardDescription>Customize the look and feel of your platform</CardDescription></CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="mb-3 block font-medium">Theme</Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light', label: 'Light', bg: 'bg-white border-2 border-blue-500' },
                    { id: 'dark', label: 'Dark', bg: 'bg-gray-900 border-2 border-gray-700' },
                    { id: 'system', label: 'System', bg: 'bg-gradient-to-r from-white to-gray-900 border-2 border-gray-300' },
                  ].map(t => (
                    <div key={t.id} className={`h-20 rounded-xl cursor-pointer flex items-end p-2 ${t.bg}`}>
                      <span className={`text-xs font-medium ${t.id === 'dark' ? 'text-white' : 'text-gray-700'}`}>{t.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label className="mb-3 block font-medium">Accent Color</Label>
                <div className="flex gap-3">
                  {['bg-blue-600', 'bg-purple-600', 'bg-green-600', 'bg-orange-600', 'bg-red-600', 'bg-teal-600'].map(c => (
                    <div key={c} className={`h-8 w-8 rounded-full cursor-pointer ${c} ring-2 ring-offset-2 ring-transparent hover:ring-gray-400 transition-all`} />
                  ))}
                </div>
              </div>
              <Button onClick={() => toast({ title: 'Appearance settings saved' })} className="gap-2"><Save className="h-4 w-4" />Save Appearance</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
