'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Building2, Plus, Search, Users, FileText, Globe, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', name_ar: '', cr_number: '', email: '', phone: '', website: '', industry: '', city: 'Muscat', country: 'Oman' });
  const { toast } = useToast();
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('companies').select('*').order('created_at', { ascending: false });
    setCompanies(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  async function createCompany() {
    if (!form.name) { toast({ title: 'Company name required', variant: 'destructive' }); return; }
    const { error } = await supabase.from('companies').insert(form);
    if (error) { toast({ title: 'Error', description: error.message, variant: 'destructive' }); return; }
    toast({ title: 'Company created' });
    setShowNew(false);
    setForm({ name: '', name_ar: '', cr_number: '', email: '', phone: '', website: '', industry: '', city: 'Muscat', country: 'Oman' });
    fetchCompanies();
  }

  const filtered = companies.filter(c => !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.cr_number?.includes(search));

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Building2 className="h-8 w-8 text-blue-600" />Companies</h1>
          <p className="text-gray-500 mt-1">Manage all registered companies on the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><Input placeholder="Search companies..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" /></div>
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Add Company</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Register New Company</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-4">
                <Input placeholder="Company name (English) *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
                <Input placeholder="اسم الشركة (Arabic)" value={form.name_ar} onChange={e => setForm(p => ({...p, name_ar: e.target.value}))} dir="rtl" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="CR Number" value={form.cr_number} onChange={e => setForm(p => ({...p, cr_number: e.target.value}))} />
                  <Input placeholder="Industry" value={form.industry} onChange={e => setForm(p => ({...p, industry: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
                  <Input placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
                </div>
                <Input placeholder="Website" value={form.website} onChange={e => setForm(p => ({...p, website: e.target.value}))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="City" value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} />
                  <Input placeholder="Country" value={form.country} onChange={e => setForm(p => ({...p, country: e.target.value}))} />
                </div>
                <Button onClick={createCompany} disabled={!form.name} className="w-full">Register Company</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Companies', value: companies.length, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active', value: companies.filter(c => c.status === 'active' || !c.status).length, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Oman', value: companies.filter(c => c.country === 'Oman' || !c.country).length, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Industries', value: new Set(companies.map(c => c.industry).filter(Boolean)).size, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(s => (
          <Card key={s.label}><CardContent className="pt-6">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </CardContent></Card>
        ))}
      </div>

      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_,i) => <Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-24 bg-gray-200 rounded" /></CardContent></Card>)}</div> :
      filtered.length === 0 ? <div className="text-center py-16 text-gray-400"><Building2 className="h-16 w-16 mx-auto mb-4 opacity-30" /><p className="text-xl">No companies found</p></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold truncate">{c.name}</div>
                    {c.name_ar && <div className="text-sm text-gray-500 truncate" dir="rtl">{c.name_ar}</div>}
                    {c.industry && <Badge variant="secondary" className="mt-1 text-xs">{c.industry}</Badge>}
                  </div>
                </div>
                <div className="space-y-1 text-sm text-gray-600">
                  {c.cr_number && <div className="flex items-center gap-2"><FileText className="h-3 w-3 text-gray-400" />CR: {c.cr_number}</div>}
                  {c.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-gray-400" /><a href={`mailto:${c.email}`} className="hover:text-blue-600 truncate">{c.email}</a></div>}
                  {c.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-gray-400" />{c.phone}</div>}
                  {c.city && <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-gray-400" />{[c.city, c.country].filter(Boolean).join(', ')}</div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
