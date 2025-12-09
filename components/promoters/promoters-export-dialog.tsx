'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { DashboardPromoter } from './types';

interface PromotersExportDialogProps {
  promoters: DashboardPromoter[];
  selectedCount: number;
  onExport: (options: ExportOptions) => void;
  trigger?: React.ReactNode;
}

interface ExportOptions {
  format: 'csv' | 'xlsx' | 'pdf';
  includeDocuments: boolean;
  includeContacts: boolean;
  includeAssignments: boolean;
  includeStatus: boolean;
}

/**
 * Enhanced export dialog with format and field selection
 * Allows users to customize their export output
 */
export function PromotersExportDialog({
  promoters,
  selectedCount,
  onExport,
  trigger,
}: PromotersExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [format, setFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [options, setOptions] = useState({
    includeDocuments: true,
    includeContacts: true,
    includeAssignments: true,
    includeStatus: true,
  });

  const totalToExport = selectedCount > 0 ? selectedCount : promoters.length;

  const handleExport = async () => {
    if (totalToExport === 0) {
      toast.error('No promoters to export');
      return;
    }

    setIsExporting(true);
    try {
      await onExport({ format, ...options });
      toast.success(
        `Exported ${totalToExport} promoters as ${format.toUpperCase()}`
      );
      setIsOpen(false);
    } catch (error) {
      toast.error('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant='outline' size='sm'>
            <Download className='mr-2 h-4 w-4' />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <Download className='h-5 w-5' />
            Export Promoters Data
          </DialogTitle>
          <DialogDescription>
            Export{' '}
            {selectedCount > 0 ? `${selectedCount} selected` : totalToExport}{' '}
            promoters to your preferred format
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-6 py-4'>
          {/* Format Selection */}
          <div className='space-y-3'>
            <Label>Export Format</Label>
            <RadioGroup
              value={format}
              onValueChange={(value: any) => setFormat(value)}
            >
              <div className='flex items-center space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer'>
                <RadioGroupItem value='csv' id='csv' />
                <Label htmlFor='csv' className='flex-1 cursor-pointer'>
                  <div className='flex items-center gap-2'>
                    <FileSpreadsheet className='h-4 w-4 text-green-600' />
                    <div>
                      <p className='font-medium'>CSV (Excel)</p>
                      <p className='text-xs text-muted-foreground'>
                        Best for data analysis
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className='flex items-center space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer'>
                <RadioGroupItem value='xlsx' id='xlsx' />
                <Label htmlFor='xlsx' className='flex-1 cursor-pointer'>
                  <div className='flex items-center gap-2'>
                    <FileSpreadsheet className='h-4 w-4 text-blue-600' />
                    <div>
                      <p className='font-medium'>Excel (XLSX)</p>
                      <p className='text-xs text-muted-foreground'>
                        With formatting and formulas
                      </p>
                    </div>
                  </div>
                </Label>
              </div>

              <div className='flex items-center space-x-2 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer'>
                <RadioGroupItem value='pdf' id='pdf' />
                <Label htmlFor='pdf' className='flex-1 cursor-pointer'>
                  <div className='flex items-center gap-2'>
                    <FileText className='h-4 w-4 text-red-600' />
                    <div>
                      <p className='font-medium'>PDF Report</p>
                      <p className='text-xs text-muted-foreground'>
                        Print-ready format
                      </p>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Fields to Include */}
          <div className='space-y-3'>
            <Label>Include Fields</Label>
            <div className='space-y-3 p-3 border rounded-md bg-muted/30'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='documents'
                  checked={options.includeDocuments}
                  onCheckedChange={checked =>
                    setOptions({
                      ...options,
                      includeDocuments: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor='documents'
                  className='text-sm font-normal cursor-pointer'
                >
                  Document Information (ID, Passport status)
                </Label>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='contacts'
                  checked={options.includeContacts}
                  onCheckedChange={checked =>
                    setOptions({
                      ...options,
                      includeContacts: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor='contacts'
                  className='text-sm font-normal cursor-pointer'
                >
                  Contact Information (Email, Phone)
                </Label>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='assignments'
                  checked={options.includeAssignments}
                  onCheckedChange={checked =>
                    setOptions({
                      ...options,
                      includeAssignments: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor='assignments'
                  className='text-sm font-normal cursor-pointer'
                >
                  Assignment Details (Company, Job Title)
                </Label>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='status'
                  checked={options.includeStatus}
                  onCheckedChange={checked =>
                    setOptions({
                      ...options,
                      includeStatus: checked as boolean,
                    })
                  }
                />
                <Label
                  htmlFor='status'
                  className='text-sm font-normal cursor-pointer'
                >
                  Status & Compliance (Overall status, Alerts)
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className='flex-col sm:flex-row gap-2'>
          <Button
            variant='outline'
            onClick={() => setIsOpen(false)}
            className='w-full sm:w-auto'
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || totalToExport === 0}
            className='w-full sm:w-auto'
          >
            {isExporting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                Exporting...
              </>
            ) : (
              <>
                <Download className='mr-2 h-4 w-4' />
                Export {totalToExport} Promoter{totalToExport !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
