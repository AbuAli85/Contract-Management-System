'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, Phone, Mail, Building2, MapPin, Star } from 'lucide-react';

interface Contact { id: string; name: string; email: string; phone: string; company: string; position: string; type: string; status: string; city: string; country: string; notes: string; created_at: string; }

const TYPE_COLORS: Record<string,string> = { client:'bg-blue-100 text-blue-800', lead:'bg-yellow-100 text-yellow-800', partner:'bg-green-100 text-green-800', vendor:'bg-purple-100 text-purple-800' };

export default function CRMContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name:'', email:'', phone:'', company:'', position:'', type:'lead', city:'', country:'Oman', notes:'' });
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('crm_contacts').select('*').order('created_at', { ascending: false });
    setContacts(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchContacts(); }, [fetchContacts]);

  async function createContact() {
    const { error } = await supabase.from('crm_contacts').insert(form);
    if (!error) { setShowNew(false); setForm({ name:'', email:'', phone:'', company:'', position:'', type:'lead', city:'', country:'Oman', notes:'' }); fetchContacts(); }
    else alert(error.message);
  }

  const filtered = contacts.filter(c => {
    const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase()) || c.company?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || c.type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Users className="h-8 w-8 text-blue-600" />CRM Contacts</h1>
          <p className="text-gray-500 mt-1">Manage clients, leads, partners, and vendors</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" /></div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="client">Clients</SelectItem>
              <SelectItem value="lead">Leads</SelectItem>
              <SelectItem value="partner">Partners</SelectItem>
              <SelectItem value="vendor">Vendors</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={showNew} onOpenChange={setShowNew}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />Add Contact</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New Contact</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-4">
                <Input placeholder="Full name *" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Email" value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
                  <Input placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({...p, phone: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Company" value={form.company} onChange={e => setForm(p => ({...p, company: e.target.value}))} />
                  <Input placeholder="Position" value={form.position} onChange={e => setForm(p => ({...p, position: e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="City" value={form.city} onChange={e => setForm(p => ({...p, city: e.target.value}))} />
                  <Input placeholder="Country" value={form.country} onChange={e => setForm(p => ({...p, country: e.target.value}))} />
                </div>
                <Select value={form.type} onValueChange={v => setForm(p => ({...p, type: v}))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                    <SelectItem value="partner">Partner</SelectItem>
                    <SelectItem value="vendor">Vendor</SelectItem>
                  </SelectContent>
                </Select>
                <Input placeholder="Notes" value={form.notes} onChange={e => setForm(p => ({...p, notes: e.target.value}))} />
                <Button onClick={createContact} disabled={!form.name} className="w-full">Add Contact</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {['client','lead','partner','vendor'].map(type => (
          <Card key={type} className={`cursor-pointer transition-all ${typeFilter===type?'border-blue-500 bg-blue-50':''}`} onClick={() => setTypeFilter(typeFilter===type?'all':type)}>
            <CardContent className="pt-4 pb-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{contacts.filter(c=>c.type===type).length}</div>
              <div className="text-sm capitalize text-gray-600">{type}s</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {loading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_,i) => <Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-24 bg-gray-200 rounded" /></CardContent></Card>)}</div> :
        filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Users className="h-20 w-20 mx-auto mb-4 opacity-30" /><p className="text-xl font-medium">No contacts found</p></div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(c => (
              <Card key={c.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-700 font-semibold">{c.name?.charAt(0)?.toUpperCase()||'?'}</span>
                      </div>
                      <div>
                        <div className="font-semibold">{c.name}</div>
                        {c.position && <div className="text-xs text-gray-500">{c.position}</div>}
                      </div>
                    </div>
                    <Badge className={TYPE_COLORS[c.type]||'bg-gray-100 text-gray-800'} variant="secondary">{c.type}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    {c.company && <div className="flex items-center gap-2"><Building2 className="h-3 w-3 text-gray-400" />{c.company}</div>}
                    {c.email && <div className="flex items-center gap-2"><Mail className="h-3 w-3 text-gray-400" /><a href={`mailto:${c.email}`} className="hover:text-blue-600 truncate">{c.email}</a></div>}
                    {c.phone && <div className="flex items-center gap-2"><Phone className="h-3 w-3 text-gray-400" />{c.phone}</div>}
                    {(c.city||c.country) && <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-gray-400" />{[c.city,c.country].filter(Boolean).join(', ')}</div>}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      }
    </div>
  );
}
