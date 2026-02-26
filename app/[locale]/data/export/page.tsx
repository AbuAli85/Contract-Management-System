'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Users, Briefcase, BarChart3, CheckCircle2, Loader2 } from 'lucide-react';

const EXPORT_MODULES = [
  { id: 'contracts', label: 'Contracts', icon: FileText, table: 'contracts', fields: 'id,contract_number,status,created_at,party_a_name,party_b_name,contract_value' },
  { id: 'employees', label: 'Employees', icon: Users, table: 'employees', fields: 'id,full_name,email,department,position,status,salary,created_at' },
  { id: 'promoters', label: 'Promoters', icon: Users, table: 'promoters', fields: 'id,full_name,email,nationality,status,created_at' },
  { id: 'leave_requests', label: 'Leave Requests', icon: Briefcase, table: 'leave_requests', fields: 'id,leave_type,status,start_date,end_date,created_at' },
  { id: 'job_postings', label: 'Job Postings', icon: Briefcase, table: 'job_postings', fields: 'id,title,department,status,deadline,created_at' },
  { id: 'deals', label: 'CRM Deals', icon: BarChart3, table: 'deals', fields: 'id,title,stage,value,currency,probability,expected_close,created_at' },
  { id: 'audit_logs', label: 'Audit Logs', icon: FileText, table: 'audit_logs', fields: 'id,action,entity_type,entity_id,created_at,ip_address' },
];

export default function DataExportPage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState<string|null>(null);
  const [exported, setExported] = useState<string[]>([]);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x=>x!==id) : [...s, id]);
  }

  async function exportModule(mod: typeof EXPORT_MODULES[0]) {
    setExporting(mod.id);
    try {
      const { data } = await supabase.from(mod.table).select(mod.fields).limit(10000);
      if (!data || data.length === 0) { alert('No data found for ' + mod.label); return; }
      const headers = Object.keys(data[0]);
      const rows = [headers, ...data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')))];
      const csv = rows.map(r => r.join(',')).join('\n');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = `${mod.id}-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      setExported(e => [...e, mod.id]);
    } catch(e) { console.error(e); alert('Export failed'); } finally { setExporting(null); }
  }

  async function exportAll() {
    for (const mod of EXPORT_MODULES.filter(m => selected.includes(m.id))) {
      await exportModule(mod);
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Download className="h-8 w-8 text-blue-600" />Data Export</h1>
        <p className="text-gray-500 mt-1">Export your company data to CSV for analysis or backup</p>
      </div>
      <div className="grid grid-cols-1 gap-4 mb-6">
        {EXPORT_MODULES.map(mod => (
          <Card key={mod.id} className={`transition-all cursor-pointer ${selected.includes(mod.id)?'border-blue-500 bg-blue-50':''}`} onClick={()=>toggle(mod.id)}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox checked={selected.includes(mod.id)} onCheckedChange={()=>toggle(mod.id)} />
                  <mod.icon className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">{mod.label}</div>
                    <div className="text-xs text-gray-500">Table: {mod.table}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {exported.includes(mod.id) && <CheckCircle2 className="h-4 w-4 text-green-600" />}
                  <Button size="sm" variant="outline" onClick={e=>{e.stopPropagation();exportModule(mod);}} disabled={exporting===mod.id} className="gap-1">
                    {exporting===mod.id?<Loader2 className="h-3 w-3 animate-spin"/>:<Download className="h-3 w-3"/>}
                    Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {selected.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{selected.length} module(s) selected</span>
              <Button onClick={exportAll} className="gap-2"><Download className="h-4 w-4" />Export All Selected</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
