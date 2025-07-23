'use client'

import DashboardLayoutComponent from "@/components/dashboard/dashboard-layout"
import { RBACProvider } from "@/src/components/auth/rbac-provider";
import { useAuth } from "@/src/components/auth/auth-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading authentication...</div>;
  if (!user) return <div>Please log in to access the dashboard.</div>;
  return (
    <RBACProvider user={user}>
      <DashboardLayoutComponent>
        {children}
      </DashboardLayoutComponent>
    </RBACProvider>
  );
}
