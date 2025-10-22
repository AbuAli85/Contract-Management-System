'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-service';
import { usePermissions } from '@/hooks/use-permissions';
import BulkPromoterAssignment from '@/components/admin/bulk-promoter-assignment';
import AdminTools from '@/components/dashboard/admin-tools';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, Settings, Users } from 'lucide-react';

export default function AdminToolsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const { user, loading: authLoading } = useAuth();
  const permissions = usePermissions();

  // Redirect non-admin users
  useEffect(() => {
    if (!authLoading && !permissions.isLoading) {
      if (!user) {
        router.push(`/${locale}/login`);
      } else if (!permissions.canManageUsers()) {
        router.push(`/${locale}/dashboard`);
      }
    }
  }, [user, authLoading, permissions, router, locale]);

  if (authLoading || permissions.isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (!permissions.canManageUsers()) {
    return (
      <div className='container mx-auto p-6'>
        <Alert variant='destructive'>
          <AlertTriangle className='h-4 w-4' />
          <AlertDescription>
            You do not have permission to access admin tools.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold text-gray-900 dark:text-gray-100'>
          Admin Tools
        </h1>
        <p className='text-gray-600 dark:text-gray-400 mt-2'>
          Manage system data and perform administrative tasks
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue='general' className='w-full'>
        <TabsList>
          <TabsTrigger value='general' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            General Tools
          </TabsTrigger>
          <TabsTrigger value='promoters' className='flex items-center gap-2'>
            <Users className='h-4 w-4' />
            Promoter Assignment
          </TabsTrigger>
        </TabsList>

        <TabsContent value='general' className='mt-6'>
          <AdminTools />
        </TabsContent>

        <TabsContent value='promoters' className='mt-6'>
          <BulkPromoterAssignment />
        </TabsContent>
      </Tabs>

      {/* Instructions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Database Migration Required</CardTitle>
          <CardDescription>
            To enable automatic promoter relationships, run the following
            migration in your Supabase SQL Editor
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              <strong>Important:</strong> A database foreign key constraint is
              missing. This causes the "N/A" display issue for promoters in
              contracts.
            </AlertDescription>
          </Alert>

          <div className='space-y-2'>
            <h4 className='font-semibold text-sm'>Steps to Fix:</h4>
            <ol className='list-decimal list-inside space-y-2 text-sm text-muted-foreground'>
              <li>
                Open your Supabase project's SQL Editor at:{' '}
                <code className='bg-muted px-1 rounded'>
                  https://supabase.com/dashboard/project/[your-project]/sql/new
                </code>
              </li>
              <li>
                Copy and paste the contents of{' '}
                <code className='bg-muted px-1 rounded'>
                  scripts/fix-promoter-relationship.sql
                </code>
              </li>
              <li>Click "Run" to execute the migration</li>
              <li>
                Refresh this page and verify the foreign key constraint was
                added
              </li>
              <li>
                Use the "Promoter Assignment" tab above to assign promoters to
                existing contracts
              </li>
            </ol>
          </div>

          <div className='bg-muted p-4 rounded-lg'>
            <p className='text-sm font-mono'>
              Migration file location:{' '}
              <span className='font-bold'>
                scripts/fix-promoter-relationship.sql
              </span>
            </p>
            <p className='text-sm text-muted-foreground mt-2'>
              This migration adds the foreign key constraint between contracts
              and promoters tables, enabling automatic relationship joins.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

