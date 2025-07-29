'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Inter } from 'next/font/google';
import { ToastProvider } from '@/components/toast-notifications';
import { ErrorBoundary } from '@/components/error-boundary';
import { ProfessionalSidebar } from '@/components/professional-sidebar';
import { ProfessionalHeader } from '@/components/professional-header';
import { usePathname } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { PerformanceMonitor } from '@/components/performance-monitor';
import { FormProvider } from '@/hooks/use-form-context';
import { useAuth } from '@/src/components/auth/simple-auth-provider';

const inter = Inter({ subsets: ['latin'] });

interface ClientLayoutProps {
  children: ReactNode;
  locale: string;
}

function AuthenticatedAppLayout({ children, locale }: { children: ReactNode; locale: string }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  // Only call useAuth on the client side
  const authResult = isClient ? useAuth() : { user: null, loading: true, mounted: false };
  const { user, loading: authLoading, mounted } = authResult;
  
  const [forceShow, setForceShow] = useState(false);

  // Ensure we're on the client side
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Force show content after 5 seconds to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔧 ClientLayout: Force showing content after timeout')
      setForceShow(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

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
                      pathname?.includes('/demo') ||
                      pathname?.includes('/onboarding');

  const shouldShowSidebar = !isAuthPage && !isPublicPage && !!user;
  const isLoading = (authLoading || !mounted) && !forceShow;

  console.log('🔧 ClientLayout: Auth state:', { 
    user: !!user, 
    authLoading, 
    mounted, 
    forceShow, 
    isLoading,
    pathname,
    isClient 
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication...</p>
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
        
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <PerformanceMonitor>
              <FormProvider>
                <ToastProvider>
                  {children}
                </ToastProvider>
              </FormProvider>
            </PerformanceMonitor>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export function ClientLayout({ children, locale }: ClientLayoutProps) {
  return (
    <html lang={locale} className={inter.className}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthenticatedAppLayout locale={locale}>
          {children}
        </AuthenticatedAppLayout>
      </body>
    </html>
  );
}
