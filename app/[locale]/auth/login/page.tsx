'use client';

import EnvironmentCheck from '@/components/auth/environment-check';
import SimpleWorkingLogin from '@/components/auth/simple-working-login';

export default function LoginPage() {
  return (
    <>
      <EnvironmentCheck />
      <SimpleWorkingLogin />
    </>
  );
}
