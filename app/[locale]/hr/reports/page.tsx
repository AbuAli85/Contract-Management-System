'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, TrendingUp, TrendingDown, Calendar, FileText, Clock, Download, BarChart3, PieChart, Activity, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function HRReportsPage() {
  const [period, setPeriod] = useState('this_month');
  const [stats, setStats] = useState({ totalEmployees:0, activeEmployees:0, onLeave:0, pendingLeaveRequests:0, attendanceRate:0, openPositions:0, newHires:0, terminations:0, payrollTotal:0 });
  const [departments, setDepartments] = useState<Array<{department:string;count:number}>>([]);
  const [leaveBreakdown, setLeaveBreakdown] = useState<Array<{type:string;count:number;approved:number;pending:number;rejected:number}>>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const getStartDate = useCallback((p: string) => {
    const now = new Date();
    if (p === 'this_week') { const d = new Date(now); d.setDate(now.getDate()-now.getDay()); return d.toISOString(); }
    if (p === 'this_month') return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    if (p === 'last_month') return new Date(now.getFullYear(), now.getMonth()-1, 1).toISOString();
    if (p === 'this_quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth()/3)*3, 1).toISOString();
    return new Date(now.getFullYear(), 0, 1).toISOString();
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: emp }, { data: lv }, { data: att }, { data: jobs }] = await Promise.all([
        supabase.from('employees').select('id,department,status,created_at,salary'),
        supabase.from('leave_requests').select('id,leave_type,status,start_date,end_date'),
        supabase.from('attendance_records').select('id,status,check_in').gte('check_in', getStartDate(period)),
        supabase.from('job_postings').select('id,status'),
      ]);
      const empList = emp||[], leaveList = lv||[], attList = att||[], jobList = jobs||[];
      const now = new Date();
      const active = empList.filter(e=>e.status==='active').length;
      const onLeave = leaveList.filter(l=>l.status==='approved'&&new Date(l.start_date)<=now&&new Date(l.end_date)>=now).length;
      const pending = leaveList.filter(l=>l.status==='pending').length;
      const openJobs = jobList.filter(j=>j.status==='open').length;
      const present = attList.filter(a=>a.check_in).length;
      const attRate = attList.length>0?Math.round((present/attList.length)*100):0;
      const sd = new Date(getStartDate(period));
      const newHires = empList.filter(e=>new Date(e.created_at)>=sd).length;
      const payrollTotal = empList.filter(e=>e.status==='active').reduce((s,e)=>s+(e.salary||0),0);
      setStats({totalEmployees:empList.length,activeEmployees:active,onLeave,pendingLeaveRequests:pending,attendanceRate:attRate,openPositions:openJobs,newHires,terminations:empList.filter(e=>e.status==='terminated').length,payrollTotal});
      const dm: Record<string,number>={};
      empList.forEach(e=>{const d=e.department||'Unassigned';dm[d]=(dm[d]||0)+1;});
      setDepartments(Object.entries(dm).map(([department,count])=>({department,count})).sort((a,b)=>b.count-a.count));
      const lt: Record<string,{type:string;count:number;approved:number;pending:number;rejected:number}>={};
      leaveList.forEach(l=>{const t=l.leave_type||'Annual';if(!lt[t])lt[t]={type:t,count:0,approved:0,pending:0,rejected:0};lt[t].count++;if(l.status==='approved')lt[t].approved++;else if(l.status==='pending')lt[t].pending++;else if(l.status==='rejected')lt[t].rejected++;});
      setLeaveBreakdown(Object.values(lt));
    } catch(e){console.error(e);} finally{setLoading(false);}
  }, [period, getStartDate, supabase]);

  useEffect(()=>{fetchData();}, [fetchData]);

  function exportCSV() {
    const rows=[['Metric','Value'],['Total Employees',stats.totalEmployees],['Active',stats.activeEmployees],['On Leave',stats.onLeave],['Pending Leave',stats.pendingLeaveRequests],['Attendance Rate',stats.attendanceRate+'%'],['Open Positions',stats.openPositions],['New Hires',stats.newHires],['Terminations',stats.terminations],['Payroll (OMR)',stats.payrollTotal.toFixed(3)]];
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([rows.map(r=>r.join(',')).join('\n')],{type:'text/csv'}));a.download=`hr-report-${period}.csv`;a.click();
  }

  const kpiCards=[
    {title:'Total Employees',value:stats.totalEmployees,sub:`${stats.activeEmployees} active`,icon:Users,color:'text-blue-600',bg:'bg-blue-50'},
    {title:'Attendance Rate',value:`${stats.attendanceRate}%`,sub:'This period',icon:Activity,color:stats.attendanceRate>=90?'text-green-600':'text-red-600',bg:stats.attendanceRate>=90?'bg-green-50':'bg-red-50'},
    {title:'On Leave Today',value:stats.onLeave,sub:`${stats.pendingLeaveRequests} pending`,icon:Calendar,color:'text-orange-600',bg:'bg-orange-50'},
    {title:'Open Positions',value:stats.openPositions,sub:`${stats.newHires} new hires`,icon:TrendingUp,color:'text-purple-600',bg:'bg-purple-50'},
    {title:'Terminations',value:stats.terminations,sub:'This period',icon:TrendingDown,color:'text-red-600',bg:'bg-red-50'},
    {title:'Monthly Payroll',value:`OMR ${stats.payrollTotal.toLocaleString('en-OM',{minimumFractionDigits:3})}`,sub:'Total salary cost',icon:FileText,color:'text-teal-600',bg:'bg-teal-50'},
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3"><BarChart3 className="h-8 w-8 text-blue-600" />HR Reports & Analytics</h1>
          <p className="text-gray-500 mt-1">Comprehensive human resources insights and workforce analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_quarter">This Quarter</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportCSV} variant="outline" className="gap-2"><Download className="h-4 w-4" />Export CSV</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {loading ? [...Array(6)].map((_,i)=><Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-16 bg-gray-200 rounded" /></CardContent></Card>) :
          kpiCards.map(card=>(
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-3`}><card.icon className={`h-5 w-5 ${card.color}`} /></div>
                <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
                <div className="text-xs font-medium text-gray-700 mt-1">{card.title}</div>
                <div className="text-xs text-gray-400 mt-0.5">{card.sub}</div>
              </CardContent>
            </Card>
          ))
        }
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><PieChart className="h-5 w-5 text-blue-600" />Headcount by Department</CardTitle><CardDescription>Employee distribution across departments</CardDescription></CardHeader>
          <CardContent>
            {departments.length===0 ? <div className="text-center py-8 text-gray-400"><Users className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>No department data</p></div> :
              <div className="space-y-3">{departments.map(dept=>{
                const pct=stats.totalEmployees>0?Math.round((dept.count/stats.totalEmployees)*100):0;
                return <div key={dept.department}><div className="flex justify-between text-sm mb-1"><span className="font-medium">{dept.department}</span><span className="text-gray-500">{dept.count} ({pct}%)</span></div><div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full" style={{width:`${pct}%`}} /></div></div>;
              })}</div>
            }
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-orange-600" />Leave Requests Breakdown</CardTitle><CardDescription>By type and status</CardDescription></CardHeader>
          <CardContent>
            {leaveBreakdown.length===0 ? <div className="text-center py-8 text-gray-400"><Calendar className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>No leave data</p></div> :
              <div className="space-y-4">{leaveBreakdown.map(item=>(
                <div key={item.type} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2"><span className="font-medium text-sm">{item.type}</span><Badge variant="outline">{item.count} total</Badge></div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" />{item.approved} approved</span>
                    <span className="flex items-center gap-1 text-yellow-600"><Clock className="h-3 w-3" />{item.pending} pending</span>
                    <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3 w-3" />{item.rejected} rejected</span>
                  </div>
                </div>
              ))}</div>
            }
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-purple-600" />Workforce Health Summary</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`rounded-lg p-4 ${stats.attendanceRate>=90?'bg-green-50 border border-green-200':'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">{stats.attendanceRate>=90?<CheckCircle2 className="h-5 w-5 text-green-600"/>:<AlertCircle className="h-5 w-5 text-red-600"/>}<span className="font-semibold text-sm">Attendance</span></div>
              <p className="text-2xl font-bold">{stats.attendanceRate}%</p>
              <p className="text-xs text-gray-600 mt-1">{stats.attendanceRate>=90?'Healthy attendance rate':'Below target — review needed'}</p>
            </div>
            <div className={`rounded-lg p-4 ${stats.pendingLeaveRequests===0?'bg-green-50 border border-green-200':'bg-yellow-50 border border-yellow-200'}`}>
              <div className="flex items-center gap-2 mb-2">{stats.pendingLeaveRequests===0?<CheckCircle2 className="h-5 w-5 text-green-600"/>:<Clock className="h-5 w-5 text-yellow-600"/>}<span className="font-semibold text-sm">Leave Approvals</span></div>
              <p className="text-2xl font-bold">{stats.pendingLeaveRequests}</p>
              <p className="text-xs text-gray-600 mt-1">{stats.pendingLeaveRequests===0?'All requests processed':'Requests awaiting approval'}</p>
            </div>
            <div className="rounded-lg p-4 bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-blue-600"/><span className="font-semibold text-sm">Recruitment</span></div>
              <p className="text-2xl font-bold">{stats.openPositions}</p>
              <p className="text-xs text-gray-600 mt-1">Open positions · {stats.newHires} hired this period</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
