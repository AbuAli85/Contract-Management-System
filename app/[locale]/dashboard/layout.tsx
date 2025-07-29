'use client'

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        const data = await response.json();
        
        if (data.success && data.hasSession) {
          setIsAuthenticated(true);
        } else {
          // Redirect to login with proper locale
          const locale = params?.locale || 'en';
          router.push(`/${locale}/auth/login`);
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Redirect to login with proper locale
        const locale = params?.locale || 'en';
        router.push(`/${locale}/auth/login`);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router, params]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
