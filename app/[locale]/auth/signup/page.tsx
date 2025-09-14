'use client';

import EnvironmentCheck from '@/components/auth/environment-check';
import UnifiedSignupForm from '@/components/auth/unified-signup-form';

export default function SignupPage() {
  return (
    <>
      <EnvironmentCheck />
      <UnifiedSignupForm />
    </>
  );
}
