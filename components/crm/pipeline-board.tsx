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
import { Plus, DollarSign, User, Calendar, TrendingUp } from 'lucide-react';

const STAGES = [
  { id: 'lead', label: 'Lead', color: 'bg-gray-100 border-gray-300' },
  { id: 'qualified', label: 'Qualified', color: 'bg-blue-50 border-blue-300' },
  { id: 'proposal', label: 'Proposal', color: 'bg-yellow-50 border-yellow-300' },
  { id: 'negotiation', label: 'Negotiation', color: 'bg-orange-50 border-orange-300' },
  { id: 'won', label: 'Won', color: 'bg-green-50 border-green-300' },
  { id: 'lost', label: 'Lost', color: 'bg-red-50 border-red-300' },
];

interface Deal {
  id: string;
  title: string;
  contact_name?: string;
  stage: string;
  value?: number;
  currency?: string;
  probability?: number;
  expected_close?: string;
  assigned_to?: string;
  notes?: string;
}

export function PipelineBoard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: '', contact_name: '', stage: 'lead',
    value: '', currency: 'OMR', probability: '50',
    expected_close: '', notes: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['crm-deals'],
    queryFn: async () => {
      const res = await fetch('/api/crm/deals');
      if (!res.ok) throw new Error('Failed to fetch deals');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await fetch('/api/crm/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          value: payload.value ? parseFloat(payload.value) : undefined,
          probability: parseInt(payload.probability),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Deal created' });
      queryClient.invalidateQueries({ queryKey: ['crm-deals'] });
      setCreateOpen(false);
      setForm({ title: '', contact_name: '', stage: 'lead', value: '', currency: 'OMR', probability: '50', expected_close: '', notes: '' });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const moveMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: string; stage: string }) => {
      const res = await fetch('/api/crm/deals/' + id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error('Failed to update deal');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['crm-deals'] }),
  });

  const pipeline: Record<string, Deal[]> = data?.pipeline ?? {};
  const deals: Deal[] = data?.deals ?? [];

  // Summary stats
  const totalValue = deals.filter(d => d.stage !== 'lost').reduce((s, d) => s + (d.value ?? 0), 0);
  const wonValue = deals.filter(d => d.stage === 'won').reduce((s, d) => s + (d.value ?? 0), 0);
  const activeDeals = deals.filter(d => !['won', 'lost'].includes(d.stage)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            Sales Pipeline
          </h2>
          <p className="text-muted-foreground">Track deals from lead to close</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />New Deal</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Deal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Deal Title *</Label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. ABC Corp - Employment Contract" />
              </div>
              <div>
                <Label>Contact Name</Label>
                <Input value={form.contact_name} onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))} placeholder="Contact or company name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Stage</Label>
                  <Select value={form.stage} onValueChange={v => setForm(f => ({ ...f, stage: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STAGES.map(s => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Probability (%)</Label>
                  <Input type="number" min="0" max="100" value={form.probability} onChange={e => setForm(f => ({ ...f, probability: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Value</Label>
                  <Input type="number" value={form.value} onChange={e => setForm(f => ({ ...f, value: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['OMR', 'USD', 'EUR', 'AED', 'SAR'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Expected Close Date</Label>
                <Input type="date" value={form.expected_close} onChange={e => setForm(f => ({ ...f, expected_close: e.target.value }))} />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.title}>
                  {createMutation.isPending ? 'Creating...' : 'Create Deal'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeDeals}</div>
            <p className="text-sm text-muted-foreground">Active Deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {totalValue.toLocaleString()} OMR
            </div>
            <p className="text-sm text-muted-foreground">Pipeline Value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {wonValue.toLocaleString()} OMR
            </div>
            <p className="text-sm text-muted-foreground">Won This Period</p>
          </CardContent>
        </Card>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading pipeline...</div>
      ) : (
        <div className="grid grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto">
          {STAGES.map(stage => {
            const stageDeals = pipeline[stage.id] ?? [];
            const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0);

            return (
              <div key={stage.id} className={`rounded-lg border-2 ${stage.color} p-3 min-h-[300px]`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">{stage.label}</h3>
                  <Badge variant="secondary" className="text-xs">{stageDeals.length}</Badge>
                </div>
                {stageValue > 0 && (
                  <p className="text-xs text-muted-foreground mb-2">{stageValue.toLocaleString()} OMR</p>
                )}
                <div className="space-y-2">
                  {stageDeals.map((deal: Deal) => (
                    <Card key={deal.id} className="shadow-sm cursor-pointer hover:shadow-md transition-shadow">
                      <CardContent className="p-3">
                        <p className="font-medium text-sm line-clamp-2">{deal.title}</p>
                        {deal.contact_name && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <User className="h-3 w-3" />{deal.contact_name}
                          </p>
                        )}
                        {deal.value && (
                          <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                            <DollarSign className="h-3 w-3" />{deal.value.toLocaleString()} {deal.currency}
                          </p>
                        )}
                        {deal.expected_close && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />{new Date(deal.expected_close).toLocaleDateString()}
                          </p>
                        )}
                        {deal.probability !== undefined && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs mb-1">
                              <span>Probability</span>
                              <span>{deal.probability}%</span>
                            </div>
                            <div className="h-1.5 bg-gray-200 rounded-full">
                              <div
                                className="h-1.5 bg-blue-500 rounded-full"
                                style={{ width: deal.probability + '%' }}
                              />
                            </div>
                          </div>
                        )}
                        {/* Quick move buttons */}
                        <div className="flex gap-1 mt-2 flex-wrap">
                          {STAGES.filter(s => s.id !== deal.stage).slice(0, 2).map(s => (
                            <button
                              key={s.id}
                              onClick={() => moveMutation.mutate({ id: deal.id, stage: s.id })}
                              className="text-xs px-1.5 py-0.5 rounded bg-white border hover:bg-gray-50 transition-colors"
                            >
                              → {s.label}
                            </button>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
