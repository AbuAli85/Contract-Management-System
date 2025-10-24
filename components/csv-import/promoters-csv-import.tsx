'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Upload, Download, AlertTriangle, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { 
  parseCSV, 
  validateAndTransformCSV, 
  downloadCSVTemplate, 
  validators,
  transformers,
  type CSVColumn,
  type CSVParseResult,
} from '@/lib/utils/csv-parser';
import { createClient } from '@/lib/supabase/client';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface PromoterCSVRow {
  name_en: string;
  name_ar: string;
  id_card_number: string;
  email?: string;
  phone?: string;
  mobile_number?: string;
  nationality?: string;
  date_of_birth?: string;
  gender?: string;
  job_title?: string;
  employer_name?: string;
  status?: string;
  id_card_expiry_date?: string;
  passport_number?: string;
  passport_expiry_date?: string;
}

const PROMOTER_COLUMNS: CSVColumn[] = [
  {
    key: 'name_en',
    label: 'Name (English)',
    required: true,
    validator: validators.required,
    transformer: transformers.trim,
    example: 'John Doe',
  },
  {
    key: 'name_ar',
    label: 'Name (Arabic)',
    required: true,
    validator: validators.required,
    transformer: transformers.trim,
    example: 'جون دو',
  },
  {
    key: 'id_card_number',
    label: 'ID Card Number',
    required: true,
    validator: validators.required,
    transformer: transformers.trim,
    example: '123456789',
  },
  {
    key: 'email',
    label: 'Email',
    required: false,
    validator: (value) => value ? validators.email(value) : null,
    transformer: transformers.nullIfEmpty,
    example: 'john.doe@example.com',
  },
  {
    key: 'phone',
    label: 'Phone',
    required: false,
    validator: (value) => value ? validators.phone(value) : null,
    transformer: transformers.nullIfEmpty,
    example: '+971501234567',
  },
  {
    key: 'mobile_number',
    label: 'Mobile Number',
    required: false,
    validator: (value) => value ? validators.phone(value) : null,
    transformer: transformers.nullIfEmpty,
    example: '+971501234567',
  },
  {
    key: 'nationality',
    label: 'Nationality',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'UAE',
  },
  {
    key: 'date_of_birth',
    label: 'Date of Birth',
    required: false,
    validator: (value) => value ? validators.date(value) : null,
    transformer: (value) => value ? transformers.date(value) : null,
    example: '1990-01-15',
  },
  {
    key: 'gender',
    label: 'Gender',
    required: false,
    validator: (value) => {
      if (!value) return null;
      const valid = ['male', 'female', 'other'];
      return valid.includes(value.toLowerCase()) ? null : 'Must be: male, female, or other';
    },
    transformer: (value) => value ? value.toLowerCase() : null,
    example: 'male',
  },
  {
    key: 'job_title',
    label: 'Job Title',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Sales Promoter',
  },
  {
    key: 'employer_name',
    label: 'Employer Name',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Falcon Eye Business and Promotion',
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    validator: (value) => {
      if (!value) return null;
      const valid = ['active', 'inactive', 'pending'];
      return valid.includes(value.toLowerCase()) ? null : 'Must be: active, inactive, or pending';
    },
    transformer: (value) => value ? value.toLowerCase() : 'active',
    example: 'active',
  },
  {
    key: 'id_card_expiry_date',
    label: 'ID Card Expiry Date',
    required: false,
    validator: (value) => value ? validators.date(value) : null,
    transformer: (value) => value ? transformers.date(value) : null,
    example: '2025-12-31',
  },
  {
    key: 'passport_number',
    label: 'Passport Number',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'AB1234567',
  },
  {
    key: 'passport_expiry_date',
    label: 'Passport Expiry Date',
    required: false,
    validator: (value) => value ? validators.date(value) : null,
    transformer: (value) => value ? transformers.date(value) : null,
    example: '2028-12-31',
  },
];

