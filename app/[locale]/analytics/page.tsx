'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { BarChart3, TrendingUp, Users, FileText, DollarSign, Activity, ArrowRight, PieChart, Target, Calendar } from 'lucide-react';

interface PlatformStats {
  contracts: { total: number; active: number; pending: number; value: number };
  hr: { employees: number; onLeave: number; openPositions: number };
  crm: { contacts: number; deals: number; pipelineValue: number };
  tasks: { total: number; completed: number; overdue: number };
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<PlatformStats>({ contracts:{total:0,active:0,pending:0,value:0}, hr:{employees:0,onLeave:0,openPositions:0}, crm:{contacts:0,deals:0,pipelineValue:0}, tasks:{total:0,completed:0,overdue:0} });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('this_month');
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: contracts }, { data: employees }, { data: leaveReqs }, { data: jobs }, { data: contacts }, { data: deals }, { data: tasks }] = await Promise.all([
        supabase.from('contracts').select('id,status,contract_value'),
        supabase.from('employees').select('id,status'),
        supabase.from('leave_requests').select('id,status,start_date,end_date'),
        supabase.from('job_postings').select('id,status'),
        supabase.from('crm_contacts').select('id'),
        supabase.from('deals').select('id,value,currency'),
        supabase.from('tasks').select('id,status,due_date'),
      ]);
      const now = new Date();
      const contractList = contracts||[];
      const empList = employees||[];
      const leaveList = leaveReqs||[];
      const onLeave = leaveList.filter(l=>l.status==='approved'&&new Date(l.start_date)<=now&&new Date(l.end_date)>=now).length;
      const dealList = deals||[];
      const taskList = tasks||[];
      setStats({
        contracts: { total: contractList.length, active: contractList.filter(c=>c.status==='active'||c.status==='approved').length, pending: contractList.filter(c=>c.status==='pending').length, value: contractList.reduce((s,c)=>s+(c.contract_value||0),0) },
        hr: { employees: empList.filter(e=>e.status==='active').length, onLeave, openPositions: (jobs||[]).filter(j=>j.status==='open').length },
        crm: { contacts: (contacts||[]).length, deals: dealList.length, pipelineValue: dealList.reduce((s,d)=>s+(d.value||0),0) },
        tasks: { total: taskList.length, completed: taskList.filter(t=>t.status==='completed').length, overdue: taskList.filter(t=>t.status!=='completed'&&t.due_date&&new Date(t.due_date)<now).length },
      });
    } catch(e){console.error(e);} finally{setLoading(false);}
  }, [supabase]);

  useEffect(()=>{ fetchStats(); }, [fetchStats]);

  const modules = [
    { title: 'HR Analytics', desc: 'Workforce, attendance, and payroll insights', href: '/analytics/hr', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', stats: [`${stats.hr.employees} active employees`, `${stats.hr.onLeave} on leave`] },
    { title: 'Contract Analytics', desc: 'Contract lifecycle and value tracking', href: '/contracts/analytics', icon: FileText, color: 'text-green-600', bg: 'bg-green-50', stats: [`${stats.contracts.total} total contracts`, `${stats.contracts.pending} pending`] },
    { title: 'CRM Analytics', desc: 'Sales pipeline and deal tracking', href: '/crm/pipeline', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', stats: [`${stats.crm.contacts} contacts`, `${stats.crm.deals} deals`] },
    { title: 'Report Builder', desc: 'Custom reports across all modules', href: '/analytics/report-builder', icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50', stats: ['Build custom reports', 'Export to CSV'] },
    { title: 'KPI Dashboard', desc: 'Key performance indicators overview', href: '/dashboard/kpi', icon: Target, color: 'text-teal-600', bg: 'bg-teal-50', stats: [`${stats.tasks.completed} tasks done`, `${stats.tasks.overdue} overdue`] },
    { title: 'Promoter Analytics', desc: 'Promoter performance and deployment', href: '/analytics/employer-promoters', icon: Activity, color: 'text-red-600', bg: 'bg-red-50', stats: ['Deployment tracking', 'Performance metrics'] },
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart3 className="h-8 w-8 text-blue-600" />Analytics & Insights</h1>
          <p className="text-gray-500 mt-1">Platform-wide business intelligence and reporting</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="this_quarter">This Quarter</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Platform KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {loading ? [...Array(4)].map((_,i)=><Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-20 bg-gray-200 rounded" /></CardContent></Card>) : [
          { label: 'Active Contracts', value: stats.contracts.active, sub: `${stats.contracts.pending} pending`, icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Active Employees', value: stats.hr.employees, sub: `${stats.hr.openPositions} open positions`, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pipeline Value', value: `OMR ${stats.crm.pipelineValue.toLocaleString()}`, sub: `${stats.crm.deals} deals`, icon: DollarSign, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Tasks Completed', value: `${stats.tasks.total > 0 ? Math.round((stats.tasks.completed/stats.tasks.total)*100) : 0}%`, sub: `${stats.tasks.overdue} overdue`, icon: Target, color: 'text-teal-600', bg: 'bg-teal-50' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="pt-6">
              <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs font-medium text-gray-700 mt-1">{s.label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{s.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Analytics Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map(mod => (
          <Link key={mod.title} href={mod.href}>
            <Card className="hover:shadow-lg transition-all cursor-pointer border hover:border-blue-300 group h-full">
              <CardHeader>
                <div className={`inline-flex p-3 rounded-xl ${mod.bg} mb-3 w-fit`}><mod.icon className={`h-6 w-6 ${mod.color}`} /></div>
                <CardTitle className="flex items-center justify-between">{mod.title}<ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" /></CardTitle>
                <CardDescription>{mod.desc}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {mod.stats.map((s,i) => <div key={i} className="text-sm text-gray-600 flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-gray-400" />{s}</div>)}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
