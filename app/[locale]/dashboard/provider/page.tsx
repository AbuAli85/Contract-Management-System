"use client"

import { useEnhancedRBAC, RoleRedirect } from '@/components/auth/enhanced-rbac-provider'
import { ProviderDashboard } from '@/components/dashboards/provider-dashboard'

export default function ProviderDashboardPage() {
  return (
    <RoleRedirect allowedRoles={['provider', 'admin', 'super_admin']}>
      <ProviderDashboard />
    </RoleRedirect>
  )
}