'use client';

import EnvironmentCheck from '@/components/auth/environment-check';
import ProductionLoginForm from '@/components/auth/production-login-form';

export default function ProductionLoginPage() {
  return (
    <>
      <EnvironmentCheck />
      <ProductionLoginForm />
    </>
  );
}
