'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Briefcase, Plus, Users, Search, Calendar, DollarSign, MapPin } from 'lucide-react';

interface JobPosting { id: string; title: string; department: string; location: string; employment_type: string; status: string; deadline: string; created_at: string; salary_min: number; salary_max: number; currency: string; description: string; }
interface JobApplication { id: string; job_posting_id: string; applicant_name: string; applicant_email: string; status: string; applied_at: string; }

const STATUS_COLORS: Record<string,string> = { open:'bg-green-100 text-green-800', draft:'bg-gray-100 text-gray-800', closed:'bg-red-100 text-red-800', new:'bg-blue-100 text-blue-800', screening:'bg-yellow-100 text-yellow-800', interview:'bg-purple-100 text-purple-800', offer:'bg-teal-100 text-teal-800', hired:'bg-green-100 text-green-800', rejected:'bg-red-100 text-red-800' };

export default function RecruitmentPage() {
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobPosting|null>(null);
  const [showNewJob, setShowNewJob] = useState(false);
  const [newJob, setNewJob] = useState({ title:'', department:'', location:'', employment_type:'full_time', status:'draft', description:'', salary_min:'', salary_max:'', currency:'OMR', deadline:'' });
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: j }, { data: a }] = await Promise.all([
      supabase.from('job_postings').select('*').order('created_at', { ascending: false }),
      supabase.from('job_applications').select('*').order('applied_at', { ascending: false }),
    ]);
    setJobs(j||[]); setApplications(a||[]); setLoading(false);
  }, [supabase]);

  useEffect(()=>{ fetchData(); }, [fetchData]);

  async function createJob() {
    const { error } = await supabase.from('job_postings').insert({ ...newJob, salary_min: parseFloat(newJob.salary_min)||null, salary_max: parseFloat(newJob.salary_max)||null });
    if (!error) { setShowNewJob(false); setNewJob({ title:'', department:'', location:'', employment_type:'full_time', status:'draft', description:'', salary_min:'', salary_max:'', currency:'OMR', deadline:'' }); fetchData(); }
  }

  const filtered = jobs.filter(j => !search || j.title?.toLowerCase().includes(search.toLowerCase()) || j.department?.toLowerCase().includes(search.toLowerCase()));
  const jobApps = (jobId: string) => applications.filter(a=>a.job_posting_id===jobId);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-bold flex items-center gap-3"><Briefcase className="h-8 w-8 text-blue-600" />Recruitment</h1><p className="text-gray-500 mt-1">Manage job postings and track applications</p></div>
        <div className="flex items-center gap-3">
          <div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><Input placeholder="Search jobs..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9 w-56" /></div>
          <Dialog open={showNewJob} onOpenChange={setShowNewJob}>
            <DialogTrigger asChild><Button className="gap-2"><Plus className="h-4 w-4" />New Job Posting</Button></DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Create Job Posting</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-4">
                <Input placeholder="Job title *" value={newJob.title} onChange={e=>setNewJob(p=>({...p,title:e.target.value}))} />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="Department" value={newJob.department} onChange={e=>setNewJob(p=>({...p,department:e.target.value}))} />
                  <Input placeholder="Location" value={newJob.location} onChange={e=>setNewJob(p=>({...p,location:e.target.value}))} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={newJob.employment_type} onValueChange={v=>setNewJob(p=>({...p,employment_type:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="full_time">Full Time</SelectItem><SelectItem value="part_time">Part Time</SelectItem><SelectItem value="contract">Contract</SelectItem><SelectItem value="internship">Internship</SelectItem></SelectContent>
                  </Select>
                  <Select value={newJob.status} onValueChange={v=>setNewJob(p=>({...p,status:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="open">Open</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input placeholder="Min salary" value={newJob.salary_min} onChange={e=>setNewJob(p=>({...p,salary_min:e.target.value}))} />
                  <Input placeholder="Max salary" value={newJob.salary_max} onChange={e=>setNewJob(p=>({...p,salary_max:e.target.value}))} />
                  <Select value={newJob.currency} onValueChange={v=>setNewJob(p=>({...p,currency:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="OMR">OMR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="AED">AED</SelectItem></SelectContent>
                  </Select>
                </div>
                <Input type="date" placeholder="Application deadline" value={newJob.deadline} onChange={e=>setNewJob(p=>({...p,deadline:e.target.value}))} />
                <Textarea placeholder="Job description..." value={newJob.description} onChange={e=>setNewJob(p=>({...p,description:e.target.value}))} rows={3} />
                <Button onClick={createJob} disabled={!newJob.title} className="w-full">Create Job Posting</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[{label:'Total Postings',value:jobs.length,color:'text-blue-600'},{label:'Open Positions',value:jobs.filter(j=>j.status==='open').length,color:'text-green-600'},{label:'Total Applications',value:applications.length,color:'text-purple-600'}].map(s=>(
          <Card key={s.label}><CardContent className="pt-6 text-center"><div className={`text-3xl font-bold ${s.color}`}>{s.value}</div><div className="text-sm text-gray-500 mt-1">{s.label}</div></CardContent></Card>
        ))}
      </div>

      {loading ? <div className="space-y-3">{[...Array(4)].map((_,i)=><Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-20 bg-gray-200 rounded" /></CardContent></Card>)}</div> :
        filtered.length === 0 ? <div className="text-center py-16 text-gray-400"><Briefcase className="h-20 w-20 mx-auto mb-4 opacity-30" /><p className="text-xl font-medium">No job postings yet</p><p className="text-sm mt-2">Create your first job posting to start recruiting</p></div> :
        <div className="space-y-4">
          {filtered.map(job=>{
            const apps = jobApps(job.id);
            return (
              <Card key={job.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={()=>setSelectedJob(selectedJob?.id===job.id?null:job)}>
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <Badge className={STATUS_COLORS[job.status]||'bg-gray-100 text-gray-800'}>{job.status}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                        {job.department && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{job.department}</span>}
                        {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                        {job.deadline && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Deadline: {new Date(job.deadline).toLocaleDateString()}</span>}
                        {(job.salary_min||job.salary_max) && <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{job.salary_min||0}–{job.salary_max||'?'} {job.currency}</span>}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-blue-600">{apps.length}</div>
                      <div className="text-xs text-gray-500">applications</div>
                    </div>
                  </div>
                  {selectedJob?.id===job.id && apps.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="font-medium text-sm mb-3">Applications ({apps.length})</h4>
                      <div className="space-y-2">
                        {apps.map(app=>(
                          <div key={app.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div><div className="text-sm font-medium">{app.applicant_name}</div><div className="text-xs text-gray-500">{app.applicant_email}</div></div>
                            <div className="flex items-center gap-2">
                              <Badge className={STATUS_COLORS[app.status]||'bg-gray-100 text-gray-800'} variant="secondary">{app.status}</Badge>
                              <span className="text-xs text-gray-400">{new Date(app.applied_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      }
    </div>
  );
}
