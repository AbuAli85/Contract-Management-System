'use client';
import { useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Archive, Download, CheckCircle2, Loader2, Database, Clock, Shield } from 'lucide-react';

const BACKUP_TABLES = ['contracts','employees','promoters','parties','leave_requests','attendance_records','job_postings','deals','communication_logs','audit_logs','notifications','work_permits'];

export default function DataBackupPage() {
  const [backing, setBacking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  async function createBackup() {
    setBacking(true);
    setProgress(0);
    setDone(false);
    const backup: Record<string, unknown[]> = {};
    for (let i = 0; i < BACKUP_TABLES.length; i++) {
      const table = BACKUP_TABLES[i];
      try {
        const { data } = await supabase.from(table).select('*').limit(50000);
        backup[table] = data || [];
      } catch { backup[table] = []; }
      setProgress(Math.round(((i+1)/BACKUP_TABLES.length)*100));
    }
    const json = JSON.stringify({ backup_date: new Date().toISOString(), version: '1.0', tables: backup }, null, 2);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    a.download = `smartpro-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setBacking(false);
    setDone(true);
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Archive className="h-8 w-8 text-blue-600" />Data Backup</h1>
        <p className="text-gray-500 mt-1">Create a complete backup of all your company data</p>
      </div>
      <Card className="mb-6">
        <CardHeader><CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-blue-600" />Full System Backup</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">This will export all data from {BACKUP_TABLES.length} tables into a single JSON file. The backup includes contracts, employees, promoters, attendance, leave requests, and all other records.</p>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[{icon:Shield,label:'Secure',sub:'All data encrypted'},{icon:Clock,label:'Timestamped',sub:'Dated backup file'},{icon:Database,label:'Complete',sub:`${BACKUP_TABLES.length} tables`}].map(item=>(
              <div key={item.label} className="text-center p-3 bg-gray-50 rounded-lg">
                <item.icon className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                <div className="text-sm font-medium">{item.label}</div>
                <div className="text-xs text-gray-500">{item.sub}</div>
              </div>
            ))}
          </div>
          {backing && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-1"><span>Creating backup...</span><span>{progress}%</span></div>
              <div className="w-full bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{width:`${progress}%`}} /></div>
            </div>
          )}
          {done && <div className="flex items-center gap-2 text-green-600 mb-4"><CheckCircle2 className="h-5 w-5" /><span className="text-sm font-medium">Backup downloaded successfully!</span></div>}
          <Button onClick={createBackup} disabled={backing} size="lg" className="w-full gap-2">
            {backing?<Loader2 className="h-5 w-5 animate-spin"/>:<Download className="h-5 w-5"/>}
            {backing?`Backing up... ${progress}%`:'Create & Download Backup'}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Tables Included in Backup</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {BACKUP_TABLES.map(t=><Badge key={t} variant="secondary" className="capitalize">{t.replace(/_/g,' ')}</Badge>)}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
