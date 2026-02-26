'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckSquare, Target, Calendar, Clock, Bell, FileText, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';

export default function EmployeeDashboardPage() {
  const [data, setData] = useState<any>({ tasks: [], targets: [], leaves: [], attendance: [] });
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (!u) { setLoading(false); return; }
    const [{ data: tasks }, { data: targets }, { data: leaves }] = await Promise.all([
      supabase.from('tasks').select('*').eq('assigned_to', u.id).order('due_date', { ascending: true }).limit(10),
      supabase.from('targets').select('*').eq('assigned_to', u.id).eq('status', 'active').limit(5),
      supabase.from('leave_requests').select('*').eq('employee_id', u.id).order('created_at', { ascending: false }).limit(5),
    ]);
    setData({ tasks: tasks || [], targets: targets || [], leaves: leaves || [] });
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const now = new Date();
  const pendingTasks = data.tasks.filter((t: any) => t.status !== 'completed');
  const overdueTasks = data.tasks.filter((t: any) => t.status !== 'completed' && t.due_date && new Date(t.due_date) < now);
  const completedTasks = data.tasks.filter((t: any) => t.status === 'completed');
  const completionRate = data.tasks.length > 0 ? Math.round((completedTasks.length / data.tasks.length) * 100) : 0;

  const PRIORITY_COLOR: any = { urgent: 'text-red-600', high: 'text-orange-600', medium: 'text-blue-600', low: 'text-gray-500' };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">My Workspace</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Employee'}</p>
        </div>
        <div className="flex gap-3">
          <Link href="/notifications"><Button variant="outline" className="gap-2"><Bell className="h-4 w-4" />Notifications</Button></Link>
          <Link href="/profile"><Button variant="outline" className="gap-2"><User className="h-4 w-4" />My Profile</Button></Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Pending Tasks', value: pendingTasks.length, icon: CheckSquare, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Overdue', value: overdueTasks.length, icon: Clock, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Active Targets', value: data.targets.length, icon: Target, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(s => (
          <Card key={s.label}><CardContent className="pt-6">
            <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-3`}><s.icon className={`h-5 w-5 ${s.color}`} /></div>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Tasks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><CheckSquare className="h-5 w-5 text-blue-600" />My Tasks</CardTitle>
            <Link href="/hr/tasks"><Button variant="ghost" size="sm">View All</Button></Link>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div> :
            pendingTasks.length === 0 ? <div className="text-center py-8 text-gray-400"><CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>All tasks completed!</p></div> : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 6).map((t: any) => {
                  const isOverdue = t.due_date && new Date(t.due_date) < now;
                  return (
                    <div key={t.id} className={`flex items-center justify-between p-2 rounded-lg ${isOverdue ? 'bg-red-50' : 'bg-gray-50'}`}>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{t.title}</div>
                        {t.due_date && <div className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'}`}>{isOverdue ? 'Overdue: ' : 'Due: '}{new Date(t.due_date).toLocaleDateString()}</div>}
                      </div>
                      <span className={`text-xs font-medium ml-2 ${PRIORITY_COLOR[t.priority] || 'text-gray-500'}`}>{t.priority}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* My Targets */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><Target className="h-5 w-5 text-green-600" />My Targets</CardTitle>
            <Link href="/hr/targets"><Button variant="ghost" size="sm">View All</Button></Link>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-14 bg-gray-100 rounded animate-pulse" />)}</div> :
            data.targets.length === 0 ? <div className="text-center py-8 text-gray-400"><Target className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No active targets</p></div> : (
              <div className="space-y-4">
                {data.targets.map((t: any) => {
                  const progress = t.target_value > 0 ? Math.min(100, Math.round((t.current_value / t.target_value) * 100)) : 0;
                  return (
                    <div key={t.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{t.title}</span>
                        <span className="text-sm text-gray-500">{t.current_value}/{t.target_value} {t.unit}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                      <div className="text-xs text-gray-400 mt-1">{progress}% complete · Due {t.end_date ? new Date(t.end_date).toLocaleDateString() : 'No deadline'}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Leave Requests */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5 text-purple-600" />My Leave Requests</CardTitle>
            <Link href="/hr/leave-requests"><Button variant="ghost" size="sm">Request Leave</Button></Link>
          </CardHeader>
          <CardContent>
            {loading ? <div className="space-y-2">{[...Array(3)].map((_,i) => <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />)}</div> :
            data.leaves.length === 0 ? <div className="text-center py-8 text-gray-400"><Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" /><p>No leave requests</p></div> : (
              <div className="space-y-2">
                {data.leaves.map((l: any) => (
                  <div key={l.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div>
                      <div className="text-sm font-medium capitalize">{l.leave_type?.replace('_', ' ')} Leave</div>
                      <div className="text-xs text-gray-500">{new Date(l.start_date).toLocaleDateString()} — {new Date(l.end_date).toLocaleDateString()} ({l.days_requested}d)</div>
                    </div>
                    <Badge className={l.status === 'approved' ? 'bg-green-100 text-green-800' : l.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'} variant="secondary">{l.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Check In', href: '/attendance/check-in', icon: Clock, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                { label: 'Request Leave', href: '/hr/leave-requests', icon: Calendar, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                { label: 'My Documents', href: '/hr/documents', icon: FileText, color: 'bg-green-50 text-green-700 hover:bg-green-100' },
                { label: 'My Contracts', href: '/contracts', icon: FileText, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
              ].map(a => (
                <Link key={a.label} href={a.href}>
                  <Button variant="ghost" className={`w-full h-16 flex-col gap-1 ${a.color}`}>
                    <a.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{a.label}</span>
                  </Button>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
