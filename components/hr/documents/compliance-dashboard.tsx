'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingDown,
} from 'lucide-react';
import { useCompany } from '@/components/providers/company-provider';
import { format } from 'date-fns';

interface ComplianceDashboardProps {
  locale?: string;
}

export function ComplianceDashboard({
  locale = 'en',
}: ComplianceDashboardProps) {
  const { companyId } = useCompany();

  // Fetch documents with expiry info
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents-compliance', companyId],
    queryFn: async () => {
      const response = await fetch('/api/hr/documents?expiring_soon=true', {
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      return response.json();
    },
  });

  const documents = documentsData?.documents || [];
  const expiringSoon = documents.filter((doc: any) => {
    if (!doc.expiry_date) return false;
    const expiry = new Date(doc.expiry_date);
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    return expiry >= today && expiry <= thirtyDaysFromNow;
  });

  const expired = documents.filter((doc: any) => doc.status === 'expired');
  const pending = documents.filter((doc: any) => doc.status === 'pending');
  const verified = documents.filter((doc: any) => doc.status === 'verified');

  const totalDocuments = documents.length;
  const complianceRate =
    totalDocuments > 0
      ? Math.round((verified.length / totalDocuments) * 100)
      : 100;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>
            {locale === 'ar' ? 'لوحة الامتثال' : 'Compliance Dashboard'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-center justify-center py-8'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Compliance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            {locale === 'ar' ? 'نظرة عامة على الامتثال' : 'Compliance Overview'}
          </CardTitle>
          <CardDescription>
            {locale === 'ar'
              ? 'حالة المستندات والامتثال'
              : 'Document status and compliance'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {/* Compliance Rate */}
            <div>
              <div className='flex items-center justify-between mb-2'>
                <span className='text-sm font-medium'>
                  {locale === 'ar' ? 'معدل الامتثال' : 'Compliance Rate'}
                </span>
                <span className='text-2xl font-bold'>{complianceRate}%</span>
              </div>
              <Progress value={complianceRate} className='h-2' />
            </div>

            {/* Stats Grid */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='p-4 bg-green-50 rounded-lg border border-green-200'>
                <div className='flex items-center gap-2 mb-1'>
                  <CheckCircle className='h-4 w-4 text-green-600' />
                  <span className='text-sm font-medium text-green-900'>
                    {locale === 'ar' ? 'متحقق' : 'Verified'}
                  </span>
                </div>
                <div className='text-2xl font-bold text-green-600'>
                  {verified.length}
                </div>
              </div>

              <div className='p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                <div className='flex items-center gap-2 mb-1'>
                  <Clock className='h-4 w-4 text-yellow-600' />
                  <span className='text-sm font-medium text-yellow-900'>
                    {locale === 'ar' ? 'قيد الانتظار' : 'Pending'}
                  </span>
                </div>
                <div className='text-2xl font-bold text-yellow-600'>
                  {pending.length}
                </div>
              </div>

              <div className='p-4 bg-orange-50 rounded-lg border border-orange-200'>
                <div className='flex items-center gap-2 mb-1'>
                  <AlertTriangle className='h-4 w-4 text-orange-600' />
                  <span className='text-sm font-medium text-orange-900'>
                    {locale === 'ar' ? 'تنتهي قريباً' : 'Expiring Soon'}
                  </span>
                </div>
                <div className='text-2xl font-bold text-orange-600'>
                  {expiringSoon.length}
                </div>
              </div>

              <div className='p-4 bg-red-50 rounded-lg border border-red-200'>
                <div className='flex items-center gap-2 mb-1'>
                  <TrendingDown className='h-4 w-4 text-red-600' />
                  <span className='text-sm font-medium text-red-900'>
                    {locale === 'ar' ? 'منتهي' : 'Expired'}
                  </span>
                </div>
                <div className='text-2xl font-bold text-red-600'>
                  {expired.length}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expiring Soon List */}
      {expiringSoon.length > 0 && (
        <Card className='border-orange-200 bg-orange-50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-orange-900'>
              <AlertTriangle className='h-5 w-5' />
              {locale === 'ar'
                ? 'مستندات تنتهي قريباً'
                : 'Documents Expiring Soon'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? `${expiringSoon.length} مستند سينتهي في غضون 30 يوم`
                : `${expiringSoon.length} document(s) expiring within 30 days`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {expiringSoon.slice(0, 5).map((doc: any) => (
                <div
                  key={doc.id}
                  className='p-3 bg-white rounded-lg border border-orange-200 flex items-center justify-between'
                >
                  <div className='flex items-center gap-3'>
                    <FileText className='h-4 w-4 text-orange-600' />
                    <div>
                      <p className='font-medium text-sm'>{doc.document_name}</p>
                      <p className='text-xs text-gray-500'>
                        {doc.employer_employee?.employee?.name_en ||
                          doc.employer_employee?.employee?.name_ar ||
                          'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className='text-right'>
                    <Badge
                      variant='outline'
                      className='bg-orange-100 text-orange-700'
                    >
                      {format(new Date(doc.expiry_date), 'MMM dd, yyyy')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Expired Documents */}
      {expired.length > 0 && (
        <Card className='border-red-200 bg-red-50'>
          <CardHeader>
            <CardTitle className='flex items-center gap-2 text-red-900'>
              <TrendingDown className='h-5 w-5' />
              {locale === 'ar' ? 'مستندات منتهية' : 'Expired Documents'}
            </CardTitle>
            <CardDescription>
              {locale === 'ar'
                ? `${expired.length} مستند منتهي يحتاج إلى تجديد`
                : `${expired.length} expired document(s) need renewal`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              {expired.slice(0, 5).map((doc: any) => (
                <div
                  key={doc.id}
                  className='p-3 bg-white rounded-lg border border-red-200 flex items-center justify-between'
                >
                  <div className='flex items-center gap-3'>
                    <FileText className='h-4 w-4 text-red-600' />
                    <div>
                      <p className='font-medium text-sm'>{doc.document_name}</p>
                      <p className='text-xs text-gray-500'>
                        {doc.employer_employee?.employee?.name_en ||
                          doc.employer_employee?.employee?.name_ar ||
                          'N/A'}
                      </p>
                    </div>
                  </div>
                  <Badge className='bg-red-500 hover:bg-red-600'>
                    {locale === 'ar' ? 'منتهي' : 'Expired'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
