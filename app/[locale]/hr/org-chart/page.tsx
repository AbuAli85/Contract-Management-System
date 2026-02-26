'use client';
import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Users, Search, Building2, ChevronDown, ChevronRight } from 'lucide-react';

interface Employee { id: string; full_name: string; position: string; department: string; status: string; email: string; }

export default function OrgChartPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('employees').select('id,full_name,position,department,status,email').eq('status','active').order('department');
    setEmployees(data || []);
    setLoading(false);
  }, [supabase]);

  useEffect(()=>{ fetchEmployees(); }, [fetchEmployees]);

  const departments = [...new Set(employees.map(e=>e.department||'Unassigned'))].sort();
  const filtered = employees.filter(e => !search || e.full_name?.toLowerCase().includes(search.toLowerCase()) || e.position?.toLowerCase().includes(search.toLowerCase()));

  function toggleDept(dept: string) {
    setExpanded(s => { const n = new Set(s); if(n.has(dept)) n.delete(dept); else n.add(dept); return n; });
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-bold flex items-center gap-3"><Users className="h-8 w-8 text-blue-600" />Organisation Chart</h1><p className="text-gray-500 mt-1">Company structure and employee hierarchy by department</p></div>
        <div className="relative w-64"><Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" /><Input placeholder="Search employees..." value={search} onChange={e=>setSearch(e.target.value)} className="pl-9" /></div>
      </div>

      {loading ? <div className="space-y-4">{[...Array(4)].map((_,i)=><Card key={i} className="animate-pulse"><CardContent className="pt-6"><div className="h-24 bg-gray-200 rounded" /></CardContent></Card>)}</div> :
        employees.length === 0 ? (
          <div className="text-center py-16 text-gray-400"><Users className="h-20 w-20 mx-auto mb-4 opacity-30" /><p className="text-xl font-medium">No employees found</p><p className="text-sm mt-2">Add employees in the HR module to see the org chart</p></div>
        ) : (
          <div className="space-y-4">
            {departments.map(dept => {
              const deptEmps = filtered.filter(e=>(e.department||'Unassigned')===dept);
              if (deptEmps.length === 0) return null;
              const isOpen = expanded.has(dept) || search.length > 0;
              return (
                <Card key={dept}>
                  <CardHeader className="cursor-pointer pb-3" onClick={()=>toggleDept(dept)}>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <span>{dept}</span>
                        <Badge variant="secondary">{deptEmps.length} employees</Badge>
                      </div>
                      {isOpen ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                    </CardTitle>
                  </CardHeader>
                  {isOpen && (
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {deptEmps.map(emp=>(
                          <div key={emp.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                              <span className="text-blue-700 font-semibold text-sm">{emp.full_name?.charAt(0)?.toUpperCase()||'?'}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium text-sm truncate">{emp.full_name}</div>
                              <div className="text-xs text-gray-500 truncate">{emp.position||'No position'}</div>
                              <div className="text-xs text-gray-400 truncate">{emp.email}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )
      }
    </div>
  );
}
