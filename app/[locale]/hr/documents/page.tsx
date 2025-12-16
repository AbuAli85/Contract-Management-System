'use client';

import React from 'react';
import { DocumentManager } from '@/components/hr/documents/document-manager';
import { ComplianceDashboard } from '@/components/hr/documents/compliance-dashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DocumentsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale || 'en';

  return (
    <AuthGuard requireAuth={true}>
      <div className="container mx-auto py-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">
            {locale === 'ar' ? 'إدارة المستندات' : 'Document Management'}
          </h1>
          <p className="text-gray-600 mt-2">
            {locale === 'ar'
              ? 'إدارة وتتبع جميع مستندات الموظفين'
              : 'Manage and track all employee documents'}
          </p>
        </div>

        <Tabs defaultValue="documents" className="space-y-4">
          <TabsList>
            <TabsTrigger value="documents">
              {locale === 'ar' ? 'المستندات' : 'Documents'}
            </TabsTrigger>
            <TabsTrigger value="compliance">
              {locale === 'ar' ? 'الامتثال' : 'Compliance'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="documents">
            <DocumentManager locale={locale} />
          </TabsContent>

          <TabsContent value="compliance">
            <ComplianceDashboard locale={locale} />
          </TabsContent>
        </Tabs>
      </div>
    </AuthGuard>
  );
}

