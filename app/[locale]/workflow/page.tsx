'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { GitBranch, Plus, Play, Pause, Trash2, Settings, Zap, Bell, FileText, Users, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const TRIGGER_TYPES = [
  { value: 'contract_expiry', label: 'Contract Expiry', icon: FileText },
  { value: 'task_overdue', label: 'Task Overdue', icon: Clock },
  { value: 'leave_submitted', label: 'Leave Submitted', icon: Users },
  { value: 'document_expiry', label: 'Document Expiry', icon: FileText },
  { value: 'new_employee', label: 'New Employee Added', icon: Users },
  { value: 'contract_approved', label: 'Contract Approved', icon: FileText },
];

const ACTION_TYPES = [
  { value: 'send_email', label: 'Send Email Notification' },
  { value: 'send_whatsapp', label: 'Send WhatsApp Message' },
  { value: 'create_task', label: 'Create a Task' },
  { value: 'update_status', label: 'Update Record Status' },
  { value: 'notify_manager', label: 'Notify Manager' },
  { value: 'webhook', label: 'Call Webhook (Make.com)' },
];

export default function WorkflowPage() {
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', trigger_type: '', action_type: '', is_active: true, delay_hours: 0 });
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('workflows').select('*').order('created_at', { ascending: false });
    setWorkflows(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchWorkflows(); }, [fetchWorkflows]);

  async function createWorkflow() {
    if (!form.name || !form.trigger_type || !form.action_type) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' }); return;
    }
    const { error } = await supabase.from('workflows').insert({
      name: form.name, description: form.description,
      trigger_type: form.trigger_type, action_type: form.action_type,
      is_active: form.is_active, config: { delay_hours: form.delay_hours },
    });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Workflow created' });
    setShowNew(false);
    setForm({ name: '', description: '', trigger_type: '', action_type: '', is_active: true, delay_hours: 0 });
    fetchWorkflows();
  }

  async function toggleWorkflow(id: string, current: boolean) {
    await supabase.from('workflows').update({ is_active: !current }).eq('id', id);
    fetchWorkflows();
  }

  async function deleteWorkflow(id: string) {
    await supabase.from('workflows').delete().eq('id', id);
    toast({ title: 'Workflow deleted' });
    fetchWorkflows();
  }

  const active = workflows.filter(w => w.is_active).length;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><GitBranch className="h-8 w-8 text-blue-600" />Workflow Automation</h1>
          <p className="text-gray-500 mt-1">Automate repetitive tasks and set up smart triggers across all modules</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />New Workflow</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Automation Workflow</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <Input placeholder="Workflow name *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
              <Textarea placeholder="Description (optional)" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} rows={2} />
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Trigger *</Label>
                <Select value={form.trigger_type} onValueChange={v => setForm(p => ({...p, trigger_type: v}))}>
                  <SelectTrigger><SelectValue placeholder="When this happens..." /></SelectTrigger>
                  <SelectContent>{TRIGGER_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label className="mb-1.5 block text-sm font-medium">Action *</Label>
                <Select value={form.action_type} onValueChange={v => setForm(p => ({...p, action_type: v}))}>
                  <SelectTrigger><SelectValue placeholder="Do this..." /></SelectTrigger>
                  <SelectContent>{ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm">Delay (hours before trigger):</Label>
                <Input type="number" value={form.delay_hours} onChange={e => setForm(p => ({...p, delay_hours: Number(e.target.value)}))} className="w-24" min={0} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(p => ({...p, is_active: v}))} />
                <Label>Activate immediately</Label>
              </div>
              <Button onClick={createWorkflow} disabled={!form.name || !form.trigger_type || !form.action_type} className="w-full">Create Workflow</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Workflows', value: workflows.length, color: 'text-blue-600' },
          { label: 'Active', value: active, color: 'text-green-600' },
          { label: 'Inactive', value: workflows.length - active, color: 'text-gray-500' },
          { label: 'Triggers Available', value: TRIGGER_TYPES.length, color: 'text-purple-600' },
        ].map(s => (
          <Card key={s.label}><CardContent className="pt-6">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </CardContent></Card>
        ))}
      </div>

      {loading ? <div className="space-y-4">{[...Array(3)].map((_,i) => <Card key={i} className="animate-pulse"><CardContent className="pt-4"><div className="h-20 bg-gray-200 rounded" /></CardContent></Card>)}</div> :
      workflows.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <GitBranch className="h-20 w-20 mx-auto mb-4 opacity-20" />
          <p className="text-xl font-medium mb-2">No workflows yet</p>
          <p className="text-sm mb-6">Create your first automation to save time on repetitive tasks</p>
          <Button onClick={() => setShowNew(true)} className="gap-2"><Plus className="h-4 w-4" />Create First Workflow</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map(w => {
            const trigger = TRIGGER_TYPES.find(t => t.value === w.trigger_type);
            const action = ACTION_TYPES.find(a => a.value === w.action_type);
            return (
              <Card key={w.id} className={`transition-all ${w.is_active ? 'border-green-200' : 'opacity-70'}`}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${w.is_active ? 'bg-green-100' : 'bg-gray-100'}`}>
                        <Zap className={`h-6 w-6 ${w.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                      </div>
                      <div>
                        <div className="font-semibold">{w.name}</div>
                        {w.description && <div className="text-sm text-gray-500">{w.description}</div>}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs gap-1"><Bell className="h-3 w-3" />{trigger?.label || w.trigger_type}</Badge>
                          <span className="text-gray-300">→</span>
                          <Badge variant="outline" className="text-xs">{action?.label || w.action_type}</Badge>
                          {w.config?.delay_hours > 0 && <Badge variant="secondary" className="text-xs">{w.config.delay_hours}h delay</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch checked={w.is_active} onCheckedChange={() => toggleWorkflow(w.id, w.is_active)} />
                      <Button variant="ghost" size="icon" onClick={() => deleteWorkflow(w.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
