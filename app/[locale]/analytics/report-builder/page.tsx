'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Play, Download, Save } from 'lucide-react';

const ENTITIES = [
  { id: 'contracts', label: 'Contracts', fields: ['id', 'contract_number', 'status', 'contract_type', 'start_date', 'end_date', 'value', 'currency', 'created_at'] },
  { id: 'employees', label: 'Employees', fields: ['id', 'full_name', 'email', 'role', 'created_at'] },
  { id: 'promoters', label: 'Promoters', fields: ['id', 'name', 'nationality', 'status', 'created_at'] },
  { id: 'parties', label: 'Parties / Clients', fields: ['id', 'name', 'type', 'status', 'created_at'] },
  { id: 'deals', label: 'CRM Deals', fields: ['id', 'title', 'stage', 'value', 'currency', 'probability', 'expected_close', 'created_at'] },
  { id: 'bookings', label: 'Bookings', fields: ['id', 'status', 'total_amount', 'currency', 'created_at'] },
  { id: 'payroll', label: 'Payroll Runs', fields: ['id', 'status', 'total_amount', 'currency', 'pay_period_start', 'pay_period_end', 'created_at'] },
];

export default function ReportBuilderPage() {
  const { toast } = useToast();
  const [entity, setEntity] = useState('contracts');
  const [selectedFields, setSelectedFields] = useState<string[]>(['id', 'status', 'created_at']);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [orderBy, setOrderBy] = useState('created_at');
  const [orderDir, setOrderDir] = useState<'asc' | 'desc'>('desc');
  const [limit, setLimit] = useState('100');
  const [saveName, setSaveName] = useState('');
  const [results, setResults] = useState<Record<string, unknown>[] | null>(null);
  const [total, setTotal] = useState(0);

  const currentEntity = ENTITIES.find(e => e.id === entity)!;

  const runMutation = useMutation({
    mutationFn: async (saveAs?: string) => {
      const definition = {
        entity,
        fields: selectedFields,
        order_by: orderBy,
        order_dir: orderDir,
        limit: parseInt(limit),
        ...(dateFrom && dateTo ? { date_range: { from: dateFrom, to: dateTo, field: 'created_at' } } : {}),
      };
      const res = await fetch('/api/analytics/report-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ definition, save_as: saveAs }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: (data, saveAs) => {
      setResults(data.data);
      setTotal(data.total);
      if (saveAs) toast({ title: 'Report saved as "' + saveAs + '"' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const toggleField = (field: string) => {
    setSelectedFields(prev =>
      prev.includes(field) ? prev.filter(f => f !== field) : [...prev, field]
    );
  };

  const exportCSV = () => {
    if (!results?.length) return;
    const headers = Object.keys(results[0]);
    const rows = results.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = entity + '_report_' + new Date().toISOString().split('T')[0] + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-6">
      <div className="flex items-center gap-3">
        <BarChart3 className="h-7 w-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Custom Report Builder</h1>
          <p className="text-muted-foreground">Build and export custom reports from any data source</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Data Source</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Entity</Label>
                <Select value={entity} onValueChange={v => { setEntity(v); setSelectedFields(['id', 'created_at']); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTITIES.map(e => <SelectItem key={e.id} value={e.id}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="mb-2 block">Fields to Include</Label>
                <div className="flex flex-wrap gap-2">
                  {currentEntity.fields.map(field => (
                    <Badge
                      key={field}
                      variant={selectedFields.includes(field) ? 'default' : 'outline'}
                      className="cursor-pointer select-none"
                      onClick={() => toggleField(field)}
                    >
                      {field}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Filters & Sorting</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Date From</Label>
                  <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                </div>
                <div>
                  <Label>Date To</Label>
                  <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Order By</Label>
                  <Select value={orderBy} onValueChange={setOrderBy}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currentEntity.fields.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Direction</Label>
                  <Select value={orderDir} onValueChange={v => setOrderDir(v as 'asc' | 'desc')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="desc">Descending</SelectItem>
                      <SelectItem value="asc">Ascending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Max Rows</Label>
                <Input type="number" value={limit} onChange={e => setLimit(e.target.value)} min="1" max="5000" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Actions</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={() => runMutation.mutate(undefined)} disabled={runMutation.isPending || selectedFields.length === 0}>
                <Play className="h-4 w-4 mr-2" />
                {runMutation.isPending ? 'Running...' : 'Run Report'}
              </Button>
              <div className="flex gap-2">
                <Input placeholder="Save as..." value={saveName} onChange={e => setSaveName(e.target.value)} />
                <Button variant="outline" size="icon" onClick={() => saveName && runMutation.mutate(saveName)} disabled={!saveName || runMutation.isPending}>
                  <Save className="h-4 w-4" />
                </Button>
              </div>
              {results && results.length > 0 && (
                <Button variant="outline" className="w-full" onClick={exportCSV}>
                  <Download className="h-4 w-4 mr-2" />Export CSV
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Results
                {results !== null && (
                  <Badge variant="secondary">{total} rows</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {results === null ? (
                <div className="text-center py-16 text-muted-foreground">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
                  <p>Configure your report and click Run to see results</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p>No data found for the selected criteria</p>
                </div>
              ) : (
                <div className="overflow-auto max-h-[600px]">
                  <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        {Object.keys(results[0]).map(col => (
                          <th key={col} className="text-left p-2 border-b font-medium whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((row, i) => (
                        <tr key={i} className="hover:bg-muted/50 border-b">
                          {Object.values(row).map((val, j) => (
                            <td key={j} className="p-2 whitespace-nowrap max-w-[200px] truncate">
                              {val === null || val === undefined ? (
                                <span className="text-muted-foreground italic">—</span>
                              ) : String(val)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