export function PromotersCSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<CSVParseResult<PromoterCSVRow> | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParseResult(null);
    setImportResult(null);

    try {
      const { content } = await parseCSV(selectedFile);
      const result = validateAndTransformCSV<PromoterCSVRow>(content, PROMOTER_COLUMNS);
      setParseResult(result);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setParseResult({
        data: [],
        errors: [{
          row: 0,
          message: error instanceof Error ? error.message : 'Failed to parse CSV',
          severity: 'critical',
        }],
        warnings: [],
        stats: {
          totalRows: 0,
          validRows: 0,
          invalidRows: 0,
          emptyRows: 0,
        },
      });
    }
  };

  const handleImport = async () => {
    if (!parseResult || parseResult.data.length === 0) return;

    setIsImporting(true);
    setImportProgress(0);
    const errors: string[] = [];
    let successCount = 0;
    let failedCount = 0;

    const supabase = createClient();
    if (!supabase) {
      errors.push('Failed to initialize database connection');
      setImportResult({ success: 0, failed: parseResult.data.length, errors });
      setIsImporting(false);
      return;
    }

    // Fetch all employers for matching
    const { data: employers } = await supabase
      .from('parties')
      .select('id, name_en, name_ar')
      .eq('type', 'Employer');

    const employerMap = new Map<string, string>();
    employers?.forEach(emp => {
      if (emp.name_en) employerMap.set(emp.name_en.toLowerCase(), emp.id);
      if (emp.name_ar) employerMap.set(emp.name_ar.toLowerCase(), emp.id);
    });

    // Import promoters one by one
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      if (!row) continue;

      try {
        // Find employer ID if employer name is provided
        let employer_id = null;
        if (row.employer_name) {
          const empName = row.employer_name.toLowerCase();
          employer_id = employerMap.get(empName) || null;
          if (!employer_id) {
            errors.push(`Row ${i + 2}: Employer "${row.employer_name}" not found`);
          }
        }

        // Prepare promoter data
        const promoterData: any = {
          name_en: row.name_en,
          name_ar: row.name_ar,
          id_card_number: row.id_card_number,
          email: row.email,
          phone: row.phone,
          mobile_number: row.mobile_number,
          nationality: row.nationality,
          date_of_birth: row.date_of_birth,
          gender: row.gender,
          job_title: row.job_title,
          employer_id,
          status: row.status || 'active',
          id_card_expiry_date: row.id_card_expiry_date,
          passport_number: row.passport_number,
          passport_expiry_date: row.passport_expiry_date,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Remove null/undefined values
        Object.keys(promoterData).forEach(key => {
          if (promoterData[key] === null || promoterData[key] === undefined) {
            delete promoterData[key];
          }
        });

        // Insert into database
        const { error } = await supabase
          .from('promoters')
          .insert(promoterData);

        if (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
          failedCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        errors.push(`Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        failedCount++;
      }

      setImportProgress(Math.round(((i + 1) / parseResult.data.length) * 100));
    }

    setImportResult({ success: successCount, failed: failedCount, errors });
    setIsImporting(false);
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate(PROMOTER_COLUMNS, 'promoters-import-template.csv');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import Promoters from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file to bulk import promoters. Download the template to see the required format.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Download Template */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Download CSV Template
          </Button>
        </div>

        {/* File Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Upload CSV File</label>
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={isImporting}
          />
        </div>

        {/* Parse Results */}
        {parseResult && (
          <div className="space-y-4">
            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-900">
                  {parseResult.stats.totalRows}
                </div>
                <div className="text-sm text-blue-700">Total Rows</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-900">
                  {parseResult.stats.validRows}
                </div>
                <div className="text-sm text-green-700">Valid Rows</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="text-2xl font-bold text-red-900">
                  {parseResult.stats.invalidRows}
                </div>
                <div className="text-sm text-red-700">Invalid Rows</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">
                  {parseResult.stats.emptyRows}
                </div>
                <div className="text-sm text-gray-700">Empty Rows</div>
              </div>
            </div>

            {/* Errors */}
            {parseResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Found {parseResult.errors.length} Error(s)</AlertTitle>
                <AlertDescription>
                  <div className="mt-2 max-h-60 overflow-y-auto space-y-1">
                    {parseResult.errors.slice(0, 10).map((error, idx) => (
                      <div key={idx} className="text-sm">
                        Row {error.row}{error.column ? ` - ${error.column}` : ''}: {error.message}
                      </div>
                    ))}
                    {parseResult.errors.length > 10 && (
                      <div className="text-sm font-medium">
                        ...and {parseResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Import Button */}
            {parseResult.data.length > 0 && (
              <div className="space-y-4">
                <Button
                  onClick={handleImport}
                  disabled={isImporting || parseResult.errors.length > 0}
                  className="w-full"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing... {importProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Import {parseResult.data.length} Promoter(s)
                    </>
                  )}
                </Button>

                {isImporting && (
                  <Progress value={importProgress} className="w-full" />
                )}
              </div>
            )}
          </div>
        )}

        {/* Import Results */}
        {importResult && (
          <Alert variant={importResult.failed > 0 ? "default" : "default"}>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Import Complete</AlertTitle>
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex gap-4">
                  <Badge variant="default" className="bg-green-600">
                    {importResult.success} Succeeded
                  </Badge>
                  {importResult.failed > 0 && (
                    <Badge variant="destructive">
                      {importResult.failed} Failed
                    </Badge>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className="text-sm text-red-600">
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Preview Table */}
        {parseResult && parseResult.data.length > 0 && !importResult && (
          <div>
            <h4 className="text-sm font-medium mb-2">Preview (First 5 Rows)</h4>
            <div className="border rounded-lg overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Name (AR)</TableHead>
                    <TableHead>ID Number</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Employer</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResult.data.slice(0, 5).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row?.name_en || '-'}</TableCell>
                      <TableCell>{row?.name_ar || '-'}</TableCell>
                      <TableCell>{row?.id_card_number || '-'}</TableCell>
                      <TableCell>{row?.email || '-'}</TableCell>
                      <TableCell>{row?.employer_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={row?.status === 'active' ? 'default' : 'secondary'}>
                          {row?.status || 'active'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

