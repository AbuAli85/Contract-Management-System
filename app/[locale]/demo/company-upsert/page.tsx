'use client';

import { CompanyUpsertDemo } from '@/components/companies/company-upsert-demo';
import { RoleRedirect } from '@/components/auth/enhanced-rbac-provider';

export default function CompanyUpsertDemoPage() {
  return (
    <RoleRedirect
      allowedRoles={['admin', 'super_admin', 'manager', 'provider']}
    >
      <div className='container mx-auto px-4 py-8'>
        <CompanyUpsertDemo />
      </div>
    </RoleRedirect>
  );
}
