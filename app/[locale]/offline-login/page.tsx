'use client';

import { OfflineLoginForm } from '@/components/auth/offline-login-form';
import { OfflineModeStatus } from '@/components/auth/offline-mode-status';

export default function OfflineLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="space-y-4 w-full max-w-md">
        <OfflineModeStatus />
        <OfflineLoginForm />
      </div>
    </div>
  );
}
