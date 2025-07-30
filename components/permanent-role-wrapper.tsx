"use client"

import { useAuth } from "@/lib/auth-service"
import { RBACProvider } from "@/src/components/auth/rbac-provider"

export function PermanentRoleWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return <RBACProvider>{children}</RBACProvider>
}
