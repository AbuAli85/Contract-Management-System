'use client';

import { ReactNode, useState } from 'react';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/src/components/auth/auth-provider';
import { ToastProvider } from '@/components/toast-notifications';
import { ErrorBoundary } from '@/components/error-boundary';
import { ProfessionalSidebar } from '@/components/professional-sidebar';
import { ProfessionalHeader } from '@/components/professional-header';
import { useAuth } from '@/src/components/auth/auth-provider';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PerformanceMonitor } from '@/components/performance-monitor';

const inter = Inter({ subsets: ['latin'] });

interface ClientLayoutProps {
  children: ReactNode;
  locale: string;
}

function AuthenticatedAppLayout({ children, locale }: { children: ReactNode; locale: string }) {
  const { user, loading, mounted } = useAuth();
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Don't show sidebar on auth pages
  const isAuthPage = pathname?.includes('/auth/') || 
                    pathname?.includes('/login') || 
                    pathname?.includes('/signup') ||
                    pathname?.includes('/forgot-password') ||
                    pathname?.includes('/reset-password') ||
                    pathname?.includes('/bypass');

  // Don't show sidebar on public pages
  const isPublicPage = pathname === '/' || 
                      pathname === '/en' || 
                      pathname === '/ar' ||
                      pathname?.includes('/demo');

  const shouldShowSidebar = !isAuthPage && !isPublicPage && user;

  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ProfessionalSidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={toggleSidebar} 
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <ProfessionalHeader
          onMenuToggle={toggleSidebar}
          showSearch={true}
          showActions={true}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function ClientLayout({ children, locale }: ClientLayoutProps) {
  return (
    <div className={inter.className}>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <AuthenticatedAppLayout locale={locale}>
              {children}
            </AuthenticatedAppLayout>
            <PerformanceMonitor />
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </div>
  );
}
