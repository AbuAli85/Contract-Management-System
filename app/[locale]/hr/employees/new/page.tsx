'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Metadata } from 'next';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export const metadata: Metadata = {
  title: 'Add Employee | HR Management',
  description: 'Add a new employee to the system',
};

export default function AddEmployeePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [form, setForm] = useState({
    full_name: '',
    job_title: '',
    department_id: '',
    email: '',
    employment_status: 'active',
    hire_date: '',
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        full_name: form.full_name,
        job_title: form.job_title || null,
        department_id: form.department_id
          ? Number(form.department_id)
          : undefined,
        email: form.email || null,
        phone: form.phone || null,
        employment_status: form.employment_status,
        hire_date: form.hire_date || null,
        emergency_contact_name: form.emergency_contact_name || null,
        emergency_contact_phone: form.emergency_contact_phone || null,
      };

      const res = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(
          data?.error ||
            'Failed to create employee. Please check the form and try again.'
        );
        setSubmitting(false);
        return;
      }

      // On success, redirect back to employees list
      router.push(`/${locale}/hr/employees`);
    } catch (err) {
      setError('Unexpected error while creating employee.');
      setSubmitting(false);
    }
  };

  return (
    <div className='container mx-auto py-8'>
      <div className='max-w-3xl mx-auto'>
        <Card>
          <CardHeader>
            <CardTitle>Add New Employee</CardTitle>
            <CardDescription>
              Register a new employee for the active company.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className='space-y-6' onSubmit={handleSubmit}>
              <div className='space-y-2'>
                <Label htmlFor='full_name'>Full name</Label>
                <Input
                  id='full_name'
                  name='full_name'
                  value={form.full_name}
                  onChange={handleChange}
                  required
                  placeholder='Jane Doe'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='job_title'>Job title</Label>
                  <Input
                    id='job_title'
                    name='job_title'
                    value={form.job_title}
                    onChange={handleChange}
                    placeholder='Software Engineer'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='department_id'>Department (ID)</Label>
                  <Input
                    id='department_id'
                    name='department_id'
                    type='number'
                    value={form.department_id}
                    onChange={handleChange}
                    placeholder='e.g. 1'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Work email</Label>
                  <Input
                    id='email'
                    name='email'
                    type='email'
                    value={form.email}
                    onChange={handleChange}
                    placeholder='employee@example.com'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone</Label>
                  <Input
                    id='phone'
                    name='phone'
                    value={form.phone}
                    onChange={handleChange}
                    placeholder='+968...'
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='employment_status'>Employment status</Label>
                  <Select
                    value={form.employment_status}
                    onValueChange={value =>
                      setForm(prev => ({
                        ...prev,
                        employment_status: value,
                      }))
                    }
                  >
                    <SelectTrigger id='employment_status'>
                      <SelectValue placeholder='Select status' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='active'>Active</SelectItem>
                      <SelectItem value='probation'>Probation</SelectItem>
                      <SelectItem value='on_leave'>On leave</SelectItem>
                      <SelectItem value='terminated'>Terminated</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='hire_date'>Hire date</Label>
                  <Input
                    id='hire_date'
                    name='hire_date'
                    type='date'
                    value={form.hire_date}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='emergency_contact_name'>
                  Emergency contact
                </Label>
                <Input
                  id='emergency_contact_name'
                  name='emergency_contact_name'
                  value={form.emergency_contact_name}
                  onChange={handleChange}
                  placeholder='Contact name'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='emergency_contact_phone'>
                  Emergency contact phone
                </Label>
                <Input
                  id='emergency_contact_phone'
                  name='emergency_contact_phone'
                  value={form.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder='+968...'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='notes'>Notes (optional)</Label>
                <Textarea
                  id='notes'
                  name='notes'
                  value={''}
                  onChange={() => {}}
                  disabled
                  placeholder='Additional details can be managed from the employee detail page.'
                  className='resize-none'
                />
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
                <Button type='submit' disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create employee'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

