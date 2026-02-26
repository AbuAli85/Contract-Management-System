'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Download, RefreshCw, AlertTriangle, Info, CheckCircle2, XCircle } from 'lucide-react';

interface AuditLog { id: string; action: string; entity_type: string; entity_id: string; user_id: string; created_at: string; old_data: Record<string,unknown>|null; new_data: Record<string,unknown>|null; ip_address: string|null; }

const ACTION_COLORS: Record<string,string> = { create:'bg-green-100 text-green-800', update:'bg-blue-100 text-blue-800', delete:'bg-red-100 text-red-800', login:'bg-purple-100 text-purple-800', logout:'bg-gray-100 text-gray-800', approve:'bg-teal-100 text-teal-800', reject:'bg-orange-100 text-orange-800' };

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      let q = supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).range(page*PAGE_SIZE, (page+1)*PAGE_SIZE-1);
      if (entityFilter !== 'all') q = q.eq('entity_type', entityFilter);
      if (search) q = q.ilike('action', `%${search}%`);
      const { data } = await q;
      setLogs(data || []);
    } catch(e){console.error(e);} finally{setLoading(false);}
  }, [supabase, page, entityFilter, search]);

  useEffect(()=>{ fetchLogs(); }, [fetchLogs]);

  function exportCSV() {
    const rows = [['Time','Action','Entity Type','Entity ID','IP Address'], ...logs.map(l=>[new Date(l.created_at).toLocaleString(),l.action,l.entity_type||'',l.entity_id||'',l.ip_address||''])];
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}));a.download='audit-logs.csv';a.click();
  }

  const getActionIcon = (action: string) => {
    if (action.includes('create')||action.includes('add')) return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    if (action.includes('delete')||action.includes('remove')) return <XCircle className="h-4 w-4 text-red-600" />;
    if (action.includes('error')||action.includes('fail')) return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    return <Info className="h-4 w-4 text-blue-600" />;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-bold flex items-center gap-3"><FileText className="h-8 w-8 text-blue-600" />System Audit Logs</h1><p className="text-gray-500 mt-1">Complete trail of all system activities and changes</p></div>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} variant="outline" size="sm" className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
          <Button onClick={exportCSV} variant="outline" size="sm" className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>
        </div>
      </div>
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="relative flex-1"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><Input placeholder="Search actions..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filter by entity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Entities</SelectItem>
                <SelectItem value="contract">Contracts</SelectItem>
                <SelectItem value="employee">Employees</SelectItem>
                <SelectItem value="user">Users</SelectItem>
                <SelectItem value="leave_request">Leave Requests</SelectItem>
                <SelectItem value="promoter">Promoters</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Activity Log ({logs.length} entries)</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="space-y-3">{[...Array(8)].map((_,i)=><div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />)}</div> :
            logs.length === 0 ? <div className="text-center py-12 text-gray-400"><FileText className="h-16 w-16 mx-auto mb-3 opacity-30" /><p className="text-lg font-medium">No audit logs found</p><p className="text-sm">System activity will appear here</p></div> :
            <div className="space-y-2">
              {logs.map(log=>(
                <div key={log.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="mt-0.5">{getActionIcon(log.action)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={ACTION_COLORS[log.action.split('.')[0]] || 'bg-gray-100 text-gray-800'} variant="secondary">{log.action}</Badge>
                      {log.entity_type && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{log.entity_type}</span>}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                      <span>{new Date(log.created_at).toLocaleString()}</span>
                      {log.ip_address && <span>IP: {log.ip_address}</span>}
                      {log.entity_id && <span>ID: {log.entity_id.slice(0,8)}...</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          }
          <div className="flex justify-between items-center mt-4 pt-4 border-t">
            <Button variant="outline" size="sm" onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}>Previous</Button>
            <span className="text-sm text-gray-500">Page {page+1}</span>
            <Button variant="outline" size="sm" onClick={()=>setPage(p=>p+1)} disabled={logs.length<PAGE_SIZE}>Next</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
