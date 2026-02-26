'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Plus, CheckCircle, XCircle, Clock, FileText, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'emergency', label: 'Emergency Leave' },
  { value: 'maternity', label: 'Maternity Leave' },
  { value: 'paternity', label: 'Paternity Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
  { value: 'hajj', label: 'Hajj Leave' },
  { value: 'other', label: 'Other' },
];

const STATUS_CONFIG: any = {
  pending:  { label: 'Pending',  color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-800',  icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800',     icon: XCircle },
  cancelled:{ label: 'Cancelled',color: 'bg-gray-100 text-gray-800',   icon: AlertCircle },
};

function daysBetween(start: string, end: string): number {
  const s = new Date(start), e = new Date(end);
  return Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
}

export default function LeaveRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [reviewDialog, setReviewDialog] = useState<any>({ open: false, request: null, action: null });
  const [reviewNotes, setReviewNotes] = useState('');
  const [form, setForm] = useState({ employee_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: reqs }, { data: emps }] = await Promise.all([
      supabase.from('leave_requests').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('id,full_name').eq('status', 'active'),
    ]);
    const empMap: any = Object.fromEntries((emps || []).map((e: any) => [e.id, e.full_name]));
    setRequests((reqs || []).map((r: any) => ({ ...r, employee_name: empMap[r.employee_id] || 'Unknown' })));
    setEmployees(emps || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function submitRequest() {
    if (!form.employee_id || !form.start_date || !form.end_date) {
      toast({ title: 'Missing fields', variant: 'destructive' }); return;
    }
    const days = daysBetween(form.start_date, form.end_date);
    const { error } = await supabase.from('leave_requests').insert({ ...form, days_requested: days, status: 'pending' });
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Leave request submitted' });
    setShowNew(false);
    setForm({ employee_id: '', leave_type: 'annual', start_date: '', end_date: '', reason: '' });
    fetchData();
  }

  async function reviewRequest() {
    if (!reviewDialog.request) return;
    const status = reviewDialog.action === 'approve' ? 'approved' : 'rejected';
    const { error } = await supabase.from('leave_requests')
      .update({ status, reviewer_notes: reviewNotes, reviewed_at: new Date().toISOString() })
      .eq('id', reviewDialog.request.id);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: `Request ${status}` });
    setReviewDialog({ open: false, request: null, action: null });
    setReviewNotes('');
    fetchData();
  }

  const filtered = requests.filter(r => statusFilter === 'all' || r.status === statusFilter);
  const pending = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Calendar className="h-8 w-8 text-blue-600" />Leave Requests
          </h1>
          <p className="text-gray-500 mt-1">Manage and approve employee leave applications</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />New Request</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Submit Leave Request</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <Select value={form.employee_id} onValueChange={v => setForm(p => ({ ...p, employee_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee *" /></SelectTrigger>
                <SelectContent>
                  {employees.map((e: any) => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={form.leave_type} onValueChange={v => setForm(p => ({ ...p, leave_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEAVE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium mb-1 block">Start Date *</label>
                  <Input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">End Date *</label>
                  <Input type="date" value={form.end_date} min={form.start_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))} />
                </div>
              </div>
              {form.start_date && form.end_date && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                  Duration: <strong>{daysBetween(form.start_date, form.end_date)} day(s)</strong>
                </div>
              )}
              <Textarea placeholder="Reason for leave..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))} rows={3} />
              <Button onClick={submitRequest} disabled={!form.employee_id || !form.start_date || !form.end_date} className="w-full">
                Submit Request
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Requests', value: requests.length, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Review', value: pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Approved', value: requests.filter(r => r.status === 'approved').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Days Approved', value: requests.filter(r => r.status === 'approved').reduce((s: number, r: any) => s + (r.days_requested || 0), 0), icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex items-center gap-3 mb-4">
        {['all', 'pending', 'approved', 'rejected', 'cancelled'].map(s => (
          <Button key={s} variant={statusFilter === s ? 'default' : 'outline'} size="sm" className="capitalize" onClick={() => setStatusFilter(s)}>
            {s === 'all' ? 'All' : STATUS_CONFIG[s]?.label || s}
            {s === 'pending' && pending > 0 && (
              <Badge className="ml-2 bg-yellow-500 text-white text-xs px-1.5 py-0">{pending}</Badge>
            )}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-gray-400">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No leave requests found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((req: any) => {
                  const sc = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                  const StatusIcon = sc.icon;
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{req.employee_name}</TableCell>
                      <TableCell>{LEAVE_TYPES.find(t => t.value === req.leave_type)?.label || req.leave_type}</TableCell>
                      <TableCell>{new Date(req.start_date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(req.end_date).toLocaleDateString()}</TableCell>
                      <TableCell><Badge variant="outline">{req.days_requested}d</Badge></TableCell>
                      <TableCell>
                        <Badge className={`${sc.color} gap-1`} variant="secondary">
                          <StatusIcon className="h-3 w-3" />{sc.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-500 text-sm">{new Date(req.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {req.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" className="text-green-600 border-green-300"
                              onClick={() => setReviewDialog({ open: true, request: req, action: 'approve' })}>
                              <CheckCircle className="h-3 w-3 mr-1" />Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300"
                              onClick={() => setReviewDialog({ open: true, request: req, action: 'reject' })}>
                              <XCircle className="h-3 w-3 mr-1" />Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={reviewDialog.open} onOpenChange={(open: boolean) => setReviewDialog((p: any) => ({ ...p, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className={reviewDialog.action === 'approve' ? 'text-green-700' : 'text-red-700'}>
              {reviewDialog.action === 'approve' ? '✓ Approve' : '✗ Reject'} Leave Request
            </DialogTitle>
          </DialogHeader>
          {reviewDialog.request && (
            <div className="space-y-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
                <div><strong>Employee:</strong> {reviewDialog.request.employee_name}</div>
                <div><strong>Period:</strong> {new Date(reviewDialog.request.start_date).toLocaleDateString()} — {new Date(reviewDialog.request.end_date).toLocaleDateString()} ({reviewDialog.request.days_requested} days)</div>
                {reviewDialog.request.reason && <div><strong>Reason:</strong> {reviewDialog.request.reason}</div>}
              </div>
              <Textarea placeholder="Reviewer notes (optional)..." value={reviewNotes} onChange={e => setReviewNotes(e.target.value)} rows={3} />
              <div className="flex gap-3">
                <Button onClick={reviewRequest}
                  className={`flex-1 ${reviewDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                  Confirm {reviewDialog.action === 'approve' ? 'Approval' : 'Rejection'}
                </Button>
                <Button variant="outline" onClick={() => setReviewDialog({ open: false, request: null, action: null })} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
