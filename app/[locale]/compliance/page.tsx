'use client';

import { useParams } from 'next/navigation';
import { ComplianceDashboard } from '@/components/compliance/compliance-dashboard';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function CompliancePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  return (
    <AuthGuard requireAuth={true}>
      <div className='container mx-auto p-6'>
        <ComplianceDashboard locale={locale} />
      </div>
    </AuthGuard>
  );
}

