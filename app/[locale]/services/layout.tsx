import type { ReactNode } from 'react';

interface ServicesLayoutProps {
  children: ReactNode;
  params: { locale: string };
}

// Services layout now uses universal navigation
export default function ServicesLayout({ children }: ServicesLayoutProps) {
  return <>{children}</>;
}
