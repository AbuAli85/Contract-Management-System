'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Building2, MapPin, Package, Upload, ArrowLeft, Shield } from 'lucide-react';
import { PromotersCSVImport } from '@/components/csv-import/promoters-csv-import';
import { PartiesCSVImport } from '@/components/csv-import/parties-csv-import';
import { LocationsCSVImport } from '@/components/csv-import/locations-csv-import';
import { ProductsCSVImport } from '@/components/csv-import/products-csv-import';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/hooks/useUserRole';

export default function CSVImportPage() {
  const params = useParams();
  const locale = params?.locale as string;
  const [activeTab, setActiveTab] = useState('promoters');
  const role = useUserRole();

  // Show admin-only notice for non-admin users
  if (role && role !== 'admin') {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Admin Access Required</AlertTitle>
          <AlertDescription>
            CSV bulk import is only available to administrators. Please contact your system administrator for access.
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Link href={`/${locale}/dashboard`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Bulk CSV Import</h1>
          <p className="text-muted-foreground mt-1">
            Import data in bulk from CSV files for promoters, parties, locations, and products
          </p>
        </div>
        <Link href={`/${locale}/dashboard`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
      </div>

      {/* Important Notes */}
      <Alert>
        <Upload className="h-4 w-4" />
        <AlertTitle>Important Guidelines</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Download the CSV template for each entity before importing</li>
            <li>Ensure all required fields are filled in</li>
            <li>Use the exact column headers as shown in the template</li>
            <li>For dates, use DD-MM-YYYY, DD/MM/YYYY, or YYYY-MM-DD (e.g., 31-12-2024, 31/12/2024, or 2024-12-31)</li>
            <li>For employers/suppliers, make sure they exist in the system before importing</li>
            <li>Review any errors before attempting to fix and re-import</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Import Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="promoters" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Promoters</span>
          </TabsTrigger>
          <TabsTrigger value="parties" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Parties</span>
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="hidden sm:inline">Locations</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="promoters">
          <PromotersCSVImport />
        </TabsContent>

        <TabsContent value="parties">
          <PartiesCSVImport />
        </TabsContent>

        <TabsContent value="locations">
          <LocationsCSVImport />
        </TabsContent>

        <TabsContent value="products">
          <ProductsCSVImport />
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
          <CardDescription>
            Common questions and troubleshooting tips
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Q: What if I have duplicate entries?</h4>
            <p className="text-sm text-muted-foreground">
              The system will attempt to insert all records. Duplicate entries (based on unique
              fields like ID card number for promoters) will be rejected with an error message.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Q: Can I import partial data?</h4>
            <p className="text-sm text-muted-foreground">
              Yes, only required fields marked in the template must be filled. Optional fields
              can be left empty and updated later.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Q: What happens if an employer/supplier doesn't exist?</h4>
            <p className="text-sm text-muted-foreground">
              The import will continue, but those specific records will fail. You'll see an error
              message indicating which employer/supplier wasn't found. Import parties first, then
              promoters/products that reference them.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Q: Can I import large files?</h4>
            <p className="text-sm text-muted-foreground">
              For best results, keep files under 1000 rows. For larger datasets, split them into
              multiple files and import separately.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Q: How do I handle errors?</h4>
            <p className="text-sm text-muted-foreground">
              Review the error messages after validation. Fix the issues in your CSV file and
              re-upload. Successfully imported rows won't be duplicated if you re-run the import.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Import Order */}
      <Card>
        <CardHeader>
          <CardTitle>Recommended Import Order</CardTitle>
          <CardDescription>
            Follow this sequence for best results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2">
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">Step 1</Badge>
              <span>Import <strong>Parties</strong> (Employers, Clients, Vendors)</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">Step 2</Badge>
              <span>Import <strong>Locations</strong> (Stores, Offices, Sites)</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">Step 3</Badge>
              <span>Import <strong>Products</strong> (if referencing vendors from Step 1)</span>
            </li>
            <li className="flex items-center gap-2">
              <Badge variant="outline" className="bg-blue-50">Step 4</Badge>
              <span>Import <strong>Promoters</strong> (referencing employers from Step 1)</span>
            </li>
          </ol>
          <p className="text-sm text-muted-foreground mt-4">
            <strong>Note:</strong> This order ensures that referenced entities (like employers
            and suppliers) exist before importing entities that depend on them.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';

