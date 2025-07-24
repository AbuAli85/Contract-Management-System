'use client'

import { useAuth } from "@/src/components/auth/auth-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div>Loading authentication...</div>;
  if (!user) return <div>Please log in to access the dashboard.</div>;
  
  return <>{children}</>;
}
