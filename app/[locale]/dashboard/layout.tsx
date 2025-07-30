'use client'

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const hasCheckedAuth = useRef(false);
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    // Prevent multiple auth checks
    if (hasCheckedAuth.current) return;
    hasCheckedAuth.current = true;

    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        const data = await response.json();
        
        if (data.success && data.hasSession) {
          setIsAuthenticated(true);
        } else {
          // Redirect to login with proper locale
          const locale = params?.locale || 'en';
          router.replace(`/${locale}/auth/login`);
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Redirect to login with proper locale
        const locale = params?.locale || 'en';
        router.replace(`/${locale}/auth/login`);
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []); // Remove dependencies to prevent re-renders

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
    // In development mode, allow access with a warning
    if (process.env.NODE_ENV === 'development') {
      return (
        <div className="min-h-screen">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Development Mode:</strong> No user authenticated. Dashboard is accessible for testing.
                </p>
              </div>
            </div>
          </div>
          {children}
        </div>
      );
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to access the dashboard.</p>
          <a 
            href="/en/auth/login" 
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go to Login
          </a>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
