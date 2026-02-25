'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import * as XLSX from 'xlsx';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => void;
}

interface ImportResult {
  success: boolean;
  message: string;
  imported: number;
  errors: string[];
  duplicates: number;
}

interface PromoterData {
  name_en: string;
  name_ar: string;
  id_card_number: string;
  mobile_number?: string;
  passport_number?: string;
  nationality?: string;
  id_card_expiry_date?: string | null;
  passport_expiry_date?: string | null;
  notes?: string;
  status?: string;
  employer_id?: string;
}

interface Company {
  id: string;
  name_en: string;
  name_ar: string;
}

export default function ExcelImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: ExcelImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [previewData, setPreviewData] = useState<PromoterData[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [step, setStep] = useState<
    'upload' | 'preview' | 'import' | 'complete'
  >('upload');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);
  const { toast } = useToast();

  // Fetch companies when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen]);

  const fetchCompanies = useCallback(async () => {
    setCompaniesLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        return;
      }

      const { data, error } = await supabase
        .from('parties')
        .select('id, name_en, name_ar')
        .eq('type', 'Employer')
        .order('name_en');

      if (error) {
        toast({
          title: 'Error loading companies',
          description: 'Could not load company list for template',
          variant: 'destructive',
        });
        return;
      }

      setCompanies(data || []);
    } catch (error) {
    } finally {
      setCompaniesLoading(false);
    }
  }, [toast]);

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = event.target.files?.[0];
      if (!selectedFile) return;

      // Validate by extension fallback as some browsers provide empty/incorrect MIME types
      const fileName = selectedFile.name.toLowerCase();
      const ext = fileName.split('.').pop() || '';
      const allowedExt = ['xlsx', 'xls', 'csv'];
      const validByExt = allowedExt.includes(ext);
      const validTypes = [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel', // .xls
        'text/csv', // .csv
      ];
      const validByMime = validTypes.includes(selectedFile.type);

      if (!validByExt && !validByMime) {
        toast({
          title: 'Invalid file type',
          description:
            'Please upload an Excel (.xlsx, .xls) or CSV (.csv) file saved on your local disk.',
          variant: 'destructive',
        });
        return;
      }

      setFile(selectedFile);
      processFile(selectedFile);
    },
    [toast]
  );

  const processFile = useCallback(
    async (selectedFile: File) => {
      setIsProcessing(true);
      setProgress(0);

      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {
          type: 'array',
          cellDates: true,
          raw: false,
          dateNF: 'yyyy-mm-dd',
        });

        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON (row arrays) keeping empty cells as ''
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          raw: false,
          defval: '',
        });

        if (jsonData.length < 2) {
          throw new Error(
            'File must contain at least a header row and one data row'
          );
        }

        // Extract headers and data
        const headers = jsonData[0] as string[];
        const dataRows = jsonData.slice(1) as any[][];

        // Build header index map with tolerant matching (underscores, punctuation → spaces)
        const normalize = (s: string) =>
          String(s || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        const idx = {
          name_en: headers.findIndex(h =>
            [
              'name en',
              'english name',
              'name',
              'full name english',
              'name english',
              'name_en',
            ].includes(normalize(h))
          ),
          name_ar: headers.findIndex(h =>
            ['name ar', 'arabic name', 'full name arabic', 'name_ar'].includes(
              normalize(h)
            )
          ),
          first_name: headers.findIndex(h =>
            ['first name', 'firstname', 'first_name'].includes(normalize(h))
          ),
          last_name: headers.findIndex(h =>
            ['last name', 'lastname', 'last_name', 'surname'].includes(
              normalize(h)
            )
          ),
          id_card_number: headers.findIndex(h =>
            [
              'id card number',
              'id number',
              'id',
              'national id',
              'id_card_number',
            ].includes(normalize(h))
          ),
          mobile_number: headers.findIndex(h =>
            ['mobile number', 'mobile', 'phone', 'mobile_number'].includes(
              normalize(h)
            )
          ),
          passport_number: headers.findIndex(h =>
            [
              'passport number',
              'passport',
              'passport_no',
              'passport_number',
            ].includes(normalize(h))
          ),
          nationality: headers.findIndex(h =>
            ['nationality'].includes(normalize(h))
          ),
          id_card_expiry_date: headers.findIndex(h =>
            ['id expiry date', 'id card expiry date', 'id expiry'].includes(
              normalize(h)
            )
          ),
          passport_expiry_date: headers.findIndex(h =>
            ['passport expiry date', 'passport expiry'].includes(normalize(h))
          ),
          notes: headers.findIndex(h =>
            ['notes', 'note'].includes(normalize(h))
          ),
          status: headers.findIndex(h => ['status'].includes(normalize(h))),
          employer_id: headers.findIndex(h =>
            [
              'company id',
              'employer id',
              'company',
              'employer',
              'company_id',
              'employer_id',
              'employer uuid',
            ].includes(normalize(h))
          ),
        };

        // Helper to safely read a cell by index
        const cell = (r: any[], i: number) => (i >= 0 ? r[i] : '');

        // Map data to PromoterData interface
        const mappedData: PromoterData[] = dataRows.map((row, index) => {
          const toISODate = (value: any): string | null => {
            if (value == null || value === '') return null;

            // Date object
            if (value instanceof Date && !isNaN(value.getTime())) {
              return value.toISOString().slice(0, 10);
            }

            // Excel serial number
            if (typeof value === 'number') {
              const jsDate = new Date(
                Math.round((value - 25569) * 86400 * 1000)
              );
              if (!isNaN(jsDate.getTime()))
                return jsDate.toISOString().slice(0, 10);
            }

            const dateStr = String(value).trim();
            if (!dateStr) return null;

            // Try dd-mm-yyyy format (with dashes)
            if (dateStr.includes('-') && dateStr.length === 10) {
              const parts = dateStr.split('-');
              if (parts.length === 3) {
                // Check if it's already in yyyy-mm-dd format
                if (parts[0].length === 4) {
                  return dateStr;
                }
                // Convert dd-mm-yyyy to yyyy-mm-dd
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                const formattedDate = `${year}-${month}-${day}`;
                return formattedDate;
              }
            }

            // Try dd/mm/yyyy format
            if (dateStr.includes('/')) {
              const parts = dateStr.split('/');
              if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                const formattedDate = `${year}-${month}-${day}`;
                return formattedDate;
              }
            }

            // Try dd.mm.yyyy format
            if (dateStr.includes('.')) {
              const parts = dateStr.split('.');
              if (parts.length === 3) {
                const day = parts[0].padStart(2, '0');
                const month = parts[1].padStart(2, '0');
                const year = parts[2];
                const formattedDate = `${year}-${month}-${day}`;
                return formattedDate;
              }
            }

            // Already yyyy-mm-dd
            if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
              return dateStr;
            }

            return null;
          };

          const mappedRow = {
            name_en: String(cell(row, idx.name_en) || '').trim(),
            name_ar: String(cell(row, idx.name_ar) || '').trim(),
            id_card_number: String(cell(row, idx.id_card_number) || '').trim(),
            mobile_number: String(cell(row, idx.mobile_number) || '').trim(),
            passport_number: String(
              cell(row, idx.passport_number) || ''
            ).trim(),
            nationality: String(cell(row, idx.nationality) || '').trim(),
            id_card_expiry_date: toISODate(cell(row, idx.id_card_expiry_date)),
            passport_expiry_date: toISODate(
              cell(row, idx.passport_expiry_date)
            ),
            notes: String(cell(row, idx.notes) || '').trim(),
            status: String(cell(row, idx.status) || 'active').trim(),
            employer_id:
              String(cell(row, idx.employer_id) || '').trim() || undefined,
          };

          // If name_en is missing but first/last present, compose it
          if (!mappedRow.name_en) {
            const first = String(cell(row, idx.first_name) || '').trim();
            const last = String(cell(row, idx.last_name) || '').trim();
            const combined = [first, last].filter(Boolean).join(' ').trim();
            if (combined) {
              (mappedRow as any).name_en = combined;
            }
          }

          return mappedRow;
        });

        // Filter out empty rows
        const validData = mappedData.filter(row => {
          const isValid = row.name_en && row.id_card_number;

          // Additional validation for required fields
          if (!row.name_en) {
            return false;
          }
          if (!row.id_card_number) {
            return false;
          }

          return isValid;
        });

        if (validData.length === 0) {
          throw new Error('No valid promoter data found in the file');
        }

        setPreviewData(validData);
        setStep('preview');
      } catch (error) {
        toast({
          title: 'Error processing file',
          description:
            error instanceof Error ? error.message : 'Failed to process file',
          variant: 'destructive',
        });
      } finally {
        setIsProcessing(false);
        setProgress(100);
      }
    },
    [toast]
  );

  const handleImport = useCallback(async () => {
    if (previewData.length === 0) {
      toast({
        title: 'No data to import',
        description: 'Please upload a file with valid promoter data',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setStep('import');

    try {
      setProgress(10);

      const response = await fetch('/api/promoters/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ promoters: previewData }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err?.error || 'Server import failed');
      }

      const result = await response.json();
      const {
        imported = 0,
        duplicates = 0,
        errors = [],
        importedWithCompany = 0,
      } = result || {};

      setProgress(100);

      if (imported > 0) {
        toast({
          title: 'Import completed',
          description: `Successfully processed ${imported} promoters. ${importedWithCompany} with company, ${imported - importedWithCompany} without company.`,
        });
        onImportComplete();
      } else if (duplicates > 0) {
        toast({
          title: 'Import completed',
          description: `All promoters already exist. ${duplicates} duplicates were skipped.`,
        });
        onImportComplete();
      } else {
        toast({
          title: 'Import failed',
          description:
            errors?.[0] ||
            'No promoters were processed. Check the data and try again.',
          variant: 'destructive',
        });
      }

      setImportResult({
        success: imported > 0,
        message:
          imported > 0
            ? 'Import successful'
            : 'Import completed with no new records',
        imported,
        duplicates,
        errors,
      });
    } catch (error) {
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed',
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        duplicates: 0,
      });
    } finally {
      setIsProcessing(false);
      setStep('complete');
    }
  }, [previewData, onImportComplete, toast]);

  const handleClose = useCallback(() => {
    setFile(null);
    setPreviewData([]);
    setImportResult(null);
    setStep('upload');
    setProgress(0);
    onClose();
  }, [onClose]);

  const downloadTemplate = useCallback(() => {
    // Create template with company dropdown
    const templateData = [
      [
        'Name (EN)',
        'Name (AR)',
        'ID Card Number',
        'Mobile Number',
        'Passport Number',
        'Nationality',
        'ID Expiry Date',
        'Passport Expiry Date',
        'Notes',
        'Status',
        'Company ID',
      ],
      [
        'John Doe',
        'جون دو',
        '1234567890',
        '+966501234567',
        'A12345678',
        'Saudi',
        '15/08/2025',
        '20/03/2026',
        'Sample promoter',
        'active',
        '',
      ],
    ];

    // Add company options as a separate sheet for reference
    const companyOptions = [
      ['Company ID', 'Company Name (EN)', 'Company Name (AR)'],
      ...companies.map(company => [
        company.id,
        company.name_en || '',
        company.name_ar || '',
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(templateData);
    const wsCompanies = XLSX.utils.aoa_to_sheet(companyOptions);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Promoters Template');
    XLSX.utils.book_append_sheet(wb, wsCompanies, 'Companies Reference');

    const fileName = 'promoters-template-with-companies.xlsx';
    XLSX.writeFile(wb, fileName);
  }, [companies]);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <FileSpreadsheet className='h-5 w-5' />
            Import Promoters from Excel
          </DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to import promoter data. The file should
            include columns for name, ID card number, and other required fields.
            Company assignment is optional - promoters can be assigned to
            companies after import. Download the template to see the correct
            format with company options.
          </DialogDescription>
        </DialogHeader>

        {step === 'upload' && (
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Upload File</CardTitle>
                <CardDescription>
                  Select an Excel (.xlsx, .xls) or CSV file containing promoter
                  data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='flex items-center gap-4'>
                    <Button
                      onClick={downloadTemplate}
                      variant='outline'
                      disabled={companiesLoading}
                    >
                      <Download className='mr-2 h-4 w-4' />
                      {companiesLoading
                        ? 'Loading Companies...'
                        : 'Download Template'}
                    </Button>
                    <Button
                      onClick={() =>
                        document.getElementById('file-input')?.click()
                      }
                      disabled={isProcessing}
                    >
                      <Upload className='mr-2 h-4 w-4' />
                      Choose File
                    </Button>
                  </div>

                  <input
                    id='file-input'
                    type='file'
                    accept='.xlsx,.xls,.csv'
                    onChange={handleFileChange}
                    className='hidden'
                    data-testid='import-file-input'
                  />

                  {file && (
                    <div className='flex items-center gap-2 p-3 border rounded-md'>
                      <FileSpreadsheet className='h-4 w-4 text-blue-600' />
                      <span className='text-sm'>{file.name}</span>
                      <Badge variant='secondary'>{file.size} bytes</Badge>
                    </div>
                  )}

                  {isProcessing && (
                    <div className='space-y-2'>
                      <Progress value={progress} />
                      <p className='text-sm text-muted-foreground'>
                        Processing file...
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'preview' && (
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Preview Data</CardTitle>
                <CardDescription>
                  Review the data before importing. {previewData.length}{' '}
                  promoters found.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='max-h-96 overflow-y-auto'>
                  <table className='w-full text-sm'>
                    <thead className='bg-muted'>
                      <tr>
                        <th className='p-2 text-left'>Name (EN)</th>
                        <th className='p-2 text-left'>Name (AR)</th>
                        <th className='p-2 text-left'>ID Card</th>
                        <th className='p-2 text-left'>Mobile</th>
                        <th className='p-2 text-left'>Company</th>
                        <th className='p-2 text-left'>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((promoter, index) => (
                        <tr key={index} className='border-b'>
                          <td className='p-2'>{promoter.name_en}</td>
                          <td className='p-2'>{promoter.name_ar}</td>
                          <td className='p-2'>{promoter.id_card_number}</td>
                          <td className='p-2'>{promoter.mobile_number}</td>
                          <td className='p-2'>
                            {promoter.employer_id ? (
                              (() => {
                                const company = companies.find(
                                  c => c.id === promoter.employer_id
                                );
                                return company
                                  ? company.name_en ||
                                      company.name_ar ||
                                      company.id
                                  : promoter.employer_id;
                              })()
                            ) : (
                              <span className='text-muted-foreground'>
                                Not assigned
                              </span>
                            )}
                          </td>
                          <td className='p-2'>
                            <Badge
                              variant={
                                promoter.status === 'active'
                                  ? 'default'
                                  : 'secondary'
                              }
                            >
                              {promoter.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                      {previewData.length > 10 && (
                        <tr>
                          <td
                            colSpan={6}
                            className='p-2 text-center text-muted-foreground'
                          >
                            ... and {previewData.length - 10} more rows
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'import' && (
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Importing Data</CardTitle>
                <CardDescription>
                  Please wait while we import the promoter data...
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <Progress value={progress} />
                  <p className='text-sm text-muted-foreground'>
                    Importing {previewData.length} promoters...
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {step === 'complete' && importResult && (
          <div className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  {importResult.success ? (
                    <CheckCircle className='h-5 w-5 text-green-600' />
                  ) : (
                    <AlertTriangle className='h-5 w-5 text-yellow-600' />
                  )}
                  Import Complete
                </CardTitle>
                <CardDescription>{importResult.message}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='space-y-4'>
                  <div className='grid grid-cols-3 gap-4'>
                    <div className='text-center p-3 bg-green-50 rounded-md'>
                      <div className='text-2xl font-bold text-green-600'>
                        {importResult.imported}
                      </div>
                      <div className='text-sm text-green-600'>Imported</div>
                    </div>
                    <div className='text-center p-3 bg-yellow-50 rounded-md'>
                      <div className='text-2xl font-bold text-yellow-600'>
                        {importResult.duplicates}
                      </div>
                      <div className='text-sm text-yellow-600'>Duplicates</div>
                    </div>
                    <div className='text-center p-3 bg-red-50 rounded-md'>
                      <div className='text-2xl font-bold text-red-600'>
                        {importResult.errors.length}
                      </div>
                      <div className='text-sm text-red-600'>Errors</div>
                    </div>
                  </div>

                  {importResult.errors.length > 0 && (
                    <Alert>
                      <AlertTriangle className='h-4 w-4' />
                      <AlertDescription>
                        <div className='max-h-32 overflow-y-auto'>
                          {importResult.errors.map((error, index) => (
                            <div key={index} className='text-sm text-red-600'>
                              {error}
                            </div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <DialogFooter>
          {step === 'upload' && (
            <>
              <Button variant='outline' onClick={handleClose}>
                Cancel
              </Button>
            </>
          )}

          {step === 'preview' && (
            <>
              <Button variant='outline' onClick={() => setStep('upload')}>
                Back
              </Button>
              <Button onClick={handleImport} disabled={isProcessing}>
                Import {previewData.length} Promoters
              </Button>
            </>
          )}

          {step === 'complete' && (
            <>
              <Button variant='outline' onClick={handleClose}>
                Close
              </Button>
              {(importResult?.imported || 0) > 0 && (
                <Button onClick={handleClose}>View Promoters</Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
