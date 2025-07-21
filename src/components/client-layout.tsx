'use client';

import { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import { i18n } from '@/src/i18n/i18n-config';

const inter = Inter({ subsets: ['latin'] });

interface ClientLayoutProps {
  children: ReactNode;
  locale: string;
}

export function ClientLayout({ children, locale }: ClientLayoutProps) {
  return (
    <div className={inter.className}>
      <main>
        {/* Add any client-side layout components here */}
        {children}
      </main>
    </div>
  );
}
