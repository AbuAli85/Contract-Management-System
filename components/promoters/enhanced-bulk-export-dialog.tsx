/**
 * Enhanced Bulk Export Dialog Component
 * Export promoters data in multiple formats with customizable options
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Download,
  FileSpreadsheet,
  FileJson,
  FileText,
  Loader2,
} from 'lucide-react';
import type { DashboardPromoter } from './types';

interface EnhancedBulkExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  promoters: DashboardPromoter[];
  selectedIds?: string[];
}

type ExportFormat = 'csv' | 'excel' | 'json' | 'pdf';

interface ExportOptions {
  format: ExportFormat;
  includeFields: Set<string>;
  includeAll: boolean;
  dateFormat: 'iso' | 'locale' | 'custom';
}

const AVAILABLE_FIELDS = [
  { id: 'full_name', label: 'Full Name', default: true },
  { id: 'email', label: 'Email', default: true },
  { id: 'phone', label: 'Phone', default: true },
  { id: 'job_title', label: 'Job Title', default: true },
  { id: 'work_location', label: 'Work Location', default: true },
  { id: 'status', label: 'Status', default: true },
  { id: 'id_card_expiry_date', label: 'ID Card Expiry', default: true },
  { id: 'passport_expiry_date', label: 'Passport Expiry', default: true },
  { id: 'employer_id', label: 'Employer', default: false },
  { id: 'created_at', label: 'Created Date', default: false },
  { id: 'updated_at', label: 'Updated Date', default: false },
  { id: 'profile_picture_url', label: 'Profile Picture URL', default: false },
];

export function EnhancedBulkExportDialog({
  isOpen,
  onClose,
  promoters,
  selectedIds,
}: EnhancedBulkExportDialogProps) {
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeFields: new Set(
      AVAILABLE_FIELDS.filter(f => f.default).map(f => f.id)
    ),
    includeAll: selectedIds ? false : true,
    dateFormat: 'locale',
  });

  const dataToExport = options.includeAll
    ? promoters
    : promoters.filter(p => selectedIds?.includes(p.id));

  const handleFieldToggle = (fieldId: string, checked: boolean) => {
    const newFields = new Set(options.includeFields);
    if (checked) {
      newFields.add(fieldId);
    } else {
      newFields.delete(fieldId);
    }
    setOptions({ ...options, includeFields: newFields });
  };

  const handleSelectAllFields = () => {
    setOptions({
      ...options,
      includeFields: new Set(AVAILABLE_FIELDS.map(f => f.id)),
    });
  };

  const handleDeselectAllFields = () => {
    setOptions({ ...options, includeFields: new Set() });
  };

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return '';

    const dateObj = new Date(date);
    switch (options.dateFormat) {
      case 'iso':
        return dateObj.toISOString();
      case 'locale':
        return dateObj.toLocaleDateString();
      case 'custom':
        return dateObj.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        });
      default:
        return date;
    }
  };

  const prepareDataForExport = () => {
    return dataToExport.map(promoter => {
      const row: Record<string, any> = {};

      options.includeFields.forEach(fieldId => {
        const value = promoter[fieldId as keyof DashboardPromoter];

        // Format dates
        if (fieldId.includes('date') && typeof value === 'string' && value) {
          row[fieldId] = formatDate(value);
        } else {
          row[fieldId] = value ?? '';
        }
      });

      return row;
    });
  };

  const exportToCSV = () => {
    const data = prepareDataForExport();
    if (data.length === 0) return;

    const headers = Array.from(options.includeFields);
    const csv = [
      headers.join(','),
      ...data.map(row =>
        headers
          .map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value ?? '').replace(/"/g, '""');
            return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, 'promoters-export.csv');
  };

  const exportToJSON = () => {
    const data = prepareDataForExport();
    const json = JSON.stringify(data, null, 2);

    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, 'promoters-export.json');
  };

  const exportToExcel = async () => {
    // Note: This requires xlsx library
    toast({
      title: 'Excel export',
      description:
        'Excel export requires the xlsx library. Falling back to CSV.',
    });
    exportToCSV();
  };

  const exportToPDF = async () => {
    // Note: This requires jspdf library
    toast({
      title: 'PDF export',
      description: 'PDF export is coming soon. Please use CSV or JSON for now.',
      variant: 'default',
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (options.includeFields.size === 0) {
      toast({
        title: 'No fields selected',
        description: 'Please select at least one field to export',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      switch (options.format) {
        case 'csv':
          exportToCSV();
          break;
        case 'excel':
          await exportToExcel();
          break;
        case 'json':
          exportToJSON();
          break;
        case 'pdf':
          await exportToPDF();
          break;
      }

      toast({
        title: 'Export successful',
        description: `Exported ${dataToExport.length} promoters to ${options.format.toUpperCase()}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Export failed',
        description: 'An error occurred while exporting data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[80vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' />
            Export Promoters Data
          </DialogTitle>
          <DialogDescription>
            Export {options.includeAll ? 'all' : selectedIds?.length || 0}{' '}
            promoters with customizable options
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6'>
          {/* Export Format */}
          <div className='space-y-2'>
            <Label>Export Format</Label>
            <Select
              value={options.format}
              onValueChange={value =>
                setOptions({ ...options, format: value as ExportFormat })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='csv'>
                  <div className='flex items-center gap-2'>
                    <FileSpreadsheet className='h-4 w-4' />
                    CSV (Comma Separated Values)
                  </div>
                </SelectItem>
                <SelectItem value='json'>
                  <div className='flex items-center gap-2'>
                    <FileJson className='h-4 w-4' />
                    JSON (JavaScript Object Notation)
                  </div>
                </SelectItem>
                <SelectItem value='excel'>
                  <div className='flex items-center gap-2'>
                    <FileSpreadsheet className='h-4 w-4' />
                    Excel (.xlsx)
                  </div>
                </SelectItem>
                <SelectItem value='pdf'>
                  <div className='flex items-center gap-2'>
                    <FileText className='h-4 w-4' />
                    PDF (Portable Document Format)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Format */}
          <div className='space-y-2'>
            <Label>Date Format</Label>
            <Select
              value={options.dateFormat}
              onValueChange={(value: any) =>
                setOptions({ ...options, dateFormat: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='iso'>
                  ISO 8601 (2024-01-15T10:30:00.000Z)
                </SelectItem>
                <SelectItem value='locale'>Locale (1/15/2024)</SelectItem>
                <SelectItem value='custom'>Custom (15/01/2024)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Fields Selection */}
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <Label>Fields to Include</Label>
              <div className='flex gap-2'>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleSelectAllFields}
                  type='button'
                >
                  Select All
                </Button>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={handleDeselectAllFields}
                  type='button'
                >
                  Deselect All
                </Button>
              </div>
            </div>

            <div className='grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-4 border rounded-lg'>
              {AVAILABLE_FIELDS.map(field => (
                <div key={field.id} className='flex items-center space-x-2'>
                  <Checkbox
                    id={field.id}
                    checked={options.includeFields.has(field.id)}
                    onCheckedChange={checked =>
                      handleFieldToggle(field.id, checked as boolean)
                    }
                  />
                  <label
                    htmlFor={field.id}
                    className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
                  >
                    {field.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className='rounded-lg bg-muted p-4 text-sm'>
            <p className='font-medium mb-2'>Export Summary:</p>
            <ul className='space-y-1 text-muted-foreground'>
              <li>• Records: {dataToExport.length}</li>
              <li>• Fields: {options.includeFields.size}</li>
              <li>• Format: {options.format.toUpperCase()}</li>
              <li>• Date Format: {options.dateFormat}</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Exporting...
              </>
            ) : (
              <>
                <Download className='h-4 w-4 mr-2' />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
