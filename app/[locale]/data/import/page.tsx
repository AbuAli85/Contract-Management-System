'use client';
import { useState, useRef } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, CheckCircle2, AlertTriangle, Loader2, Download } from 'lucide-react';

const IMPORT_TEMPLATES: Record<string, { headers: string[]; table: string; description: string }> = {
  employees: { headers: ['full_name','email','department','position','salary','nationality','phone'], table: 'employees', description: 'Import employee records' },
  promoters: { headers: ['full_name','email','nationality','phone','id_number'], table: 'promoters', description: 'Import promoter profiles' },
  leave_requests: { headers: ['employee_id','leave_type','start_date','end_date','reason'], table: 'leave_requests', description: 'Import leave requests' },
};

export default function DataImportPage() {
  const [module, setModule] = useState('employees');
  const [file, setFile] = useState<File|null>(null);
  const [preview, setPreview] = useState<string[][]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{success:number;errors:string[]}|null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = ev => {
      const text = ev.target?.result as string;
      const rows = text.split('\n').filter(Boolean).map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
      setPreview(rows.slice(0, 6));
    };
    reader.readAsText(f);
  }

  async function runImport() {
    if (!file) return;
    setImporting(true);
    setResult(null);
    try {
      const text = await file.text();
      const rows = text.split('\n').filter(Boolean).map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
      const headers = rows[0];
      const dataRows = rows.slice(1);
      const template = IMPORT_TEMPLATES[module];
      let success = 0;
      const errors: string[] = [];
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        if (row.length < 2) continue;
        const obj: Record<string,string> = {};
        headers.forEach((h, idx) => { obj[h] = row[idx] || ''; });
        const { error } = await supabase.from(template.table).insert(obj);
        if (error) errors.push(`Row ${i+2}: ${error.message}`);
        else success++;
      }
      setResult({ success, errors });
    } catch(e:unknown) { setResult({ success: 0, errors: [(e as Error).message] }); } finally { setImporting(false); }
  }

  function downloadTemplate() {
    const template = IMPORT_TEMPLATES[module];
    const csv = template.headers.join(',') + '\nexample_value1,example_value2,' + template.headers.slice(2).map(()=>'').join(',');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `${module}-import-template.csv`;
    a.click();
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3"><Upload className="h-8 w-8 text-blue-600" />Data Import</h1>
        <p className="text-gray-500 mt-1">Import data from CSV files into the platform</p>
      </div>
      <Card className="mb-6">
        <CardHeader><CardTitle>Import Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Module</label>
            <Select value={module} onValueChange={v=>{setModule(v);setFile(null);setPreview([]);setResult(null);}}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(IMPORT_TEMPLATES).map(([k,v])=><SelectItem key={k} value={k}>{k.charAt(0).toUpperCase()+k.slice(1).replace('_',' ')} — {v.description}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={downloadTemplate} className="gap-2"><Download className="h-4 w-4" />Download Template</Button>
            <span className="text-xs text-gray-500">Download a CSV template with the correct column headers</span>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Upload CSV File</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors" onClick={()=>fileRef.current?.click()}>
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">{file ? file.name : 'Click to upload or drag and drop a CSV file'}</p>
              <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
            </div>
          </div>
        </CardContent>
      </Card>
      {preview.length > 0 && (
        <Card className="mb-6">
          <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Preview (first 5 rows)</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead><tr>{preview[0]?.map((h,i)=><th key={i} className="border px-2 py-1 bg-gray-50 text-left font-medium">{h}</th>)}</tr></thead>
                <tbody>{preview.slice(1).map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j} className="border px-2 py-1">{cell}</td>)}</tr>)}</tbody>
              </table>
            </div>
            <Button onClick={runImport} disabled={importing} className="mt-4 gap-2">
              {importing?<Loader2 className="h-4 w-4 animate-spin"/>:<Upload className="h-4 w-4"/>}
              {importing?'Importing...':'Start Import'}
            </Button>
          </CardContent>
        </Card>
      )}
      {result && (
        <Card className={result.errors.length===0?'border-green-200 bg-green-50':'border-yellow-200 bg-yellow-50'}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">{result.errors.length===0?<CheckCircle2 className="h-5 w-5 text-green-600"/>:<AlertTriangle className="h-5 w-5 text-yellow-600"/>}<span className="font-semibold">{result.success} records imported successfully</span></div>
            {result.errors.length > 0 && <div className="mt-2 space-y-1">{result.errors.slice(0,10).map((e,i)=><p key={i} className="text-xs text-red-600">{e}</p>)}</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
