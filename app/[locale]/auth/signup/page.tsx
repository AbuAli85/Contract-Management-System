'use client';

import EnvironmentCheck from '@/components/auth/environment-check';
import SimpleWorkingSignupFixed from '@/components/auth/simple-working-signup-fixed';

export default function SignupPage() {
  return (
    <>
      <EnvironmentCheck />
      <SimpleWorkingSignupFixed />
    </>
  );
}
