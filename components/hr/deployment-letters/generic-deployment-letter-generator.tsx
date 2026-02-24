'use client';

import React, { useState, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Loader2,
  Download,
  ExternalLink,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCompany } from '@/components/providers/company-provider';

interface GenericDeploymentLetterGeneratorProps {
  assignmentId?: string;
  employerEmployeeId?: string;
  clientPartyId?: string;
  locale?: string;
  onSuccess?: (contractId: string) => void;
}

export function GenericDeploymentLetterGenerator({
  assignmentId,
  employerEmployeeId,
  clientPartyId,
  locale = 'en',
  onSuccess,
}: GenericDeploymentLetterGeneratorProps) {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    promoter_id: '',
    first_party_id: '', // Employer
    second_party_id: clientPartyId || '', // Client
    contract_number: '',
    contract_start_date: '',
    contract_end_date: '',
    job_title: '',
    department: '',
    work_location: '',
    basic_salary: '',
    special_terms: '',
  });
  const [generating, setGenerating] = useState(false);
  const [pdfStatus, setPdfStatus] = useState<
    'idle' | 'generating' | 'ready' | 'error'
  >('idle');
  const [contractId, setContractId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Fetch promoters
  const { data: promotersData } = useQuery({
    queryKey: ['promoters', companyId],
    queryFn: async () => {
      const response = await fetch('/api/promoters?limit=1000', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch promoters');
      return response.json();
    },
    enabled: !employerEmployeeId,
  });

  // Fetch parties (employers and clients)
  const { data: partiesData } = useQuery({
    queryKey: ['parties', companyId],
    queryFn: async () => {
      const response = await fetch('/api/parties', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch parties');
      return response.json();
    },
  });

  // If assignmentId is provided, fetch assignment details
  const { data: assignmentData } = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const response = await fetch(`/api/hr/assignments/${assignmentId}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch assignment');
      return response.json();
    },
    enabled: !!assignmentId,
  });

  // Auto-populate from assignment
  useEffect(() => {
    if (assignmentData?.assignment) {
      const assignment = assignmentData.assignment;
      setFormData(prev => ({
        ...prev,
        employer_employee_id: assignment.employer_employee_id,
        second_party_id: assignment.client_party_id,
        job_title: assignment.job_title || prev.job_title,
        department: assignment.department || prev.department,
        work_location: assignment.work_location || prev.work_location,
        contract_start_date: assignment.start_date
          ? assignment.start_date.split('T')[0]
          : prev.contract_start_date,
        contract_end_date: assignment.end_date
          ? assignment.end_date.split('T')[0]
          : prev.contract_end_date,
      }));
    }
  }, [assignmentData]);

  // Auto-generate contract number
  const generateContractNumber = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `DEP-${year}${month}${day}-${random}`;
  };

  useEffect(() => {
    if (!formData.contract_number) {
      setFormData(prev => ({
        ...prev,
        contract_number: generateContractNumber(),
      }));
    }
  }, []);

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      setGenerating(true);
      setPdfStatus('generating');

      // Create contract first
      const contractResponse = await fetch('/api/contracts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          contract_type: 'deployment_letter',
          contract_number: data.contract_number,
          promoter_id: data.promoter_id,
          first_party_id: data.first_party_id,
          second_party_id: data.second_party_id,
          start_date: data.contract_start_date,
          end_date: data.contract_end_date,
          job_title: data.job_title,
          department: data.department,
          work_location: data.work_location,
          basic_salary: data.basic_salary
            ? parseFloat(data.basic_salary)
            : undefined,
          special_terms: data.special_terms,
        }),
      });

      if (!contractResponse.ok) {
        const error = await contractResponse.json();
        throw new Error(error.error || 'Failed to create contract');
      }

      const contractResult = await contractResponse.json();
      const newContractId = contractResult.contract?.id;

      if (!newContractId) {
        throw new Error('Contract created but no ID returned');
      }

      setContractId(newContractId);

      // Trigger PDF generation via Make.com webhook
      const webhookResponse = await fetch('/api/webhook/makecom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          contract_id: newContractId,
          contract_type: 'deployment_letter',
          ...data,
        }),
      });

      if (!webhookResponse.ok) {
        console.warn(
          'PDF generation webhook may have failed, but contract was created'
        );
      }

      return { contractId: newContractId, contract: contractResult.contract };
    },
    onSuccess: data => {
      setPdfStatus('ready');
      toast({
        title: locale === 'ar' ? 'تم الإنشاء بنجاح' : 'Created Successfully',
        description:
          locale === 'ar'
            ? 'تم إنشاء خطاب النشر بنجاح. جاري إنشاء PDF...'
            : 'Deployment letter created successfully. Generating PDF...',
      });
      onSuccess?.(data.contractId);
    },
    onError: error => {
      setPdfStatus('error');
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to generate deployment letter',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setGenerating(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.promoter_id) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          locale === 'ar' ? 'يرجى اختيار الموظف' : 'Please select employee',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.first_party_id) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          locale === 'ar' ? 'يرجى اختيار صاحب العمل' : 'Please select employer',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.second_party_id) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          locale === 'ar' ? 'يرجى اختيار العميل' : 'Please select client',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.contract_start_date) {
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

    generateMutation.mutate(formData);
  };

  const promoters = promotersData?.promoters || [];
  const parties = partiesData?.parties || [];
  const employers = parties.filter((p: any) => p.type === 'employer');
  const clients = parties.filter((p: any) => p.type === 'client');

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <FileText className='h-5 w-5' />
          {locale === 'ar' ? 'إنشاء خطاب نشر' : 'Generate Deployment Letter'}
        </CardTitle>
        <CardDescription>
          {locale === 'ar'
            ? 'إنشاء خطاب نشر احترافي للموظف'
            : 'Generate a professional deployment letter for employee'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='promoter_id'>
                {locale === 'ar' ? 'الموظف' : 'Employee'} *
              </Label>
              <Select
                value={formData.promoter_id}
                onValueChange={value =>
                  setFormData({ ...formData, promoter_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      locale === 'ar' ? 'اختر الموظف' : 'Select employee'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {promoters.map((promoter: any) => (
                    <SelectItem key={promoter.id} value={promoter.id}>
                      {promoter.name_en || promoter.name_ar || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='contract_number'>
                {locale === 'ar' ? 'رقم العقد' : 'Contract Number'} *
              </Label>
              <div className='flex gap-2'>
                <Input
                  id='contract_number'
                  value={formData.contract_number}
                  onChange={e =>
                    setFormData({
                      ...formData,
                      contract_number: e.target.value,
                    })
                  }
                  placeholder='DEP-YYYYMMDD-XXX'
                />
                <Button
                  type='button'
                  variant='outline'
                  onClick={() =>
                    setFormData({
                      ...formData,
                      contract_number: generateContractNumber(),
                    })
                  }
                >
                  {locale === 'ar' ? 'توليد' : 'Generate'}
                </Button>
              </div>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='first_party_id'>
                {locale === 'ar' ? 'صاحب العمل' : 'Employer'} *
              </Label>
              <Select
                value={formData.first_party_id}
                onValueChange={value =>
                  setFormData({ ...formData, first_party_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      locale === 'ar' ? 'اختر صاحب العمل' : 'Select employer'
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {employers.map((employer: any) => (
                    <SelectItem key={employer.id} value={employer.id}>
                      {employer.name_en || employer.name_ar || 'N/A'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='second_party_id'>
                {locale === 'ar' ? 'العميل' : 'Client'} *
              </Label>
              <Select
                value={formData.second_party_id}
                onValueChange={value =>
                  setFormData({ ...formData, second_party_id: value })
                }
                disabled={!!clientPartyId}
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
              <Label htmlFor='contract_start_date'>
                {locale === 'ar' ? 'تاريخ البدء' : 'Start Date'} *
              </Label>
              <Input
                id='contract_start_date'
                type='date'
                value={formData.contract_start_date}
                onChange={e =>
                  setFormData({
                    ...formData,
                    contract_start_date: e.target.value,
                  })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='contract_end_date'>
                {locale === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}
              </Label>
              <Input
                id='contract_end_date'
                type='date'
                value={formData.contract_end_date}
                onChange={e =>
                  setFormData({
                    ...formData,
                    contract_end_date: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className='grid grid-cols-3 gap-4'>
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
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='basic_salary'>
              {locale === 'ar' ? 'الراتب الأساسي' : 'Basic Salary'}
            </Label>
            <Input
              id='basic_salary'
              type='number'
              step='0.01'
              value={formData.basic_salary}
              onChange={e =>
                setFormData({ ...formData, basic_salary: e.target.value })
              }
              placeholder='0.00'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='special_terms'>
              {locale === 'ar' ? 'شروط خاصة' : 'Special Terms'}
            </Label>
            <Textarea
              id='special_terms'
              value={formData.special_terms}
              onChange={e =>
                setFormData({ ...formData, special_terms: e.target.value })
              }
              placeholder={
                locale === 'ar'
                  ? 'أي شروط إضافية...'
                  : 'Any additional terms...'
              }
              rows={3}
            />
          </div>

          {/* Status Alert */}
          {pdfStatus === 'generating' && (
            <Alert>
              <Loader2 className='h-4 w-4 animate-spin' />
              <AlertDescription>
                {locale === 'ar'
                  ? 'جاري إنشاء خطاب النشر و PDF...'
                  : 'Generating deployment letter and PDF...'}
              </AlertDescription>
            </Alert>
          )}

          {pdfStatus === 'ready' && contractId && (
            <Alert className='bg-green-50 border-green-200'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <AlertDescription className='text-green-800'>
                {locale === 'ar'
                  ? 'تم إنشاء خطاب النشر بنجاح!'
                  : 'Deployment letter created successfully!'}
                <div className='mt-2 flex gap-2'>
                  <Button variant='outline' size='sm' asChild>
                    <a href={`/en/contracts/${contractId}`} target='_blank'>
                      <ExternalLink className='h-4 w-4 mr-2' />
                      {locale === 'ar' ? 'عرض العقد' : 'View Contract'}
                    </a>
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {pdfStatus === 'error' && (
            <Alert variant='destructive'>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                {locale === 'ar'
                  ? 'حدث خطأ أثناء إنشاء خطاب النشر'
                  : 'An error occurred while generating the deployment letter'}
              </AlertDescription>
            </Alert>
          )}

          <div className='flex justify-end gap-2'>
            <Button type='submit' disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  {locale === 'ar' ? 'جاري الإنشاء...' : 'Generating...'}
                </>
              ) : (
                <>
                  <FileText className='h-4 w-4 mr-2' />
                  {locale === 'ar'
                    ? 'إنشاء خطاب النشر'
                    : 'Generate Deployment Letter'}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
