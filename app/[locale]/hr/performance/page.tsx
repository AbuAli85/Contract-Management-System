'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Star, Plus, TrendingUp, Users, Award, Target } from 'lucide-react';

interface Review { id: string; employee_id: string; reviewer_id: string; period: string; overall_rating: number; status: string; created_at: string; comments: string; goals_met: number; }

const RATING_LABELS: Record<number,string> = { 1:'Poor', 2:'Below Average', 3:'Average', 4:'Good', 5:'Excellent' };
const RATING_COLORS: Record<number,string> = { 1:'text-red-600', 2:'text-orange-600', 3:'text-yellow-600', 4:'text-blue-600', 5:'text-green-600' };

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(n => (
        <Star key={n} className={`h-5 w-5 cursor-pointer transition-colors ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} onClick={() => onChange?.(n)} />
      ))}
    </div>
  );
}

export default function PerformancePage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [employees, setEmployees] = useState<Array<{id:string;full_name:string}>>([]);
  const [form, setForm] = useState({ employee_id:'', period:'', overall_rating:3, goals_met:3, comments:'' });
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: r }, { data: e }] = await Promise.all([
      supabase.from('performance_reviews').select('*').order('created_at', { ascending: false }),
      supabase.from('employees').select('id,full_name').eq('status','active'),
    ]);
    setReviews(r||[]); setEmployees(e||[]); setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function submitReview() {
    const { error } = await supabase.from('performance_reviews').insert({ ...form, status: 'completed' });
    if (!error) { setShowNew(false); setForm({ employee_id:'', period:'', overall_rating:3, goals_met:3, comments:'' }); fetchData(); }
  }

  const avgRating = reviews.length > 0 ? (reviews.reduce((s,r) => s + r.overall_rating, 0) / reviews.length).toFixed(1) : '—';
  const excellent = reviews.filter(r => r.overall_rating >= 4).length;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><Star className="h-8 w-8 text-yellow-500" />Performance Reviews</h1>
          <p className="text-gray-500 mt-1">Track and manage employee performance evaluations</p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />New Review</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Performance Review</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-4">
              <Select value={form.employee_id} onValueChange={v => setForm(p => ({...p, employee_id: v}))}>
                <SelectTrigger><SelectValue placeholder="Select employee *" /></SelectTrigger>
                <SelectContent>{employees.map(e => <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>)}</SelectContent>
              </Select>
              <Input placeholder="Review period (e.g. Q1 2026)" value={form.period} onChange={e => setForm(p => ({...p, period: e.target.value}))} />
              <div>
                <label className="text-sm font-medium mb-2 block">Overall Rating</label>
                <StarRating value={form.overall_rating} onChange={v => setForm(p => ({...p, overall_rating: v}))} />
                <span className="text-sm text-gray-500 mt-1 block">{RATING_LABELS[form.overall_rating]}</span>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Goals Achievement (1-5)</label>
                <StarRating value={form.goals_met} onChange={v => setForm(p => ({...p, goals_met: v}))} />
              </div>
              <Textarea placeholder="Comments and feedback..." value={form.comments} onChange={e => setForm(p => ({...p, comments: e.target.value}))} rows={4} />
              <Button onClick={submitReview} disabled={!form.employee_id || !form.period} className="w-full">Submit Review</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Reviews', value: reviews.length, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Average Rating', value: avgRating, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Excellent (4-5★)', value: excellent, icon: Award, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Needs Improvement', value: reviews.filter(r => r.overall_rating <= 2).length, icon: Target, color: 'text-red-600', bg: 'bg-red-50' },
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

      {loading ? <div className="space-y-3">{[...Array(4)].map((_,i) => <Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-16 bg-gray-200 rounded" /></CardContent></Card>)}</div> :
        reviews.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Star className="h-20 w-20 mx-auto mb-4 opacity-30" />
            <p className="text-xl font-medium">No performance reviews yet</p>
            <p className="text-sm mt-2">Create the first review to start tracking employee performance</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <Card key={r.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{employees.find(e => e.id === r.employee_id)?.full_name || 'Employee'}</div>
                        <div className="text-sm text-gray-500">{r.period} · {new Date(r.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <StarRating value={r.overall_rating} />
                        <span className={`text-xs font-medium ${RATING_COLORS[r.overall_rating]}`}>{RATING_LABELS[r.overall_rating]}</span>
                      </div>
                      <Badge variant="outline">{r.status}</Badge>
                    </div>
                  </div>
                  {r.comments && <p className="text-sm text-gray-600 mt-3 pl-14">{r.comments}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )
      }
    </div>
  );
}
