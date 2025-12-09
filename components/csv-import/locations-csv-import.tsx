'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  MapPin,
  Loader2,
} from 'lucide-react';
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

interface LocationCSVRow {
  name_en: string;
  name_ar?: string;
  type?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: string;
  longitude?: string;
  contact_person?: string;
  contact_phone?: string;
  notes?: string;
}

const LOCATION_COLUMNS: CSVColumn[] = [
  {
    key: 'name_en',
    label: 'Name (English)',
    required: true,
    validator: validators.required,
    transformer: transformers.trim,
    example: 'Dubai Mall Store',
  },
  {
    key: 'name_ar',
    label: 'Name (Arabic)',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'متجر دبي مول',
  },
  {
    key: 'type',
    label: 'Type',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Store',
  },
  {
    key: 'address',
    label: 'Address',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Dubai Mall, Financial Centre Road',
  },
  {
    key: 'city',
    label: 'City',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Dubai',
  },
  {
    key: 'state',
    label: 'State/Emirate',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Dubai',
  },
  {
    key: 'country',
    label: 'Country',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'UAE',
  },
  {
    key: 'postal_code',
    label: 'Postal Code',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: '00000',
  },
  {
    key: 'latitude',
    label: 'Latitude',
    required: false,
    validator: value => (value ? validators.number(value) : null),
    transformer: value => (value ? transformers.number(value) : null),
    example: '25.198185',
  },
  {
    key: 'longitude',
    label: 'Longitude',
    required: false,
    validator: value => (value ? validators.number(value) : null),
    transformer: value => (value ? transformers.number(value) : null),
    example: '55.274254',
  },
  {
    key: 'contact_person',
    label: 'Contact Person',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Ahmed Mohammed',
  },
  {
    key: 'contact_phone',
    label: 'Contact Phone',
    required: false,
    validator: value => (value ? validators.phone(value) : null),
    transformer: transformers.nullIfEmpty,
    example: '+971501234567',
  },
  {
    key: 'notes',
    label: 'Notes',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Ground floor, next to main entrance',
  },
];

