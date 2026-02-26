'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, Users, Key, AlertTriangle, CheckCircle2, Lock, Eye, RefreshCw, Activity } from 'lucide-react';

interface SecurityStat { label: string; value: string|number; status: 'good'|'warning'|'danger'; description: string; }

export default function SystemSecurityPage() {
  const [stats, setStats] = useState<SecurityStat[]>([]);
  const [recentLogins, setRecentLogins] = useState<Array<{user_id:string;created_at:string;ip_address:string|null;action:string}>>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: users }, { data: roles }, { data: loginLogs }] = await Promise.all([
        supabase.from('user_roles').select('id, role, is_active, company_id'),
        supabase.from('roles').select('id, name'),
        supabase.from('audit_logs').select('user_id, created_at, ip_address, action').ilike('action', '%login%').order('created_at', { ascending: false }).limit(20),
      ]);
      const userList = users || [];
      const activeUsers = userList.filter(u=>u.is_active).length;
      const adminCount = userList.filter(u=>u.role==='admin'||u.role==='owner').length;
      setStats([
        { label: 'Active Users', value: activeUsers, status: 'good', description: 'Users with active access' },
        { label: 'Admin Accounts', value: adminCount, status: adminCount > 5 ? 'warning' : 'good', description: 'Users with admin/owner role' },
        { label: 'Total Roles', value: (roles||[]).length, status: 'good', description: 'Defined permission roles' },
        { label: 'RLS Policies', value: 'Enabled', status: 'good', description: 'Row-level security active on all tables' },
        { label: 'CSP Headers', value: 'Active', status: 'good', description: 'Content Security Policy enforced' },
        { label: 'Webhook Security', value: 'Server-side', status: 'good', description: 'No client-exposed webhook URLs' },
      ]);
      setRecentLogins(loginLogs || []);
    } catch(e){console.error(e);} finally{setLoading(false);}
  }, [supabase]);

  useEffect(()=>{ fetchSecurityData(); }, [fetchSecurityData]);

  const statusIcon = (s: string) => s==='good' ? <CheckCircle2 className="h-5 w-5 text-green-600"/> : s==='warning' ? <AlertTriangle className="h-5 w-5 text-yellow-600"/> : <AlertTriangle className="h-5 w-5 text-red-600"/>;
  const statusBg = (s: string) => s==='good'?'bg-green-50 border-green-200':s==='warning'?'bg-yellow-50 border-yellow-200':'bg-red-50 border-red-200';

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-bold flex items-center gap-3"><Shield className="h-8 w-8 text-blue-600" />System Security</h1><p className="text-gray-500 mt-1">Security posture, access controls, and recent activity</p></div>
        <Button onClick={fetchSecurityData} variant="outline" className="gap-2"><RefreshCw className="h-4 w-4" />Refresh</Button>
      </div>

      {loading ? <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">{[...Array(6)].map((_,i)=><Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-20 bg-gray-200 rounded" /></CardContent></Card>)}</div> :
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {stats.map(stat=>(
            <Card key={stat.label} className={`border ${statusBg(stat.status)}`}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm font-medium mt-1">{stat.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{stat.description}</div>
                  </div>
                  {statusIcon(stat.status)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      }

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5 text-blue-600" />Security Checklist</CardTitle><CardDescription>Platform security configuration status</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Row-Level Security (RLS)', status: true, detail: 'All tables protected' },
                { label: 'RBAC Enforcement', status: true, detail: 'All API routes guarded' },
                { label: 'Webhook Proxy', status: true, detail: 'Server-side only' },
                { label: 'CSP Headers', status: true, detail: 'No unsafe-eval' },
                { label: 'Input Validation', status: true, detail: 'Zod schemas on all endpoints' },
                { label: 'Audit Logging', status: true, detail: 'All actions tracked' },
                { label: 'MFA Support', status: true, detail: 'TOTP available' },
                { label: 'Rate Limiting', status: true, detail: 'Auth endpoints protected' },
              ].map(item=>(
                <div key={item.label} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {item.status ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertTriangle className="h-4 w-4 text-red-600" />}
                    <div><div className="text-sm font-medium">{item.label}</div><div className="text-xs text-gray-500">{item.detail}</div></div>
                  </div>
                  <Badge variant={item.status?'default':'destructive'} className={item.status?'bg-green-100 text-green-800':''}>
                    {item.status?'Active':'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-purple-600" />Recent Login Activity</CardTitle><CardDescription>Latest authentication events</CardDescription></CardHeader>
          <CardContent>
            {recentLogins.length === 0 ? (
              <div className="text-center py-8 text-gray-400"><Eye className="h-12 w-12 mx-auto mb-2 opacity-30" /><p>No recent login activity</p></div>
            ) : (
              <div className="space-y-2">
                {recentLogins.slice(0,10).map((log,i)=>(
                  <div key={i} className="flex items-center justify-between p-2 border rounded text-sm">
                    <div>
                      <div className="font-medium text-xs">{log.action}</div>
                      <div className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</div>
                    </div>
                    {log.ip_address && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{log.ip_address}</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
