'use client';

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { useToast } from '@/hooks/use-toast';
import { Upload, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employerEmployeeId?: string;
  locale?: string;
  onSuccess?: () => void;
}

export function DocumentUploadDialog({
  open,
  onOpenChange,
  employerEmployeeId,
  locale = 'en',
  onSuccess,
}: DocumentUploadDialogProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    employer_employee_id: employerEmployeeId || '',
    document_type: '',
    document_name: '',
    expiry_date: '',
    issue_date: '',
    issuing_authority: '',
    document_number: '',
    notes: '',
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const supabase = createClient();

  const uploadMutation = useMutation({
    mutationFn: async (data: any) => {
      setUploading(true);

      // Upload file to Supabase Storage
      let fileUrl = '';
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `documents/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, selectedFile);

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
      }

      // Create document record
      const response = await fetch('/api/hr/documents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          file_url: fileUrl,
          file_name: selectedFile?.name,
          file_size: selectedFile?.size,
          mime_type: selectedFile?.type,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create document');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: locale === 'ar' ? 'تم الرفع بنجاح' : 'Upload Successful',
        description:
          locale === 'ar'
            ? 'تم رفع المستند بنجاح'
            : 'Document has been uploaded successfully',
      });
      setFormData({
        employer_employee_id: employerEmployeeId || '',
        document_type: '',
        document_name: '',
        expiry_date: '',
        issue_date: '',
        issuing_authority: '',
        document_number: '',
        notes: '',
      });
      setSelectedFile(null);
      onSuccess?.();
      onOpenChange(false);
    },
    onError: error => {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to upload document',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setUploading(false);
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

    if (!formData.document_type) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          locale === 'ar'
            ? 'يرجى اختيار نوع المستند'
            : 'Please select document type',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.document_name) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          locale === 'ar'
            ? 'يرجى إدخال اسم المستند'
            : 'Please enter document name',
        variant: 'destructive',
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description:
          locale === 'ar' ? 'يرجى اختيار ملف' : 'Please select a file',
        variant: 'destructive',
      });
      return;
    }

    uploadMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Upload className='h-5 w-5' />
            {locale === 'ar' ? 'رفع مستند جديد' : 'Upload New Document'}
          </DialogTitle>
          <DialogDescription>
            {locale === 'ar'
              ? 'قم برفع مستند جديد للموظف'
              : 'Upload a new document for the employee'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='document_type'>
                {locale === 'ar' ? 'نوع المستند' : 'Document Type'} *
              </Label>
              <Select
                value={formData.document_type}
                onValueChange={value =>
                  setFormData({ ...formData, document_type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={locale === 'ar' ? 'اختر النوع' : 'Select type'}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='id_card'>
                    {locale === 'ar' ? 'بطاقة الهوية' : 'ID Card'}
                  </SelectItem>
                  <SelectItem value='passport'>
                    {locale === 'ar' ? 'جواز السفر' : 'Passport'}
                  </SelectItem>
                  <SelectItem value='contract'>
                    {locale === 'ar' ? 'عقد' : 'Contract'}
                  </SelectItem>
                  <SelectItem value='certificate'>
                    {locale === 'ar' ? 'شهادة' : 'Certificate'}
                  </SelectItem>
                  <SelectItem value='training_certificate'>
                    {locale === 'ar' ? 'شهادة تدريب' : 'Training Certificate'}
                  </SelectItem>
                  <SelectItem value='license'>
                    {locale === 'ar' ? 'رخصة' : 'License'}
                  </SelectItem>
                  <SelectItem value='visa'>
                    {locale === 'ar' ? 'تأشيرة' : 'Visa'}
                  </SelectItem>
                  <SelectItem value='work_permit'>
                    {locale === 'ar' ? 'تصريح عمل' : 'Work Permit'}
                  </SelectItem>
                  <SelectItem value='insurance'>
                    {locale === 'ar' ? 'تأمين' : 'Insurance'}
                  </SelectItem>
                  <SelectItem value='other'>
                    {locale === 'ar' ? 'أخرى' : 'Other'}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='document_name'>
                {locale === 'ar' ? 'اسم المستند' : 'Document Name'} *
              </Label>
              <Input
                id='document_name'
                value={formData.document_name}
                onChange={e =>
                  setFormData({ ...formData, document_name: e.target.value })
                }
                placeholder={
                  locale === 'ar' ? 'أدخل اسم المستند' : 'Enter document name'
                }
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='file'>{locale === 'ar' ? 'الملف' : 'File'} *</Label>
            <div className='flex items-center gap-2'>
              <Input
                id='file'
                type='file'
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setSelectedFile(file);
                    if (!formData.document_name) {
                      setFormData({ ...formData, document_name: file.name });
                    }
                  }
                }}
                accept='.pdf,.jpg,.jpeg,.png,.doc,.docx'
                className='flex-1'
              />
              {selectedFile && (
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => setSelectedFile(null)}
                >
                  <X className='h-4 w-4' />
                </Button>
              )}
            </div>
            {selectedFile && (
              <p className='text-sm text-gray-500'>
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='issue_date'>
                {locale === 'ar' ? 'تاريخ الإصدار' : 'Issue Date'}
              </Label>
              <Input
                id='issue_date'
                type='date'
                value={formData.issue_date}
                onChange={e =>
                  setFormData({ ...formData, issue_date: e.target.value })
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='expiry_date'>
                {locale === 'ar' ? 'تاريخ الانتهاء' : 'Expiry Date'}
              </Label>
              <Input
                id='expiry_date'
                type='date'
                value={formData.expiry_date}
                onChange={e =>
                  setFormData({ ...formData, expiry_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='issuing_authority'>
                {locale === 'ar' ? 'جهة الإصدار' : 'Issuing Authority'}
              </Label>
              <Input
                id='issuing_authority'
                value={formData.issuing_authority}
                onChange={e =>
                  setFormData({
                    ...formData,
                    issuing_authority: e.target.value,
                  })
                }
                placeholder={
                  locale === 'ar'
                    ? 'مثال: وزارة الداخلية'
                    : 'e.g., Ministry of Interior'
                }
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='document_number'>
                {locale === 'ar' ? 'رقم المستند' : 'Document Number'}
              </Label>
              <Input
                id='document_number'
                value={formData.document_number}
                onChange={e =>
                  setFormData({ ...formData, document_number: e.target.value })
                }
                placeholder={
                  locale === 'ar'
                    ? 'رقم الهوية أو الجواز'
                    : 'ID or Passport number'
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

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              {locale === 'ar' ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button type='submit' disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  {locale === 'ar' ? 'جاري الرفع...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className='h-4 w-4 mr-2' />
                  {locale === 'ar' ? 'رفع' : 'Upload'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
