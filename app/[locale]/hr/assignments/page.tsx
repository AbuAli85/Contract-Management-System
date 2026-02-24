'use client';

import React from 'react';
import { AssignmentManager } from '@/components/hr/assignments/assignment-manager';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function AssignmentsPage({
  params,
}: {
  params: { locale: string };
}) {
  const locale = params.locale || 'en';

  return (
    <AuthGuard requireAuth={true}>
      <div className='container mx-auto py-6 space-y-6'>
        <div>
          <h1 className='text-3xl font-bold'>
            {locale === 'ar' ? 'إدارة التعيينات' : 'Assignment Management'}
          </h1>
          <p className='text-gray-600 mt-2'>
            {locale === 'ar'
              ? 'إدارة تعيينات الموظفين للعملاء'
              : 'Manage employee assignments to clients'}
          </p>
        </div>

        <AssignmentManager locale={locale} />
      </div>
    </AuthGuard>
  );
}
