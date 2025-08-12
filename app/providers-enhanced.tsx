'use client';

import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { EnhancedRBACProvider } from '@/components/auth/enhanced-rbac-provider';
import { Toaster } from 'sonner';

// Enhanced Providers Component with RBAC integration
export default function EnhancedProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        <EnhancedRBACProvider>
          {children}
          <Toaster position='top-right' expand={false} richColors closeButton />
        </EnhancedRBACProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
