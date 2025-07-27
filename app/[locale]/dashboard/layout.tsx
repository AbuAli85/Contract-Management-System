'use client'

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check-session');
        const data = await response.json();
        
        if (data.success && data.hasSession) {
          setIsAuthenticated(true);
        } else {
          // Redirect to login if not authenticated
          router.push('/auth/login');
          return;
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/auth/login');
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isLoading) return <div>Loading authentication...</div>;
  if (!isAuthenticated) return <div>Please log in to access the dashboard.</div>;
  
  return <>{children}</>;
}
