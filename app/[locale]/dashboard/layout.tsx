import { type Metadata } from "next"
import DashboardLayout from "@/components/dashboard/dashboard-layout"
import { RBACProvider } from "@/src/components/auth/rbac-provider";
import { useAuth } from "@/src/components/auth/auth-provider";

export const metadata: Metadata = {
  title: "Dashboard - Contract Management System",
  description: "Streamline your contract generation and management process",
}

export default function DashboardLayout({ children }) {
  const { user } = useAuth();
  return (
    <RBACProvider user={user}>
      {/* ...dashboard layout... */}
      {children}
    </RBACProvider>
  );
}
