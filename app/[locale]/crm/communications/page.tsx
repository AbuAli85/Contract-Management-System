'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Phone, Mail, MessageSquare, Users, Calendar, ArrowUpRight, ArrowDownLeft,
} from 'lucide-react';

const CHANNEL_ICONS: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
  meeting: <Users className="h-4 w-4" />,
  note: <MessageSquare className="h-4 w-4" />,
};

const CHANNEL_COLORS: Record<string, string> = {
  email: 'bg-blue-100 text-blue-700',
  phone: 'bg-green-100 text-green-700',
  whatsapp: 'bg-emerald-100 text-emerald-700',
  meeting: 'bg-purple-100 text-purple-700',
  note: 'bg-gray-100 text-gray-700',
};

export default function CommunicationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    contact_type: 'party', contact_id: '', contact_name: '',
    contact_email: '', channel: 'email', direction: 'outbound',
    subject: '', body: '', outcome: '', duration_mins: '',
    follow_up_date: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['crm-communications'],
    queryFn: async () => {
      const res = await fetch('/api/crm/communications?limit=100');
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await fetch('/api/crm/communications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          duration_mins: payload.duration_mins ? parseInt(payload.duration_mins) : undefined,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Communication logged' });
      queryClient.invalidateQueries({ queryKey: ['crm-communications'] });
      setCreateOpen(false);
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const communications = data?.communications ?? [];

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-blue-600" />
            Communication Log
          </h1>
          <p className="text-muted-foreground">Track all interactions with contacts, clients, and partners</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Log Communication</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Log Communication</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Contact Type</Label>
                  <Select value={form.contact_type} onValueChange={v => setForm(f => ({ ...f, contact_type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['party', 'promoter', 'employer', 'employee', 'applicant'].map(t => (
                        <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Channel</Label>
                  <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['email', 'phone', 'whatsapp', 'meeting', 'note', 'sms', 'other'].map(c => (
                        <SelectItem key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Contact or company name" />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input type="email" value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Direction</Label>
                  <Select value={form.direction} onValueChange={v => setForm(f => ({ ...f, direction: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="outbound">Outbound</SelectItem>
                      <SelectItem value="inbound">Inbound</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Duration (mins)</Label>
                  <Input type="number" value={form.duration_mins} onChange={e => setForm(f => ({ ...f, duration_mins: e.target.value }))} placeholder="e.g. 30" />
                </div>
              </div>
              <div>
                <Label>Subject</Label>
                <Input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div>
                <Label>Notes / Body</Label>
                <Textarea rows={3} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
              </div>
              <div>
                <Label>Outcome</Label>
                <Input value={form.outcome} onChange={e => setForm(f => ({ ...f, outcome: e.target.value }))} placeholder="e.g. Agreed to proceed, Follow-up scheduled" />
              </div>
              <div>
                <Label>Follow-up Date</Label>
                <Input type="date" value={form.follow_up_date} onChange={e => setForm(f => ({ ...f, follow_up_date: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Logging...' : 'Log Communication'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : communications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No communications logged yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {communications.map((comm: {
            id: string;
            channel: string;
            direction: string;
            contact_name?: string;
            contact_email?: string;
            subject?: string;
            body?: string;
            outcome?: string;
            duration_mins?: number;
            follow_up_date?: string;
            logged_at: string;
          }) => (
            <Card key={comm.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-full ${CHANNEL_COLORS[comm.channel] ?? 'bg-gray-100 text-gray-700'}`}>
                    {CHANNEL_ICONS[comm.channel] ?? <MessageSquare className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{comm.contact_name ?? 'Unknown Contact'}</span>
                      {comm.contact_email && <span className="text-sm text-muted-foreground">{comm.contact_email}</span>}
                      <Badge variant="outline" className="text-xs capitalize">{comm.channel}</Badge>
                      <Badge variant="secondary" className="text-xs flex items-center gap-1">
                        {comm.direction === 'outbound'
                          ? <ArrowUpRight className="h-3 w-3" />
                          : <ArrowDownLeft className="h-3 w-3" />}
                        {comm.direction}
                      </Badge>
                    </div>
                    {comm.subject && <p className="font-medium text-sm mt-1">{comm.subject}</p>}
                    {comm.body && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{comm.body}</p>}
                    {comm.outcome && (
                      <p className="text-sm text-green-700 mt-1">
                        <span className="font-medium">Outcome:</span> {comm.outcome}
                      </p>
                    )}
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{new Date(comm.logged_at).toLocaleString()}</span>
                      {comm.duration_mins && <span>{comm.duration_mins} min</span>}
                      {comm.follow_up_date && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Calendar className="h-3 w-3" />
                          Follow-up: {new Date(comm.follow_up_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
