'use client';

import EnvironmentCheck from '@/components/auth/environment-check';
import SimpleWorkingLoginFixed from '@/components/auth/simple-working-login-fixed';

export default function LoginPage() {
  return (
    <>
      <EnvironmentCheck />
      <SimpleWorkingLoginFixed />
    </>
  );
}
