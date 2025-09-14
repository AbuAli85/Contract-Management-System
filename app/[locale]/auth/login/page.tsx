'use client';

import EnvironmentCheck from '@/components/auth/environment-check';
import UnifiedLoginForm from '@/components/auth/unified-login-form';

export default function LoginPage() {
  return (
    <>
      <EnvironmentCheck />
      <UnifiedLoginForm />
    </>
  );
}
