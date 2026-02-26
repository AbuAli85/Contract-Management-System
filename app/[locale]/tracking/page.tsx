'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Package, FileText, CheckSquare, Clock, AlertCircle, TrendingUp, Activity } from 'lucide-react';

export default function TrackingPage() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: c }, { data: t }] = await Promise.all([
      supabase.from('contracts').select('id,contract_number,status,contract_value,created_at,first_party_name,second_party_name').order('created_at', { ascending: false }).limit(50),
      supabase.from('tasks').select('id,title,status,priority,due_date,assigned_to').order('created_at', { ascending: false }).limit(50),
    ]);
    setContracts(c || []);
    setTasks(t || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const CONTRACT_STATUS: any = {
    draft: { color: 'bg-gray-100 text-gray-700', label: 'Draft' },
    pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
    active: { color: 'bg-green-100 text-green-800', label: 'Active' },
    approved: { color: 'bg-blue-100 text-blue-800', label: 'Approved' },
    expired: { color: 'bg-red-100 text-red-800', label: 'Expired' },
    cancelled: { color: 'bg-gray-100 text-gray-500', label: 'Cancelled' },
  };

  const TASK_PRIORITY: any = {
    low: { color: 'bg-gray-100 text-gray-600', label: 'Low' },
    medium: { color: 'bg-blue-100 text-blue-700', label: 'Medium' },
    high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
    urgent: { color: 'bg-red-100 text-red-700', label: 'Urgent' },
  };

  const filteredContracts = contracts.filter(c =>
    !search || c.contract_number?.toLowerCase().includes(search.toLowerCase()) ||
    c.first_party_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.second_party_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredTasks = tasks.filter(t =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase())
  );

  const now = new Date();
  const overdueTasks = tasks.filter(t => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now);
  const activeContracts = contracts.filter(c => c.status === 'active' || c.status === 'approved');

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-600" />Tracking Center
          </h1>
          <p className="text-gray-500 mt-1">Monitor contracts, tasks, and all active workflows in real time</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="Search anything..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-64" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Contracts', value: activeContracts.length, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending Contracts', value: contracts.filter(c => c.status === 'pending').length, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Open Tasks', value: tasks.filter(t => t.status !== 'completed').length, icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Overdue Tasks', value: overdueTasks.length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
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

      <Tabs defaultValue="contracts">
        <TabsList className="mb-6">
          <TabsTrigger value="contracts" className="gap-2"><FileText className="h-4 w-4" />Contracts ({filteredContracts.length})</TabsTrigger>
          <TabsTrigger value="tasks" className="gap-2"><CheckSquare className="h-4 w-4" />Tasks ({filteredTasks.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="contracts">
          {loading ? <div className="space-y-3">{[...Array(5)].map((_,i) => <Card key={i} className="animate-pulse"><CardContent className="pt-4"><div className="h-12 bg-gray-200 rounded" /></CardContent></Card>)}</div> :
          filteredContracts.length === 0 ? <div className="text-center py-16 text-gray-400"><FileText className="h-16 w-16 mx-auto mb-4 opacity-30" /><p>No contracts found</p></div> : (
            <div className="space-y-3">
              {filteredContracts.map(c => {
                const sc = CONTRACT_STATUS[c.status] || CONTRACT_STATUS.draft;
                return (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold">{c.contract_number || 'No Number'}</div>
                            <div className="text-sm text-gray-500">{c.first_party_name} → {c.second_party_name}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {c.contract_value && <div className="text-sm font-medium text-gray-700">OMR {Number(c.contract_value).toLocaleString()}</div>}
                          <Badge className={sc.color} variant="secondary">{sc.label}</Badge>
                          <div className="text-xs text-gray-400">{new Date(c.created_at).toLocaleDateString()}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="tasks">
          {loading ? <div className="space-y-3">{[...Array(5)].map((_,i) => <Card key={i} className="animate-pulse"><CardContent className="pt-4"><div className="h-12 bg-gray-200 rounded" /></CardContent></Card>)}</div> :
          filteredTasks.length === 0 ? <div className="text-center py-16 text-gray-400"><CheckSquare className="h-16 w-16 mx-auto mb-4 opacity-30" /><p>No tasks found</p></div> : (
            <div className="space-y-3">
              {filteredTasks.map(t => {
                const pc = TASK_PRIORITY[t.priority] || TASK_PRIORITY.medium;
                const isOverdue = t.status !== 'completed' && t.due_date && new Date(t.due_date) < now;
                return (
                  <Card key={t.id} className={`hover:shadow-md transition-shadow ${isOverdue ? 'border-red-200' : ''}`}>
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${isOverdue ? 'bg-red-50' : 'bg-blue-50'}`}>
                            <CheckSquare className={`h-5 w-5 ${isOverdue ? 'text-red-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <div className="font-semibold">{t.title}</div>
                            <div className="text-sm text-gray-500">
                              {t.due_date ? `Due: ${new Date(t.due_date).toLocaleDateString()}` : 'No due date'}
                              {isOverdue && <span className="ml-2 text-red-600 font-medium">OVERDUE</span>}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={pc.color} variant="secondary">{pc.label}</Badge>
                          <Badge variant="outline" className="capitalize">{t.status?.replace('_', ' ')}</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
