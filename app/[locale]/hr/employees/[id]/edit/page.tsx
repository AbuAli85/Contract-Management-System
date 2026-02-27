'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';

interface Employee {
  id: number;
  full_name: string;
  job_title: string | null;
  manager_employee_id: number | null;
}

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const idParam = params?.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [managerId, setManagerId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        // Load current employee
        const res = await fetch(`/api/hr/employees/${idParam}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || 'Failed to load employee');
          setLoading(false);
          return;
        }
        const emp: Employee = {
          id: data.id,
          full_name: data.full_name,
          job_title: data.job_title,
          manager_employee_id: data.manager?.id ?? data.manager_employee_id ?? null,
        };
        setEmployee(emp);
        setManagerId(
          emp.manager_employee_id != null ? String(emp.manager_employee_id) : ''
        );

        // Load potential managers (same company; API already tenant-scoped)
        const listRes = await fetch('/api/hr/employees?page=1&limit=500');
        const listData = await listRes.json();
        if (listRes.ok) {
          const emps = (listData.data || []) as Employee[];
          setEmployees(emps.filter(e => e.id !== emp.id));
        }
      } catch (e) {
        setError('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };
    if (idParam) {
      load();
    }
  }, [idParam]);

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);
    setError(null);
    try {
      const payload: any = {};
      if (managerId) {
        payload.manager_employee_id = Number(managerId);
      } else {
        payload.manager_employee_id = null;
      }

      const res = await fetch(`/api/hr/employees/${employee.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || 'Failed to update employee');
        setSaving(false);
        return;
      }
      router.push(`/${locale}/hr/employees`);
    } catch (e) {
      setError('Unexpected error while saving');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600' />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className='container mx-auto py-8'>
        <p className='text-red-600'>Employee not found.</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8'>
      <div className='max-w-3xl mx-auto'>
        <Card>
          <CardHeader>
            <CardTitle>Edit Employee – Manager</CardTitle>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='space-y-1'>
              <Label>Name</Label>
              <Input value={employee.full_name} disabled />
            </div>
            <div className='space-y-1'>
              <Label>Job title</Label>
              <Input value={employee.job_title || ''} disabled />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='manager'>Manager</Label>
              <Select
                value={managerId}
                onValueChange={value => setManagerId(value)}
              >
                <SelectTrigger id='manager'>
                  <SelectValue placeholder='Select a manager (optional)' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>No manager</SelectItem>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <p className='text-sm text-red-600' role='alert'>
                {error}
              </p>
            )}

            <div className='flex justify-end gap-3'>
              <Button
                type='button'
                variant='outline'
                onClick={() => router.push(`/${locale}/hr/employees`)}
              >
                Cancel
              </Button>
              <Button type='button' onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

