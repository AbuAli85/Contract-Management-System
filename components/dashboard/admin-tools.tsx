'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Settings, Database, Mail, FileSpreadsheet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input'; // For file input
import { useParams } from 'next/navigation';
import type React from 'react';

export default function AdminTools() {
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();

  const handleBulkImport = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast({
        title: 'Invalid File',
        description: 'Please select a CSV file',
        variant: 'destructive',
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();

      toast({
        title: 'Upload Successful',
        description: `Processed ${data.processed} records from ${file.name}`,
      });
    } catch (error) {
      console.error('Bulk import error:', error);
      toast({
        title: 'Upload Failed',
        description: 'Failed to process the CSV file',
        variant: 'destructive',
      });
    }
  };

  const adminActions = [
    {
      label: 'Manage Users',
      labelAr: 'إدارة المستخدمين',
      icon: Users,
      action: () => {
        // Navigate to user management page
        window.location.href = `/${locale}/dashboard/users`;
      },
    },
    {
      label: 'System Settings',
      labelAr: 'إعدادات النظام',
      icon: Settings,
      action: () => {
        // Navigate to settings page
        window.location.href = `/${locale}/dashboard/settings`;
      },
    },
    {
      label: 'Database Backup',
      labelAr: 'نسخ احتياطي لقاعدة البيانات',
      icon: Database,
      action: async () => {
        try {
          const response = await fetch('/api/admin/backup', {
            method: 'POST',
          });

          if (!response.ok) {
            throw new Error('Backup failed');
          }

          const data = await response.json();

          toast({
            title: 'Backup Started',
            description: 'Database backup has been initiated',
          });
        } catch (error) {
          console.error('Backup error:', error);
          toast({
            title: 'Backup Failed',
            description: 'Failed to initiate database backup',
            variant: 'destructive',
          });
        }
      },
    },
    {
      label: 'Email Templates',
      labelAr: 'قوالب البريد الإلكتروني',
      icon: Mail,
      action: () => {
        // Navigate to email templates page
        window.location.href = `/${locale}/dashboard/email-templates`;
      },
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Tools / أدوات المسؤول</CardTitle>
        <CardDescription>
          Quick access to administrative functions. / وصول سريع إلى الوظائف
          الإدارية.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {adminActions.map(tool => (
          <Button
            key={tool.label}
            variant='outline'
            onClick={tool.action}
            className='w-full justify-start p-4 text-left'
          >
            <tool.icon className='mr-3 h-5 w-5' />
            <div>
              <p>{tool.label}</p>
              <p className='text-xs text-muted-foreground'>{tool.labelAr}</p>
            </div>
          </Button>
        ))}
        <div className='space-y-2 rounded-md border p-4'>
          <label
            htmlFor='bulk-import-input'
            className='flex cursor-pointer items-center gap-2 font-semibold'
          >
            <FileSpreadsheet className='h-5 w-5' />
            <div>
              <p>Bulk Contract Import</p>
              <p className='text-xs text-muted-foreground'>
                استيراد جماعي للعقود
              </p>
            </div>
          </label>
          <Input
            id='bulk-import-input'
            type='file'
            accept='.csv'
            onChange={handleBulkImport}
            className='mt-1'
          />
          <p className='mt-1 text-xs text-muted-foreground'>
            Upload a CSV file to import multiple contracts.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
