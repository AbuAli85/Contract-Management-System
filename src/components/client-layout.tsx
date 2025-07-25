'use client';

import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/src/components/auth/auth-provider';

const inter = Inter({ subsets: ['latin'] });

interface ClientLayoutProps {
  children: ReactNode;
  locale: string;
}

export function ClientLayout({ children, locale }: ClientLayoutProps) {
  return (
    <div className={inter.className}>
      <AuthProvider>
        <main>
          {/* Add any client-side layout components here */}
          {children}
        </main>
      </AuthProvider>
    </div>
  );
}