export function LocationsCSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] =
    useState<CSVParseResult<LocationCSVRow> | null>(null);
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
      const result = validateAndTransformCSV<LocationCSVRow>(
        content,
        LOCATION_COLUMNS
      );
      setParseResult(result);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setParseResult({
        data: [],
        errors: [
          {
            row: 0,
            message:
              error instanceof Error ? error.message : 'Failed to parse CSV',
            severity: 'critical',
          },
        ],
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

    // Import locations one by one
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      if (!row) continue;

      try {
        // Prepare location data
        const locationData: any = {
          name_en: row.name_en,
          name_ar: row.name_ar,
          type: row.type,
          address: row.address,
          city: row.city,
          state: row.state,
          country: row.country,
          postal_code: row.postal_code,
          latitude: row.latitude,
          longitude: row.longitude,
          contact_person: row.contact_person,
          contact_phone: row.contact_phone,
          notes: row.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Remove null/undefined values
        Object.keys(locationData).forEach(key => {
          if (locationData[key] === null || locationData[key] === undefined) {
            delete locationData[key];
          }
        });

        // Insert into database
        const { error } = await supabase.from('locations').insert(locationData);

        if (error) {
          errors.push(`Row ${i + 2}: ${error.message}`);
          failedCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        errors.push(
          `Row ${i + 2}: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        failedCount++;
      }

      setImportProgress(Math.round(((i + 1) / parseResult.data.length) * 100));
    }

    setImportResult({ success: successCount, failed: failedCount, errors });
    setIsImporting(false);
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate(LOCATION_COLUMNS, 'locations-import-template.csv');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <MapPin className='h-5 w-5' />
          Import Locations from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file to bulk import locations (stores, offices, sites,
          etc.).
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='flex items-center gap-4'>
          <Button
            variant='outline'
            onClick={handleDownloadTemplate}
            className='flex items-center gap-2'
          >
            <Download className='h-4 w-4' />
            Download CSV Template
          </Button>
        </div>

        <div className='space-y-2'>
          <label className='text-sm font-medium'>Upload CSV File</label>
          <Input
            type='file'
            accept='.csv'
            onChange={handleFileChange}
            disabled={isImporting}
          />
        </div>

        {parseResult && (
          <div className='space-y-4'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='p-4 bg-blue-50 rounded-lg border border-blue-200'>
                <div className='text-2xl font-bold text-blue-900'>
                  {parseResult.stats.totalRows}
                </div>
                <div className='text-sm text-blue-700'>Total Rows</div>
              </div>
              <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                <div className='text-2xl font-bold text-green-900'>
                  {parseResult.stats.validRows}
                </div>
                <div className='text-sm text-green-700'>Valid Rows</div>
              </div>
              <div className='p-4 bg-red-50 rounded-lg border border-red-200'>
                <div className='text-2xl font-bold text-red-900'>
                  {parseResult.stats.invalidRows}
                </div>
                <div className='text-sm text-red-700'>Invalid Rows</div>
              </div>
              <div className='p-4 bg-gray-50 rounded-lg border border-gray-200'>
                <div className='text-2xl font-bold text-gray-900'>
                  {parseResult.stats.emptyRows}
                </div>
                <div className='text-sm text-gray-700'>Empty Rows</div>
              </div>
            </div>

            {parseResult.errors.length > 0 && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertTitle>
                  Found {parseResult.errors.length} Error(s)
                </AlertTitle>
                <AlertDescription>
                  <div className='mt-2 max-h-60 overflow-y-auto space-y-1'>
                    {parseResult.errors.slice(0, 10).map((error, idx) => (
                      <div key={idx} className='text-sm'>
                        Row {error.row}
                        {error.column ? ` - ${error.column}` : ''}:{' '}
                        {error.message}
                      </div>
                    ))}
                    {parseResult.errors.length > 10 && (
                      <div className='text-sm font-medium'>
                        ...and {parseResult.errors.length - 10} more errors
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {parseResult.data.length > 0 && (
              <div className='space-y-4'>
                <Button
                  onClick={handleImport}
                  disabled={isImporting || parseResult.errors.length > 0}
                  className='w-full'
                >
                  {isImporting ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Importing... {importProgress}%
                    </>
                  ) : (
                    <>
                      <Upload className='mr-2 h-4 w-4' />
                      Import {parseResult.data.length} Location(s)
                    </>
                  )}
                </Button>

                {isImporting && (
                  <Progress value={importProgress} className='w-full' />
                )}
              </div>
            )}
          </div>
        )}

        {importResult && (
          <Alert variant={importResult.failed > 0 ? 'default' : 'default'}>
            <CheckCircle className='h-4 w-4' />
            <AlertTitle>Import Complete</AlertTitle>
            <AlertDescription>
              <div className='space-y-2'>
                <div className='flex gap-4'>
                  <Badge variant='default' className='bg-green-600'>
                    {importResult.success} Succeeded
                  </Badge>
                  {importResult.failed > 0 && (
                    <Badge variant='destructive'>
                      {importResult.failed} Failed
                    </Badge>
                  )}
                </div>
                {importResult.errors.length > 0 && (
                  <div className='mt-2 max-h-40 overflow-y-auto space-y-1'>
                    {importResult.errors.map((error, idx) => (
                      <div key={idx} className='text-sm text-red-600'>
                        {error}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {parseResult && parseResult.data.length > 0 && !importResult && (
          <div>
            <h4 className='text-sm font-medium mb-2'>Preview (First 5 Rows)</h4>
            <div className='border rounded-lg overflow-auto max-h-96'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name (EN)</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResult.data.slice(0, 5).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row?.name_en || '-'}</TableCell>
                      <TableCell>{row?.type || '-'}</TableCell>
                      <TableCell>{row?.city || '-'}</TableCell>
                      <TableCell className='max-w-xs truncate'>
                        {row?.address || '-'}
                      </TableCell>
                      <TableCell>{row?.contact_phone || '-'}</TableCell>
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
