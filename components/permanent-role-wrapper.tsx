"use client"

import { useAuth } from "@/src/components/auth/simple-auth-provider"
import { RBACProvider } from "@/src/components/auth/rbac-provider"

export function PermanentRoleWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return <RBACProvider>{children}</RBACProvider>
}
