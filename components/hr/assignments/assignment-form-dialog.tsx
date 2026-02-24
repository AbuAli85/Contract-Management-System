'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Users,
  Building2,
  Calendar,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { useCompany } from '@/components/providers/company-provider';

interface Assignment {
  id: string;
  employer_employee_id: string;
  client_party_id: string;
  assignment_type: string;
  job_title: string;
  department?: string;
  work_location?: string;
  start_date: string;
  end_date?: string;
  status: string;
}

interface AssignmentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: Assignment | null;
  employerEmployeeId?: string;
  locale?: string;
  onSuccess?: () => void;
}

export function AssignmentFormDialog({
  open,
  onOpenChange,
  assignment,
  employerEmployeeId,
  locale = 'en',
  onSuccess,
}: AssignmentFormDialogProps) {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    employer_employee_id: employerEmployeeId || '',
    client_party_id: '',
    assignment_type: 'deployment',
    job_title: '',
    department: '',
    work_location: '',
    start_date: '',
    end_date: '',
    client_contact_person: '',
    client_contact_email: '',
    client_contact_phone: '',
    notes: '',
    generate_deployment_letter: true,
  });

  // Fetch employees
  const { data: employeesData } = useQuery({
    queryKey: ['employer-employees', companyId],
    queryFn: async () => {
      const response = await fetch('/api/employer/team', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
    enabled: open && !employerEmployeeId,
  });

  // Fetch clients (parties with type = 'client')
  const { data: clientsData } = useQuery({
    queryKey: ['clients', companyId],
    queryFn: async () => {
      const response = await fetch('/api/parties?type=client', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch clients');
      return response.json();
    },
    enabled: open,
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        employer_employee_id: assignment.employer_employee_id,
        client_party_id: assignment.client_party_id,
        assignment_type: assignment.assignment_type,
        job_title: assignment.job_title,
        department: assignment.department || '',
        work_location: assignment.work_location || '',
        start_date: assignment.start_date.split('T')[0],
        end_date: assignment.end_date ? assignment.end_date.split('T')[0] : '',
        client_contact_person: '',
        client_contact_email: '',
        client_contact_phone: '',
        notes: '',
        generate_deployment_letter: false,
      });
    } else {
      setFormData({
        employer_employee_id: employerEmployeeId || '',
        client_party_id: '',
        assignment_type: 'deployment',
        job_title: '',
        department: '',
        work_location: '',
        start_date: '',
        end_date: '',
        client_contact_person: '',
        client_contact_email: '',
        client_contact_phone: '',
        notes: '',
        generate_deployment_letter: true,
      });
    }
  }, [assignment, employerEmployeeId, open]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const url = assignment
        ? `/api/hr/assignments/${assignment.id}`
        : '/api/hr/assignments';

      const method = assignment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save assignment');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: assignment
          ? locale === 'ar'
            ? 'تم التحديث بنجاح'
            : 'Updated Successfully'
          : locale === 'ar'
            ? 'تم الإنشاء بنجاح'
            : 'Created Successfully',
        description: assignment
          ? locale === 'ar'
            ? 'تم تحديث التعيين بنجاح'
            : 'Assignment has been updated successfully'
          : locale === 'ar'
            ? 'تم إنشاء التعيين بنجاح'
            : 'Assignment has been created successfully',
      });
      onSuccess?.();
      onOpenChange(false);
    },
    onError: error => {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to save assignment',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.employer_employee_id) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          locale === 'ar' ? 'يرجى اختيار الموظف' : 'Please select an employee',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.client_party_id) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          locale === 'ar' ? 'يرجى اختيار العميل' : 'Please select a client',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.job_title) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          locale === 'ar'
            ? 'يرجى إدخال المسمى الوظيفي'
            : 'Please enter job title',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.start_date) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          locale === 'ar'
            ? 'يرجى اختيار تاريخ البدء'
            : 'Please select start date',
        variant: 'destructive',
      });
      return;
    }

    createMutation.mutate(formData);
  };

  const employees = employeesData?.team || [];
  const clients = clientsData?.parties || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Users className='h-5 w-5' />
            {assignment
              ? locale === 'ar'
                ? 'تعديل التعيين'
                : 'Edit Assignment'
              : locale === 'ar'
                ? 'تعيين جديد'
                : 'New Assignment'}
          </DialogTitle>
          <DialogDescription>
            {assignment
              ? locale === 'ar'
                ? 'قم بتعديل تفاصيل التعيين'
                : 'Update assignment details'
              : locale === 'ar'
                ? 'قم بإنشاء تعيين جديد للموظف'
                : 'Create a new assignment for employee'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='employer_employee_id'>
                {locale === 'ar' ? 'الموظف' : 'Employee'} *
              </Label>
              <Select
                value={formData.employer_employee_id}
                onValueChange={value =>
                  setFormData({ ...formData, employer_employee_id: value })
                }
                disabled={!!employerEmployeeId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      locale === 'ar' ? 'اختر الموظف' : 'Select employee'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.employee?.name_en ||
                        emp.employee?.name_ar ||
                        emp.employee?.email ||
                        'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='client_party_id'>
                {locale === 'ar' ? 'العميل' : 'Client'} *
              </Label>
              <Select
                value={formData.client_party_id}
                onValueChange={value =>
                  setFormData({ ...formData, client_party_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      locale === 'ar' ? 'اختر العميل' : 'Select client'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client: any) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name_en || client.name_ar || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='assignment_type'>
                {locale === 'ar' ? 'نوع التعيين' : 'Assignment Type'}
              </Label>
              <Select
                value={formData.assignment_type}
                onValueChange={value =>
                  setFormData({ ...formData, assignment_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='deployment'>
                    {locale === 'ar' ? 'نشر' : 'Deployment'}
                  </SelectItem>
                  <SelectItem value='temporary'>
                    {locale === 'ar' ? 'مؤقت' : 'Temporary'}
                  </SelectItem>
                  <SelectItem value='project'>
                    {locale === 'ar' ? 'مشروع' : 'Project'}
                  </SelectItem>
                  <SelectItem value='consultation'>
                    {locale === 'ar' ? 'استشارة' : 'Consultation'}
                  </SelectItem>
                  <SelectItem value='training'>
                    {locale === 'ar' ? 'تدريب' : 'Training'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='job_title'>
                {locale === 'ar' ? 'المسمى الوظيفي' : 'Job Title'} *
              </Label>
              <Input
                id='job_title'
                value={formData.job_title}
                onChange={e =>
                  setFormData({ ...formData, job_title: e.target.value })
                }
                placeholder={
                  locale === 'ar'
                    ? 'مثال: مندوب مبيعات'
                    : 'e.g., Sales Representative'
                }
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='department'>
                {locale === 'ar' ? 'القسم' : 'Department'}
              </Label>
              <Input
                id='department'
                value={formData.department}
                onChange={e =>
                  setFormData({ ...formData, department: e.target.value })
                }
                placeholder={locale === 'ar' ? 'مثال: المبيعات' : 'e.g., Sales'}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='work_location'>
                {locale === 'ar' ? 'موقع العمل' : 'Work Location'}
              </Label>
              <Input
                id='work_location'
                value={formData.work_location}
                onChange={e =>
                  setFormData({ ...formData, work_location: e.target.value })
                }
                placeholder={
                  locale === 'ar' ? 'مثال: دبي مول' : 'e.g., Dubai Mall'
                }
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='start_date'>
                {locale === 'ar' ? 'تاريخ البدء' : 'Start Date'} *
              </Label>
              <Input
                id='start_date'
                type='date'
                value={formData.start_date}
                onChange={e =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='end_date'>
                {locale === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
              </Label>
              <Input
                id='end_date'
                type='date'
                value={formData.end_date}
                onChange={e =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='client_contact_person'>
                {locale === 'ar' ? 'جهة الاتصال' : 'Contact Person'}
              </Label>
              <Input
                id='client_contact_person'
                value={formData.client_contact_person}
                onChange={e =>
                  setFormData({
                    ...formData,
                    client_contact_person: e.target.value,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='client_contact_email'>
                {locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}
              </Label>
              <Input
                id='client_contact_email'
                type='email'
                value={formData.client_contact_email}
                onChange={e =>
                  setFormData({
                    ...formData,
                    client_contact_email: e.target.value,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='client_contact_phone'>
                {locale === 'ar' ? 'الهاتف' : 'Phone'}
              </Label>
              <Input
                id='client_contact_phone'
                value={formData.client_contact_phone}
                onChange={e =>
                  setFormData({
                    ...formData,
                    client_contact_phone: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>
              {locale === 'ar' ? 'ملاحظات' : 'Notes'}
            </Label>
            <Textarea
              id='notes'
              value={formData.notes}
              onChange={e =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder={
                locale === 'ar'
                  ? 'أي ملاحظات إضافية...'
                  : 'Any additional notes...'
              }
              rows={3}
            />
          </div>

          {!assignment && (
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='generate_deployment_letter'
                checked={formData.generate_deployment_letter}
                onCheckedChange={checked =>
                  setFormData({
                    ...formData,
                    generate_deployment_letter: checked as boolean,
                  })
                }
              />
              <Label
                htmlFor='generate_deployment_letter'
                className='text-sm font-normal cursor-pointer'
              >
                {locale === 'ar'
                  ? 'إنشاء خطاب النشر تلقائياً'
                  : 'Generate deployment letter automatically'}
              </Label>
            </div>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={createMutation.isPending}
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  {locale === 'ar' ? 'جاري الحفظ...' : 'Saving...'}
                </>
              ) : assignment ? (
                locale === 'ar' ? (
                  'تحديث'
                ) : (
                  'Update'
                )
              ) : locale === 'ar' ? (
                'إنشاء'
              ) : (
                'Create'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
