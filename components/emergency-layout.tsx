'use client';

import { ReactNode } from 'react';
import { EmergencyErrorBoundaryWrapper } from '@/components/emergency-error-boundary';
import { AuthProvider } from '@/components/auth-provider';

interface EmergencyLayoutProps {
  children: ReactNode;
}

export function EmergencyLayout({ children }: EmergencyLayoutProps) {
  return (
    <EmergencyErrorBoundaryWrapper>
      <AuthProvider>
        <div className='min-h-screen bg-background'>{children}</div>
      </AuthProvider>
    </EmergencyErrorBoundaryWrapper>
  );
}
