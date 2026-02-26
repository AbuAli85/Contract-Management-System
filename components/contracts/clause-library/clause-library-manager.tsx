'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Edit, Trash2, BookOpen, Tag, Shield } from 'lucide-react';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'indemnity', label: 'Indemnity' },
  { value: 'liability', label: 'Liability' },
  { value: 'confidentiality', label: 'Confidentiality' },
  { value: 'payment', label: 'Payment' },
  { value: 'termination', label: 'Termination' },
  { value: 'dispute_resolution', label: 'Dispute Resolution' },
  { value: 'intellectual_property', label: 'Intellectual Property' },
  { value: 'force_majeure', label: 'Force Majeure' },
  { value: 'governing_law', label: 'Governing Law' },
  { value: 'custom', label: 'Custom' },
];

interface Clause {
  id: string;
  title: string;
  title_ar?: string;
  content: string;
  content_ar?: string;
  category: string;
  tags: string[];
  is_mandatory: boolean;
  is_active: boolean;
  version: number;
  created_at: string;
}

interface ClauseLibraryManagerProps {
  onSelectClause?: (clause: Clause) => void;
  selectionMode?: boolean;
}

export function ClauseLibraryManager({ onSelectClause, selectionMode = false }: ClauseLibraryManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [editClause, setEditClause] = useState<Clause | null>(null);

  const [form, setForm] = useState({
    title: '', title_ar: '', content: '', content_ar: '',
    category: 'general', tags: '', is_mandatory: false,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['clause-library', search, categoryFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);
      const res = await fetch('/api/contracts/clause-library?' + params.toString());
      if (!res.ok) throw new Error('Failed to fetch clauses');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: typeof form) => {
      const res = await fetch('/api/contracts/clause-library', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          tags: payload.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Clause created', description: 'The clause has been added to the library.' });
      queryClient.invalidateQueries({ queryKey: ['clause-library'] });
      setCreateOpen(false);
      setForm({ title: '', title_ar: '', content: '', content_ar: '', category: 'general', tags: '', is_mandatory: false });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch('/api/contracts/clause-library/' + id, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete clause');
    },
    onSuccess: () => {
      toast({ title: 'Clause deleted' });
      queryClient.invalidateQueries({ queryKey: ['clause-library'] });
    },
    onError: (err: Error) => toast({ title: 'Error', description: err.message, variant: 'destructive' }),
  });

  const clauses: Clause[] = data?.clauses ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-blue-600" />
            Clause Library
          </h2>
          <p className="text-muted-foreground">Manage reusable legal clauses for your contracts</p>
        </div>
        {!selectionMode && (
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />New Clause</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Clause</DialogTitle>
                <DialogDescription>Add a reusable clause to your library</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Title (English)</Label>
                    <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Limitation of Liability" />
                  </div>
                  <div>
                    <Label>Title (Arabic)</Label>
                    <Input dir="rtl" value={form.title_ar} onChange={e => setForm(f => ({ ...f, title_ar: e.target.value }))} placeholder="العنوان بالعربية" />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Content (English)</Label>
                  <Textarea rows={6} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Enter the clause text in English..." />
                </div>
                <div>
                  <Label>Content (Arabic)</Label>
                  <Textarea dir="rtl" rows={6} value={form.content_ar} onChange={e => setForm(f => ({ ...f, content_ar: e.target.value }))} placeholder="أدخل نص البند بالعربية..." />
                </div>
                <div>
                  <Label>Tags (comma-separated)</Label>
                  <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. employment, liability, standard" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.is_mandatory} onCheckedChange={v => setForm(f => ({ ...f, is_mandatory: v }))} />
                  <Label>Mandatory clause (always included in contracts)</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                  <Button onClick={() => createMutation.mutate(form)} disabled={createMutation.isPending || !form.title || !form.content}>
                    {createMutation.isPending ? 'Creating...' : 'Create Clause'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search clauses..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{clauses.length}</div>
            <p className="text-sm text-muted-foreground">Total Clauses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-amber-600">{clauses.filter(c => c.is_mandatory).length}</div>
            <p className="text-sm text-muted-foreground">Mandatory</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{new Set(clauses.map(c => c.category)).size}</div>
            <p className="text-sm text-muted-foreground">Categories</p>
          </CardContent>
        </Card>
      </div>

      {/* Clause List */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">Loading clauses...</div>
      ) : clauses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No clauses found. Create your first clause to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {clauses.map(clause => (
            <Card key={clause.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{clause.title}</h3>
                      {clause.title_ar && <span className="text-sm text-muted-foreground" dir="rtl">{clause.title_ar}</span>}
                      <Badge variant="outline">{CATEGORIES.find(c => c.value === clause.category)?.label ?? clause.category}</Badge>
                      {clause.is_mandatory && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          <Shield className="h-3 w-3 mr-1" />Mandatory
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">v{clause.version}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{clause.content}</p>
                    {clause.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {clause.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            <Tag className="h-2.5 w-2.5 mr-1" />{tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {selectionMode ? (
                      <Button size="sm" onClick={() => onSelectClause?.(clause)}>Select</Button>
                    ) : (
                      <>
                        <Button size="sm" variant="ghost" onClick={() => setEditClause(clause)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700"
                          onClick={() => { if (confirm('Delete this clause?')) deleteMutation.mutate(clause.id); }}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
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
