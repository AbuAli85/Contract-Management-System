'use client';

import React from 'react';
import { GenericDeploymentLetterGenerator } from '@/components/hr/deployment-letters/generic-deployment-letter-generator';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function DeploymentLettersPage({
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
            {locale === 'ar' ? 'خطابات النشر' : 'Deployment Letters'}
          </h1>
          <p className='text-gray-600 mt-2'>
            {locale === 'ar'
              ? 'إنشاء خطابات نشر احترافية للموظفين'
              : 'Generate professional deployment letters for employees'}
          </p>
        </div>

        <GenericDeploymentLetterGenerator locale={locale} />
      </div>
    </AuthGuard>
  );
}
