'use client'

import DashboardLayoutComponent from "@/components/dashboard/dashboard-layout"
import { RBACProvider } from "@/src/components/auth/rbac-provider";
import { useAuth } from "@/src/components/auth/auth-provider";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return (
    <RBACProvider user={user}>
      <DashboardLayoutComponent>
        {children}
      </DashboardLayoutComponent>
    </RBACProvider>
  );
}
