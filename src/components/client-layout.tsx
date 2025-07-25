'use client';

import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/src/components/auth/auth-provider';
import { ToastProvider } from '@/components/toast-notifications';
import { ErrorBoundary } from '@/components/error-boundary';

const inter = Inter({ subsets: ['latin'] });

interface ClientLayoutProps {
  children: ReactNode;
  locale: string;
}

export function ClientLayout({ children, locale }: ClientLayoutProps) {
  return (
    <div className={inter.className}>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <main>
              {children}
            </main>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </div>
  );
}
