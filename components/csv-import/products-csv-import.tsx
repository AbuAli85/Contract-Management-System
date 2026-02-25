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
  Package,
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

interface ProductCSVRow {
  name_en: string;
  name_ar?: string;
  sku?: string;
  category?: string;
  brand?: string;
  price?: string;
  description?: string;
  supplier_name?: string;
  stock_quantity?: string;
  unit?: string;
  status?: string;
}

const PRODUCT_COLUMNS: CSVColumn[] = [
  {
    key: 'name_en',
    label: 'Name (English)',
    required: true,
    validator: validators.required,
    transformer: transformers.trim,
    example: 'Samsung Galaxy S24',
  },
  {
    key: 'name_ar',
    label: 'Name (Arabic)',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'سامسونج جالاكسي اس ٢٤',
  },
  {
    key: 'sku',
    label: 'SKU',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'SMSG-S24-128-BLK',
  },
  {
    key: 'category',
    label: 'Category',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Electronics',
  },
  {
    key: 'brand',
    label: 'Brand',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Samsung',
  },
  {
    key: 'price',
    label: 'Price',
    required: false,
    validator: value => (value ? validators.number(value) : null),
    transformer: value => (value ? transformers.number(value) : null),
    example: '3499.00',
  },
  {
    key: 'description',
    label: 'Description',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Latest flagship smartphone with AI features',
  },
  {
    key: 'supplier_name',
    label: 'Supplier Name',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'Samsung Electronics',
  },
  {
    key: 'stock_quantity',
    label: 'Stock Quantity',
    required: false,
    validator: value => (value ? validators.number(value) : null),
    transformer: value => (value ? transformers.number(value) : null),
    example: '50',
  },
  {
    key: 'unit',
    label: 'Unit',
    required: false,
    transformer: transformers.nullIfEmpty,
    example: 'pcs',
  },
  {
    key: 'status',
    label: 'Status',
    required: false,
    validator: value => {
      if (!value) return null;
      const valid = ['active', 'inactive', 'discontinued'];
      return valid.includes(value.toLowerCase())
        ? null
        : 'Must be: active, inactive, or discontinued';
    },
    transformer: value => (value ? value.toLowerCase() : 'active'),
    example: 'active',
  },
];

export function ProductsCSVImport() {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] =
    useState<CSVParseResult<ProductCSVRow> | null>(null);
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
      const result = validateAndTransformCSV<ProductCSVRow>(
        content,
        PRODUCT_COLUMNS
      );
      setParseResult(result);
    } catch (error) {
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

    // Fetch all suppliers for matching
    const { data: suppliers } = await supabase
      .from('parties')
      .select('id, name_en, name_ar')
      .eq('type', 'Vendor');

    const supplierMap = new Map<string, string>();
    suppliers?.forEach(supplier => {
      if (supplier.name_en)
        supplierMap.set((supplier.name_en ?? '').toLowerCase(), supplier.id);
      if (supplier.name_ar)
        supplierMap.set((supplier.name_ar ?? '').toLowerCase(), supplier.id);
    });

    // Import products one by one
    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      if (!row) continue;

      try {
        // Find supplier ID if supplier name is provided
        let supplier_id = null;
        if (row.supplier_name) {
          const supplierName = row.supplier_name.toLowerCase();
          supplier_id = supplierMap.get(supplierName) || null;
          if (!supplier_id) {
            errors.push(
              `Row ${i + 2}: Supplier "${row.supplier_name}" not found`
            );
          }
        }

        // Prepare product data
        const productData: any = {
          name_en: row.name_en,
          name_ar: row.name_ar,
          sku: row.sku,
          category: row.category,
          brand: row.brand,
          price: row.price,
          description: row.description,
          supplier_id,
          stock_quantity: row.stock_quantity,
          unit: row.unit,
          status: row.status || 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        // Remove null/undefined values
        Object.keys(productData).forEach(key => {
          if (productData[key] === null || productData[key] === undefined) {
            delete productData[key];
          }
        });

        // Insert into database
        const { error } = await supabase.from('products').insert(productData);

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
    downloadCSVTemplate(PRODUCT_COLUMNS, 'products-import-template.csv');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Package className='h-5 w-5' />
          Import Products from CSV
        </CardTitle>
        <CardDescription>
          Upload a CSV file to bulk import products and inventory items.
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
                      Import {parseResult.data.length} Product(s)
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
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parseResult.data.slice(0, 5).map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row?.name_en || '-'}</TableCell>
                      <TableCell>{row?.sku || '-'}</TableCell>
                      <TableCell>{row?.category || '-'}</TableCell>
                      <TableCell>
                        {row?.price ? `$${row.price}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            row?.status === 'active' ? 'default' : 'secondary'
                          }
                        >
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
