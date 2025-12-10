'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Download, FileText, FileSpreadsheet, File, Loader2 } from 'lucide-react';
import type { DashboardPromoter } from './types';

interface PromotersAdvancedExportProps {
  promoters: DashboardPromoter[];
  selectedIds?: Set<string>;
  isOpen: boolean;
  onClose: () => void;
}

export function PromotersAdvancedExport({
  promoters,
  selectedIds,
  isOpen,
  onClose,
}: PromotersAdvancedExportProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'json' | 'pdf'>('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [includeFields, setIncludeFields] = useState<Set<string>>(
    new Set([
      'name',
      'email',
      'phone',
      'status',
      'company',
      'jobTitle',
      'idExpiry',
      'passportExpiry',
      'createdAt',
    ])
  );

  const dataToExport = useMemo(() => {
    if (selectedIds && selectedIds.size > 0) {
      return promoters.filter(p => selectedIds.has(p.id));
    }
    return promoters;
  }, [promoters, selectedIds]);

  const availableFields = [
    { id: 'name', label: 'Name', default: true },
    { id: 'email', label: 'Email', default: true },
    { id: 'phone', label: 'Phone', default: true },
    { id: 'status', label: 'Status', default: true },
    { id: 'company', label: 'Company', default: true },
    { id: 'jobTitle', label: 'Job Title', default: true },
    { id: 'idExpiry', label: 'ID Expiry', default: true },
    { id: 'passportExpiry', label: 'Passport Expiry', default: true },
    { id: 'createdAt', label: 'Created Date', default: true },
    { id: 'address', label: 'Address', default: false },
    { id: 'nationality', label: 'Nationality', default: false },
    { id: 'documents', label: 'Document Status', default: false },
    { id: 'assignment', label: 'Assignment Details', default: false },
  ];

  const toggleField = (fieldId: string) => {
    const newFields = new Set(includeFields);
    if (newFields.has(fieldId)) {
      newFields.delete(fieldId);
    } else {
      newFields.add(fieldId);
    }
    setIncludeFields(newFields);
  };

  const exportToCSV = () => {
    const headers: string[] = [];
    const rows: string[][] = [];

    // Build headers
    availableFields.forEach(field => {
      if (includeFields.has(field.id)) {
        headers.push(field.label);
      }
    });

    // Build rows
    dataToExport.forEach(promoter => {
      const row: string[] = [];
      availableFields.forEach(field => {
        if (includeFields.has(field.id)) {
          switch (field.id) {
            case 'name':
              row.push(promoter.displayName || '');
              break;
            case 'email':
              row.push(promoter.contactEmail || '');
              break;
            case 'phone':
              row.push(promoter.contactPhone || '');
              break;
            case 'status':
              row.push(promoter.overallStatus || '');
              break;
            case 'company':
              row.push(promoter.organisationLabel || '');
              break;
            case 'jobTitle':
              row.push(promoter.job_title || '');
              break;
            case 'idExpiry':
              row.push(promoter.id_card_expiry_date || '');
              break;
            case 'passportExpiry':
              row.push(promoter.passport_expiry_date || '');
              break;
            case 'createdAt':
              row.push(promoter.created_at || '');
              break;
            default:
              row.push('');
          }
        }
      });
      rows.push(row);
    });

    // Escape CSV values
    const escapeCSV = (value: string) => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };

    const csvContent = [
      headers.map(escapeCSV).join(','),
      ...rows.map(row => row.map(escapeCSV).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadBlob(blob, `promoters-export-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const exportToJSON = () => {
    const jsonData = dataToExport.map(promoter => {
      const obj: Record<string, any> = {};
      availableFields.forEach(field => {
        if (includeFields.has(field.id)) {
          switch (field.id) {
            case 'name':
              obj[field.label] = promoter.displayName;
              break;
            case 'email':
              obj[field.label] = promoter.contactEmail;
              break;
            case 'phone':
              obj[field.label] = promoter.contactPhone;
              break;
            case 'status':
              obj[field.label] = promoter.overallStatus;
              break;
            case 'company':
              obj[field.label] = promoter.organisationLabel;
              break;
            case 'jobTitle':
              obj[field.label] = promoter.job_title;
              break;
            case 'idExpiry':
              obj[field.label] = promoter.id_card_expiry_date;
              break;
            case 'passportExpiry':
              obj[field.label] = promoter.passport_expiry_date;
              break;
            case 'createdAt':
              obj[field.label] = promoter.created_at;
              break;
          }
        }
      });
      return obj;
    });

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `promoters-export-${new Date().toISOString().split('T')[0]}.json`);
  };

  const exportToExcel = async () => {
    // For Excel, we'll create a CSV that Excel can open
    // In production, use xlsx library for proper Excel format
    toast({
      title: 'Excel Export',
      description: 'Exporting as CSV (Excel-compatible). For full Excel support, install xlsx library.',
    });
    exportToCSV();
  };

  const exportToPDF = async () => {
    toast({
      title: 'PDF Export',
      description: 'PDF export coming soon. Please use CSV or JSON for now.',
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    if (includeFields.size === 0) {
      toast({
        title: 'No fields selected',
        description: 'Please select at least one field to export',
        variant: 'destructive',
      });
      return;
    }

    if (dataToExport.length === 0) {
      toast({
        title: 'No data to export',
        description: 'No promoters selected for export',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);

    try {
      switch (format) {
        case 'csv':
          exportToCSV();
          break;
        case 'xlsx':
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
        title: 'Export Successful',
        description: `Exported ${dataToExport.length} promoter${dataToExport.length > 1 ? 's' : ''} as ${format.toUpperCase()}`,
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'An error occurred during export',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='text-2xl font-bold flex items-center gap-2'>
            <Download className='h-6 w-6' />
            Advanced Export
          </DialogTitle>
          <DialogDescription>
            Export {dataToExport.length} promoter{dataToExport.length > 1 ? 's' : ''} with custom fields and format
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Format Selection */}
          <div className='space-y-2'>
            <Label className='text-base font-semibold'>Export Format</Label>
            <Select value={format} onValueChange={(value: any) => setFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='csv'>
                  <div className='flex items-center gap-2'>
                    <FileText className='h-4 w-4' />
                    CSV (Comma Separated Values)
                  </div>
                </SelectItem>
                <SelectItem value='xlsx'>
                  <div className='flex items-center gap-2'>
                    <FileSpreadsheet className='h-4 w-4' />
                    Excel (XLSX)
                  </div>
                </SelectItem>
                <SelectItem value='json'>
                  <div className='flex items-center gap-2'>
                    <File className='h-4 w-4' />
                    JSON (JavaScript Object Notation)
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

          {/* Field Selection */}
          <div className='space-y-3'>
            <Label className='text-base font-semibold'>Select Fields to Export</Label>
            <div className='grid grid-cols-2 gap-3 max-h-64 overflow-y-auto p-2 border rounded-lg'>
              {availableFields.map(field => (
                <div key={field.id} className='flex items-center space-x-2'>
                  <Checkbox
                    id={field.id}
                    checked={includeFields.has(field.id)}
                    onCheckedChange={() => toggleField(field.id)}
                  />
                  <Label
                    htmlFor={field.id}
                    className='text-sm font-normal cursor-pointer'
                  >
                    {field.label}
                  </Label>
                </div>
              ))}
            </div>
            <div className='flex items-center justify-between text-sm text-muted-foreground'>
              <span>
                {includeFields.size} of {availableFields.length} fields selected
              </span>
              <button
                onClick={() => {
                  if (includeFields.size === availableFields.length) {
                    setIncludeFields(new Set());
                  } else {
                    setIncludeFields(new Set(availableFields.map(f => f.id)));
                  }
                }}
                className='text-primary hover:underline'
              >
                {includeFields.size === availableFields.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || includeFields.size === 0}>
            {isExporting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Exporting...
              </>
            ) : (
              <>
                <Download className='mr-2 h-4 w-4' />
                Export {dataToExport.length} Promoter{dataToExport.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

