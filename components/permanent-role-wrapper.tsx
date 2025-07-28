'use client'

import { useAuth } from "@/src/components/auth/auth-provider"
import { PermanentRoleProvider } from "@/src/components/auth/permanent-role-provider"

export function PermanentRoleWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return <PermanentRoleProvider user={user}>{children}</PermanentRoleProvider>
} 