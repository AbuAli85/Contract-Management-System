'use client';

import EnvironmentCheck from '@/components/auth/environment-check';
import EnhancedLoginFormV2 from '@/components/auth/enhanced-login-form-v2';

export default function LoginPage() {
  return (
    <>
      <EnvironmentCheck />
      <EnhancedLoginFormV2 />
    </>
  );
}
